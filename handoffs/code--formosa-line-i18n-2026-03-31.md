# Handoff: LINE 多語系支援（LIFF 自動導向 + Bot 回覆 + 推播）

**來源**: Cowork session
**目標**: Code session
**日期**: 2026-03-31
**優先級**: Phase 3 上線前（4/12 前完成）

---

## ⚠️ 執行紀律

1. **嚴格按 Phase 順序執行**，不可跳躍、不可合併 Phase
2. **每個 Phase 結尾都有 Checkpoint**，Checkpoint 沒過不准進下一個 Phase
3. **每個 Phase 開始前先 git commit 當前狀態**，確保可以 rollback
4. **新功能不可以破壞既有功能**——每個 Phase 的 Checkpoint 都包含既有功能回歸測試
5. **最終有完整 Smoke Test**，全部通過才算完工
6. **deploy 指令由 Paul 本機執行**，Code session 只負責 commit + push + 產出指令

---

## 背景

外國參與者（日本人、歐美背包客等）可能透過 LINE 參加白沙屯繞境。
目前系統的 i18n 翻譯檔已齊全（zh-Hant / en / ja / zh-Hans，237 keys × 4 語系），
但 LINE 端（LIFF 入口、Bot 回覆、推播）全部硬編碼繁體中文。

LINE 平台原生支援語言偵測：
- LIFF SDK `liff.getAppLanguage()` — 拿到 LINE App 語言設定（BCP 47 格式）
- Messaging API `getProfile` — 回傳 `language` 欄位（BCP 47 格式）

本工單分 5 個 Phase 依序執行，一次做完：D1 schema → Worker 翻譯層 → Bot 多語回覆 → 推播多語 → LIFF 自動導向。

---

## Phase 0：偵察（只讀不改）

**目的**：確認程式碼現狀，定位所有要改的位置，避免改錯地方。

```bash
# 0-1. 確認 formosa_users 目前的 schema
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "PRAGMA table_info(formosa_users)"
# → 記錄目前有哪些欄位，確認沒有 language 欄位

# 0-2. 定位 formosa.js 的關鍵函式行號
grep -n "function routeKeyword\|function buildWelcomeMessage\|function buildUsageMessage\|function buildMenuMessage\|function buildCarbonInfoMessage\|function buildStatsMessage\|const PUSH_MESSAGES\|function getLineProfile\|function handleFormosaWebhook\|function handleFormosaScheduledPush\|function sendLineMessage\|function replyLineMessage\|function multicastLineMessage" worker/src/formosa.js

# 0-3. 定位 LIFF init 位置（前端）
grep -rn "liff.init\|liff\.getAppLanguage\|liff\.getLanguage\|@line/liff" src/ public/

# 0-4. 確認 LIFF SDK 版本
grep -rn "liff.*cdn\|liff.*2\.\|@line/liff" src/ public/ package.json

# 0-5. 確認翻譯檔結構
ls -la src/i18n/translations/
grep -c ":" src/i18n/translations/en.ts
grep -c ":" src/i18n/translations/ja.ts
grep -c ":" src/i18n/translations/zh-Hans.ts

# 0-6. 確認目前 webhook 的 upsert 語句
grep -A5 "INSERT INTO formosa_users" worker/src/formosa.js

# 0-7. 確認目前 getLineProfile 的回傳
grep -A10 "function getLineProfile" worker/src/formosa.js
```

### Checkpoint 0
- [ ] 已記錄 `formosa_users` 現有欄位清單
- [ ] 已記錄所有關鍵函式的行號
- [ ] 已確認 LIFF SDK 版本號（需 ≥ v2.24.0）
- [ ] 已確認 language 欄位目前不存在
- [ ] **不可以修改任何檔案就進入 Phase 1**

---

## Phase 1：D1 Schema Migration + 語言存取

**目的**：在 D1 加入 `language` 欄位，讓 webhook 每次互動都存下使用者的 LINE 語言。
**範圍**：只改 `worker/src/formosa.js` 中的 `migrateFormosa()` 和 webhook handler 的 upsert。

### 1-1. 在 `migrateFormosa()` 加入 ALTER TABLE

找到 `migrateFormosa` 函式，在既有的 migration statements 之後加入：

```javascript
// ── i18n: add language column ──
try {
  await db.prepare("ALTER TABLE formosa_users ADD COLUMN language TEXT DEFAULT NULL").run();
} catch (e) {
  // Column already exists — safe to ignore
}
```

**注意**：用 try-catch 包住，因為 ALTER TABLE ADD COLUMN 如果欄位已存在會報錯，這是正常的 idempotent 做法。

### 1-2. 修改 webhook handler 的 upsert

在 `handleFormosaWebhook` 中，找到 upsert user 的那段程式碼（約 line 155-165），改為：

```javascript
if (userId) {
  const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
  // profile 本來就包含 language 欄位，LINE API 會回傳
  const userLang = profile?.language || null;

  await env.AUTH_DB.prepare(
    `INSERT INTO formosa_users (line_user_id, display_name, picture_url, language)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(line_user_id) DO UPDATE SET
     display_name = excluded.display_name,
     picture_url = excluded.picture_url,
     language = excluded.language`
  ).bind(userId, profile?.displayName || '', profile?.pictureUrl || '', userLang).run();
}
```

**關鍵**：`getLineProfile` 本來就用 `await res.json()` 解析整個 response，`language` 已經在裡面了，不需要改 `getLineProfile` 函式本身。

### 1-3. Git commit

```bash
git add worker/src/formosa.js
git commit -m "feat(formosa): add language column to formosa_users and save from LINE profile"
```

### Checkpoint 1（必須全過才進 Phase 2）

```bash
# C1-1. 語法檢查：Worker 能正常 build
cd worker && npx wrangler deploy --dry-run --config wrangler.toml 2>&1 | tail -5
# → 不應該有 syntax error

# C1-2. 確認 migration 語句存在
grep -n "ALTER TABLE formosa_users ADD COLUMN language" worker/src/formosa.js
# → 應該找到一行

# C1-3. 確認 upsert 有包含 language
grep -A3 "INSERT INTO formosa_users" worker/src/formosa.js | grep language
# → 應該找到 language 在 INSERT 和 bind 中

# C1-4. 回歸測試：確認既有的 upsert 邏輯沒被破壞
# 用眼睛檢查：bind() 的參數數量和 VALUES 的 ? 數量一致（應為 4 個）
grep -A8 "INSERT INTO formosa_users" worker/src/formosa.js
```

- [ ] dry-run build 成功
- [ ] migration 語句存在且有 try-catch
- [ ] upsert 語句包含 language
- [ ] bind 參數數量正確（4 個 ?，4 個 bind 值）
- [ ] **沒有改到其他函式**

---

## Phase 2：Worker 翻譯層（新檔案）

**目的**：建立 Bot 專用的翻譯字典和 helper 函式。
**範圍**：只新增 `worker/src/formosa-i18n.js`，不改任何既有檔案。

### 2-1. 新建 `worker/src/formosa-i18n.js`

```javascript
/**
 * Formosa LINE Bot — i18n 訊息字典
 *
 * 只包含 Bot 回覆 + 推播需要的文字。
 * 前端翻譯在 src/i18n/translations/，這裡是 Worker 端獨立一份。
 *
 * placeholder 語法：{varName}，由 botMsg() 替換。
 */

// ── BCP 47 → 系統 locale 映射 ──

export function mapLineLanguageToLocale(lang) {
  if (!lang) return 'zh-Hant';
  const l = lang.toLowerCase();
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('en')) return 'en';
  if (l === 'zh-cn' || l === 'zh-hans' || l.startsWith('zh-hans')) return 'zh-Hans';
  // zh-TW, zh-Hant, zh, 或任何其他語言 → 預設繁中
  return 'zh-Hant';
}

// ── URL helper：根據 locale 加前綴 ──

const LOCALE_PREFIX = {
  'zh-Hant': '',
  'en': '/en',
  'ja': '/ja',
  'zh-Hans': '/zh-cn',
};

export function localizeUrl(baseUrl, locale) {
  if (!locale || locale === 'zh-Hant') return baseUrl;
  const prefix = LOCALE_PREFIX[locale] || '';
  if (!prefix) return baseUrl;
  // https://mazu.today/tracker/ → https://mazu.today/en/tracker/
  try {
    const url = new URL(baseUrl);
    url.pathname = prefix + url.pathname;
    return url.toString();
  } catch {
    return baseUrl;
  }
}

// ── 訊息字典 ──

export const BOT_MESSAGES = {
  'zh-Hant': {
    checkin: '📍 立即打卡記錄足跡：\n{url}',
    help: '📖 使用指南請看這裡：\n{url}',
    bug: '📝 回報問題請到這裡：\n{feedbackUrl}\n\n也可以直接在這裡打字描述，我們會看到！',
    share: '📤 分享你的進香足跡給朋友：\n{url}\n\n打開後點「📸 分享我的進香足跡」按鈕，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯媽祖 ESG 永續進香\n\n台灣首份進香永續數據計畫，記錄參與者的足跡、碳足跡與善行故事。\n\n📖 了解更多：\n{url}',
    carbon: '🌱 碳足跡小知識\n\n進香途中我們用兩種方式估算你的碳足跡：\n🚶 步行/腳踏車 → 零排放 ✨\n🚌 搭乘交通工具 → 約 0.48 kg CO₂e/km\n\n走越多、搭越少，碳足跡越低！\n🌿 鼓勵大家多走路、多共乘，一起愛護地球 🌍\n\n📍 前往記錄：\n{url}',
    menu: '🙏 媽祖 Bot 為您服務\n\n輸入以下關鍵字：\n📍「打卡」→ 記錄足跡\n📖「說明」→ 使用指南\n📊「等級」→ 我的紀錄\n🌱「碳足跡」→ 碳排資訊\n💡「關於」→ 專案介紹\n\n💡 輸入「說明」查看使用指南',
    welcome_alt: '🙏 歡迎加入白沙屯媽祖 ESG 永續進香！',
    stats_checkins: '📍 打卡次數：{count}',
    stats_km: '📊 總公里數：{km} km',
    stats_carbon: '🌱 碳足跡：{carbon} kg CO₂e',
    stats_survey_done: '📋 問卷：已完成',
    stats_survey_pending: '📋 問卷：尚未填寫',
    push: [
      { title: '📍 早安打卡', text: '媽祖保佑 🙏 新的一天，記錄您的進香足跡！' },
      { title: '📍 午間打卡', text: '走了好多路！打個卡記錄一下 🚶' },
      { title: '📍 下午打卡', text: '繼續前進！打卡累積您的香客等級 ✨' },
      { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡記錄今日行程' },
    ],
  },
  'en': {
    checkin: '📍 Check in now and record your journey:\n{url}',
    help: '📖 User guide:\n{url}',
    bug: '📝 Report an issue here:\n{feedbackUrl}\n\nOr just type your feedback here — we will see it!',
    share: '📤 Share your pilgrimage journey with friends:\n{url}\n\nTap the "📸 Share My Pilgrimage" button to share on LINE, Facebook, and more!',
    about: '🌱 2026 Baishatun Mazu ESG Pilgrimage\n\nTaiwan\'s first sustainable pilgrimage data project — tracking footprint, carbon emissions, and stories of kindness.\n\n📖 Learn more:\n{url}',
    carbon: '🌱 Carbon Footprint Facts\n\nWe estimate your carbon footprint two ways:\n🚶 Walking/cycling → Zero emissions ✨\n🚌 Motor transport → ~0.48 kg CO₂e/km\n\nWalk more, ride less — lower your footprint!\n🌿 Let\'s protect the Earth together 🌍\n\n📍 Record now:\n{url}',
    menu: '🙏 Mazu Bot at your service\n\nType a keyword:\n📍 "checkin" → Record footprint\n📖 "help" → User guide\n📊 "level" → My stats\n🌱 "carbon" → Carbon info\n💡 "about" → About this project\n\n💡 Type "help" for the user guide',
    welcome_alt: '🙏 Welcome to Baishatun Mazu ESG Pilgrimage!',
    stats_checkins: '📍 Check-ins: {count}',
    stats_km: '📊 Total distance: {km} km',
    stats_carbon: '🌱 Carbon footprint: {carbon} kg CO₂e',
    stats_survey_done: '📋 Survey: Completed',
    stats_survey_pending: '📋 Survey: Not yet completed',
    push: [
      { title: '📍 Morning Check-in', text: 'Mazu blesses you 🙏 Start a new day — record your pilgrimage!' },
      { title: '📍 Midday Check-in', text: 'You\'ve walked so far! Check in to record your journey 🚶' },
      { title: '📍 Afternoon Check-in', text: 'Keep going! Check in to level up ✨' },
      { title: '📍 Evening Check-in', text: 'Great effort today 🙏 Check in to record your day' },
    ],
  },
  'ja': {
    checkin: '📍 今すぐチェックインして巡礼を記録：\n{url}',
    help: '📖 使い方ガイド：\n{url}',
    bug: '📝 問題の報告はこちら：\n{feedbackUrl}\n\nここに直接入力してもOKです！',
    share: '📤 巡礼の記録を友達にシェア：\n{url}\n\n「📸 巡礼をシェア」をタップしてLINE・Facebookなどで共有！',
    about: '🌱 2026 白沙屯媽祖 ESG 巡礼\n\n台湾初の巡礼サステナビリティデータ計画 — 足跡、CO₂、善行の記録。\n\n📖 詳しく見る：\n{url}',
    carbon: '🌱 CO₂豆知識\n\n巡礼中のCO₂排出を2つの方法で推定：\n🚶 徒歩/自転車 → ゼロ排出 ✨\n🚌 車両移動 → 約 0.48 kg CO₂e/km\n\n歩くほどCO₂が減ります！\n🌿 一緒に地球を守りましょう 🌍\n\n📍 記録する：\n{url}',
    menu: '🙏 媽祖 Bot がお手伝い\n\nキーワードを入力：\n📍「checkin」→ 足跡を記録\n📖「help」→ 使い方ガイド\n📊「level」→ マイ記録\n🌱「carbon」→ CO₂情報\n💡「about」→ プロジェクト紹介\n\n💡「help」でガイドを表示',
    welcome_alt: '🙏 白沙屯媽祖 ESG 巡礼へようこそ！',
    stats_checkins: '📍 チェックイン回数：{count}',
    stats_km: '📊 総距離：{km} km',
    stats_carbon: '🌱 CO₂排出量：{carbon} kg CO₂e',
    stats_survey_done: '📋 アンケート：完了',
    stats_survey_pending: '📋 アンケート：未回答',
    push: [
      { title: '📍 おはようチェックイン', text: '媽祖のご加護を 🙏 新しい一日、巡礼を記録しましょう！' },
      { title: '📍 お昼のチェックイン', text: 'たくさん歩きましたね！チェックインしましょう 🚶' },
      { title: '📍 午後のチェックイン', text: '前進あるのみ！チェックインでレベルアップ ✨' },
      { title: '📍 夕方のチェックイン', text: 'お疲れ様でした 🙏 今日の行程を記録しましょう' },
    ],
  },
  'zh-Hans': {
    checkin: '📍 立即打卡记录足迹：\n{url}',
    help: '📖 使用指南：\n{url}',
    bug: '📝 回报问题请到这里：\n{feedbackUrl}\n\n也可以直接在这里打字描述，我们会看到！',
    share: '📤 分享你的进香足迹给朋友：\n{url}\n\n打开后点「📸 分享我的进香足迹」按钮，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯妈祖 ESG 永续进香\n\n台湾首份进香永续数据计划，记录参与者的足迹、碳足迹与善行故事。\n\n📖 了解更多：\n{url}',
    carbon: '🌱 碳足迹小知识\n\n进香途中我们用两种方式估算你的碳足迹：\n🚶 步行/脚踏车 → 零排放 ✨\n🚌 搭乘交通工具 → 约 0.48 kg CO₂e/km\n\n走越多、搭越少，碳足迹越低！\n🌿 鼓励大家多走路、多共乘，一起爱护地球 🌍\n\n📍 前往记录：\n{url}',
    menu: '🙏 妈祖 Bot 为您服务\n\n输入以下关键字：\n📍「打卡」→ 记录足迹\n📖「说明」→ 使用指南\n📊「等级」→ 我的记录\n🌱「碳足迹」→ 碳排信息\n💡「关于」→ 项目介绍\n\n💡 输入「说明」查看使用指南',
    welcome_alt: '🙏 欢迎加入白沙屯妈祖 ESG 永续进香！',
    stats_checkins: '📍 打卡次数：{count}',
    stats_km: '📊 总公里数：{km} km',
    stats_carbon: '🌱 碳足迹：{carbon} kg CO₂e',
    stats_survey_done: '📋 问卷：已完成',
    stats_survey_pending: '📋 问卷：尚未填写',
    push: [
      { title: '📍 早安打卡', text: '妈祖保佑 🙏 新的一天，记录您的进香足迹！' },
      { title: '📍 午间打卡', text: '走了好多路！打个卡记录一下 🚶' },
      { title: '📍 下午打卡', text: '继续前进！打卡累积您的香客等级 ✨' },
      { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡记录今日行程' },
    ],
  },
};

/**
 * 取得 bot 訊息（帶 placeholder 替換）
 * @param {string} locale - 'zh-Hant' | 'en' | 'ja' | 'zh-Hans'
 * @param {string} key - 訊息 key（如 'checkin', 'menu', 'about'）
 * @param {object} vars - placeholder 變數，如 { url, feedbackUrl, count, km, carbon }
 * @returns {string|object} - 替換後的字串，或原始物件（如 push array）
 */
export function botMsg(locale, key, vars = {}) {
  const dict = BOT_MESSAGES[locale] || BOT_MESSAGES['zh-Hant'];
  const msg = dict[key] ?? BOT_MESSAGES['zh-Hant'][key] ?? key;
  if (typeof msg !== 'string') return msg; // push array 等非字串直接回傳
  return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
```

### 2-2. Git commit

```bash
git add worker/src/formosa-i18n.js
git commit -m "feat(formosa): add bot i18n dictionary and helper functions"
```

### Checkpoint 2（必須全過才進 Phase 3）

```bash
# C2-1. 新檔案存在且語法正確
node -e "require('./worker/src/formosa-i18n.js')" 2>&1
# → 如果是 ESM，改用：node --input-type=module -e "import './worker/src/formosa-i18n.js'"
# → 不應該有 syntax error

# C2-2. 四個語系都有完整的 key
node -e "
  const m = require('./worker/src/formosa-i18n.js');
  const keys = Object.keys(m.BOT_MESSAGES['zh-Hant']);
  for (const locale of ['en','ja','zh-Hans']) {
    const missing = keys.filter(k => !(k in m.BOT_MESSAGES[locale]));
    if (missing.length) console.error(locale + ' missing: ' + missing.join(', '));
    else console.log(locale + ': OK (' + keys.length + ' keys)');
  }
"

# C2-3. mapLineLanguageToLocale 測試
node -e "
  const { mapLineLanguageToLocale } = require('./worker/src/formosa-i18n.js');
  console.assert(mapLineLanguageToLocale('en') === 'en');
  console.assert(mapLineLanguageToLocale('en-US') === 'en');
  console.assert(mapLineLanguageToLocale('ja') === 'ja');
  console.assert(mapLineLanguageToLocale('zh-TW') === 'zh-Hant');
  console.assert(mapLineLanguageToLocale('zh-CN') === 'zh-Hans');
  console.assert(mapLineLanguageToLocale(null) === 'zh-Hant');
  console.assert(mapLineLanguageToLocale(undefined) === 'zh-Hant');
  console.assert(mapLineLanguageToLocale('ko') === 'zh-Hant'); // 不支援的語言 fallback 繁中
  console.log('All assertions passed');
"

# C2-4. botMsg placeholder 替換測試
node -e "
  const { botMsg } = require('./worker/src/formosa-i18n.js');
  const result = botMsg('en', 'checkin', { url: 'https://mazu.today/tracker/' });
  console.assert(result.includes('https://mazu.today/tracker/'), 'URL not found');
  console.assert(!result.includes('{url}'), 'Placeholder not replaced');
  console.log('botMsg test passed:', result.substring(0, 50));
"

# C2-5. 回歸：formosa.js 沒有被改到
git diff worker/src/formosa.js
# → Phase 1 的改動應該已經 commit，這裡不應該有新的 diff
```

- [ ] 新檔案語法正確
- [ ] 四個語系 key 齊全
- [ ] mapLineLanguageToLocale 7 個 assertion 全過
- [ ] botMsg placeholder 替換正常
- [ ] formosa.js 沒有額外修改

---

## Phase 3：Bot 多語回覆（改 formosa.js）

**目的**：讓 routeKeyword 和所有 message builder 根據使用者語言回覆對應語系。
**範圍**：只改 `worker/src/formosa.js` 的回覆邏輯。

### 3-0. 匯入翻譯模組

在 `formosa.js` 頂部加入：

```javascript
import { mapLineLanguageToLocale, localizeUrl, botMsg, BOT_MESSAGES } from './formosa-i18n.js';
```

如果 formosa.js 用 `const ... = require(...)` 風格，則改用：

```javascript
const { mapLineLanguageToLocale, localizeUrl, botMsg, BOT_MESSAGES } = require('./formosa-i18n.js');
```

### 3-1. 新增 helper：從 D1 查使用者語言

```javascript
/**
 * 從 D1 查使用者的 locale
 * @returns {string} 'zh-Hant' | 'en' | 'ja' | 'zh-Hans'
 */
async function getUserLocale(userId, env) {
  if (!userId) return 'zh-Hant';
  try {
    const row = await env.AUTH_DB.prepare(
      'SELECT language FROM formosa_users WHERE line_user_id = ?'
    ).bind(userId).first();
    return mapLineLanguageToLocale(row?.language);
  } catch {
    return 'zh-Hant';
  }
}
```

### 3-2. 修改 `routeKeyword`

**改之前先把原本的 routeKeyword 函式完整複製備份到註解裡**，萬一出事可以 rollback。

修改後的 routeKeyword：

```javascript
async function routeKeyword(text, userId, env) {
  const locale = await getUserLocale(userId, env);
  const t = text.toLowerCase();

  // 根據使用者語言，URL 加上對應前綴
  const trackerUrl = localizeUrl(TRACKER_URL, locale);
  const projectUrl = localizeUrl(PROJECT_URL, locale);
  const guideUrl = localizeUrl(GUIDE_URL, locale);
  const feedbackUrl = localizeUrl('https://mazu.today/feedback/', locale);

  // 打卡 — 同時支援中英日關鍵字
  if (/打卡|checkin|check.?in|記錄|チェックイン/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'checkin', { url: trackerUrl }) }];
  }

  // 說明 / 幫助
  if (/說明|使用|幫助|help|怎麼用|功能|ヘルプ|使い方/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'help', { url: guideUrl }) }];
  }

  // 回報 / bug
  if (/回報|問題|bug|反饋|建議|report|フィードバック/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'bug', { feedbackUrl }) }];
  }

  // 等級 / 紀錄
  if (/等級|紀錄|我的|成就|level|stats|排行|rank|レベル|記録/.test(t)) {
    return [await buildStatsMessage(userId, env, locale)];
  }

  // 分享
  if (/分享|share|推薦|シェア/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'share', { url: trackerUrl }) }];
  }

  // 碳足跡
  if (/碳|carbon|co2|排放|CO₂/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'carbon', { url: trackerUrl }) }];
  }

  // 關於 / 專案
  if (/關於|專案|esg|永續|什麼|about|プロジェクト/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'about', { url: projectUrl }) }];
  }

  // 預設：功能選單
  return [{ type: 'text', text: botMsg(locale, 'menu') }];
}
```

### 3-3. 修改 `buildStatsMessage`

加入 `locale` 參數（第三個參數），用 `botMsg` 取代硬編碼字串。

**注意**：等級名稱要用前端翻譯檔的多語版。如果太複雜，Phase 3 先用繁中等級名，Phase 4 再補。但 stats 的數字文字（打卡次數、公里數等）一定要走翻譯。

### 3-4. 修改 Welcome Message（follow event）

在 `handleFormosaWebhook` 的 follow event 處理中：

```javascript
if (event.type === 'follow' && userId) {
  const locale = await getUserLocale(userId, env);
  await sendLineMessage(userId, env.FORMOSA_LINE_TOKEN, [buildWelcomeMessage(locale)]);
}
```

`buildWelcomeMessage(locale)` 需要改為接受 locale 參數，altText 用 `botMsg(locale, 'welcome_alt')`。
Flex Message body 裡的文字也要走翻譯。

### 3-5. Git commit

```bash
git add worker/src/formosa.js
git commit -m "feat(formosa): wire up i18n to routeKeyword, buildStatsMessage, buildWelcomeMessage"
```

### Checkpoint 3（必須全過才進 Phase 4）

```bash
# C3-1. Worker build 成功
cd worker && npx wrangler deploy --dry-run --config wrangler.toml 2>&1 | tail -5

# C3-2. import/require 沒打錯
grep -n "formosa-i18n" worker/src/formosa.js
# → 應該在頂部找到 import 或 require

# C3-3. routeKeyword 有用 getUserLocale
grep -A3 "function routeKeyword\|async function routeKeyword" worker/src/formosa.js
# → 應該看到 getUserLocale

# C3-4. 回歸：繁中使用者行為不變
# 確認繁中的 regex 關鍵字（打卡、說明、等級等）全部還在
grep "打卡" worker/src/formosa.js | head -3
grep "說明" worker/src/formosa.js | head -3
grep "等級" worker/src/formosa.js | head -3

# C3-5. 確認 getUserLocale 有 try-catch（D1 掛了不會炸 bot）
grep -A8 "function getUserLocale" worker/src/formosa.js
```

- [ ] dry-run build 成功
- [ ] formosa-i18n import 存在
- [ ] routeKeyword 使用 getUserLocale
- [ ] 繁中關鍵字仍存在於 regex 中
- [ ] getUserLocale 有 try-catch fallback 到 zh-Hant

---

## Phase 4：推播多語

**目的**：定時推播根據使用者語言分組發送。
**範圍**：只改 `handleFormosaScheduledPush` 函式。

### 4-1. 修改推播邏輯

原本的推播是對所有使用者發同一則中文訊息。改為按語言分組：

```javascript
export async function handleFormosaScheduledPush(env) {
  // ... 時間檢查、活動狀態檢查邏輯完全不動 ...

  // ── 以下是修改的部分：按語言分組推播 ──

  const localeConfigs = [
    {
      locale: 'zh-Hant',
      // NULL 和 zh-TW 都歸繁中
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND (language IS NULL OR language LIKE 'zh-TW%' OR language LIKE 'zh-Hant%' OR language = 'zh')`,
      bind: [],
    },
    {
      locale: 'en',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND language LIKE ?`,
      bind: ['en%'],
    },
    {
      locale: 'ja',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND language LIKE ?`,
      bind: ['ja%'],
    },
    {
      locale: 'zh-Hans',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND (language = 'zh-CN' OR language LIKE 'zh-Hans%')`,
      bind: [],
    },
  ];

  const trackerUrl = 'https://mazu.today/tracker/';
  let totalSent = 0;

  for (const { locale, query, bind } of localeConfigs) {
    const stmt = env.AUTH_DB.prepare(query);
    const users = bind.length > 0
      ? await stmt.bind(...bind).all()
      : await stmt.all();

    if (!users.results?.length) continue;

    const pushMessages = BOT_MESSAGES[locale].push;
    const msg = pushMessages[Math.min(msgIdx, pushMessages.length - 1)];
    const localizedUrl = localizeUrl(trackerUrl, locale);
    const userIds = users.results.map(u => u.line_user_id);

    await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [
      { type: 'text', text: `${msg.title}\n\n${msg.text}\n\n📍 ${localizedUrl}` }
    ]);

    totalSent += userIds.length;
  }

  return { sent: totalSent };
}
```

**關鍵**：時間檢查、活動狀態檢查、pushHours 判斷等邏輯**完全不動**，只改「查使用者 → 發訊息」這段。

### 4-2. Git commit

```bash
git add worker/src/formosa.js
git commit -m "feat(formosa): push notifications by user language (4 locales)"
```

### Checkpoint 4（必須全過才進 Phase 5）

```bash
# C4-1. Worker build 成功
cd worker && npx wrangler deploy --dry-run --config wrangler.toml 2>&1 | tail -5

# C4-2. 推播時間邏輯沒被改到
grep -B2 -A5 "pushHours" worker/src/formosa.js
# → pushHours 陣列應該和原來一樣 [6, 9, 12, 15, 18]

# C4-3. 活動日期判斷沒被改到
grep "month !== 4\|day < 12\|day > 20" worker/src/formosa.js
# → 應該找到原本的日期判斷

# C4-4. 推播有分 4 個 locale
grep -c "locale:" worker/src/formosa.js
# → 至少 4 個（localeConfigs 裡的 4 個）

# C4-5. multicastLineMessage 仍然存在且沒被改壞
grep "multicastLineMessage" worker/src/formosa.js
```

- [ ] dry-run build 成功
- [ ] pushHours 時間判斷沒變
- [ ] 活動日期判斷沒變
- [ ] 有 4 個 locale 分組
- [ ] multicastLineMessage 呼叫正常

---

## Phase 5：LIFF 自動語言導向（前端）

**目的**：LIFF 頁面載入時偵測 LINE App 語言，自動 redirect 到對應語系。
**範圍**：只改 Tracker 頁面的前端 `<script>`。

### 5-1. 確認 LIFF SDK 版本

```bash
grep -rn "liff" src/ public/ | grep -i "cdn\|version\|2\.\|script.*src"
```

如果版本 < 2.24.0，先升級 CDN URL。

### 5-2. 在 LIFF init 完成後加入自動導向

找到 `liff.init()` 的 `.then()` 或 `await`，在 init 成功後加入：

```javascript
// ── i18n: auto-redirect by LINE language ──
(function autoRedirectByLanguage() {
  try {
    const lineLang = (typeof liff !== 'undefined' && typeof liff.getAppLanguage === 'function')
      ? liff.getAppLanguage()
      : null;

    if (!lineLang) return; // 非 LIFF 環境（外部瀏覽器），不做 redirect

    const langMap = {
      'en': '/en', 'ja': '/ja',
      'zh-CN': '/zh-cn', 'zh-Hans': '/zh-cn',
      'zh-TW': '', 'zh-Hant': '',
    };

    // BCP 47 完整比對 → 前兩碼 fallback
    const prefix = langMap[lineLang] ?? langMap[lineLang.split('-')[0]] ?? null;
    if (prefix === null || prefix === '') return; // 繁中或不支援的語言，不 redirect

    const currentPath = window.location.pathname;
    // 已經在語系路徑上了，不重複 redirect
    if (currentPath.startsWith('/en/') || currentPath.startsWith('/ja/') || currentPath.startsWith('/zh-cn/')) return;

    window.location.replace(prefix + currentPath + window.location.search + window.location.hash);
  } catch (e) {
    console.warn('[i18n] auto-redirect failed:', e);
    // 失敗不影響正常使用，繼續顯示繁中版
  }
})();
```

**關鍵**：
- 整個函式用 try-catch 包住，出錯就靜默 fallback 到繁中
- 只在「預設繁中路徑」+「偵測到外語」時 redirect
- 使用者手動切換語言後不會被覆蓋（因為 URL 已經有前綴了）
- 保留 search 和 hash（避免丟失 query parameters）

### 5-3. Git commit

```bash
git add src/  # 只 add 改動的前端檔案
git commit -m "feat(formosa): LIFF auto-redirect by LINE app language"
```

### Checkpoint 5

```bash
# C5-1. Astro build 成功
npm run build 2>&1 | tail -10
# → 不應該有 build error

# C5-2. 確認 auto-redirect 程式碼存在
grep -rn "autoRedirectByLanguage\|getAppLanguage" src/
# → 應該找到相關程式碼

# C5-3. 確認 try-catch 包住了
grep -A2 "autoRedirectByLanguage" src/ | grep "try\|catch"

# C5-4. 回歸：原本的 LIFF init 邏輯沒被破壞
grep -rn "liff.init" src/
# → 應該還在，且 auto-redirect 是在 init 之後
```

- [ ] Astro build 成功
- [ ] auto-redirect 程式碼存在
- [ ] 有 try-catch 保護
- [ ] liff.init 邏輯未被改動

---

## Phase 6：Smoke Test（全功能回歸）

**部署前的最後一關。Paul 會在本機 deploy，但 Code session 必須先確認一切就緒。**

### 6-1. 完整 build 檢查

```bash
# 前端 build
npm run build 2>&1 | tail -10
echo "Exit code: $?"

# Worker build
cd worker && npx wrangler deploy --dry-run --config wrangler.toml 2>&1 | tail -10
echo "Exit code: $?"
```

### 6-2. 既有功能回歸 checklist

用 grep 和程式碼閱讀確認以下功能**沒有被改壞**：

```bash
# S-1. Webhook endpoint 還在
grep "handleFormosaWebhook" worker/src/formosa.js worker/src/index.js

# S-2. 打卡 API 還在
grep "checkin\|check-in\|formosa/checkin" worker/src/formosa.js | head -5

# S-3. 問卷 API 還在
grep "survey\|questionnaire" worker/src/formosa.js | head -5

# S-4. Dashboard API 還在
grep "dashboard\|admin" worker/src/formosa.js | head -5

# S-5. 成就卡還在
grep "achievement\|scorecard" worker/src/formosa.js | head -5

# S-6. CORS 設定沒被改掉
grep "Access-Control\|cors\|CORS" worker/src/formosa.js | head -5

# S-7. 9 級等級系統還在
grep "TITLES\|煉氣\|飛升" worker/src/formosa.js | head -5

# S-8. 推播時間限制還在（4/12-4/20, 6am-6pm）
grep "month.*4\|day.*12\|pushHours" worker/src/formosa.js | head -5

# S-9. KV Buffer 邏輯還在
grep "TICKER_KV\|KV\|kv" worker/src/formosa.js | head -5

# S-10. formosa-i18n.js 有被正確 import
grep "formosa-i18n" worker/src/formosa.js
```

### 6-3. 新功能驗證 checklist

```bash
# N-1. language 欄位 migration 語句存在
grep "ADD COLUMN language" worker/src/formosa.js

# N-2. upsert 有存 language
grep -A5 "INSERT INTO formosa_users" worker/src/formosa.js | grep language

# N-3. getUserLocale 函式存在且有 fallback
grep -A10 "function getUserLocale" worker/src/formosa.js

# N-4. routeKeyword 有用 locale
grep "getUserLocale\|botMsg\|localizeUrl" worker/src/formosa.js | wc -l
# → 應該 > 5 個使用點

# N-5. 推播有分語言
grep "localeConfigs\|locale.*push" worker/src/formosa.js | head -5

# N-6. LIFF auto-redirect 存在
grep -rn "getAppLanguage" src/

# N-7. 所有改動都已 commit
git status
# → 應該是 clean（nothing to commit）
```

### 6-4. 結果紀錄

把上面所有檢查結果記錄在 worklog 裡。格式：

```
## Smoke Test Results

### 既有功能回歸（10/10 pass）
- [x] S-1 ~ S-10 全部通過

### 新功能驗證（7/7 pass）
- [x] N-1 ~ N-7 全部通過

### Build 狀態
- [x] 前端 build: OK
- [x] Worker build: OK
```

---

## 部署指令（Paul 本機執行）

Code session 完成所有 Phase 並通過 Smoke Test 後，產出以下指令給 Paul：

```bash
# 先 pull 最新
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull

# 部署前端
npm run build && npx wrangler pages deploy dist/

# 部署 Worker（必須帶 --config）
cd worker && wrangler deploy --config wrangler.toml

# 部署後驗證
curl -s https://api.paulkuo.tw/formosa/health | jq .
```

---

## 注意事項（Code session 必讀）

1. **不可以跳 Phase**。Phase 0 偵察完才能改程式碼。每個 Checkpoint 沒過就停下來排錯。
2. **每個 Phase 開始前 commit**。確保任何時候都能 `git checkout` 回上一個好的狀態。
3. **getUserLocale 和 autoRedirectByLanguage 都必須有 try-catch**。語言偵測失敗不應該影響核心功能。
4. **繁中是 fallback，不是例外**。任何地方拿不到語言就用繁中，確保既有使用者完全不受影響。
5. **Rich Menu 不改**。Rich Menu 按鈕發送中文關鍵字，但 routeKeyword 的 regex 已經涵蓋中英日，所以不需要改圖。
6. **LIFF SDK 版本**：必須 ≥ v2.24.0 才有 `liff.getAppLanguage()`。如果目前版本太舊，Phase 5 需要先升級。
7. **deploy 兩次**：前端 + Worker 是分開部署的。
8. **CDN 快取**：部署後最多等 1hr 才生效，驗證時用 hard refresh。

---

## 回報格式

完成後在 worklog 回報：
```
- {HH:MM} LINE i18n 多語系支援 Phase 1-5 完成（D1 language 欄位 + Bot 4 語回覆 + 推播分語言 + LIFF auto-redirect）({commit hash}) Code
- {HH:MM} Smoke Test: 既有功能 10/10 pass, 新功能 7/7 pass, build OK Code
```

## 新增/修改檔案清單

| 檔案 | 動作 | Phase | 說明 |
|------|------|-------|------|
| `worker/src/formosa.js` | 修改 | 1,3,4 | migration + upsert language + routeKeyword i18n + push i18n |
| `worker/src/formosa-i18n.js` | 新增 | 2 | Bot 訊息翻譯字典 + mapLineLanguageToLocale + localizeUrl + botMsg |
| Tracker 頁面 `<script>` | 修改 | 5 | LIFF getAppLanguage() auto-redirect |

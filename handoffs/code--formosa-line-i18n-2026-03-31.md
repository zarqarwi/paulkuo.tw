# Handoff: LINE 多語系支援（LIFF 自動導向 + Bot 回覆 + 推播）

**來源**: Cowork session
**目標**: Code session
**日期**: 2026-03-31
**優先級**: Phase 3 上線前（4/12 前完成）

---

## 背景

外國參與者（日本人、歐美背包客等）可能透過 LINE 參加白沙屯繞境。
目前系統的 i18n 翻譯檔已齊全（zh-Hant / en / ja / zh-Hans，237 keys × 4 語系），
但 LINE 端（LIFF 入口、Bot 回覆、推播）全部硬編碼繁體中文，外國人進來只能手動找語言切換器。

LINE 平台有完整的語言偵測能力：
- LIFF SDK `liff.getAppLanguage()` — 拿到 LINE App 語言設定（BCP 47）
- Messaging API `getProfile` — 回傳 `language` 欄位（BCP 47）

本工單一次做完三件事：LIFF 自動語言導向 + Bot 多語回覆 + 推播多語。

---

## Step 0：偵察（先查再改）

```bash
# 確認翻譯檔有 push 和 bot 相關 key
grep -n "push\." src/i18n/translations/en.ts | head -20
grep -n "push\." src/i18n/translations/ja.ts | head -20

# 確認 formosa.js 的 LINE 相關函式位置
grep -n "routeKeyword\|buildWelcomeMessage\|buildUsageMessage\|buildMenuMessage\|buildCarbonInfoMessage\|buildStatsMessage\|PUSH_MESSAGES\|getLineProfile" worker/src/formosa.js

# 確認 LIFF init 的位置（前端）
grep -rn "liff.init\|liff.getAppLanguage\|liff.getLanguage" src/ public/

# 確認翻譯檔有完整的 bot 訊息 key
grep -n "bot\.\|menu\.\|welcome\." src/i18n/translations/en.ts | head -30
```

---

## Part A：LIFF 自動語言導向（前端）

### A1. 在 Tracker 頁面加入 LIFF 語言偵測

找到 LIFF init 的地方（應在 Tracker 頁面的 `<script>` 中），在 `liff.init()` 完成後加入自動導向邏輯：

```javascript
// ── i18n auto-redirect based on LINE language ──
// 在 liff.init() 成功後執行
function autoRedirectByLanguage() {
  // liff.getAppLanguage() 不需要 init 就能用（LIFF v2.24+）
  // 但在 init 後呼叫更穩妥
  const lineLang = (typeof liff !== 'undefined' && liff.getAppLanguage)
    ? liff.getAppLanguage()
    : null;

  if (!lineLang) return; // 非 LIFF 環境，不做 redirect

  // BCP 47 → 我們的 locale prefix 映射
  const langMap = {
    'en': '/en',
    'ja': '/ja',
    'zh-CN': '/zh-cn',
    'zh-Hans': '/zh-cn',
    'zh-TW': '',       // 繁中 = 預設，不需 prefix
    'zh-Hant': '',
  };

  // 取前兩碼做 fallback（例如 'en-US' → 'en'）
  const prefix = langMap[lineLang] ?? langMap[lineLang.split('-')[0]] ?? null;

  // 如果偵測到的語言和當前 URL 不同，redirect
  if (prefix !== null) {
    const currentPath = window.location.pathname;
    const isAlreadyLocalized = currentPath.startsWith('/en/') ||
                                currentPath.startsWith('/ja/') ||
                                currentPath.startsWith('/zh-cn/');

    // 只在預設路徑（繁中）且偵測到外語時 redirect
    // 避免使用者手動切語言後被覆蓋
    if (!isAlreadyLocalized && prefix !== '') {
      const newPath = prefix + currentPath;
      window.location.replace(newPath);
      return;
    }
  }
}
```

### A2. 注意事項

- `liff.getAppLanguage()` 需要 LIFF SDK v2.24.0+，確認 CDN 載入的版本
- 只在「預設繁中路徑」且「偵測到外語」時才 redirect，避免干擾手動切語言的使用者
- 在外部瀏覽器（非 LINE in-app）中 `liff.getAppLanguage()` 會 fallback 到 `liff.getLanguage()` 行為，回傳 OS 語言

---

## Part B：Bot 多語回覆（Worker 端）

### B1. 在 `getLineProfile` 中保存 `language` 到 D1

目前 `getLineProfile`（~line 1413）回傳 `{ displayName, pictureUrl, statusMessage, userId }`，
LINE API 其實還會回傳 `language` 欄位。

**修改 `getLineProfile`**：確保回傳包含 `language`（它本來就在 response 裡，只是沒被用到）。

**修改 D1 upsert**（~line 160 的 webhook handler）：

```sql
-- 新增 language 欄位到 formosa_users
ALTER TABLE formosa_users ADD COLUMN language TEXT DEFAULT 'zh-Hant';
```

```javascript
// 在 webhook handler 的 upsert 中加入 language
const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
const userLang = profile?.language || 'zh-Hant';

await env.AUTH_DB.prepare(
  `INSERT INTO formosa_users (line_user_id, display_name, picture_url, language)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(line_user_id) DO UPDATE SET
   display_name = excluded.display_name,
   picture_url = excluded.picture_url,
   language = excluded.language`
).bind(userId, profile?.displayName || '', profile?.pictureUrl || '', userLang).run();
```

### B2. BCP 47 → 系統 locale 映射函式

```javascript
/**
 * 將 LINE 的 BCP 47 language tag 映射到我們的 4 個 locale
 * @param {string} lang - LINE profile 的 language 欄位，如 'en', 'ja', 'zh-TW'
 * @returns {string} - 'zh-Hant' | 'en' | 'ja' | 'zh-Hans'
 */
function mapLineLanguageToLocale(lang) {
  if (!lang) return 'zh-Hant';
  const l = lang.toLowerCase();
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('en')) return 'en';
  if (l === 'zh-cn' || l === 'zh-hans') return 'zh-Hans';
  // zh-TW, zh-Hant, zh, 或其他 → 預設繁中
  return 'zh-Hant';
}
```

### B3. Worker 端翻譯字典

翻譯檔目前在 `src/i18n/translations/`（Astro 前端用），Worker 端需要一份獨立的 bot 訊息字典。

**新建 `worker/src/formosa-i18n.js`**：

```javascript
/**
 * Formosa LINE Bot — i18n 訊息字典
 * 只包含 Bot 回覆 + 推播需要的文字
 */
export const BOT_MESSAGES = {
  'zh-Hant': {
    checkin: '📍 立即打卡記錄足跡：\n{url}',
    bug: '📝 回報問題請到這裡：\n{url}\n\n也可以直接在這裡打字描述，我們會看到！',
    share: '📤 分享你的進香足跡給朋友：\n{url}\n\n打開後點「📸 分享我的進香足跡」按鈕，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯媽祖 ESG 永續進香\n\n台灣首份進香永續數據計畫，記錄參與者的足跡、碳足跡與善行故事。\n\n📖 了解更多：\n{url}',
    menu: '🙏 媽祖 Bot 為您服務\n\n輸入以下關鍵字：\n📍「打卡」→ 記錄足跡\n📖「說明」→ 使用指南\n📊「等級」→ 我的紀錄\n🌱「碳足跡」→ 碳排資訊\n💡「關於」→ 專案介紹\n\n💡 輸入「說明」查看使用指南',
    welcome_alt: '🙏 歡迎加入白沙屯媽祖 ESG 永續進香！',
    stats_checkins: '📍 打卡次數：{count}',
    stats_km: '📊 總公里數：{km} km',
    stats_carbon: '🌱 碳足跡：{carbon} kg CO₂e',
    stats_survey_done: '📋 問卷：已完成',
    stats_survey_pending: '📋 問卷：尚未填寫',
    carbon_info: '🌱 碳足跡小知識\n\n進香途中我們用兩種方式估算你的碳足跡：\n🚶 步行/腳踏車 → 零排放 ✨\n🚌 搭乘交通工具 → 約 0.48 kg CO₂e/km\n\n走越多、搭越少，碳足跡越低！\n🌿 鼓勵大家多走路、多共乘，一起愛護地球 🌍',
    push: [
      { title: '📍 早安打卡', text: '媽祖保佑 🙏 新的一天，記錄您的進香足跡！' },
      { title: '📍 午間打卡', text: '走了好多路！打個卡記錄一下 🚶' },
      { title: '📍 下午打卡', text: '繼續前進！打卡累積您的香客等級 ✨' },
      { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡記錄今日行程' },
    ],
  },
  'en': {
    checkin: '📍 Check in now and record your journey:\n{url}',
    bug: '📝 Report an issue here:\n{url}\n\nOr just type your feedback here — we will see it!',
    share: '📤 Share your pilgrimage journey with friends:\n{url}\n\nTap "📸 Share My Pilgrimage" to share on LINE, Facebook, and more!',
    about: '🌱 2026 Baishatun Mazu ESG Pilgrimage\n\nTaiwan first sustainable pilgrimage data project — tracking footprint, carbon emissions, and stories of kindness.\n\n📖 Learn more:\n{url}',
    menu: '🙏 Mazu Bot at your service\n\nType a keyword:\n📍 "checkin" → Record footprint\n📖 "help" → User guide\n📊 "level" → My stats\n🌱 "carbon" → Carbon info\n💡 "about" → About this project\n\n💡 Type "help" for the user guide',
    welcome_alt: '🙏 Welcome to Baishatun Mazu ESG Pilgrimage!',
    stats_checkins: '📍 Check-ins: {count}',
    stats_km: '📊 Total distance: {km} km',
    stats_carbon: '🌱 Carbon footprint: {carbon} kg CO₂e',
    stats_survey_done: '📋 Survey: Completed',
    stats_survey_pending: '📋 Survey: Not yet completed',
    carbon_info: '🌱 Carbon Footprint Facts\n\nWe estimate your carbon footprint two ways:\n🚶 Walking/cycling → Zero emissions ✨\n🚌 Motor transport → ~0.48 kg CO₂e/km\n\nWalk more, ride less — lower your footprint!\n🌿 Let us protect the Earth together 🌍',
    push: [
      { title: '📍 Morning Check-in', text: 'Mazu blesses you 🙏 Start a new day — record your pilgrimage!' },
      { title: '📍 Midday Check-in', text: 'You have walked so far! Check in to record your journey 🚶' },
      { title: '📍 Afternoon Check-in', text: 'Keep going! Check in to level up ✨' },
      { title: '📍 Evening Check-in', text: 'Great effort today 🙏 Check in to record your day' },
    ],
  },
  'ja': {
    checkin: '📍 今すぐチェックインして巡礼を記録：\n{url}',
    bug: '📝 問題の報告はこちら：\n{url}\n\nここに直接入力してもOKです！',
    share: '📤 巡礼の記録を友達にシェア：\n{url}\n\n「📸 巡礼をシェア」をタップしてLINE・Facebookなどで共有！',
    about: '🌱 2026 白沙屯媽祖 ESG 巡礼\n\n台湾初の巡礼サステナビリティデータ計画 — 足跡、CO₂、善行の記録。\n\n📖 詳しく見る：\n{url}',
    menu: '🙏 媽祖 Bot がお手伝い\n\nキーワードを入力：\n📍「checkin」→ 足跡を記録\n📖「help」→ 使い方ガイド\n📊「level」→ マイ記録\n🌱「carbon」→ CO₂情報\n💡「about」→ プロジェクト紹介\n\n💡「help」でガイドを表示',
    welcome_alt: '🙏 白沙屯媽祖 ESG 巡礼へようこそ！',
    stats_checkins: '📍 チェックイン回数：{count}',
    stats_km: '📊 総距離：{km} km',
    stats_carbon: '🌱 CO₂排出量：{carbon} kg CO₂e',
    stats_survey_done: '📋 アンケート：完了',
    stats_survey_pending: '📋 アンケート：未回答',
    carbon_info: '🌱 CO₂豆知識\n\n巡礼中のCO₂排出を2つの方法で推定：\n🚶 徒歩/自転車 → ゼロ排出 ✨\n🚌 車両移動 → 約 0.48 kg CO₂e/km\n\n歩くほどCO₂が減ります！\n🌿 一緒に地球を守りましょう 🌍',
    push: [
      { title: '📍 おはようチェックイン', text: '媽祖のご加護を 🙏 新しい一日、巡礼を記録しましょう！' },
      { title: '📍 お昼のチェックイン', text: 'たくさん歩きましたね！チェックインしましょう 🚶' },
      { title: '📍 午後のチェックイン', text: '前進あるのみ！チェックインでレベルアップ ✨' },
      { title: '📍 夕方のチェックイン', text: 'お疲れ様でした 🙏 今日の行程を記録しましょう' },
    ],
  },
  'zh-Hans': {
    checkin: '📍 立即打卡记录足迹：\n{url}',
    bug: '📝 回报问题请到这里：\n{url}\n\n也可以直接在这里打字描述，我们会看到！',
    share: '📤 分享你的进香足迹给朋友：\n{url}\n\n打开后点「📸 分享我的进香足迹」按钮，就能分享到 LINE、Facebook 等平台！',
    about: '🌱 2026 白沙屯妈祖 ESG 永续进香\n\n台湾首份进香永续数据计划，记录参与者的足迹、碳足迹与善行故事。\n\n📖 了解更多：\n{url}',
    menu: '🙏 妈祖 Bot 为您服务\n\n输入以下关键字：\n📍「打卡」→ 记录足迹\n📖「说明」→ 使用指南\n📊「等级」→ 我的记录\n🌱「碳足迹」→ 碳排信息\n💡「关于」→ 项目介绍\n\n💡 输入「说明」查看使用指南',
    welcome_alt: '🙏 欢迎加入白沙屯妈祖 ESG 永续进香！',
    stats_checkins: '📍 打卡次数：{count}',
    stats_km: '📊 总公里数：{km} km',
    stats_carbon: '🌱 碳足迹：{carbon} kg CO₂e',
    stats_survey_done: '📋 问卷：已完成',
    stats_survey_pending: '📋 问卷：尚未填写',
    carbon_info: '🌱 碳足迹小知识\n\n进香途中我们用两种方式估算你的碳足迹：\n🚶 步行/脚踏车 → 零排放 ✨\n🚌 搭乘交通工具 → 约 0.48 kg CO₂e/km\n\n走越多、搭越少，碳足迹越低！\n🌿 鼓励大家多走路、多共乘，一起爱护地球 🌍',
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
 * @param {string} key - 訊息 key
 * @param {object} vars - placeholder 變數，如 { url, count, km, carbon }
 */
export function botMsg(locale, key, vars = {}) {
  const msg = BOT_MESSAGES[locale]?.[key] || BOT_MESSAGES['zh-Hant'][key] || key;
  if (typeof msg !== 'string') return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
```

### B4. 修改 `routeKeyword` 接入多語

```javascript
async function routeKeyword(text, userId, env) {
  // 從 D1 讀使用者語言
  const userRow = await env.AUTH_DB.prepare(
    'SELECT language FROM formosa_users WHERE line_user_id = ?'
  ).bind(userId).first();
  const locale = mapLineLanguageToLocale(userRow?.language);
  const t = text.toLowerCase();

  // 關鍵字也要支援英日文
  if (/打卡|checkin|check.?in|記錄/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'checkin', { url: TRACKER_URL }) }];
  }
  // ... 其他關鍵字同理
}
```

### B5. 修改 Flex Message builders

`buildWelcomeMessage()`、`buildUsageMessage()`、`buildMenuMessage()` 等都要接受 `locale` 參數。
Flex Message 的文字欄位用 `botMsg(locale, key)` 取代硬編碼字串。

---

## Part C：推播多語

### C1. 修改 `handleFormosaScheduledPush`

推播時按使用者語言分組，分批發送：

```javascript
export async function handleFormosaScheduledPush(env) {
  // ... 時間檢查邏輯不變 ...

  // 按語言分組查詢使用者
  const locales = ['zh-Hant', 'en', 'ja', 'zh-Hans'];

  for (const locale of locales) {
    const langPattern = locale === 'zh-Hant' ? "zh%" :
                        locale === 'en' ? "en%" :
                        locale === 'ja' ? "ja%" : "zh-Hans";

    // zh-Hant 額外包含 language IS NULL（預設）
    const users = locale === 'zh-Hant'
      ? await env.AUTH_DB.prepare(
          `SELECT line_user_id FROM formosa_users
           WHERE line_user_id IS NOT NULL
           AND (participant_status IS NULL OR participant_status = 'active')
           AND (language IS NULL OR language LIKE 'zh-TW%' OR language LIKE 'zh-Hant%' OR language = 'zh')`
        ).all()
      : await env.AUTH_DB.prepare(
          `SELECT line_user_id FROM formosa_users
           WHERE line_user_id IS NOT NULL
           AND (participant_status IS NULL OR participant_status = 'active')
           AND language LIKE ?`
        ).bind(langPattern).all();

    if (!users.results?.length) continue;

    const msg = BOT_MESSAGES[locale].push[msgIdx];
    const userIds = users.results.map(u => u.line_user_id);
    await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [
      { type: 'text', text: `${msg.title}\n\n${msg.text}\n\n📍 ${TRACKER_URL}` }
    ]);
  }
}
```

---

## Part D：D1 Migration

```sql
-- 在 migrateFormosa() 中新增：
ALTER TABLE formosa_users ADD COLUMN language TEXT DEFAULT NULL;
```

注意：SQLite 的 `ALTER TABLE ADD COLUMN` 是安全操作，不會影響既有資料。
既有使用者的 `language` 會是 NULL，下次互動時自動填入。

---

## 驗證方式

### Level 1：基本功能
```bash
# 確認 D1 migration 成功
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "PRAGMA table_info(formosa_users)" | grep language

# 確認 Worker 部署成功
curl -s https://api.paulkuo.tw/formosa/health | jq .
```

### Level 2：LIFF 語言導向
- 在手機 LINE 設定語言為英文 → 開啟 LIFF 連結 → 應自動導向 `/en/tracker/`
- 在手機 LINE 設定語言為日文 → 開啟 LIFF 連結 → 應自動導向 `/ja/tracker/`
- 在手機 LINE 設定語言為繁中 → 開啟 LIFF 連結 → 應停留在 `/tracker/`（不 redirect）

### Level 3：Bot 多語回覆
- 用英文 LINE 帳號發送 "checkin" → 應收到英文回覆
- 用日文 LINE 帳號發送 "help" → 應收到日文回覆
- 用繁中 LINE 帳號發送「打卡」→ 應收到繁中回覆（不受影響）

### Level 4：推播多語
- Dashboard 手動推播測試 → 確認不同語言使用者收到對應語言的訊息

---

## 注意事項

1. **LIFF SDK 版本**：確認 CDN 載入的是 v2.24.0+，才有 `liff.getAppLanguage()`
2. **關鍵字 regex 擴充**：英文使用者可能輸入 "help"、"about"、"share" 等英文關鍵字，regex 要加入
3. **Flex Message**：`buildWelcomeMessage()` 和 `buildUsageMessage()` 是 Flex JSON，裡面的文字都要走翻譯
4. **Rich Menu**：本次不改 Rich Menu 圖片（工程量大且優先級低），Rich Menu 的按鈕 action 是發送中文關鍵字，但 routeKeyword 的 regex 已經涵蓋英文別名，所以外國人按 Rich Menu 也能觸發正確回覆
5. **等級名稱**：前端翻譯檔 `levels.*.name` 已有四語版本（修仙/Western pilgrimage/Buddhist），`buildStatsMessage` 要用翻譯版等級名
6. **URL 語系前綴**：Bot 回覆中的 TRACKER_URL 可以根據使用者語言加上前綴（如 `mazu.today/en/tracker/`），讓點開直接是對的語言
7. **deploy 兩次**：前端（Astro build → wrangler pages deploy）+ Worker（wrangler deploy --config worker/wrangler.toml）

---

## 回報格式

完成後請在 worklog 回報：
```
- {HH:MM} LINE i18n 多語系支援（LIFF auto-redirect + Bot 4 語回覆 + 推播分語言發送）({commit hash}) Code
```

## 新增/修改檔案清單

| 檔案 | 動作 | 說明 |
|------|------|------|
| `worker/src/formosa-i18n.js` | 新增 | Bot 訊息翻譯字典 + `botMsg()` helper |
| `worker/src/formosa.js` | 修改 | getLineProfile 存 language、routeKeyword 接翻譯、推播分語言、Flex builders 接 locale |
| Tracker 頁面 `<script>` | 修改 | 加入 `liff.getAppLanguage()` 自動導向邏輯 |
| D1 migration | 修改 | `formosa_users` 加 `language` 欄位 |

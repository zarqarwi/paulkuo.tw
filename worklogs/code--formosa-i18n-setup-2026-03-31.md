# Code Handoff：多語系 i18n 架構建置

> 產出日期：2026-03-31
> 來源：Cowork session（翻譯檔已產出、key 結構已驗證）
> 目標：Code session 將 i18n 翻譯系統整合進 Astro 前端
> 優先級：Phase 4（活動期間或之後，不是 4/12 前必做）

---

## 背景

mazu.today 要支援多語系，讓外國香客也能使用。Cowork 已完成：
- 4 份翻譯檔（zh-Hant / en / ja / zh-Hans），237 key × 4 語言 = 948 條翻譯
- i18n config + utils（`t()` helper、`getLangFromURL()`、語言切換連結產生器）
- Key 結構驗證通過（4 語言完全對齊）
- 等級名稱各語言獨立設計（英文西方聖途風、日文修行巡禮風）

Code 的任務是把這些檔案放進 repo，然後逐步把 .astro 裡的 hardcode 中文替換成 `t()` 呼叫。

---

## 翻譯檔位置

Cowork 產出的檔案在 Paul 的資料夾裡，結構如下：

```
i18n/
├── config.ts              ← 語言設定、URL prefix、hreflang
├── utils.ts               ← t() helper、getLangFromURL()、getLangSwitchLinks()
└── translations/
    ├── zh-Hant.ts          ← Source of truth（237 keys）
    ├── en.ts               ← 英文（含獨立風格等級名）
    ├── ja.ts               ← 日文（修行巡禮主題等級名）
    └── zh-Hans.ts          ← 簡體中文
```

**目標放置路徑**：`src/i18n/`（整個資料夾搬過去）

ℹ️ **config.ts 和 utils.ts 已經推上 repo**（`src/i18n/config.ts`、`src/i18n/utils.ts`）。
4 份翻譯檔在 Paul 的資料夾 `白沙屯ESG繞境/i18n/translations/` 裡，請複製到 `src/i18n/translations/`。

---

## Step 0 偵察

```bash
# 1. 確認目前有沒有 i18n 相關檔案
find src/ -name "*i18n*" -o -name "*locale*" -o -name "*translation*" 2>/dev/null

# 2. 確認 Astro 版本（v4+ 才有內建 i18n routing）
grep '"astro"' package.json

# 3. 確認現有的語言切換連結怎麼寫的
grep -rn "hreflang\|langPrefix\|currentLang\|lang-switch" src/ --include="*.astro" | head -20

# 4. 確認 NavBar 和 MobileTabBar 的語言切換實作
grep -rn "繁\|简\|EN\|日" src/components/NavBar.astro src/components/MobileTabBar.astro 2>/dev/null | head -20

# 5. 確認頁面路由結構
ls -la src/pages/projects/formosa-esg-2026/
ls -la src/pages/en/ src/pages/ja/ src/pages/zh-cn/ 2>/dev/null
```

---

## 具體步驟

### Step 1：複製翻譯檔進 repo

把 Cowork 產出的 `i18n/` 資料夾搬到 `src/i18n/`。

```bash
# Paul 手動從資料夾複製，或 Code session 從 worklogs 拿
cp -r /path/to/i18n/ src/i18n/
```

### Step 2：設定 Astro i18n routing（如果 Astro v4+）

在 `astro.config.mjs` 加入：

```javascript
export default defineConfig({
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en', 'ja', 'zh-Hans'],
    routing: {
      prefixDefaultLocale: false,  // zh-Hant 不加 prefix
    },
    // URL path 對照
    // zh-Hant → /（無 prefix）
    // en → /en/
    // ja → /ja/
    // zh-Hans → /zh-cn/
  },
});
```

如果 Astro 版本不支援 `i18n` config，跳過這步，用 utils.ts 裡的手動路由即可。

### Step 3：建立多語言路由頁面

對每個需要翻譯的頁面（以 tracker 為例），建立語言版本：

```
src/pages/projects/formosa-esg-2026/tracker/index.astro    ← zh-Hant（改用 t()）
src/pages/en/projects/formosa-esg-2026/tracker/index.astro  ← 重用同一模板
src/pages/ja/projects/formosa-esg-2026/tracker/index.astro  ← 重用同一模板
src/pages/zh-cn/projects/formosa-esg-2026/tracker/index.astro ← 重用同一模板
```

**推薦做法**：抽出共用的 `_TrackerPage.astro` component，各語言頁面只是 wrapper：

```astro
---
// src/pages/en/projects/formosa-esg-2026/tracker/index.astro
import TrackerPage from '../../../../projects/formosa-esg-2026/tracker/_TrackerPage.astro';
---
<TrackerPage lang="en" />
```

### Step 4：替換 hardcode 中文（漸進式）

**建議順序（P0 → P2）：**

| 優先 | 頁面 / 元件 | 影響 |
|------|-------------|------|
| P0 | NavBar / MobileTabBar | 全站導覽 |
| P0 | tracker/index.astro | 打卡核心頁 |
| P0 | 等級系統 UI（wherever levels are rendered） | 外國人看得到 |
| P1 | guide/index.astro | 使用說明 |
| P1 | privacy/index.astro | 法律相關 |
| P1 | my/index.astro | 個人足跫 |
| P2 | 問卷 14 題 | 互動內容 |
| P2 | data.astro（碳足跫方法論） | 說明性質 |
| P3 | dashboard/ | 內部使用 |

**替換範例：**

```astro
---
// Before
---
<h1>白沙屯媽祖 ESG 進香追蹤系統</h1>
<button>打卡</button>

---
// After
import { t, getLangFromURL } from '@/i18n/utils';
const lang = getLangFromURL(Astro.url);
---
<h1>{t(lang, 'brand.systemName')}</h1>
<button>{t(lang, 'tracker.checkin')}</button>
```

### Step 5：Worker 端的 user-facing 文字（可選）

Worker 回傳的 error message 如果有中文（例如 rate limit 提示），也可以改成帶 locale 參數：

```
GET /api/formosa/checkin?locale=en
→ { "error": "Rate limit exceeded" }  // 而不是 "操作太頻繁"
```

這個可以之後再做，不影響核心功能。

---

## 翻譯設計備忘

### 等級名稱對照

| Lv | zh-Hant | en | ja | zh-Hans |
|----|---------|----|----|--------|
| 1 | 煉氣香客 | Novice Pilgrim | 初心の巡礼者 | 炼气香客 |
| 2 | 築基香客 | Steadfast Walker | 精進の歩者 | 筑基香客 |
| 3 | 金丹香客 | Trail Blazer | 行脚の修行者 | 金丹香客 |
| 4 | 元嬰香客 | Road Warrior | 信念の道者 | 元婴香客 |
| 5 | 化神香客 | Sacred Wanderer | 神通の巡者 | 化神香客 |
| 6 | 煉虛香客 | Spirit Walker | 無我の行者 | 炼虚香客 |
| 7 | 合體香客 | Path Guardian | 悟道の旅人 | 合体香客 |
| 8 | 大乘香客 | Enlightened Pilgrim | 菩薩の巡者 | 大乘香客 |
| 9 | 飛升香客 | The Ascended | 天上の巡礼 | 飞升香客 |

### 翻譯術語慣例

| 中文 | en | ja | 說明 |
|------|----|----|------|
| 祝福 | blessing | 祈り | 日文用「祈禱」更符合巡禮文化 |
| 進香 | pilgrimage | 巡礼 | 宗教旅行 |
| 碳節省量 | carbon saved | CO₂削減量 | 日文用正式環境用語 |
| 打卡 | check-in | チェックイン | 科技用語統一 |

---

## 驗證方式

1. `npm run build` 成功（所有語言頁面都能 build）
2. 開啟 `/en/projects/formosa-esg-2026/tracker/` 看到英文 UI
3. 開啟 `/ja/projects/formosa-esg-2026/tracker/` 看到日文 UI
4. 語言切換按鈕正確跳轉到對應版本
5. 等級名稱在各語言版本顯示各自的風格名
6. `t()` fallback 正常（key 不存在時 fallback 到 zh-Hant）
7. hreflang tags 在 HTML head 正確輸出

---

## 注意事項

- **不要一次改完所有頁面**。建議先做一個頁面（如 tracker）跑通整個 i18n 流程，確認 build / routing / t() 都正常，再擴展到其他頁面
- 翻譯檔的 `as const` 是故意的，確保 TypeScript 可以推斷出精確的 key type
- `utils.ts` 的 import path 用了 `@/i18n/`，確認 tsconfig / astro config 有設定 `@` alias 指向 `src/`
- 多語言頁面會讓 build output 變大（×4），確認 Cloudflare Pages 的 build size 限制
- CDN 快取：不同語言版本是不同 URL，不會互相污染快取
- LINE LIFF 的 redirect URL 可能需要更新，確認 LIFF 設定的 endpoint URL 支援帶語言 prefix

---

## 回報格式

```
完成項目：
- [ ] i18n 翻譯檔放入 src/i18n/ (commit hash)
- [ ] Astro i18n routing 設定 (commit hash)
- [ ] P0 頁面替換完成：NavBar + tracker + 等級系統 (commit hash)
- [ ] 多語言路由頁面建立 (commit hash)
- [ ] build 成功 (commit hash)

驗證結果：
- /en/ 頁面顯示英文：✅/❌
- /ja/ 頁面顯示日文：✅/❌
- /zh-cn/ 頁面顯示簡中：✅/❌
- 語言切換跳轉正確：✅/❌
- 等級名稱各語言風格正確：✅/❌
- t() fallback 正常：✅/❌
- hreflang 正確：✅/❌
```

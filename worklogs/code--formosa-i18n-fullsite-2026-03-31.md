# Code Handoff：i18n 全站整合（一次做完）

> 產出日期：2026-03-31
> 來源：Cowork session（翻譯檔已在 repo、EN tracker 已驗證通過）
> 目標：將 formosa-esg-2026 全部頁面的 hardcode 中文替換成 `t()` 呼叫，建立完整多語言路由
> 優先級：Phase 4（一次做完，不分批）
> ℹ️ 此檔取代 `code--formosa-i18n-setup-2026-03-31.md` 和 `code--formosa-i18n-integration-2026-03-31.md`

---

## 背景

mazu.today 的 Nav 已經有多語言切換（繁/EN/日/简），但頁面內容全是 hardcode 中文。
Cowork 已產出 237 key × 4 語言的翻譯檔，全部在 repo 的 `src/i18n/` 裡。
EN tracker 頁面已驗證通過（header、語言切換、AuthGate title 都正確）。

現在要把**所有 formosa 頁面**都 i18n 化，讓語言切換真的有用。

---

## 已就位的檔案（不需要再建立）

```
src/i18n/
├── config.ts              ← 語言設定、URL prefix、hreflang
├── utils.ts               ← t() helper、getLangFromURL()、getLangSwitchLinks()
└── translations/
    ├── zh-Hant.ts          ← Source of truth（237 keys）
    ├── en.ts               ← 英文
    ├── ja.ts               ← 日文
    └── zh-Hans.ts          ← 簡體中文
```

---

## Step 0 偵察

```bash
# 1. 確認翻譯檔完整
ls -la src/i18n/ src/i18n/translations/

# 2. Astro 版本
grep '"astro"' package.json

# 3. @ alias 設定
grep -n "alias\|paths\|@" tsconfig.json astro.config.mjs 2>/dev/null

# 4. formosa 全部頁面
find src/pages/projects/formosa-esg-2026/ -name "*.astro" | sort

# 5. 已有的多語言路由頁面
ls -la src/pages/en/ src/pages/ja/ src/pages/zh-cn/ 2>/dev/null

# 6. formosa 用的導航元件（是 EventHeader 不是 NavBar）
grep -rn "EventHeader\|NavBar\|MobileTabBar" src/pages/projects/formosa-esg-2026/ --include="*.astro" | head -10

# 7. AuthGate 在哪些頁面被用到
grep -rn "AuthGate" src/pages/projects/formosa-esg-2026/ --include="*.astro" | head -10

# 8. tracker 是否已有 i18n（上一輪的成果）
grep -rn "import.*i18n\|getLangFromURL\|t(lang" src/pages/projects/formosa-esg-2026/tracker/ 2>/dev/null
```

---

## 全部要改的檔案清單

### 頁面（12 個）

| # | 路徑 | 大小 | 中文行數估計 | 說明 |
|---|------|------|------------|------|
| 1 | `tracker/index.astro` | 115 KB | ~300 行 | 打卡核心頁 ⚡ 已部分完成 |
| 2 | `index.astro` | 25 KB | ~120 行 | 專案總覽首頁 |
| 3 | `guide/index.astro` | 20 KB | ~280 行 | 香客使用說明書 |
| 4 | `guide/admin/index.astro` | 20 KB | ~250 行 | 管理者操作指南 |
| 5 | `guide/admin-flow/index.astro` | 22 KB | ~200 行 | 管理者流程圖 |
| 6 | `guide/user-flow/index.astro` | 22 KB | ~180 行 | 香客使用流程圖 |
| 7 | `my/index.astro` | 33 KB | ~150 行 | 個人進香足跫 |
| 8 | `dashboard/index.astro` | 53 KB | ~180 行 | 管理後台儀表板 |
| 9 | `data.astro` | 17 KB | ~65 行 | 繞境數據收集說明 |
| 10 | `feedback/index.astro` | 10 KB | ~85 行 | 回報問題表單 |
| 11 | `privacy/index.astro` | 8 KB | ~120 行 | 隱私權聲明 |

### 共用元件（2 個）

| # | 路徑 | 中文行數估計 | 說明 |
|---|------|------------|------|
| 12 | `_components/AuthGate.astro` | ~60 行 | 認證閘道（LINE 登入 + 密碼）|
| 13 | `_components/EventHeader.astro` | ~15 行 | formosa 專用導航列 |

> **重要**：formosa 頁面用的是 `EventHeader.astro`，不是全站的 `NavBar.astro` / `MobileTabBar.astro`。語言切換整合要改 EventHeader。

---

## 執行步驟

### Step 1：Astro i18n routing 設定

在 `astro.config.mjs` 加入：

```javascript
export default defineConfig({
  // ...existing config
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en', 'ja', 'zh-Hans'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

如果 Astro 版本不支援，跳過，用 `utils.ts` 手動路由。

### Step 2：建立 shared component + 語言路由 wrapper

對每個頁面，抽出共用 component，各語言頁面只是 wrapper。

**模式：**
```
src/pages/projects/formosa-esg-2026/tracker/
├── _TrackerPage.astro          ← 共用主體（接收 lang prop，用 t()）
└── index.astro                 ← zh-Hant wrapper

src/pages/en/projects/formosa-esg-2026/tracker/
└── index.astro                 ← en wrapper

src/pages/ja/projects/formosa-esg-2026/tracker/
└── index.astro                 ← ja wrapper

src/pages/zh-cn/projects/formosa-esg-2026/tracker/
└── index.astro                 ← zh-Hans wrapper
```

**Wrapper 範例：**
```astro
---
// src/pages/en/projects/formosa-esg-2026/tracker/index.astro
import TrackerPage from '../../../../projects/formosa-esg-2026/tracker/_TrackerPage.astro';
---
<TrackerPage lang="en" />
```

每個頁面都照這個模式：`_{PageName}.astro` + 4 個語言 wrapper。

### Step 3：替換 hardcode 中文

在每個 `_{PageName}.astro` 裡，把中文替換成 `t()` 呼叫：

```astro
---
import { t } from '@/i18n/utils';
const { lang = 'zh-Hant' } = Astro.props;
---

<!-- Before -->
<h1>白沙屯媽祖 ESG 進香追蹤系統</h1>

<!-- After -->
<h1>{t(lang, 'brand.systemName')}</h1>
```

### Step 4：AuthGate.astro i18n 化

AuthGate 是認證閘道，多個頁面共用。需要接收 `lang` prop 並替換：

- 標題、副標題
- LINE 登入按鈕文字
- 隱私聲明同意文字
- 載入狀態提示（“登入中…”、“驗證中…”）
- 管理員登入提示

```astro
---
const { lang = 'zh-Hant' } = Astro.props;
import { t } from '@/i18n/utils';
---
<h2>{t(lang, 'auth.title')}</h2>
<button>{t(lang, 'auth.lineLogin')}</button>
```

### Step 5：EventHeader.astro i18n 化

EventHeader 是 formosa 頁面的專用導航列。需要：
- 替換 hardcode 的選單文字
- 整合 `getLangSwitchLinks()` 讓語言切換按鈕實際連到對應語言路由

```astro
---
import { getLangSwitchLinks, getLangFromURL } from '@/i18n/utils';
const lang = getLangFromURL(Astro.url);
const langLinks = getLangSwitchLinks(Astro.url.pathname, lang);
---
{langLinks.map(link => (
  <a href={link.href} class:list={[link.isCurrent && 'active']} hreflang={link.hreflang}>
    {link.label}
  </a>
))}
```

### Step 6：hreflang meta tags

在 `<head>` 加入 hreflang：

```astro
{langLinks.map(link => (
  <link rel="alternate" hreflang={link.hreflang} href={link.href} />
))}
```

### Step 7：翻譯 key 補齊

現有的 237 key 涵蓋主要內容，但替換過程中可能發現遺漏。
遇到 key 不存在的情況：

1. 先用 `t()` 帶 key 名，讓 fallback 機制顯示 zh-Hant 原文
2. 在回報裡列出所有新增的 key
3. Cowork 會補齊翻譯

---

## 翻譯 key 分類速查

| 分類 | prefix | 涵蓋範圍 |
|------|--------|--------|
| 品牌 | `brand.*` | 系統名稱、副標題、SEO |
| 導航 | `nav.*` | EventHeader 選單項目 |
| 認證 | `auth.*` | AuthGate 登入、隱私同意 |
| 打卡 | `tracker.*` | 打卡頁主要 UI |
| 等級 | `levels.*` | 9 級名稱 + 描述 |
| 問卷 | `survey.*` | 13 題問卷 |
| 個人 | `myPage.*` | 個人足跫頁 |
| 成就 | `achievement.*` | 成就卡片 |
| 分享 | `share.*` | 分享卡片 |
| 地圖 | `map.*` | 地圖元件 |
| 後台 | `dashboard.*` | 管理後台 |
| 碳足跫 | `carbon.*` | 碳排換算 |
| FAQ | `faq.*` | 10 組 Q&A |
| 隱私 | `privacy.*` | 隱私權聲明 |
| 通用 | `common.*` | 按鈕、狀態、確認 |
| 頁尾 | `footer.*` | 版權聲明 |

---

## 等級名稱對照（各語言獨立風格）

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

---

## 注意事項

- **tracker/index.astro 已部分 i18n 化**（上一輪成果），以此為基礎繼續
- `as const` 是故意的，確保 TypeScript 推斷精確 key type
- 確認 `@` alias 指向 `src/`
- formosa 頁面用 `EventHeader.astro` 不是 `NavBar.astro`，語言切換改 EventHeader
- AuthGate.astro 被多個頁面共用，改一次全部受益
- 多語言頁面會讓 build output ×4，注意 Cloudflare Pages build size 限制
- CDN 快取：不同語言是不同 URL，不互相污染
- LINE LIFF redirect URL 可能需要更新，確認支援語言 prefix
- guide 系列頁面文字量大（每頁 200+ 行），是最耗時的部分
- 遇到翻譯 key 不存在：先用 key 名讓 fallback 到 zh-Hant，回報裡列出缺的 key

---

## 完成後回報

```
偵察結果：
- Astro 版本：___
- @ alias 狀態：有 / 沒有（需設定）
- 現有語言路由頁面：有 / 沒有

完成項目（每個頁面一個 commit 或分組 commit）：
- [ ] Astro i18n routing 設定 (commit hash)
- [ ] EventHeader.astro i18n + 語言切換整合 (commit hash)
- [ ] AuthGate.astro i18n (commit hash)
- [ ] tracker/index.astro 完善 (commit hash)
- [ ] index.astro 專案首頁 (commit hash)
- [ ] guide/index.astro 使用說明 (commit hash)
- [ ] guide/admin/index.astro 管理指南 (commit hash)
- [ ] guide/admin-flow/index.astro 管理流程圖 (commit hash)
- [ ] guide/user-flow/index.astro 香客流程圖 (commit hash)
- [ ] my/index.astro 個人足跫 (commit hash)
- [ ] dashboard/index.astro 管理後台 (commit hash)
- [ ] data.astro 數據說明 (commit hash)
- [ ] feedback/index.astro 回報表單 (commit hash)
- [ ] privacy/index.astro 隱私聲明 (commit hash)
- [ ] 4 語言 wrapper 頁面全部建立 (commit hash)
- [ ] hreflang meta tags (commit hash)
- [ ] npm run build 成功 (commit hash)

驗證結果：
- /en/ 全部頁面顯示英文：✅/❌
- /ja/ 全部頁面顯示日文：✅/❌
- /zh-cn/ 全部頁面顯示簡中：✅/❌
- 語言切換按鈕跳轉正確（所有頁面）：✅/❌
- 等級名稱各語言風格正確：✅/❌
- AuthGate 登入流程各語言正常：✅/❌
- t() fallback 正常（缺 key 時 fallback zh-Hant）：✅/❌
- hreflang tags 在 HTML head 正確輸出：✅/❌

新增 / 缺少的翻譯 key：
- （列出替換過程中發現的缺漏 key，格式：key 名 + zh-Hant 原文）

遇到的問題 / 架構調整：
- （列出任何需要 Cowork 補翻譯或需要 Paul 決定的事項）
```

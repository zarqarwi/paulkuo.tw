# Code Handoff：i18n 前端整合

> 產出日期：2026-03-31
> 來源：Cowork session
> 目標：將 repo 裡已就位的 i18n 翻譯系統整合進 Astro 前端頁面
> 優先級：Phase 4（活動期間或之後，不是 4/12 前必做）

---

## 背景

mazu.today 要支援英文、日文、簡體中文，讓外國香客也能使用。
Cowork 已完成翻譯檔產出（237 key × 4 語言 = 948 條翻譯），所有檔案已在 repo 裡。
Code 的任務是：把 .astro 頁面裡 hardcode 的中文替換成 `t()` 呼叫，並建立多語言路由。

---

## 已就位的檔案（不需要再建立）

以下檔案已經在 repo 的 `src/i18n/`：

```
src/i18n/
├── config.ts              ← 語言設定、URL prefix、hreflang
├── utils.ts               ← t() helper、getLangFromURL()、getLangSwitchLinks()
└── translations/
    ├── zh-Hant.ts          ← Source of truth（237 keys）
    ├── en.ts               ← 英文（西方聖途風等級名）
    ├── ja.ts               ← 日文（修行巡禮主題等級名）
    └── zh-Hans.ts          ← 簡體中文
```

Key 結構已驗證：4 語言 237 key 完全對齊，不缺不多。

---

## Step 0 偵察（先查再動手）

```bash
# 1. 確認翻譯檔都在
ls -la src/i18n/ src/i18n/translations/

# 2. 確認 Astro 版本（v4+ 才有內建 i18n routing）
grep '"astro"' package.json

# 3. 確認 @ alias 有沒有設定（utils.ts 用 @/i18n/ 路徑）
grep -n "alias\|paths\|@" tsconfig.json astro.config.mjs 2>/dev/null

# 4. 確認現有的語言切換 UI 怎麼寫的
grep -rn "hreflang\|langPrefix\|currentLang\|lang-switch\|繁\|简\|EN\|日" src/components/ --include="*.astro" | head -20

# 5. 確認頁面路由結構
ls -la src/pages/projects/formosa-esg-2026/
ls -la src/pages/en/ src/pages/ja/ src/pages/zh-cn/ 2>/dev/null

# 6. 試 import 看有沒有問題
echo 'import { t } from "./src/i18n/utils"' | npx tsx --eval 2>&1 | head -5
```

---

## Step 1：設定 Astro i18n routing

在 `astro.config.mjs` 加入 i18n 設定：

```javascript
export default defineConfig({
  // ...existing config
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en', 'ja', 'zh-Hans'],
    routing: {
      prefixDefaultLocale: false,  // zh-Hant 不加 prefix
    },
  },
});
```

URL 結構：`/`（繁中）、`/en/`、`/ja/`、`/zh-cn/`

如果 Astro 版本不支援 `i18n` config，跳過此步，用 `utils.ts` 裡的手動路由即可。

---

## Step 2：建立多語言路由頁面

抽出共用 component，各語言頁面只是 wrapper。以 tracker 為例：

**2a.** 把 `tracker/index.astro` 的主體抽成 `_TrackerPage.astro`，接收 `lang` prop：

```astro
---
// src/pages/projects/formosa-esg-2026/tracker/_TrackerPage.astro
import { t } from '@/i18n/utils';
const { lang = 'zh-Hant' } = Astro.props;
---
<h1>{t(lang, 'brand.systemName')}</h1>
<!-- 其餘內容... -->
```

**2b.** 原本的 `index.astro` 改成：
```astro
---
import TrackerPage from './_TrackerPage.astro';
---
<TrackerPage lang="zh-Hant" />
```

**2c.** 建立其他語言版本：
```
src/pages/en/projects/formosa-esg-2026/tracker/index.astro     → <TrackerPage lang="en" />
src/pages/ja/projects/formosa-esg-2026/tracker/index.astro     → <TrackerPage lang="ja" />
src/pages/zh-cn/projects/formosa-esg-2026/tracker/index.astro  → <TrackerPage lang="zh-Hans" />
```

---

## Step 3：替換 hardcode 中文（漸進式）

先做一個頁面跑通整個流程，確認沒問題再擴展。

**替換範例：**
```astro
// Before
<h1>白沙屯媽祖 ESG 進香追蹤系統</h1>
<button>打卡</button>

// After
import { t, getLangFromURL } from '@/i18n/utils';
const lang = getLangFromURL(Astro.url);
---
<h1>{t(lang, 'brand.systemName')}</h1>
<button>{t(lang, 'tracker.checkin')}</button>
```

**建議順序：**

| 優先 | 頁面 / 元件 | 理由 |
|------|-------------|------|
| P0 | NavBar / MobileTabBar | 全站導覽，語言切換入口 |
| P0 | tracker/index.astro | 打卡核心頁，外國人最常用 |
| P0 | 等級系統 UI | 各語言有獨立風格名，是亮點 |
| P1 | guide/ | 使用說明 |
| P1 | privacy/ | 法律相關 |
| P1 | my/ | 個人足跫 |
| P2 | 問卷 13 題 | 互動內容 |
| P2 | data.astro | 碳足跫方法論 |
| P3 | dashboard/ | 內部使用，最後做 |

---

## Step 4：語言切換 UI 整合

NavBar 和 MobileTabBar 目前已有語言按鈕的 placeholder。
用 `getLangSwitchLinks()` 產生正確的切換連結：

```astro
---
import { getLangSwitchLinks, getLangFromURL } from '@/i18n/utils';
const lang = getLangFromURL(Astro.url);
const langLinks = getLangSwitchLinks(Astro.url.pathname, lang);
---
{langLinks.map(link => (
  <a href={link.href}
     class:list={[link.isCurrent && 'active']}
     hreflang={link.hreflang}>
    {link.label}
  </a>
))}
```

同時在 `<head>` 加入 hreflang meta：
```astro
{langLinks.map(link => (
  <link rel="alternate" hreflang={link.hreflang} href={link.href} />
))}
```

---

## 等級名稱對照

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

- **漸進式替換**：先做 tracker 一個頁面跑通 build → routing → t()，再擴展
- `as const` 是故意的，確保 TypeScript 推斷精確 key type
- 確認 `@` alias 指向 `src/`（tsconfig paths 或 astro config）
- 多語言頁面會讓 build output ×4，注意 Cloudflare Pages build size 限制
- CDN 快取：不同語言是不同 URL，不互相污染
- LINE LIFF redirect URL 可能需要更新，確認支援語言 prefix
- Worker 端的 error message 翻譯可以之後做，不影響前端

---

## 完成後回報

```
偵察結果：
- Astro 版本：___
- @ alias 狀態：有 / 沒有（需設定）
- 現有語言路由頁面：有 / 沒有

完成項目：
- [ ] Astro i18n routing 設定 (commit hash)
- [ ] _TrackerPage.astro 抽出 + 4 語言 wrapper (commit hash)
- [ ] NavBar / MobileTabBar 語言切換整合 (commit hash)
- [ ] P0 頁面 hardcode 替換完成 (commit hash)
- [ ] hreflang meta tags 加入 (commit hash)
- [ ] npm run build 成功 (commit hash)

驗證結果：
- /en/projects/formosa-esg-2026/tracker/ 顯示英文：✅/❌
- /ja/projects/formosa-esg-2026/tracker/ 顯示日文：✅/❌
- /zh-cn/projects/formosa-esg-2026/tracker/ 顯示簡中：✅/❌
- 語言切換按鈕跳轉正確：✅/❌
- 等級名稱各語言風格正確：✅/❌
- t() fallback 正常（缺 key 時 fallback zh-Hant）：✅/❌
- hreflang tags 在 HTML head 正確輸出：✅/❌

遇到的問題 / 調整：
- （列出任何翻譯 key 缺漏、需要新增的 key、或架構調整）
```

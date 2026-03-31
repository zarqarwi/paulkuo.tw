# Handoff: 活動品牌獨立化 + mazu.today 域名

> **來源**: Cowork session (2026-03-31)
> **目標**: Code session
> **優先級**: 高（4/12 起駕前必完成，義工已開始測試）
> **背景**: 使用者回饋活動頁面帶有 paulkuo.tw 個人品牌導航，不適合公共活動。Paul 已購買 `mazu.today` 域名。

---

## 問題

formosa-esg-2026 底下所有 9 個頁面都用 BaseLayout，無條件渲染 NavBar（Paul logo + 首頁/思想/專案/動態牆/知識圖譜/關於）、SiteFooter（Paul Kuo 品牌 + 7 個個人社群連結）、MobileTabBar（首頁/思想/專案/更多）。

對參加公共宗教活動的香客和義工來說，這讓整個活動看起來像某個人的個人網站，而不是「環球境地 x 1.5度科學減碳協會 x Paulkuo.tw」三方合作的公共平台。

---

## 改動範圍（4 件事）

### 1. BaseLayout 加 `hideNav` prop

**檔案**: `src/layouts/BaseLayout.astro`

在 Props interface 加：
```typescript
hideNav?: boolean;
hideFooter?: boolean;
hideMobileTabBar?: boolean;
```

渲染邏輯改為條件式：
```astro
{!hideNav && <NavBar {langPrefix} {langSwitchLinks} {currentLang} />}
<!-- ... main slot ... -->
{!hideFooter && <SiteFooter />}
{!hideMobileTabBar && <MobileTabBar {langPrefix} {langSwitchLinks} {currentLang} />}
```

### 2. 建立 EventHeader 元件

**新檔案**: `src/pages/projects/formosa-esg-2026/_components/EventHeader.astro`

設計規格：
- **風格**: 完全沿用 paulkuo.tw 的 CSS 變數（`--font-cjk`, `--bg-card`, `--border`, `--text-primary` 等）、滾動效果（`nav-scrolled` class）、響應式斷點
- **左側**: 活動名稱「白沙屯媽祖進香」（取代「Paul」logo），連結指向活動首頁 `/projects/formosa-esg-2026/`
- **右側**: 語言切換（繁/简/EN/日），沿用現有 `lang-switcher` 的 HTML 結構和 CSS
- **不包含**: 個人品牌導航連結、Auth UI、搜尋、漢堡選單內的個人頁面連結
- **i18n**: 接收 `langPrefix`, `langSwitchLinks`, `currentLang` props（與 NavBar 相同）
- **活動名稱多語系**:
  - zh-Hant: 白沙屯媽祖進香
  - zh-CN: 白沙屯妈祖进香
  - en: Baishatun Mazu Pilgrimage
  - ja: 白沙屯媽祖巡礼

參考 NavBar.astro 的結構，精簡版大致是：
```astro
<nav id="event-nav">
  <div class="nav-inner">
    <a href="/projects/formosa-esg-2026/" class="event-nav-logo">{eventName}</a>
    <nav class="lang-switcher" aria-label="語言切換">
      <!-- 繁/简/EN/日 連結，與 NavBar 完全相同 -->
    </nav>
  </div>
</nav>
```

### 3. SiteFooter + MobileTabBar eventMode

#### SiteFooter

**方案 A（推薦）**: 在 SiteFooter.astro 加 `eventMode` prop

eventMode 下的內容替換：
- 品牌區: 「Paul Kuo」→「白沙屯媽祖 ESG 進香」
- tagline: 「在技術與文明的交匯處...」→「環球境地 x 1.5度科學減碳協會」
- 社群連結: 隱藏 7 個個人社群，改放活動連結：
  - 使用說明 → /projects/formosa-esg-2026/guide/
  - 隱私權聲明 → /projects/formosa-esg-2026/privacy/
  - 問題回報 → /projects/formosa-esg-2026/feedback/
- 版權區改為兩行：
  - 主行: 「© 2026 環球境地 x 1.5度科學減碳協會」
  - 副行: 「Powered by [Paulkuo.tw](https://paulkuo.tw)」— 字體 0.75rem、顏色 var(--text-muted)、超連結可點擊
- 隱藏 RSS 連結和 AI-ready 指示器

**方案 B（備選）**: 直接用 `hideFooter` 隱藏原生 footer，在各 formosa 頁面底部自己加一個簡化的 footer section。

#### MobileTabBar

在 MobileTabBar.astro 加 `eventMode` prop，或在 BaseLayout 用 `hideMobileTabBar` 隱藏後由 EventHeader 處理手機導航。

eventMode 下的 tab 替換：
- 首頁 → 打卡（/projects/formosa-esg-2026/tracker/）
- 思想 → 足跡（/projects/formosa-esg-2026/my/）
- 專案 → 說明（/projects/formosa-esg-2026/guide/）
- 更多 → 更多（隱私權 / 問題回報 / 語言切換）

i18n 對照：
```
zh-Hant: { checkin: '打卡', track: '足跡', guide: '說明', more: '更多' }
en: { checkin: 'Check-in', track: 'My Track', guide: 'Guide', more: 'More' }
ja: { checkin: 'チェックイン', track: '足跡', guide: 'ガイド', more: 'その他' }
zh-CN: { checkin: '打卡', track: '足迹', guide: '说明', more: '更多' }
```

### 4. 所有 Formosa 頁面套用

9 個頁面全部改為：
```astro
<BaseLayout
  title="..."
  hideNav={true}
  hideFooter={true}
  hideMobileTabBar={true}
>
  <EventHeader {langPrefix} {langSwitchLinks} {currentLang} />
  <!-- 原有內容 -->
  <EventFooter />  <!-- 或 SiteFooter eventMode -->
  <EventMobileTabBar />  <!-- 或 MobileTabBar eventMode -->
</BaseLayout>
```

受影響的 9 個檔案：
1. `src/pages/projects/formosa-esg-2026/index.astro`（活動首頁）
2. `src/pages/projects/formosa-esg-2026/tracker/index.astro`（打卡頁）
3. `src/pages/projects/formosa-esg-2026/my/index.astro`（個人足跡）
4. `src/pages/projects/formosa-esg-2026/guide/index.astro`（香客說明）
5. `src/pages/projects/formosa-esg-2026/guide/admin/index.astro`（管理者說明）
6. `src/pages/projects/formosa-esg-2026/privacy/index.astro`（隱私權聲明）
7. `src/pages/projects/formosa-esg-2026/dashboard/index.astro`（管理後台）
8. `src/pages/projects/formosa-esg-2026/feedback/index.astro`（問題回報）
9. `src/pages/projects/formosa-esg-2026/data.astro`（數據方法論）

---

## 5. mazu.today 域名設定

### DNS（Paul 手動）
在域名註冊商設定 DNS 指向 Cloudflare（或直接把域名 NS 轉到 Cloudflare）。

### Cloudflare Pages Custom Domain（Paul 手動）
在 Cloudflare Pages 專案設定 → Custom Domains → 加入 `mazu.today`。Cloudflare 會自動簽 SSL。

### Worker 路徑改寫（Code session）

**檔案**: `worker/src/index.ts`（或新建一個 route handler）

需要一段路徑改寫邏輯，讓 `mazu.today` 的短路徑對應到 `paulkuo.tw` 的深層路徑：

```
mazu.today/                    → /projects/formosa-esg-2026/
mazu.today/tracker/            → /projects/formosa-esg-2026/tracker/
mazu.today/my/                 → /projects/formosa-esg-2026/my/
mazu.today/guide/              → /projects/formosa-esg-2026/guide/
mazu.today/guide/admin/        → /projects/formosa-esg-2026/guide/admin/
mazu.today/privacy/            → /projects/formosa-esg-2026/privacy/
mazu.today/dashboard/          → /projects/formosa-esg-2026/dashboard/
mazu.today/feedback/           → /projects/formosa-esg-2026/feedback/
mazu.today/data/               → /projects/formosa-esg-2026/data/
```

實作方式：在 Worker 的 fetch handler 最前面判斷 hostname：
```typescript
const url = new URL(request.url);
if (url.hostname === 'mazu.today') {
  // 路徑改寫：加上 /projects/formosa-esg-2026 prefix
  const rewrittenPath = '/projects/formosa-esg-2026' + url.pathname;
  // fetch 原始 Pages 資源，或 redirect
  // 注意：靜態資源（CSS/JS/images）也需要能正確載入
}
```

### 注意事項
- 靜態資源路徑：formosa 頁面的 CSS/JS/images 如果用相對路徑，在 mazu.today 下可能會 404。需確認所有 asset 引用是絕對路徑或能正確 resolve。
- API 端點：`api.paulkuo.tw` 的 CORS 設定需加入 `mazu.today` 為 allowed origin。
- LIFF redirect URL：LINE LIFF 的 endpoint URL 如果寫死 `paulkuo.tw`，需要加上 `mazu.today` 的對應設定（Paul 手動在 LINE Developer Console）。
- OG Image / meta tags：確保在 mazu.today 域名下，og:url 等 meta 顯示 mazu.today 而非 paulkuo.tw。
- 內部連結：9 個頁面之間的互相連結（如 guide 頁的「開始打卡」按鈕）要用相對路徑或根據域名動態生成，避免從 mazu.today 跳回 paulkuo.tw。

---

## 驗證清單（Smoke Test Level 1）

部署後逐項確認：

- [ ] `mazu.today` 可正常存取，SSL 正常
- [ ] `mazu.today/tracker/` 顯示 EventHeader（無 Paul logo）
- [ ] 語言切換（繁/简/EN/日）在 EventHeader 正常運作
- [ ] MobileTabBar 顯示活動導航（打卡/足跡/說明/更多）
- [ ] Footer 顯示活動品牌 + Powered by Paulkuo.tw（無個人社群連結）
- [ ] 9 個頁面之間的內部連結不會跳到 paulkuo.tw
- [ ] `paulkuo.tw/projects/formosa-esg-2026/` 仍可正常存取（向後相容）
- [ ] API 呼叫（打卡、問卷等）從 mazu.today 發出時 CORS 通過
- [ ] LINE LIFF 從 mazu.today 開啟能正常初始化
- [ ] OG Image 在 FB/LINE 分享時顯示正確

---

## Paul 手動操作清單

1. [ ] mazu.today DNS 設定（NS 轉到 Cloudflare 或加 CNAME）
2. [ ] Cloudflare Pages → Custom Domain → 加 mazu.today
3. [ ] LINE Developer Console → LIFF endpoint 加 mazu.today
4. [ ] 部署前端 + Worker（Code session 改完後）

---

## 設計原則

- **風格一致**: EventHeader / EventFooter / EventMobileTabBar 的視覺風格完全沿用 paulkuo.tw 的設計語言（CSS 變數、字型、圓角、陰影、動畫），只是內容換成活動品牌。
- **向後相容**: `paulkuo.tw/projects/formosa-esg-2026/` 路徑繼續可用，但也顯示活動品牌（不再顯示個人 Nav）。
- **可複用**: `hideNav` / `eventMode` 的 prop 設計讓日後其他公共專案可以比照使用。
- **多語系**: EventHeader 的活動名稱、MobileTabBar 的 tab 標籤都要支援 4 語。
- **署名權**: Footer 副行「Powered by Paulkuo.tw」保留技術方署名，低調但可點擊。

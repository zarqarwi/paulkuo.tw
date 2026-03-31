# mazu.today UIUX Design Handoff

- **審查日期**：2026-03-31
- **對象**：Code session 直接執行
- **網站**：https://mazu.today (`/projects/formosa-esg-2026/`)
- **前次審查**：2026-03-30（#0 Badge、#1 CTA、#9 數字情境化、#6 企業展開按鈕 已完成）
- **Cowork 審查意見**：已納入，優先級有調整（見下方標註）

---

## 前次修復驗證

| 項目 | 狀態 | 備註 |
|------|------|------|
| #0 Badge 文字更新 | ✅ 已驗證 | 顯示正確 |
| #1 Hero CTA 按鈕 | ✅ 已驗證 | 漸層按鈕運作正常 |
| #2 子專案 Grid | ✅ 已修為 2×2 | 桌面版 4 卡平衡 |
| #6 企業展開按鈕 | ✅ 已加 | 「展開全部 (36)」運作中 |
| #9 數字情境化 | ✅ 已驗證 | 小巨蛋、種樹比喻都有了 |

---

## P0 — 必須修（影響核心體驗）

### P0-1：Hero 區域缺乏視覺張力（延續 #4，未修）

**現狀：** 米色純色背景 + 置中文字，沒有任何視覺意象。對於「白沙屯媽祖進香」這個有極強文化圖像的專案，開場太平淡。Hero 和下面的 section 幾乎在同一個平面上。

**檔案：** `src/pages/projects/formosa-esg-2026/index.astro` Hero section

**決策：採用方案 A（漸層紋理），不需要圖片素材，純 CSS 解決。**

```css
/* 在 Hero section 加背景層次 */
.formosa-hero {
  position: relative;
  min-height: 70vh;               /* 給足高度 */
  padding: 100px 24px 80px;
  overflow: hidden;
}

/* 方案 A：大面積漸層 + 微紋理 */
.formosa-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    hsl(35, 40%, 92%) 0%,
    hsl(30, 50%, 88%) 40%,
    hsl(25, 35%, 85%) 100%
  );
  z-index: -2;
}
```

**額外建議：**
- Hero 底部加一個 subtle 的曲線分隔（`clip-path` 或 SVG divider）
- 頂部漸層線 (`.formosa-gradient-line`) 可加寬、配合動畫 shimmer

---

### P0-2：底部導覽列 Icon 缺少文字標籤的視覺權重

**現狀：** Mobile bottom nav bar 有 4 個 tab（打卡、足跡、說明、更多），但 icon 太小、標籤字太淡，觸控目標看起來不夠明確。「更多」按鈕的展開行為不明顯。

**檔案：** `src/components/MobileTabBar.astro`

```css
.tab-item {
  min-height: 48px;              /* WCAG 觸控目標最低 44px */
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  gap: 2px;
}

.tab-item svg,
.tab-item .tab-icon {
  width: 24px;
  height: 24px;                  /* 統一到 24px */
}

.tab-item .tab-label {
  font-size: 11px;
  font-weight: 500;              /* 加粗一點 */
  color: var(--text-secondary);
}

.tab-item.active .tab-label {
  color: var(--accent-faith);
  font-weight: 600;
}

.tab-item.active .tab-icon {
  color: var(--accent-faith);
}
```

---

## P1 — 應修（影響視覺品質與一致性）

### P1-1：Coming Soon 卡片可讀性差（延續 #5，未修）

**現狀：** `.coming-soon { opacity: 0.6 }` 讓整張卡片都變暗，文字可讀性變差。

**檔案：** `index.astro` → `.formosa-subproject-card.coming-soon`

```css
.formosa-subproject-card.coming-soon {
  opacity: 1;
  position: relative;
  cursor: default;
}

.formosa-subproject-card.coming-soon .subproject-status {
  display: inline-block;
  background: var(--bg-section);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
```

---

### P1-2：Vision Card 箭頭流程感缺失（延續 #7，未修）

**現狀：** 「傳統 → 轉化 → 永續」三張卡片之間沒有視覺連接，看不出是個漸進的故事線。

**檔案：** `index.astro` → `.formosa-vision-grid`

```css
@media (min-width: 769px) {
  .formosa-vision-grid {
    position: relative;
  }

  .formosa-vision-card {
    position: relative;
  }

  .formosa-vision-card:not(:last-child)::after {
    content: '→';
    position: absolute;
    right: -1.5rem;
    top: 50%;
    transform: translate(50%, -50%);
    font-size: 1.5rem;
    color: var(--text-muted);
    opacity: 0.5;
  }
}
```

---

### P1-3：合作模式 4 欄桌面版太擠（延續 #8，未修）

**現狀：** 四張卡片各只有 emoji + 標題 + 一句話，4 欄排列時每張太窄。

**檔案：** `index.astro` → `.formosa-collab-grid`

```css
.formosa-collab-grid {
  grid-template-columns: repeat(2, 1fr);  /* 從 4 改 2 */
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .formosa-collab-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### P1-4：「加入永續行善行列」CTA 區塊太弱

**現狀：** 整頁最後的行動呼籲只有一個 email 連結在淡色卡片裡，視覺權重跟一般 section 差不多。作為整個頁面的轉化目標，這太低調了。

**檔案：** `index.astro` → CTA section（最後一個 region）

```css
.formosa-cta-section {
  background: linear-gradient(135deg, var(--brand-navy) 0%, #2a4a7f 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
  border-radius: var(--radius-lg);
}

.formosa-cta-section h2 {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.formosa-cta-section .cta-email {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: var(--brand-navy);
  padding: 14px 28px;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.formosa-cta-section .cta-email:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
```

---

### P1-5：Skip navigation link ⬆️（從 P3 提升）

**現狀：** 鍵盤使用者沒辦法快速跳過 header 到主要內容。

**檔案：** BaseLayout 或 EventLayout（`<body>` 開頭）

```html
<!-- 在 <body> 開頭加 -->
<a href="#main-content" class="skip-link">跳到主要內容</a>
```

```css
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--brand-navy);
  color: white;
  text-decoration: none;
  border-radius: 0 0 4px 0;
}
.skip-link:focus {
  left: 0;
  top: 0;
}
```

---

### P1-6：底部導覽列連結缺少 accessible name ⬆️（從 P3 提升）

**現狀：** 底部 nav 的 tab 是 `<a>` 但 accessibility tree 裡缺少文字名稱（只有 icon）。螢幕閱讀器使用者不知道這些是什麼。

**檔案：** `src/components/MobileTabBar.astro`

```html
<a href="/tracker/" aria-label="打卡">
  <svg>...</svg>
  <span class="tab-label">打卡</span>
</a>
```

確保每個 `<a>` 都有 `aria-label`。

---

## P2 — 新發現問題

### P2-1：Header 只有文字 Logo，缺少回首頁的視覺暗示

**現狀：** 左上角「白沙屯媽祖進香」是純文字連結，子頁面使用者不容易意識到這是「回首頁」按鈕。

**修改方案：** 在文字前加 ⛩️ icon + hover 效果

```css
.nav-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: opacity 0.2s;
}

.nav-brand:hover {
  opacity: 0.7;
}

.nav-brand::before {
  content: '⛩️';
  font-size: 1.2em;
}
```

---

### P2-2：語言切換按鈕在桌面版佔太多視覺權重

**現狀：** 右上角 4 個語言按鈕都有明確的邊框和背景，在主要繁中頁面上搶太多注意力。

```css
.lang-switch a {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 4px 8px;
  font-size: 0.85rem;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.lang-switch a:hover {
  background: var(--bg-section);
  color: var(--text-primary);
}

.lang-switch a.active {
  background: var(--brand-navy);
  color: white;
  font-weight: 600;
}
```

---

### P2-3：字級切換浮動按鈕 (A-/A/A+) 遮擋內容

**現狀：** 右下角永遠浮著 `A- A A+` 三個按鈕，手機版會跟底部 nav bar 很近，容易誤觸。

**修改方案（簡化版）：** 手機版直接隱藏，桌面版維持現狀。

```css
@media (max-width: 768px) {
  .font-size-controls {
    display: none;
  }
}
```

---

### P2-4：空狀態頁面（/my/）缺乏引導

**現狀：** `/my/` 頁在未登入或無打卡紀錄時只顯示 🙏 + 「尚未有打卡紀錄」+ 一個按鈕，空蕩蕩。

**修改方案：** 加上 3 步快速說明 + 雙 CTA

```html
<div class="empty-state">
  <div class="empty-icon">🙏</div>
  <h2>尚未有打卡紀錄</h2>
  <p>參與進香活動時，到各站點掃碼即可記錄你的足跡。</p>

  <div class="quick-steps">
    <div class="step">
      <span class="step-num">1</span>
      <span>到站點掃描 QR Code</span>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <span>用 LINE 登入確認身份</span>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <span>累積善足跡與成就</span>
    </div>
  </div>

  <a href="/projects/formosa-esg-2026/guide/" class="btn-secondary">
    📖 完整使用說明
  </a>
  <a href="/projects/formosa-esg-2026/tracker/" class="btn-primary">
    📍 前往打卡
  </a>
</div>
```

---

### P2-5：Guide 頁版本標籤 (v0.7) 視覺語彙不一致

**現狀：** Guide 頁面上方有 `v0.7` 深色 badge，一般香客看到版本號會困惑。

**修改方案：** 拿掉 `v0.7` badge，改用「最後更新：2026-03-31」的灰色小字，或把 version 收到 footer/meta 裡。

---

### P2-6：Data 頁登入卡片垂直置中但頁面太空

**現狀：** 密碼登入卡片 vertically centered 在一大片空白裡，看起來像頁面沒載入完成。

```css
.data-auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 15vh;              /* 不要用 justify-content: center */
  min-height: calc(100vh - 60px);
}
```

建議在登入卡片上方加說明：「這是管理團隊的數據後台，香客請前往 [足跡頁面]」。

---

### P2-7：隱私權頁面標題在手機版斷行不佳

**現狀：** 「白沙屯媽祖 ESG 進香追蹤系統 — 隱私權聲明」這行標題在 390px 寬度下斷成醜的三行。

```css
.privacy-title {
  font-size: clamp(1.3rem, 5vw, 2rem);
  word-break: keep-all;
  overflow-wrap: break-word;
}
```

---

## P2-8：AuthGate 登入流程改善（最小版）⬇️（從 P0 降級）

> **Cowork 審查意見：** 原為 P0-3，降為 P2。離 4/12 起駕只剩 12 天，完整的流程合併（隱私同意 + LINE 登入）風險太高。先做最小版改善，完整重構活動後再處理。

**檔案：** `src/pages/projects/formosa-esg-2026/_components/AuthGate.astro`

**最小版改動（本輪執行）：**
1. LINE 登入按鈕加 loading state（按下後禁用 + spinner）
2. 「管理員登入」密碼框出現後加「取消」按鈕
3. 隱私權聲明 fetch 失敗時提供 fallback 連結（不要卡住）

**完整版（活動後再做）：**
- 合併「進入活動」和隱私權同意為單一畫面
- 隱私權聲明用 inline summary + 連結全文，不要 fetch

---

## P3 — 無障礙 (A11y)

### P3-1：Hero 漸層 CTA 按鈕對比度不足

**現狀：** 「📖 香客使用說明」按鈕的白色文字在 faith→circular 漸層上，漸層中段的橙轉綠可能對比度不到 4.5:1（WCAG AA）。

```css
.hero-cta {
  background: linear-gradient(
    135deg,
    hsl(25, 70%, 40%) 0%,
    hsl(140, 45%, 32%) 100%
  );
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
```

---

### P3-2：語言切換缺少 `lang` 屬性

**現狀：** 各語言連結沒有 `hreflang` 屬性，也沒有在 `<head>` 裡做 alternate link。

```html
<!-- Header 語言連結 -->
<a href="/projects/formosa-esg-2026/" hreflang="zh-Hant">繁</a>
<a href="/zh-cn/projects/formosa-esg-2026/" hreflang="zh-Hans">简</a>
<a href="/en/projects/formosa-esg-2026/" hreflang="en">EN</a>
<a href="/ja/projects/formosa-esg-2026/" hreflang="ja">日</a>

<!-- <head> 裡加 -->
<link rel="alternate" hreflang="zh-Hant" href="https://mazu.today/" />
<link rel="alternate" hreflang="zh-Hans" href="https://mazu.today/zh-cn/" />
<link rel="alternate" hreflang="en" href="https://mazu.today/en/" />
<link rel="alternate" hreflang="ja" href="https://mazu.today/ja/" />
```

---

## 執行摘要

| # | 項目 | 優先級 | 來源 | 複雜度 |
|---|------|--------|------|--------|
| P0-1 | Hero 視覺張力（方案 A 漸層） | 🔴 P0 | 延續 #4 | 中 |
| P0-2 | Bottom nav icon/label 權重 | 🔴 P0 | 新 | 低 |
| P1-1 | Coming Soon 可讀性 | 🟡 P1 | 延續 #5 | 低 |
| P1-2 | Vision Card 箭頭流程感 | 🟡 P1 | 延續 #7 | 低 |
| P1-3 | 合作模式 4→2 欄 | 🟡 P1 | 延續 #8 | 低 |
| P1-4 | 底部 CTA 視覺強化 | 🟡 P1 | 新 | 中 |
| P1-5 | Skip navigation link | 🟡 P1 | A11y ⬆️ | 低 |
| P1-6 | Bottom nav accessible name | 🟡 P1 | A11y ⬆️ | 低 |
| P2-1 | Header Logo 辨識度 | 🟢 P2 | 新 | 低 |
| P2-2 | 語言切換視覺降噪 | 🟢 P2 | 新 | 低 |
| P2-3 | 字級浮動按鈕手機版隱藏 | 🟢 P2 | 新 | 低 |
| P2-4 | /my/ 空狀態引導 | 🟢 P2 | 新 | 中 |
| P2-5 | Guide v0.7 badge 調整 | 🟢 P2 | 新 | 低 |
| P2-6 | Data 頁登入卡片位置 | 🟢 P2 | 新 | 低 |
| P2-7 | 隱私頁標題斷行 | 🟢 P2 | 新 | 低 |
| P2-8 | AuthGate 最小版改善 | 🟢 P2 | ⬇️原P0 | 中 |
| P3-1 | CTA 按鈕對比度 | 🔵 A11y | 新 | 低 |
| P3-2 | 語言 hreflang 屬性 | 🔵 A11y | 新 | 低 |

## 建議執行順序

P0-1 → P0-2 → P1-5+P1-6（快速 a11y wins）→ P1-1~P1-4 批次 → P2 系列依需求挑選 → P2-8（AuthGate 最小版）→ P3 系列

## 優先級調整說明（Cowork 審查）

1. **P0-3 AuthGate → P2-8**：高複雜度 + 動認證流程 + 離起駕 12 天，風險太高。先做最小版（loading state + 取消按鈕 + fetch fallback），完整重構活動後再處理。
2. **P3-1/P3-2 skip link + accessible name → P1-5/P1-6**：5 分鐘改完但對無障礙影響大，不該放最後。
3. **P0-1 確定用方案 A**：純 CSS 漸層，不依賴圖片素材。
4. **P2-3 字級按鈕簡化**：手機版直接 `display: none`，不做「收進更多選單」的結構改動。

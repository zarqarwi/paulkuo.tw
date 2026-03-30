# Code Handoff: Guide 頁面 UIUX 專業度升級

> **來源**: Cowork session 2026-03-30
> **目標**: 兩份 Formosa ESG 2026 指南頁面的版面專業化升級，並建立日後指南頁面的固定模板
> **涉及檔案**:
> - `src/pages/projects/formosa-esg-2026/guide/index.astro`（香客說明書，14.8KB）
> - `src/pages/projects/formosa-esg-2026/guide/admin/index.astro`（管理者指南，17.4KB）

---

## 背景

Paul 審查了兩份 guide 頁面的版面呈現，認為內容完整但視覺專業度不足——目前就是一條長長的純文字流，從頭滾到底，沒有導覽、沒有視覺錨點、沒有互動元素。兩份頁面共用 `.guide-content` 樣式（inline `<style>` 各自寫了一份，幾乎一模一樣）。Paul 希望這次改完後成為日後 guide 頁面的**固定模板**。

---

## Step 0: 偵察

```bash
# 確認兩份檔案位置和現有 CSS
grep -n "guide-content" src/pages/projects/formosa-esg-2026/guide/index.astro
grep -n "guide-content" src/pages/projects/formosa-esg-2026/guide/admin/index.astro

# 確認 CSS 變數可用
grep -n "accent-faith\|brand-navy\|bg-card\|border\|text-primary\|text-secondary" public/styles/global.css | head -20

# 確認有沒有已存在的 guide 共用元件
find src/components -name "*guide*" -o -name "*Guide*" 2>/dev/null
find src/pages/projects/formosa-esg-2026/_components -type f 2>/dev/null
```

---

## 改動 1: 共用 CSS 抽出為模板

兩份 guide 的 `<style>` 幾乎一模一樣。抽成一份共用 CSS 檔案，日後新 guide 頁面直接 import 即可。

### 做法

建立 `src/styles/guide-template.css`，把兩份 `<style>` 合併（admin 版多了 `a`、`code` 樣式，以此為基底）。兩份 `.astro` 檔改為 import 這個 CSS：

```astro
---
import '../../../../styles/guide-template.css';
---
```

然後刪掉各自的 `<style>` 區塊。

---

## 改動 2: 目錄導覽（TOC）

### 規格

- 位置：blockquote 引言與第一個 `<hr>` 之間
- 樣式：淡灰底色卡片，可收合（預設展開）
- 標題：「📑 目錄」
- 列出所有 `<h2>` 標題，帶錨點連結
- 點擊 smooth scroll 到對應段落
- 每個 h2 自動加上 `id`（用中文或拼音皆可，但要穩定可預測）

### HTML 結構參考

```html
<nav class="guide-toc">
  <details open>
    <summary>📑 目錄</summary>
    <ol>
      <li><a href="#section-1">這個系統在做什麼？</a></li>
      <li><a href="#section-2">第一步：掃碼，用 LINE 登入</a></li>
      <!-- ... -->
    </ol>
  </details>
</nav>
```

### CSS

```css
.guide-toc {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
}
.guide-toc summary {
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}
.guide-toc ol {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
}
.guide-toc li {
  margin: 0.3rem 0;
  font-size: 0.88rem;
}
.guide-toc a {
  color: var(--text-primary);
  text-decoration: none;
}
.guide-toc a:hover {
  color: var(--accent-faith);
}
```

---

## 改動 3: 步驟編號 Badge

### 規格

香客說明書的 h2 標題是「第一步」到「第七步」。改成帶數字圓形 badge 的樣式，讓視覺節奏更明確。

### 做法

在每個步驟的 `<h2>` 前加一個 `<span class="step-badge">1</span>`，或用 CSS counter 自動生成。

### CSS

```css
.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--brand-navy);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  margin-right: 0.5rem;
  vertical-align: middle;
  flex-shrink: 0;
}
```

管理者指南用的是「一、二、三...」中文序號，不需要 badge，保持現狀即可。

---

## 改動 4: Callout Box（重要提醒）

### 規格

把目前用 `<strong>` 標記的重要提醒改成 callout box：

**香客說明書需要改的地方**：
- 「請按「允許」。這是最重要的一步！」→ warning callout
- 「不要關掉瀏覽器」→ warning callout
- 「照片本身不會上傳到伺服器」→ info callout

**管理者指南需要改的地方**：
- 「按下去就直接送到香客的 LINE，沒有「確認」按鈕」→ warning callout
- 安全責任清單 → warning callout

### HTML

```html
<div class="callout callout-warning">
  <span class="callout-icon">⚠️</span>
  <p>請按「允許」。這是最重要的一步！</p>
</div>

<div class="callout callout-info">
  <span class="callout-icon">ℹ️</span>
  <p>照片本身不會上傳到伺服器，系統只讀取裡面的 GPS 座標。</p>
</div>
```

### CSS

```css
.callout {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  font-size: 0.92rem;
  line-height: 1.6;
}
.callout-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  line-height: 1.6;
}
.callout p { margin: 0; }

.callout-warning {
  background: rgba(234, 179, 8, 0.08);
  border-left: 4px solid #eab308;
}
.callout-info {
  background: rgba(59, 130, 246, 0.06);
  border-left: 4px solid #3b82f6;
}
```

---

## 改動 5: FAQ Accordion

### 規格

香客說明書的 `.faq` 區塊改成可折疊的手風琴。每個 Q&A 用 `<details>` + `<summary>`。

### 做法

把現有的：
```html
<h3>Q：我需要輸入什麼密碼嗎？</h3>
<p>A：不用。...</p>
```

改成：
```html
<details class="faq-item">
  <summary>我需要輸入什麼密碼嗎？</summary>
  <p>不用。香客只要用 LINE 登入就好，不需要任何通行碼。</p>
</details>
```

### CSS

```css
.faq-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin: 0.5rem 0;
  overflow: hidden;
}
.faq-item summary {
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  background: var(--bg-card);
  list-style: none;
}
.faq-item summary::before {
  content: "▸ ";
  color: var(--accent-faith);
}
.faq-item[open] summary::before {
  content: "▾ ";
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item p {
  padding: 0.5rem 1rem 0.85rem;
  margin: 0;
  font-size: 0.92rem;
  border-top: 1px solid var(--border);
}
```

---

## 改動 6: 表格美化

### 規格

- 交替行背景色（zebra stripe）
- hover 高亮
- 手機版用 `overflow-x: auto` 包裝避免溢出

### CSS

```css
.guide-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
}
.guide-content th {
  background: var(--brand-navy);
  color: #fff;
  font-weight: 600;
  padding: 0.6rem 0.75rem;
  text-align: left;
}
.guide-content td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--border);
}
.guide-content tbody tr:nth-child(even) {
  background: rgba(0,0,0,0.02);
}
.guide-content tbody tr:hover {
  background: rgba(180,83,9,0.04);
}

/* 手機表格不溢出 */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1rem 0;
}
```

每個 `<table>` 需要用 `<div class="table-wrapper">` 包起來。

---

## 改動 7: 行寬收窄

### 規格

`.guide-content` 的 `max-width` 從 `720px` 改為 `640px`。中文說明書的閱讀體驗在 600-640px 最佳（每行約 30 字）。

---

## 改動 8: 頁尾 CTA

### 規格

現有的 `.guide-footer` 只是純文字。加一個行動按鈕。

**香客版**：加「立即加入 LINE」按鈕，連到 LINE 好友頁面
**管理者版**：加「前往管理儀表板」按鈕，連到 `/projects/formosa-esg-2026/dashboard/`

### HTML 參考

```html
<footer class="guide-footer">
  <p>白沙屯媽祖 ESG 進香 2026</p>
  <p>每一步都算數，一起為地球走一程 🌱</p>
  <a href="https://line.me/R/ti/p/@539fkwjd" class="guide-cta">立即加入 LINE</a>
</footer>
```

### CSS

```css
.guide-cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.65rem 1.5rem;
  background: var(--brand-navy);
  color: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}
.guide-cta:hover {
  opacity: 0.85;
}
```

---

## 改動 9: AuthGate 密碼頁美化（低優先）

管理者指南的密碼輸入頁目前很陽春。如果有時間：

- 加上品牌色 header bar 或 logo
- 副標題改為「僅限管理團隊存取」
- input 和 button 加圓角和 focus 樣式

先查 AuthGate 元件的位置：
```bash
cat src/pages/projects/formosa-esg-2026/_components/AuthGate.astro
```

---

## 驗證方式

1. 用桌面瀏覽器（1440px）開啟 `/guide/` 和 `/guide/admin/`，確認：
   - TOC 目錄出現且錨點連結正確
   - 步驟 badge 數字正確顯示
   - Callout box 取代了原本的粗體提醒
   - FAQ 區塊可以折疊展開
   - 表格有 zebra stripe 和 hover 效果
   - 行寬收窄到 640px
   - 頁尾有 CTA 按鈕

2. 用手機寬度（390px）確認 responsive 正常：
   - 表格不溢出畫面
   - TOC 不會擠到文字
   - FAQ 手指可以點開

3. 確認 `src/styles/guide-template.css` 被兩份頁面共用

---

## 注意事項

- 兩份頁面的 `<style>` 區塊目前是**各自 inline**，抽出共用 CSS 後記得兩份都刪乾淨
- admin 版有 `AuthGate` 包裝，結構是 `<BaseLayout> → <AuthGate> → <article>`，改動時不要動到 AuthGate 的邏輯
- CSS 變數（`--brand-navy`、`--accent-faith`、`--bg-card`、`--border` 等）已在 global.css 定義，直接用即可
- 表格包 `.table-wrapper` 時，原本的 `<table>` 標籤要完整搬進去
- FAQ 改 `<details>` 後，原本 `.faq` 裡的 `<h3>` 和 `<p>` 結構會整個替換，不是套 CSS 就好
- 香客說明書的 footer 現有 CSS 有設 `background: var(--brand-navy)`（深藍色底），CTA 按鈕要注意對比度

---

## 回報格式

```
完成項目：
- [ ] 共用 CSS 模板 src/styles/guide-template.css
- [ ] 目錄導覽 TOC（兩份頁面）
- [ ] 步驟編號 Badge（香客版）
- [ ] Callout Box（兩份頁面）
- [ ] FAQ Accordion（香客版）
- [ ] 表格美化 + table-wrapper（兩份頁面）
- [ ] 行寬收窄 640px
- [ ] 頁尾 CTA 按鈕（兩份頁面）
- [ ] AuthGate 密碼頁美化（選做）
驗證截圖：桌面版 + 手機版各一
Commit hash：
```

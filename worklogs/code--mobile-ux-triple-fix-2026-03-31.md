# Code Handoff：手機版 UX 三修

> 產出日期：2026-03-31
> 來源：Cowork UIUX 審查 session
> 目標：Code session 在以下三個檔案執行修改

---

## 背景

Cowork session 用 Puppeteer 截圖審查了 paulkuo.tw 首頁的桌面版和手機版。桌面版 Hero 右側（人像 + 精選文章卡片）已經部署且正常顯示（commit `20409c4`）。但手機版發現三個 UX 問題需要修正。

---

## Step 0 偵察

先確認現狀，不要直接改：

```bash
# 1. 確認 hero-right 已存在
grep -n "hero-right" src/pages/index.astro

# 2. 確認 mobile-lang-group 在 NavBar 裡
grep -n "mobile-lang-group" src/components/NavBar.astro

# 3. 找到 NavBar 的 CSS（可能在 BaseLayout 或 global CSS）
grep -rn "mobile-lang-group\|nav-hamburger\|\.nav-links" src/ --include="*.astro" --include="*.css" | head -30

# 4. 確認手機版的 media query breakpoint
grep -rn "@media.*768\|@media.*mobile" src/ --include="*.astro" --include="*.css" | head -20
```

---

## 修改一：手機版精選文章卡片隱藏

### 問題
手機版 `.hero-right` 用 `order: -1` 整塊提到標題前面，導致精選文章卡片夾在人像和大標題之間，打斷「認人 → 讀標語」的敘事弧。

### 修法
在 `src/pages/index.astro` 底部的 `<style is:global>` 區塊裡，手機版 media query 中加一行：

```css
@media (max-width: 768px) {
  /* 已有的規則保留 */

  /* === 新增：手機版隱藏精選卡片 === */
  .hero-featured-card {
    display: none;
  }
}
```

### 為什麼隱藏而不是移動？
下方「最新思考」區塊已經有三張文章卡片，Hero 不需要重複這個功能。Astro 的 HTML 不能動態移動 DOM 元素，用 CSS `order` 的話卡片仍然跟人像綁在一起，無法獨立排序。

---

## 修改二：漢堡選單語系切換可見性

### 問題
`.mobile-lang-group`（繁/簡/EN/日）和 `.mobile-font-group`（字級 A-/A/A+）在 DOM 裡存在且 `display: flex`，但被擠到選單可視區域外面（語系在 y=856，螢幕高 844）。使用者不知道要滾動，所以等於看不到。

### 根因
選單項目間距太大（每個連結約 70px 高），7 個導覽連結 + CTA + 登入 = 總高 937px > 可視高 772px。

### 修法（推薦方案）：壓縮選單 padding + 用 CSS order 把語系提前

找到 NavBar 的 CSS（可能在 BaseLayout.astro 的 `<style>` 裡），調整手機版選單項目：

```css
@media (max-width: 768px) {
  .nav-links.mobile-open > a {
    padding: 12px 24px;  /* 從原本的 ~20px 壓縮 */
  }

  .mobile-lang-group {
    order: -1;
    margin-top: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
}
```

注意：如果修改三（Tab Bar）做了，這個修改會被取代，因為語系切換會搬到 Tab Bar 的「更多」面板。但在 Tab Bar 完成前，這個 CSS 微調可以先推上去作為過渡方案。

---

## 修改三：底部 Tab Bar（新 component）

### 問題
漢堡選單隱藏了核心導覽，降低功能可發現性。Paul 希望手機版導覽直接顯示在頁面上。

### 修法：新增 `MobileTabBar.astro`

在 `src/components/` 新增 `MobileTabBar.astro`，桌面版隱藏、手機版固定在底部。

#### HTML 結構

```astro
---
interface Props {
  langPrefix: string;
  currentLang: string;
  langSwitchLinks: Record<string, string>;
}
const { langPrefix, currentLang, langSwitchLinks } = Astro.props;
---

<nav class="mobile-tab-bar" aria-label="主要導覽">
  <a href={langPrefix + '/'} class="tab-item" data-tab="home">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
    <span>首頁</span>
  </a>
  <a href={langPrefix + '/blog'} class="tab-item" data-tab="blog">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    <span>思想</span>
  </a>
  <a href={langPrefix + '/projects'} class="tab-item" data-tab="projects">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
    <span>專案</span>
  </a>
  <button class="tab-item tab-more" data-tab="more" aria-label="更多選項">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    <span>更多</span>
  </button>
</nav>

<!-- 更多面板（bottom sheet） -->
<div class="tab-more-sheet" id="tabMoreSheet">
  <div class="sheet-handle"></div>
  <div class="sheet-grid">
    <a href={langPrefix ? langPrefix + '/' : '/#feed'}>動態牆</a>
    <a href={langPrefix + '/tags-graph'}>知識圖譜</a>
    <a href={langPrefix + '/about'}>關於</a>
    <a href="/search">搜尋</a>
    <a href={`${langPrefix || ''}/#contact`}>聯絡我</a>
  </div>
  <div class="sheet-divider"></div>
  <div class="sheet-lang" aria-label="語言切換">
    <a href={langSwitchLinks['zh-Hant']} class:list={['lang-btn', { active: currentLang === 'zh-Hant' }]}>繁</a>
    <a href={langSwitchLinks['zh-CN']} class:list={['lang-btn', { active: currentLang === 'zh-CN' }]}>简</a>
    <a href={langSwitchLinks['en']} class:list={['lang-btn', { active: currentLang === 'en' }]}>EN</a>
    <a href={langSwitchLinks['ja']} class:list={['lang-btn', { active: currentLang === 'ja' }]}>日</a>
  </div>
</div>
<div class="tab-more-backdrop" id="tabMoreBackdrop"></div>
```

#### CSS 關鍵規格

```css
.mobile-tab-bar,
.tab-more-sheet,
.tab-more-backdrop { display: none; }

@media (max-width: 768px) {
  .mobile-tab-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--bg-card, #fff);
    border-top: 1px solid var(--border, #e5e5e5);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
  }

  .tab-item.active {
    color: var(--brand-navy, #1b2d4f);
  }

  body {
    padding-bottom: calc(56px + env(safe-area-inset-bottom)) !important;
  }

  .nav-hamburger {
    display: none !important;
  }

  /* Bottom sheet */
  .tab-more-sheet {
    display: block;
    position: fixed;
    bottom: 56px;
    left: 0;
    right: 0;
    background: var(--bg-card, #fff);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 999;
    padding: 16px 24px 24px;
  }

  .tab-more-sheet.open {
    transform: translateY(0);
  }

  .tab-more-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 998;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .tab-more-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .sheet-handle {
    width: 40px;
    height: 4px;
    background: var(--border, #ddd);
    border-radius: 2px;
    margin: 0 auto 16px;
  }

  .sheet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    text-align: center;
  }

  .sheet-grid a {
    padding: 12px 8px;
    border-radius: 8px;
    background: var(--bg-section, #f5f0eb);
    color: var(--text-primary);
    text-decoration: none;
    font-size: 0.85rem;
  }

  .sheet-divider {
    height: 1px;
    background: var(--border, #e5e5e5);
    margin: 16px 0;
  }

  .sheet-lang {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}
```

#### 整合到 BaseLayout

在 `BaseLayout.astro` 裡 `</body>` 前加入：

```astro
import MobileTabBar from '../components/MobileTabBar.astro';
<!-- 在 </body> 前 -->
<MobileTabBar langPrefix={langPrefix} currentLang={currentLang} langSwitchLinks={langSwitchLinks} />
```

需要確認 BaseLayout 有把 `langPrefix`、`currentLang`、`langSwitchLinks` 傳到可用的 scope。

#### JS 邏輯

```js
// Active tab
const path = window.location.pathname;
document.querySelectorAll('.tab-item[data-tab]').forEach(tab => {
  const href = tab.getAttribute('href');
  if (href && (href === path || (href !== '/' && path.startsWith(href)))) {
    tab.classList.add('active');
  }
});

// 更多 toggle
const moreBtn = document.querySelector('.tab-more');
const sheet = document.getElementById('tabMoreSheet');
const backdrop = document.getElementById('tabMoreBackdrop');

function toggleMore() {
  sheet?.classList.toggle('open');
  backdrop?.classList.toggle('open');
}

moreBtn?.addEventListener('click', toggleMore);
backdrop?.addEventListener('click', toggleMore);
```

---

## 驗證方式

完成後用手機模擬器或 Puppeteer 確認：

1. **手機版 Hero**：人像 → 大標題 → 身份 → 內文 → CTA（精選卡片不見）
2. **底部 Tab Bar**：4 個 tab 固定在底部（首頁/思想/專案/更多），active 狀態正確
3. **「更多」面板**：點擊展開/收起，包含動態牆、知識圖譜、關於、搜尋、聯絡我 + 語系切換
4. **語系切換**：在「更多」面板中可見且可點擊，四語都正常跳轉
5. **漢堡按鈕**：手機版隱藏
6. **桌面版**：Tab Bar 隱藏，原有導覽列不受影響
7. **iPhone safe area**：底部 bar 不被 Home indicator 遮住
8. **body padding**：頁面底部內容不被 Tab Bar 擋住

---

## 注意事項

- NavBar 的 CSS 可能散在多處（BaseLayout 的 `<style>`、NavBar 內嵌、或 global CSS），改之前先 grep 確認位置
- `env(safe-area-inset-bottom)` 需要 `<meta name="viewport">` 包含 `viewport-fit=cover`
- 底部 Tab Bar 的 `z-index` 要比頁面內容高，但低於 modal/overlay
- 修改一可以先推上去驗證，不需要等修改三完成
- 如果修改三完成了，修改二的 CSS 微調可以移除（語系切換已搬到 Tab Bar）
- 現有 NavBar 裡的 `.mobile-font-group` JS 邏輯要保留或搬到 Tab Bar

---

## 執行建議

| 順序 | 項目 | 複雜度 | 可獨立推 |
|------|------|--------|----------|
| 1 | 手機版精選卡片隱藏 | 一行 CSS | ✅ |
| 2 | 選單 padding 壓縮 + 語系 order 提前 | CSS 微調 | ✅（過渡方案） |
| 3 | 底部 Tab Bar | 新 component | ✅（做完可取代修改二） |

---

## 回報格式

```
完成項目：
- [ ] 修改一：手機版精選卡片隱藏 (commit hash)
- [ ] 修改二：選單語系切換可見 (commit hash)
- [ ] 修改三：底部 Tab Bar (commit hash)

驗證結果：
- 手機版 Hero 順序：✅/❌
- 語系切換可見：✅/❌
- Tab Bar 功能正常：✅/❌
- 桌面版無影響：✅/❌
```

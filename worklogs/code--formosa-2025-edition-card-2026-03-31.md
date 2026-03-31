# Code Handoff：新增「歷屆紀錄」區塊 + 2025 計畫書卡片

> 產出日期：2026-03-31
> 來源：Cowork session
> 目標：在 Formosa ESG 2026 專案頁加一個「歷屆紀錄」section，放 2025 計畫書外連卡片

---

## 背景

合作方提供了 2025 年計畫書的 Gamma 頁面連結。Paul 決定不複製內容，直接用卡片外連過去。未來如果有更多屆次（2024、2027…），同一個 section 直接加卡片就好。

---

## Step 0 偵察

```bash
# 確認目標檔案
grep -n "Section 5\|Section 6\|子專案\|參與單位" src/pages/projects/formosa-esg-2026/index.astro | head -10

# 確認現有 CSS class 命名慣例
grep -n "formosa-subproject" src/pages/projects/formosa-esg-2026/index.astro | head -10
```

---

## 修改檔案

`src/pages/projects/formosa-esg-2026/index.astro` — 只改這一個檔案。

---

## Step 1：加 HTML

在 **Section 5（子專案）** 和 **Section 6（參與單位）** 之間，插入新 section：

```html
  <!-- Section: 歷屆紀錄 -->
  <section class="formosa-section">
    <h2 class="formosa-section-title">歷屆紀錄</h2>
    <div class="formosa-editions-grid">
      <a href="https://esg-bc8hhzy.gamma.site/" target="_blank" rel="noopener" class="formosa-edition-card">
        <div class="edition-year">2025</div>
        <div class="edition-body">
          <h3>白沙屯媽祖 ESG 永續進香計畫書</h3>
          <p>首屆 ESG 進香完整企劃，涵蓋碳盤查框架、社區共善機制與數據治理藍圖。</p>
          <span class="edition-cta">閱讀計畫書 ↗</span>
        </div>
      </a>
    </div>
  </section>
```

精確插入位置：在 `</section>` (子專案的結束標籤) 之後、`<!-- Section 6: Partners -->` 之前。

---

## Step 2：加 CSS

在 `<style>` 區塊的 `/* Sub-projects */` 和 `/* Partners */` 之間加入：

```css
  /* Editions */
  .formosa-editions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  .formosa-edition-card {
    display: flex;
    align-items: stretch;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s;
  }
  .formosa-edition-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--accent-faith);
  }
  .edition-year {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    background: linear-gradient(135deg, var(--accent-faith), var(--accent-circular));
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .edition-body {
    padding: 1.5rem;
    flex: 1;
  }
  .edition-body h3 {
    font-family: var(--font-cjk);
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  .edition-body p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 0.75rem;
  }
  .edition-cta {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent-faith);
  }

  @media (max-width: 480px) {
    .formosa-edition-card {
      flex-direction: column;
    }
    .edition-year {
      min-width: unset;
      padding: 0.75rem;
      font-size: 1.3rem;
    }
  }
```

---

## 就這樣

不需要建新頁面、不需要改路由、不需要新 component。一個 section + 一張卡片 + 一段 CSS。

---

## 驗證方式

1. 桌面版：卡片左邊是年份色塊、右邊是標題描述，hover 有浮起效果
2. 點擊卡片：新分頁開啟 `https://esg-bc8hhzy.gamma.site/`
3. 手機版：卡片改成上下排列（年份在上）
4. 位置在「子專案」和「參與單位」之間

---

## 回報格式

```
完成項目：
- [ ] 歷屆紀錄 section + 2025 卡片 (commit hash)

驗證結果：
- 桌面版排版正確：✅/❌
- 外連正確開新分頁：✅/❌
- 手機版 RWD 正常：✅/❌
```

# Code Handoff: Issue #107 + #108 文件上線

**來源**: Cowork Session 2026-04-07
**風險等級**: L1（純新增頁面，不影響現有功能）
**截止日**: 4/10（4/11-13 凍結期）
**驗證**: Cowork 瀏覽器驗收

---

## 背景

4/12 起駕前最後兩個 Code 任務。專案需要：
1. **Issue #107**：上線前驗收報告頁面（`/verification/`）
2. **Issue #108**：文件中心（`/docs/`）+ 6 份技術文件 + 開發紀錄 + footer 擴充

所有內容已由 Cowork 產出，存在本機 `白沙屯ESG繞境/` 資料夾。Code 的工作是轉為 Astro 頁面 + i18n。

---

## Step 0 — 偵察（先查再改）

```bash
# 確認現有 i18n 路由結構
ls src/pages/en/projects/formosa-esg-2026/
ls src/pages/ja/projects/formosa-esg-2026/
ls src/pages/zh-cn/projects/formosa-esg-2026/

# 確認 SiteFooter 現有 event mode 連結
grep -n 'footer-social-links' src/components/SiteFooter.astro

# 確認翻譯檔位置
ls src/i18n/translations/

# 確認已有的 _Page 模板樣式
head -50 src/pages/projects/formosa-esg-2026/faq/_FaqPage.astro
head -50 src/pages/projects/formosa-esg-2026/guide/_GuidePage.astro
```

---

## Part A — Issue #107: /verification/ 驗收清單頁面

### A1. 建立 Astro 頁面元件

**來源檔案**: `白沙屯ESG繞境/上線前驗收清單.html`（663 行）

**建立檔案**:
```
src/pages/projects/formosa-esg-2026/verification/
├── _VerificationPage.astro    ← 主要元件（從 HTML 轉 Astro）
└── index.astro                ← lang="zh-Hant" 入口
```

**_VerificationPage.astro 設計要點**:
- 從 `上線前驗收清單.html` 提取 HTML 結構和 CSS，包成 Astro 元件
- 接收 `lang` prop（type: `Locale`）
- 頁面標題、分類名稱、檢核項目文字用 i18n `t()` 函式
- 檢核項目狀態資料（pass/warn/fail/na）抽到 `_data/verification-items.ts`，方便日後更新狀態不動模板
- Summary bar 統計從資料自動計算
- 不需要密碼保護（公開頁面）
- 響應式 + 列印友善

**資料結構建議** (`_data/verification-items.ts`):
```typescript
export interface VerificationItem {
  key: string;           // i18n key
  status: 'pass' | 'warn' | 'fail' | 'na';
  note?: string;         // 選填備註
}

export interface VerificationCategory {
  key: string;           // i18n key
  items: VerificationItem[];
}

export const verificationData: VerificationCategory[] = [
  // 7 大類、34 項...
];
```

### A2. i18n 四語系入口

**建立 3 個入口檔**（參考 FAQ 的 import pattern）:

```
src/pages/en/projects/formosa-esg-2026/verification/index.astro
src/pages/ja/projects/formosa-esg-2026/verification/index.astro
src/pages/zh-cn/projects/formosa-esg-2026/verification/index.astro
```

每個都是：
```astro
---
import VerificationPage from '../../../../projects/formosa-esg-2026/verification/_VerificationPage.astro';
---
<VerificationPage lang="en" />  <!-- 或 ja / zh-Hans -->
```

### A3. 翻譯 key

在 `src/i18n/translations/` 四個檔案新增 `verification` 區塊：
- 頁面標題、7 個分類名稱、34 個檢核項目名稱
- 狀態標籤（通過 / 警告 / 未通過 / 不適用）
- Summary bar 文字

---

## Part B — Issue #108: /docs/ 文件中心

### B1. 技術文件頁面（6 份 + 開發紀錄）

**來源檔案**（都在 `白沙屯ESG繞境/`）:

| 檔案 | 行數 | 部署路徑 |
|------|------|---------|
| `api-endpoint-reference.md` | 344 | `/docs/api/` |
| `data-model-reference.md` | 259 | `/docs/data-model/` |
| `operations-runbook.md` | 726 | `/docs/operations/` |
| `resilience-engineering-record.md` | 239 | `/docs/resilience/` |
| `smoke-test-checklist.md` | 101 | `/docs/smoke-test/` |
| `known-pitfalls.md` | 353 | `/docs/pitfalls/` |
| `專案開發紀錄.html` | 1042 | `/docs/changelog/` |

**建立檔案結構**:
```
src/pages/projects/formosa-esg-2026/docs/
├── _DocsIndexPage.astro       ← /docs/ 索引頁
├── _DocPage.astro             ← 通用文件渲染元件（讀 md → 渲染）
├── _data/
│   └── docs-manifest.ts       ← 文件清單 metadata
├── index.astro                ← lang="zh-Hant"
├── api/index.astro
├── data-model/index.astro
├── operations/index.astro
├── resilience/index.astro
├── smoke-test/index.astro
├── pitfalls/index.astro
└── changelog/
    ├── _ChangelogPage.astro   ← 開發紀錄（從 HTML 轉 Astro）
    └── index.astro
```

**_DocsIndexPage.astro 設計要點**:
- 類似 wiki index，列出所有文件的標題 + 一句描述 + 連結
- 分兩區：「技術參考」（6 份 md）和「專案紀錄」（changelog）
- 不需要密碼保護

**_DocPage.astro 設計要點**:
- 通用 markdown 渲染元件
- 接收 `slug` prop，對應 md 檔案
- 用 Astro 的 markdown 渲染能力（或 `marked` / `remark`）將 md 轉 HTML
- 麵包屑導航（文件中心 > 文件標題）

**⚠️ Markdown 內容路徑**:
- 6 份 md 檔案目前在本機資料夾，需要 commit 到 repo
- 建議放在 `src/pages/projects/formosa-esg-2026/docs/_content/` 或 `src/content/docs/`
- Code 決定最佳的 Astro content 整合方式

**changelog 特別處理**:
- `專案開發紀錄.html` 已是完整 HTML，可提取 body 內容包成 Astro 元件
- 或轉成 md 再渲染

### B2. i18n 四語系

跟 Part A 一樣，每個子頁都需要 en / ja / zh-cn 入口：

```
src/pages/en/projects/formosa-esg-2026/docs/index.astro
src/pages/en/projects/formosa-esg-2026/docs/api/index.astro
... (每個子路徑 × 3 個語系)
```

翻譯範圍：
- 索引頁標題、文件描述
- 麵包屑文字
- 各 md 內容本身不翻譯（技術文件維持中文原文），但 UI chrome 要 i18n

### B3. SiteFooter 擴充

**修改檔案**: `src/components/SiteFooter.astro`

在 event mode 的 `footer-social-links` 區塊加上「專案文件」連結：

```astro
<!-- 現有 -->
<a href={`${langPrefix}/projects/formosa-esg-2026/guide/`}>使用說明</a>
<a href={`${langPrefix}/projects/formosa-esg-2026/privacy/`}>隱私權聲明</a>
<a href={`${langPrefix}/projects/formosa-esg-2026/feedback/`}>問題回報</a>
<!-- 新增 -->
<a href={`${langPrefix}/projects/formosa-esg-2026/docs/`}>專案文件</a>
```

⚠️ `langPrefix` 已有邏輯，確認跟現有三個連結用同樣的 pattern。

### B4. 確認現有文件

Issue #108 提到需確認第一層文件是否已上線：
- `/guide/` → 已有 `_GuidePage.astro` ✅
- `/guide/admin/` → 已有 admin 目錄 ✅
- `/privacy/` → 已有 privacy 目錄 ✅
- `/faq` → 已上線 ✅

---

## 建議執行順序

1. **Step 0**: 偵察確認（5 分鐘）
2. **Part A**: Issue #107 verification 頁面（較小，先做）
3. **Part B1**: docs 文件 commit 到 repo + 頁面元件
4. **Part B3**: footer 擴充（最後，一行改動）
5. **Build + Push**: `astro build` 確認成功 → `git push`
6. **Smoke Test**: 所有新路徑回 200

---

## 驗證 Checklist（Code 完成後自測）

### Issue #107
- [ ] `astro build` 成功，dist 有 verification/ 目錄
- [ ] `/verification/` 回 200（四語系）
- [ ] 手機瀏覽器排版正常
- [ ] 7 大類 34 項全部渲染
- [ ] Summary bar 統計正確

### Issue #108
- [ ] `/docs/` 索引頁顯示所有文件連結
- [ ] 6 份技術文件 + changelog 頁面各回 200（四語系）
- [ ] Footer 出現「專案文件」連結且指向正確路徑

### 整體
- [ ] `astro build` 無 error
- [ ] 現有頁面無 regression（首頁、tracker、guide、faq 正常）

---

## 注意事項

1. **Astro scoped CSS 陷阱**：JS 動態建立的 DOM 不會有 `data-astro-cid`，CSS 用 `:global()` 或 `is:inline`
2. **CDN 快取**：`max-age=3600`，部署後 hard refresh 驗證
3. **本機 md 檔案內容**：6 份技術文件都在 Paul 本機 `白沙屯ESG繞境/` 資料夾。如果 Code session 拿不到，Paul 會手動 commit
4. **不要動 tracker / formosa.js / Worker**：這次只做純前端新增頁面
5. **凍結期 4/11-4/13**：務必在 4/10 前完成部署

---

## 回報格式

完成後寫 worklog，內容包含：
- 建立的檔案清單
- commit hash
- build 頁數變化
- 有無 regression
- 待 Paul 執行的 deploy 指令（如果需要）

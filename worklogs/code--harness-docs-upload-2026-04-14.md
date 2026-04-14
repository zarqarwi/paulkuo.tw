# Code Handoff — Harness Engineering 文件庫上架

> **來源**：Chat session 初版 handoff + Cowork session 偵察補完
> **日期**：2026-04-14
> **Task Size**：M（純前端，~30-45 分鐘）
> **建議模型**：Sonnet 4.6
> **信心等級**：高——所有前置偵察 Cowork 已完成，路徑/檔案/整合細節都驗過。

## TL;DR

做一件事：在 `src/pages/governance/index.astro` **既有 `<style>` 區塊結尾** + **`#dashboard` 容器之外**，加一個 `.docs-library` section，兩張卡片分別連到 `/governance/harness-process.html` 和 `/governance/skill-overview.html`。兩份 HTML Cowork 已放好（Section 2 驗證）。樣式 light theme、hex 硬編碼、對齊 `.proj-card` 設計（Section 4）。

三個最容易踩的坑：
1. 文件庫**必須放在 `#dashboard` 外面**（Section 3）——裡面的話訪客解不了 token 就看不到
2. 用實際 hex 值**不是 CSS 變數**（Section 4）——governance 頁沒定義變數
3. **不要順手重構** governance 頁（Section 7.5）——scope 嚴格鎖死

Bonus（可選）：順手驗 Phase 3 稽核面板是否上線（Section 6.2），能結掉 PENDING.md 裡另一筆待辦。

---

## Changelog

- **2026-04-14 v4**：Token 取得路徑修正
  - 原本 Section 5.4 + 11 寫「從 Cowork `.auto-memory/` 讀 GOVERNANCE_TOKEN」——這個路徑 Code session 存取不到（Cowork-local 記憶）
  - 改成「Paul 在開場 chat 提供；沒看到就直接問」
  - 明確加註「不要把 token commit 進 git 或寫進 worklog」——因為 `worklogs/` 是 tracked 目錄
- **2026-04-14 v3**：完整化
  - Section 2 加檔案 byte 檢查（確認 Cowork 寫入完整）
  - Section 5 重排（build 先 / dev 後）、fix 手機 hover checklist 矛盾、明確 GOVERNANCE_TOKEN 從 memory 讀取
  - Section 6 新增 Phase 3 順手驗證（851dd58 稽核面板是否正常）
  - 新增 Section 7.5「Scope boundary — 這次任務 NOT to do」
  - Section 9 commit message 補 Refs 欄位
  - Section 11 措辭修正
- **2026-04-14 v2**：Cowork 實地偵察 `governance/index.astro` 的 style 區塊後修訂
  - 發現 governance 頁**沒用 CSS 變數**，全是 light theme 硬編碼 hex
  - Section 4 全部改寫：CSS 改用實際的設計 tokens 表格 + 具體 hex 值（`#fff` / `#e5e7eb` / `#111827` / `#3b82f6` / `#6b7280` 等）
  - max-width 從 1100px 改成 1000px 對齊 `#dashboard`
  - 明確指示「加進既有 `<style>` 區塊而不是新開」
  - 卡片樣式對齊 governance 頁既有的 `.proj-card` + `.section-title` 設計系統
  - 保證文件庫區塊跟 dashboard 主體視覺一致（light theme、`10px` 圓角、藍色 `#3b82f6` accent）
- **2026-04-14 v1**：初稿（Chat session handoff + Cowork 檔案就位 + 整合細節補完）

---

## 0. 開場：先 cd 到正確位置

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
pwd  # 應該輸出：/Users/paul/Desktop/01_專案進行中/paulkuo.tw
git status  # 確認 working tree 乾淨
git pull   # 同步 main
```

---

## 1. 背景脈絡

Paul 在 `paulkuo.tw/projects/` 新增了「人機協作秩序設計（Harness Engineering 實戰記錄）」專案 card（commit `879e6f1`），CTA 連結指向 `/governance/`。

現在要在 `/governance/` 頁面加一個**文件庫區塊**，讓從 projects card 點進來的訪客可以直接閱讀兩份 HTML 文件：
1. Harness Engineering 六階段開發歷程
2. session-handoff skill v4.8 總覽

---

## 2. 檔案已就位（Cowork 已放好，不要動）

Cowork session 已經把兩份 HTML 放到 `public/governance/`，你不需要重新放：

```
public/governance/
├── harness-process.html    (19,726 bytes)
└── skill-overview.html     (28,412 bytes)
```

兩份都是獨立完整 HTML，內嵌樣式（暗色主題），**不要修改內容**。

快速確認檔案存在且未被破壞：

```bash
ls -la public/governance/
wc -c public/governance/harness-process.html public/governance/skill-overview.html
# 預期：
#   19726 public/governance/harness-process.html
#   28412 public/governance/skill-overview.html
#   48138 total
```

如果 byte 數對不上，停下來問 Paul——不要自己 re-upload，檔案可能被意外修改過。

---

## 3. ⚠️ 整合關鍵——這一點錯了功能就壞

**`/governance/` 是 token-protected Dashboard。**

打開 `src/pages/governance/index.astro` 你會看到：

```astro
<BaseLayout title="專案治理 Dashboard" lang="zh-Hant">
  <div id="auth-gate" class="auth-wrapper">
    <!-- token 輸入框 -->
  </div>

  <div id="dashboard" hidden>    <!-- line 26，預設 hidden -->
    <!-- 所有 dashboard 內容都在這裡 -->
  </div>
</BaseLayout>
```

訪客沒輸入 GOVERNANCE_TOKEN 前，`#dashboard` 是 hidden 的。

### 這對你的意義

**文件庫區塊必須放在 `<div id="dashboard" hidden>` 外面**，否則訪客從 projects card 點進來只會看到 token 輸入框、完全看不到文件庫連結——整個功能就破功。

### 建議插入位置（你自行判斷哪個視覺更好）

**選項 A**：放在 `</BaseLayout>` 之前、`</div>`（line 78，dashboard 結尾）之後
- 優點：程式碼結構最乾淨，獨立常駐區塊
- 缺點：auth-gate 和 dashboard 切換時，文件庫永遠在下方

**選項 B**：放在 `</div>`（line 24，auth-gate 結尾）之後、`<div id="dashboard" hidden>`（line 26）之前
- 優點：token gate 正上方就能看到文件庫，訪客動線最自然
- 缺點：輸入 token 後 dashboard 顯示，文件庫會被推到更下面

**我傾向選項 B**——訪客的第一視覺是 token 輸入框，下方直接就看到「不想輸入 token？先看這兩份文件」，動線最順。但 Code 可以自己判斷。

---

## 4. 要寫的東西

### ⚠️ Design system 注意事項（Cowork 已驗過，直接照抄）

`governance/index.astro` **沒用 CSS 變數**，全部是 light theme 硬編碼 hex。Cowork 已經 grep 過整個檔案，以下是 governance 頁實際的設計 tokens：

| Token | 值 | 來源 |
|-------|-----|------|
| 卡片背景 | `#fff` | `.proj-card`, `.auth-box` |
| 邊框（預設） | `#e5e7eb` | `.proj-card`, `.auth-box` |
| 主文字（標題） | `#111827` | `.auth-box h2`, `.proj-name` |
| 次文字（說明） | `#6b7280` | `.auth-hint` |
| 分節標題 | `#374151` | `.section-title` |
| 分節底線 | `#f3f4f6` | `.section-title border-bottom` |
| 主要 accent（CTA） | `#3b82f6` / hover `#2563eb` | `.auth-row button` |
| 主容器 max-width | `1000px` | `#dashboard` |
| 卡片圓角 | `10px` / `12px` | `.proj-card` / `.auth-box` |

兩份 HTML 文件本身是暗色主題，**但文件庫卡片要維持 light theme**（跟 governance 頁一致），不要試圖匹配 HTML 內部配色。訪客點 `target="_blank"` 在新分頁看到暗色是可以接受的 context switch。

### HTML 區塊

在選定位置插入：

```astro
<section class="docs-library">
  <h2 class="docs-library-title">文件庫</h2>
  <div class="docs-library-grid">
    <a href="/governance/harness-process.html" target="_blank" rel="noopener" class="doc-card">
      <h3>Harness Engineering 開發歷程</h3>
      <p>從 Phase 0 裸奔到 Phase 5 自動化，六階段演進記錄</p>
      <span class="doc-cta">閱讀文件 →</span>
    </a>
    <a href="/governance/skill-overview.html" target="_blank" rel="noopener" class="doc-card">
      <h3>session-handoff Skill v4.8 總覽</h3>
      <p>13 條護欄、Exit Gate / Reconciliation 雙閘門、不可逆操作清單</p>
      <span class="doc-cta">閱讀文件 →</span>
    </a>
  </div>
</section>
```

### CSS 區塊

把這段**加進既有的 `<style>` 區塊**（`governance/index.astro` line 422 開始）的結尾處，`</style>` 之前。**不要**新開一個 `<style>` 區塊（Astro 會各自 scoped，管理麻煩）。

```css
  /* ── Docs library ── */
  .docs-library {
    max-width: 1000px;
    margin: 0 auto 3rem;
    padding: 0 1rem;
  }

  .docs-library-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .docs-library-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
  }

  .doc-card {
    display: block;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 1.25rem;
    text-decoration: none;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .doc-card:hover {
    transform: translateY(-2px);
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
  }

  .doc-card h3 {
    color: #111827;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .doc-card p {
    color: #6b7280;
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 0 0 0.75rem;
  }

  .doc-cta {
    color: #3b82f6;
    font-size: 0.85rem;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .docs-library-grid { grid-template-columns: 1fr; }
  }
```

### 設計決策說明

- **標題樣式直接抄 `.section-title`**（governance 頁 line 508-515）：這樣文件庫跟 dashboard 裡的「專案狀態」「稽核」等區塊視覺上是同一套分節系統
- **卡片樣式對齊 `.proj-card`**（line 524-530）：同樣的 `#fff` / `#e5e7eb` / `10px` 圓角
- **hover 效果用藍色 accent**（`#3b82f6`）：跟 `.auth-row button` 一致，暗示互動性
- **max-width 1000px** 對齊 `#dashboard`（line 485），不會比 dashboard 寬
- **用 rem 不用 px**：governance 頁 style 全用 rem，保持一致

---

## 5. 驗證 Smoke Test（必做，結果寫進 worklog）

建議執行順序：**建置先 → 本機視覺後**。build 失敗快速失敗，不用等 dev server 跑起來才發現 Astro 爆炸。

### 5.1 建置驗證

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
npm run build
```

確認：

- [ ] 無 warning/error
- [ ] `dist/governance/harness-process.html` 和 `dist/governance/skill-overview.html` 有被 Astro 複製進去（`ls dist/governance/`）

Astro build 失敗最常見原因是 `<style>` scope 問題或 `:global()` 漏寫——若報錯先看這兩個。

### 5.2 本機桌機驗證

```bash
npm run dev
```

開 http://localhost:4321/governance/，**不要輸入 token**：

- [ ] 文件庫區塊正常顯示（不在 hidden 的 dashboard 容器裡）
- [ ] 兩張卡片並排顯示
- [ ] 卡片背景白、邊框淺灰、標題深黑、說明中灰——跟頁面其他區塊 tone 一致
- [ ] Hover 卡片有上移 2px + 藍色邊框 + 輕微 shadow
- [ ] 點「Harness Engineering 開發歷程」→ 在新分頁開啟 `/governance/harness-process.html`，暗色樣式完整
- [ ] 點「session-handoff Skill v4.8 總覽」→ 在新分頁開啟 `/governance/skill-overview.html`，暗色樣式完整

### 5.3 本機手機驗證（DevTools 切 iPhone 14 Pro 或類似）

- [ ] 文件庫卡片改為直排（single column）
- [ ] 卡片寬度佔滿容器、padding 不擠
- [ ] 點擊卡片能正常開新分頁

### 5.4 Token gate 回歸驗證

**GOVERNANCE_TOKEN 取得方式**：Paul 會在任務開場的 chat 訊息裡直接貼給你（他視這個 token 為「我們之間的共享資訊」）。如果開場訊息沒看到，**直接問他**——他明確表示「不想你為了拿 token 卡關燒時間」，問他比猜快。

**不要**把 token 寫進 commit、worklog、或任何會進 git 的檔案。只在本機記憶體或暫存環境變數裡用。

輸入 token 後確認：

- [ ] Dashboard 正常解鎖顯示（你的改動沒壞掉 token gate 邏輯）
- [ ] 文件庫區塊仍可見（兩者共存，不會互相遮蔽）
- [ ] 輸入錯誤 token 會顯示錯誤訊息（沒改壞 auth-error 邏輯）

---

## 6. 部署

驗證通過後：

```bash
# 前端 build + deploy
npm run build && wrangler deploy
```

**不需要** deploy worker（這次沒動 `worker/src/`）。

### 6.1 線上檔案驗證

部署後線上驗證（等 CDN 生效，最多 1 小時，記得 hard refresh）：

```bash
curl -sI https://paulkuo.tw/governance/harness-process.html | head -3
curl -sI https://paulkuo.tw/governance/skill-overview.html | head -3
# 兩者都要 HTTP/2 200
```

然後用瀏覽器 hard refresh（Cmd+Shift+R）開 https://paulkuo.tw/governance/ 跑一次 Section 5.2 的 checklist。

### 6.2 順手驗 Phase 3（bonus，2 分鐘）

Phase 3 治理框架稽核整合（commit `851dd58`，2026-04-11 完成程式碼、待 Paul 手動部署）**從上次部署到今天都還沒線上驗證過**。你這次 deploy 會順便把 Phase 3 的程式碼也推上去（如果還沒）。既然你已經解 token 進 dashboard 了，就順手確認 Phase 3 面板是否正常運作：

開 https://paulkuo.tw/governance/ → 輸入 token → 拉到 dashboard 底部：

- [ ] 「稽核」區塊存在（Phase 3 新增的 audit panel）
- [ ] `#audit-scanner-status` badge 顯示狀態（loading/ok/fail 任一種，不是空白）
- [ ] `#audit-open-issues` 有數字或「—」，不是 JS error
- [ ] `#audit-trend-chart` canvas 有畫出折線圖（或顯示「近期無資料」也算 pass）
- [ ] DevTools console 沒有 `/api/governance/audit` 的 404/500

如果以上任一 fail：**不是你這次改動造成的**，但請寫進 worklog 的「阻礙與踩坑」，讓 Paul 知道 Phase 3 需要單獨處理。如果全 pass，就在 worklog 的「狀態變更」區塊加一筆：

```
- Phase 3 治理稽核（851dd58）：未部署 → 已部署並線上驗證通過
```

這樣 PENDING.md 裡那筆 🟡 「Phase 3 待 Paul 手動部署」就能順便結掉，省 Paul 一輪動作。

**如果你不想處理 bonus 就跳過**，這件事不阻塞主任務。

---

## 7. 跨子專案影響

**無影響**。這次改動只動：
- `public/governance/*.html`（新增，兩個檔案）
- `src/pages/governance/index.astro`（修改，純新增區塊）

不動 `worker/src/`、`translator.js`、`BaseLayout.astro`、共用 utils。

**Commit message 不需要 `[影響: ...]` 標注**，因為沒碰共用模組。

---

## 7.5. Scope boundary — 這次任務 NOT to do

Code session 非常容易「順手重構」，但這次請**嚴格控制 scope**。以下事項**不是這次任務的一部分**，看到想修也請忍住，寫進 worklog 的「阻礙與踩坑」讓 Paul 另外開 issue：

- ❌ **不要把 governance 頁的硬編碼 hex 重構成 CSS 變數**（這是獨立 refactor 任務，不該跟文件庫上架綁）
- ❌ **不要調整現有 `.proj-card`、`.auth-box`、`.audit-panel` 的任何樣式**（即使你覺得 `#e5e7eb` 應該改成 `#e7eaf0`）
- ❌ **不要重新命名任何 class**
- ❌ **不要改 governance `<script>` 區塊的任何邏輯**（Phase 3 的 audit panel 邏輯很脆弱，動到就爆）
- ❌ **不要優化 HTML 文件本身**（`public/governance/*.html` 是獨立作品，字不改、樣式不改、字型不改）
- ❌ **不要碰 `worklogs/worklog-2026-04-11.md` 或更早的 worklog**（只追加新的）
- ❌ **不要 deploy worker**（這次沒動 `worker/src/`）
- ❌ **不要主動 push**（push 前必須告知 Paul）

這份 handoff 的預期 diff 只會碰兩個地方：
1. `public/governance/` 新增兩個 HTML（Cowork 已寫入）
2. `src/pages/governance/index.astro` 新增一個 `<section>` + `<style>` 內部追加 CSS

如果你的 `git diff` 顯示動到任何其他檔案，停下來檢查。

---

## 8. 不可逆操作

**無**。純新增 + 頁面修改，可以隨時 revert（`git revert <hash>`）。

---

## 9. Commit + Push

```bash
git add public/governance/ src/pages/governance/index.astro
git status  # 再確認一次：只會看到這三個檔案（兩個新 HTML + 修改 index.astro）
git diff --cached --stat  # 確認動到的行數跟預期接近（~60-80 行新增）
```

Commit message：

```bash
git commit -m "feat(governance): 新增 Harness Engineering 文件庫區塊

- 上架兩份 HTML：harness-process.html + skill-overview.html
- governance/index.astro 加文件庫卡片（放在 token gate 外部，訪客免解鎖可見）
- 對應 paulkuo.tw/projects/ 人機協作秩序設計 card（879e6f1）的 CTA 目的地

Refs: worklogs/code--harness-docs-upload-2026-04-14.md
      worklogs/PENDING.md"
```

**⚠️ Push 前先告知 Paul**，由他按 `git push` 或明確說「你 push 吧」。**絕對不要**自己 `git push origin main`。

---

## 10. 完成後回報格式（貼回 Cowork / Chat）

1. Commit hash：`xxxxxxx`
2. 線上 URL（確認 200）：
   - https://paulkuo.tw/governance/harness-process.html
   - https://paulkuo.tw/governance/skill-overview.html
   - https://paulkuo.tw/governance/
3. Governance 頁截圖一張（含文件庫區塊 + 未輸入 token 的狀態）
4. Smoke test 結果（把 checklist 貼回，每項打 ✅ 或 ❌）
5. Worklog 追加一筆（`worklogs/worklog-2026-04-14.md`）

### Worklog 範例（三維度必填）

```markdown
## 完成日誌
- HH:MM Harness 文件庫上架完成 (xxxxxxx) Code

## 決策紀錄
- 文件庫插入位置選 B（auth-gate 下、dashboard 上）：因為訪客動線上 token gate 正下方看到文件庫最自然，輸入 token 後文件庫被推到底部也 OK

## 阻礙與踩坑
- {如果有踩坑，寫在這裡；沒有就寫「無阻礙」}

## Smoke Test
- ✅ 本機未輸入 token：文件庫顯示、卡片點擊正常
- ✅ 本機輸入 token：Dashboard 解鎖、文件庫仍可見
- ✅ npm run build 無錯誤
- ✅ 線上 curl 兩份 HTML 皆 200
- ✅ https://paulkuo.tw/governance/ hard refresh 顯示正常

## 狀態變更
- PENDING.md「Harness 文件庫上架」：待 Code → 已完成（commit xxxxxxx）
```

---

## 11. 如果卡關

- **文件庫擠進 dashboard 裡了（輸入 token 才看得到）**：插入位置錯誤，應該在 `</div>`（line 78，`#dashboard` 結尾）之後或 `</div>`（line 24，`#auth-gate` 結尾）之後
- **hover / 圓角沒生效**：CSS 應加在既有 `<style>` 區塊內（line 422 開始）的 `</style>` 之前，不要新開 `<style>`（Astro scoped style 問題）
- **需要 token 進 dashboard 驗證**：token 由 Paul 在開場 chat 訊息裡提供；如果沒看到就直接問他（他不會介意，問他比你自己卡著省 token）。**不要**把 token commit 進 git 或寫進 worklog 檔案
- **文件庫區塊太寬**：max-width 應該是 `1000px`（跟 `#dashboard` 對齊），不是 1100px
- **build 失敗抱怨 `:global()`**：你可能把 CSS 加錯地方，檢查是不是在 dashboard 的 `<style>` 之外
- **git diff 顯示動到別的檔案**：停下來檢查，這次任務只該動 3 個檔案
- **線上 CDN 還是舊版**：等最多 1 小時、hard refresh、或 Cloudflare dashboard 手動 purge cache
- **其他**：直接停下來問 Paul，不要猜。**消耗 token 在錯誤方向比承認卡住貴 10 倍。**

---

## 附錄 A：相關檔案一覽

| 檔案 | 狀態 | 動作 |
|------|------|------|
| `public/governance/harness-process.html` | ✅ 已就位（19,726 bytes） | 不要動 |
| `public/governance/skill-overview.html` | ✅ 已就位（28,412 bytes） | 不要動 |
| `src/pages/governance/index.astro` | 📝 需修改 | 加文件庫區塊 + CSS（既有 `<style>` 區塊內） |
| `worklogs/worklog-2026-04-14.md` | 📝 需追加 | 完成後補一筆三維度紀錄 |
| `worklogs/PENDING.md` | 📝 需標記 | 完成後把對應項目改 `[x]`（Cowork 也可代勞） |
| `worker/src/*` | ❌ 不動 | 無關 |
| `src/layouts/BaseLayout.astro` | ❌ 不動 | 無關 |
| 其他 governance 頁既有 class | ❌ 不動 | Scope boundary（Section 7.5） |

---

## 附錄 B：這份 handoff 的產生脈絡

這份文件不是憑空寫出來的，是多段工作的輸出：

1. **Chat session**（初稿）：Paul 在 Chat 端跟我討論 card 建立 + 兩份 HTML 上架需求，產出初版 handoff
2. **Cowork session**（偵察 + 補完）：
   - 讀取兩份 HTML 檔案、確認格式完整、複製到 `public/governance/`
   - 讀 `src/pages/governance/index.astro` 全檔，發現 token-protected 結構
   - grep CSS 區塊，發現沒用 CSS 變數、全是 light theme hex
   - 列出實際設計 tokens、對齊既有 class 風格
   - 把 Chat 版 handoff 改寫成 Code-executable 版本（v2）
   - 第二輪補完（v3）：加 byte 檢查、重排 smoke test、加 Phase 3 bonus、加 scope boundary、加 TL;DR
3. **Code session**（你現在這輪）：執行

如果 Code session 覺得哪裡需要回頭問 Cowork，就回頭——這份 handoff 不是聖經，是工作流起點。

---

**一句話總結**：兩份 HTML 已就位，你只要改 `src/pages/governance/index.astro` 加一個 `<section class="docs-library">` + 對應 CSS，注意**放在 token gate 外部、用 hex 不用 CSS 變數、scope 不要漂移**，其他就是標準 build → smoke test → deploy → 告知 Paul push 的流程。

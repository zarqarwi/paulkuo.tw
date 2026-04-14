# Handoff: governance/index.astro quick fix — commit + push + deploy

**建議模型**：Sonnet 4.6 + Medium
**Task size**：S（< 30 min）
**信心等級**：高
**產出來源**：Cowork session（2026-04-14 23:04）

---

## 1. 背景

Paul 回報 `https://paulkuo.tw/governance/` 兩個體驗問題：

1. 未登入時頁面同時顯示「登入卡」+「文件庫」，登入畫面「還在同一個網頁」的感受就是文件庫區塊在登入卡下方持續可見造成。
2. 整頁「閱讀起來像 worklog 不像儀表板」——其中一個小線索是 trend chart 標題寫「產出趨勢（週 commits）」，但 `renderTrend()` 實際畫的是各專案累計 commits 長條圖，名實不符強化了「隨便拼湊」的觀感。

Cowork 已經把檔案改好，但 Cowork 沙盒對 `.git/` 是唯讀（`rm: Operation not permitted`、`git commit` 卡 `index.lock`），無法自己 commit。所以這份 handoff 把收尾工作交給 Code。

Dashboard 更大的資訊架構改版（KPI bar / actionable 稽核表 / 真時序圖）另案處理；Stitch 上已經有登入畫面 visual redesign 的 preview（projects/3520595413095137436）供後續參考。這份 handoff **只做 quick win bug fix**。

## 2. Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status --short
# 預期：
#  M src/pages/governance/index.astro
#  M worklogs/PENDING.md
#  M worklogs/worklog-2026-04-14.md
git diff --stat src/pages/governance/index.astro
# 預期：1 changed, 30 insertions(+), 30 deletions(-)
```

改動**已經在 working directory**，不需要重寫程式碼，直接讀 diff 確認合理就 commit。

## 3. 具體步驟

### 3.1 確認 diff

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git diff src/pages/governance/index.astro | head -120
```

預期看到四塊改動：

| 區塊 | 內容 |
|------|------|
| A | `.docs-library` 從頂層 `<section>` 移除 |
| B | auth-box 內新增 `<p class="auth-footnote">登入後可見：專案健康度 · 自動化覆蓋率 · 跨專案稽核</p>` |
| C | trend chart 標題「產出趨勢（週 commits）」→「各專案累計 commits」 |
| D | `.docs-library` 重新插入 `#dashboard` 尾端（audit-panel 之後） |
| E | CSS：新增 `.auth-footnote`；`.docs-library` 刪 max-width/margin 改成 `margin-top: 2.5rem`；刪除無用 `.docs-library-title` |

### 3.2 Commit + push（原子操作）

```bash
git add src/pages/governance/index.astro worklogs/worklog-2026-04-14.md worklogs/PENDING.md

git commit -m "$(cat <<'EOF'
fix(governance): 登入/文件庫顯示隔離 + trend chart 標題正名

- 文件庫 (section.docs-library) 從頂層移入 #dashboard 內，
  未登入狀態下不再與 auth-gate 同頁顯示
- trend chart 標題「產出趨勢（週 commits）」改為
  「各專案累計 commits」，與實際資料（橫向長條圖）一致
- auth-box 加入 footnote「登入後可見：專案健康度 · 自動化
  覆蓋率 · 跨專案稽核」，登入前先預告價值
- 清理無用 CSS：.docs-library-title、舊 max-width override

Paul 回報：登入畫面下方文件庫一直顯示，整頁像 worklog 而非
儀表板。這批屬於 quick win bug fix，dashboard 資訊架構改版
（KPI bar / 動態專案卡 / actionable 稽核表）另案處理。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

git push
```

> Cowork 在 worklog-2026-04-14 已追加 23:04 條目描述本次改動（「commit 待 push」字樣）。Code 完成 push 後請補上 commit hash：把 `（commit 待 push）` 改成 `({SHA})`。

### 3.3 部署

前端純靜態 Astro，不碰 Worker：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
npm run build
wrangler deploy
```

## 4. 上游假設

- `src/pages/governance/index.astro` 改動是 Cowork 23:04 寫入，Paul 本機 diff 應該跟 `git diff` 輸出一致。接手前先 `git diff --stat` 比對行數（預期 30 insertions / 30 deletions）。
- `worklogs/PENDING.md` 有 Cowork 追加的新 🟡 條目（governance quick fix），這條 commit 後可直接 mark `[x]` 或等部署完再處理。

## 5. 驗證方式

Smoke test（用無痕視窗避免 CDN/sessionStorage 干擾）：

| 驗證項目 | 預期結果 |
|---------|---------|
| 無痕打開 `https://paulkuo.tw/governance/` | 只看到登入卡 + footnote，**看不到**文件庫區塊 |
| 頁面滾動到底 | 沒有其他內容，乾淨結束 |
| 輸入 `GOVERNANCE_TOKEN` 送出 | dashboard 展開 + 文件庫出現在稽核區塊下方 |
| 檢查趨勢圖標題 | 顯示「各專案累計 commits」（不是「產出趨勢（週 commits）」）|
| Console | 無 error、無 404 |

失敗項目 → 當場修 → 重新 deploy → 再驗。不要放著。

## 6. 注意事項

- **CDN 快取**：`wrangler deploy` 後 CDN `max-age=3600`，驗證時用 hard refresh（Cmd+Shift+R）或無痕。
- **sessionStorage**：以前登入過的瀏覽器 `gov_token` 還在，會直接跳過 auth-gate 進 dashboard——驗證「未登入畫面」務必用無痕或 `sessionStorage.clear()`。
- **不涉及 Worker**：這次純前端改動，不需要 `cd worker && wrangler deploy --config wrangler.toml`。
- **CLAUDE.md 規範**：這次改動只動 `src/pages/governance/index.astro` 單一子專案檔案，不在 `docs/shared-file-impact-map.md` 共用檔案清單內——commit message **不需要** `[影響:]` 標注。

## 7. 信心等級

**高**。改動已經在 working dir，diff 乾淨可讀（純 HTML 結構搬移 + 一行標題改字 + CSS 補充），純前端、純靜態，無資料庫或 API 動作。失敗風險只在「deploy 沒 push 到」或「CDN 沒換」，hard refresh 即可。

## 8. Integration Checklist

本次改動不新增 API endpoint，不調整資料 schema，僅前端視覺 + DOM 結構調整。檢查項：

- ⬜ `/governance/harness-process.html`、`/governance/skill-overview.html` 兩個現有連結仍可達（文件庫連結搬位置但 href 沒改）
- ⬜ `sessionStorage.getItem('gov_token')` 的 auto-login 流程不受影響（`tryLogin` → `renderDashboard` 邏輯沒動）
- ⬜ 既有 `#dashboard` 的 CSS max-width（1000px）會自動把文件庫 grid 限制在同寬——不會跑版
- ⬜ RWD：`@media (max-width: 640px)` 的 `.docs-library-grid` 單欄規則還在

---

## 狀態變更（commit 後補上）

- Issue 層：無對應 Issue；回報來源是 2026-04-14 Cowork session 的 UX 檢視
- PENDING.md：「🟡 Commit + push + deploy `src/pages/governance/index.astro` quick fix」→ 完成標 `[x]`
- worklog 23:04 條目：「（commit 待 push）」→ 替換成實際 SHA

---

## Cowork 產出三態宣告

`⚠️ local edit uncommitted` — 改動在 Paul 本機 working directory，未 commit。Cowork 沙盒 `.git/` 唯讀，無法自己 commit / push。等 Code 接手。

建議模型: Sonnet

# code-- handoff · ADR INDEX 產出 + Branch Protection 狀態稽核（Cowork 校訂版）

> - **產出時間**：2026-04-25
> - **原產出者**：Chat session（Opus 4.7）
> - **校訂者**：Cowork session（Opus 4.7）— 修了 B1/B2/B3 三個 blocker + S1/S2/S3 三個建議 + Q1 保守處理
> - **接手方**：Code session
> - **對應研究**：
>   - `research-governance-gaps-vs-industry-2026-04-25-v2.md`（Chat v2.0）
>   - `docs/governance/research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md`（Cowork v2.1）
> - **Task Sizing**：M（預估 20-40 分鐘）
> - **裁決**：v2.0 七項疏漏大幅減量，只執行 **D1** + **D3** 兩項純工程動作。其餘擱置兩個月以實證決定。

---

## Step -1 環境準備

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw && git pull
```

確認工作目錄是 `paulkuo.tw`，且 `git status` 乾淨（有未提交改動請先處理）。

---

## 背景

今天 Chat 花了 8 輪偵查產出 v2.0 治理研究報告，Cowork 寫了 v2.1 挑戰 Chat 的結構性 incentive。Paul 的裁決：

**治理修辭討論要剎車，實質工程要動手。**

Cowork v2.1 點出一個真相：Chat 的 incentive 是產出有洞見的報告，這與「最少治理」天然衝突。繼續發 v2.2、v2.3 只會把執行成本持續外包給 Cowork 和 Code——這本身就是 MAST 意義的 coordination cliff。

從工程視角盤出的純工程問題中，**D1（ADR 檢索）** 和 **D3（Immutable ADR 的實作基礎）** 是真正在默默累積的技術債，與治理修辭完全無關：

- **D1**：ADR 從 H1 成長到 H9，再成長下去沒有 index 會找不到過去決策
- **D3**：憲法 v0.2 第一條宣稱「ADR immutable」，但如果 repo 沒 branch protection，這個宣稱是修辭不是事實

這份 handoff 只做這兩件事。其他項目（H13 handoff 格式、月度 ADR 上限、Context-centric 試驗、auto-memory 盤點、GitLab handbook 借鑑）全部擱置兩個月，之後用實證決定。

---

## Step 0 偵察

開工前先確認環境狀態，避免做白工。

### 0.1 · ADR 目錄存在性

```bash
ls -la docs/adr/ 2>/dev/null || ls -la docs/governance/ 2>/dev/null
```

預期結果：找到 ADR 檔案所在目錄。可能路徑：
- `docs/adr/*.md`
- `docs/governance/adr-*.md`
- 或其他位置

如果 ADR 散在多個目錄，先統一記下實際位置後再進 Step 1。

### 0.2 · 盤點所有 ADR

```bash
# 擴寬 pattern 避免漏 H 前綴或其他命名
find docs/adr docs/governance -type f -name "*.md" 2>/dev/null \
  | grep -iE '(adr|/h[0-9]|constitution|governance)' \
  | sort
```

列出檔案後，為每份檔案取出以下資訊（用 `head` 或 `grep`）：
- ADR 編號（H1、H2...）
- 標題
- Status（Accepted / Superseded / Draft / Rejected）
- 日期
- 一句話摘要

### 0.3 · 檢查是否已有 INDEX

```bash
ls docs/adr/INDEX.md docs/governance/INDEX.md docs/governance/ADR-INDEX.md docs/adr/README.md 2>/dev/null
```

如果已經有類似檔案，**先讀內容，判斷要新增還是更新**。如果有，不要覆蓋——把現有內容納入新版本。

### 0.4 · GitHub repo 基本資訊

```bash
git remote get-url origin
git branch --show-current
```

預期：origin 指向 `github.com/zarqarwi/paulkuo.tw`（或 `git@github.com:zarqarwi/paulkuo.tw.git`），當前分支是 main。

### 0.5 · ★ 決定 INDEX_PATH 與 ADR_DIR（驗證用變數）

完成 0.1-0.3 後，**明確決定**以下兩個值，後續所有步驟（包含驗證）都用這兩個變數：

```bash
# 範例（實際值依 Step 0.1 偵察結果決定）
export ADR_DIR="docs/governance"              # 或 docs/adr
export INDEX_PATH="docs/governance/ADR-INDEX.md"  # 或 docs/adr/INDEX.md
```

**選址規則**（固定死，不要臨場發揮）：
- 如果 0.1 發現 ADR 全部在 `docs/adr/` → `ADR_DIR=docs/adr`，`INDEX_PATH=docs/adr/INDEX.md`
- 如果全部在 `docs/governance/` → `ADR_DIR=docs/governance`，`INDEX_PATH=docs/governance/ADR-INDEX.md`
- 如果散在多目錄 → `ADR_DIR=.`（根目錄 find），`INDEX_PATH=docs/governance/ADR-INDEX.md`（統一收）

⚠️ 這兩個變數一旦決定，Step 1 / Step 2 / V1 / V2 / V4 全部用同一個值。否則驗證會誤判。

---

## 具體步驟

### Step 1 · 產出 INDEX 檔案

**目標**：一份單頁檔案，讓任何 session 在 10 秒內找到想要的 ADR。

**選址**：見 Step 0.5，使用 `$INDEX_PATH`。

**格式**（建議）：

```markdown
# ADR INDEX

> paulkuo.tw 架構決策紀錄索引
>
> - **最後更新**：YYYY-MM-DD
> - **維護原則**：新 ADR 合併前須同步更新此檔（詳見底部維護 SOP）
> - **總數**：N 份（Accepted: X / Superseded: Y / Draft: Z）

---

## 快速導航

| 編號 | 標題 | 狀態 | 日期 | 一句話摘要 |
|---|---|---|---|---|
| H1 | A→C Personal Skill 同步協議 | Accepted | 2026-04-18 | ... |
| H2 | ... | Accepted | ... | ... |

---

## 主題分組（可選，ADR 達 15+ 份後再加）

### 治理與流程
- H1、H4、H7...

### 記憶與資料
- H3、H5...

### 工程基礎
- H2、H8...

---

## 維護 SOP

1. **新 ADR 合併前**，此 INDEX 必須同步更新（INDEX 不是可選產物，是 ADR 的一部分）
2. **舊 ADR Superseded 時**，狀態欄更新為 `Superseded by Hxx`
3. **合併後驗證**：`grep -c '^| H' $INDEX_PATH` 的結果要等於 `ls $ADR_DIR/H*.md | wc -l`
4. **INDEX 檢索規則**：用 `grep 'keyword' $INDEX_PATH` 比 `grep -r 'keyword' $ADR_DIR` 快一個量級
```

**重要實作細節**：

- **摘要欄位**限制 30 字內，如果摘要寫不清楚，表示 ADR 標題本身不夠好，但**這次不要順手改 ADR 標題**——那是另一個動作
- **狀態** 欄位值必須從 ADR 原文 Status 區塊摘取，不要自己推斷
- **日期** 用 ADR 檔案裡的日期，不是 git commit 日期
- **編號** 如果 ADR 沒有統一 H1-H9 的編號（例如有些叫 `adr-collaboration-constitution-v0.2-2026-04-19.md`），先問 Paul 要不要補編號，不要自己發明

**如果遇到無編號 ADR**：

```
⚠️ 發現 N 份 ADR 無統一編號：
- docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md
- docs/governance/adr-xxx.md
建議：保留檔名不動，INDEX 裡用 [無編號] 或 [CON-v0.2] 等短碼標示。
Paul 確認後再進 Step 2。
```

### Step 2 · Branch Protection 狀態稽核

**⚠️ 這一步只做「稽核 + 建議」，不啟用任何保護。** 實際啟用動作屬於權限變更，需要 Paul 在本機 GitHub UI 操作，或 Paul 明確批准後 Code 用 `gh api` 執行。

#### 2.1 · 查詢當前 branch protection 狀態

```bash
# 方法 A：用 gh CLI（推薦）
gh api repos/zarqarwi/paulkuo.tw/branches/main/protection 2>&1 | head -50

# 方法 B：如果 gh 沒裝或沒 auth
gh --version
gh auth status
```

**預期三種情況**：

1. **完全沒保護**：回傳 `{"message":"Branch not protected",...}`
2. **已設保護**：回傳 JSON 物件，列出 required_status_checks / enforce_admins / required_pull_request_reviews 等欄位
3. **權限不足**：回傳 `{"message":"Resource not accessible by integration"}` — gh token 不夠權限，要 Paul 換 token 或直接 UI 操作

#### 2.2 · 產出稽核報告（★ 明確落地位置）

**固定產出位置**：`worklogs/branch-protection-audit-2026-04-25.md`（獨立檔案，不嵌 worklog）

內容格式：

```markdown
# Branch Protection 稽核 · 2026-04-25

**Repo**：zarqarwi/paulkuo.tw
**分支**：main
**當前狀態**：[完全沒保護 / 有保護但不完整 / 已完整保護 / 權限不足無法查詢]

## 現況詳情
（如果有保護，列出啟用了哪些規則）
（如果沒保護，留空）

## 與憲法 v0.2 第一條「ADR immutable」的差距

憲法宣稱：ADR 一旦 Accepted 即 immutable，只能 Superseded 不能修改。

工程實質：
- 沒 branch protection 的情況下，force push 可以改寫 history
- 沒 required review 的情況下，直接 push 可以覆蓋任何檔案
- 現狀是「修辭 immutable」，不是「工程 immutable」

## 補救方案建議（三檔位）

### 最小版（建議優先）
- Require pull request before merging（直接 push 到 main 被拒）
- Require linear history（禁止 force push 改寫 main）
- Include administrators（Paul 自己也受限，避免緊急繞過變常態）
- 成本：幾乎零，只是 Paul 改工作流從 `git push` 變成開 PR

### 中等版
- 加上「Require approvals: 1」
- 問題：Paul 是唯一 human reviewer，自己的 PR 沒人批——這條可能不適用單人 repo

### 重量版
- 加上 required status checks（CI 必須通過才能 merge）
- 前提：先有 CI（paulkuo.tw 應該已有 Cloudflare Pages CI，可對接）
- 成本：設定 30 分鐘，之後遇到 CI flaky 時會卡住

## 建議

採用最小版即可。單人 repo 的 branch protection 核心價值是「**防手滑**」和「**讓 immutable 宣稱名實相符**」，不是「**防惡意竄改**」——單人專案不需要後者。

## 下一步

**本次 handoff 不啟用。** Paul 讀完建議後決定：
- (a) 採用最小版 → Paul 自己在 GitHub UI 開設 → 或另發 handoff 讓 Code 用 `gh api` 開
- (b) 暫不啟用 → 記入 PENDING.md 兩個月後重議
- (c) 採用其他組合 → Paul 直接說，Code 再補一次操作
```

#### 2.3 · 若發現 repo 是 private 且 gh 權限不足

不要嘗試繞過。直接回報「需要 Paul 用 web UI 檢查」，並附上網址：

```
https://github.com/zarqarwi/paulkuo.tw/settings/branches
```

### Step 3 · PENDING.md 擱置記錄

新增一段記錄，把 v2.0 / v2.1 中**這次不做的項目**明文擱置。

★ 使用 **2026-04-24 立憲的五符號 schema**（`[ ]`/`[~]`/`[>]`/`[x]`/`[-]`），不要發明新符號。擱置項統一用 `[-]`，用段落標題說明「觀察期」。

```markdown
## 觀察期項目（2026-04-25 起，2026-06-25 盤點）

以下項目來自 2026-04-25 治理研究 v2.0 / v2.1 兩份報告，經 Paul 裁決擱置兩個月，
不預先立規則，兩個月後用實證決定是否動作。狀態統一為 `[-]`（暫緩）。

- [-] v2.0 疏漏 1 · 修憲→handbook 變更 framing 切換
- [-] v2.0 疏漏 3 · auto-memory 升格 ADR 觸發規則
- [-] v2.0 疏漏 4 · cloud 層 snapshot 維護者明文化
- [-] v2.0 疏漏 5 · H13 handoff 格式（含時間 budget metadata）
- [-] v2.0 疏漏 6 · 月度 ADR 產出上限規則
- [-] v2.0 疏漏 7 · Paul 在治理體系的明文位置

### 觀察指標（2026-06-25 盤點）

1. 這兩個月新增幾份 ADR（預期 ≤ 2 份）
2. 幾份 ADR 真的被後續 session 引用（預期 ≥ 50%）
3. Chat 還會不會主動發類似 v3.0 的 meta-report（預期：不會）

兩個月後 Paul 重讀 v2.0 / v2.1 兩份報告，用實際數據決定
哪些觀察項目要升級為 ADR，哪些直接永久擱置。
```

---

## 驗證方式

### V1 · INDEX 完整性（★ 用變數不寫死路徑）

```bash
# 用 Step 0.5 決定的變數
ADR_COUNT=$(find "$ADR_DIR" -type f -name "*.md" | grep -iE '(/h[0-9]|/adr-)' | wc -l)
INDEX_ROWS=$(grep -cE '^\| (H[0-9]|\[)' "$INDEX_PATH" 2>/dev/null)
echo "ADR 檔案數: $ADR_COUNT, INDEX 行數: $INDEX_ROWS"
# 兩個數字應該相等（允許 ±1 誤差因為無編號 ADR 可能用 [CON-v0.2] 等短碼）
```

### V2 · INDEX 可用性實測

```bash
grep -i 'memory' "$INDEX_PATH"
grep -i 'session' "$INDEX_PATH"
# 預期：能直接命中相關 ADR 的那幾行
```

### V3 · Branch protection 稽核報告產出

```bash
test -f worklogs/branch-protection-audit-2026-04-25.md && echo "✅ 稽核報告存在"
grep -c '## 補救方案建議' worklogs/branch-protection-audit-2026-04-25.md
# 預期：1
```

### V4 · PENDING.md 擱置記錄落地

```bash
grep -c '觀察期項目' worklogs/PENDING.md
# 預期：≥ 1
grep -cE '^- \[-\] v2.0 疏漏' worklogs/PENDING.md
# 預期：6（v2.0 疏漏 1/3/4/5/6/7 共六項）
```

---

## 注意事項

### ⚠️ 不可逆操作標記

**本次 handoff 沒有任何不可逆操作**，但要注意：

- **不要**自己啟用 branch protection（就算有權限）——那是 Paul 的決策
- **不要**刪除或改寫任何現有 ADR 檔案——INDEX 是新增，不是重整
- **不要**順手把無編號 ADR 改名——先回報，等 Paul 確認

### 🚨 Commit + push 前必須通知 Paul（★ 改為拆 commit）

根據 Paul 的標準工作流 + CLAUDE.md「一個 commit 只做一件事」規則：

1. 改動完成後先 `git status` + `git diff --stat` 列清單
2. 回報給 Paul：「已做完 D1 + D3，準備分兩個 commit + push，確認？」
3. **等 Paul 確認後**再執行

**拆 commit 建議**（一個 commit 只做一件事）：

```bash
# Commit 1: D1 INDEX
git add "$INDEX_PATH"
git commit -m "docs(adr): add INDEX for ADR navigation

- Single-page navigation for H1-H9 + unnumbered ADRs
- Maintenance SOP at bottom: new ADR must update INDEX in same PR
- Derived from: research-governance-gaps-vs-industry-2026-04-25-v2.md"

# Commit 2: D3 稽核 + PENDING 擱置
git add worklogs/branch-protection-audit-2026-04-25.md worklogs/PENDING.md
git commit -m "docs(governance): branch protection audit + park v2.0/v2.1 items

- Audit current main branch protection state vs constitution v0.2 §1
- Three-tier remediation proposal (minimal/medium/heavy)
- Park 6 governance items for 2-month observation (2026-04-25 → 06-25)
- Handoff: code-handoff-adr-index-branch-protection-2026-04-25.md"

# Push 一次
git push
```

兩個 commit 都不涉及共用模組（`worker/src/index.js`、`translator.js`、`BaseLayout.astro` 等），**不需要影響範圍標注**。

### 📌 如果 Step 0 發現 ADR 結構跟預期不符

例如 ADR 沒有統一命名、沒有 Status 欄位、沒有日期——**不要自己補**。

直接在回報中列出差異：

```
⚠️ 實際 ADR 結構與預期不符：
- H3 沒有 Status 欄位
- adr-collaboration-constitution-v0.2 沒有 Hxx 編號
- H7 日期寫在 frontmatter，其他寫在內文

INDEX 已按現狀填寫（Status 空白處標 "?"），
建議 Paul 另起一輪「ADR 格式統一」討論，本次不處理。
```

---

## 回報格式

完成時請回報以下資訊（貼回 Chat 或寫成 cowork-- handoff 給 Cowork 同步 Issue #155）：

```markdown
### 完成回報 · D1 + D3（2026-04-25）

**Step 0.5 決定的路徑**：
- ADR_DIR = ?
- INDEX_PATH = ?

**commit SHA**：
- Commit 1 (D1 INDEX): {SHA 或 "待 Paul 批准"}
- Commit 2 (D3 audit + PENDING): {SHA 或 "待 Paul 批准"}

**狀態**：
- D1 INDEX: ✅ 產出 / ⚠️ 部分產出 / ❌ 阻塞
- D3 Branch protection 稽核: ✅ 完成 / ⚠️ 權限不足 / ❌ 阻塞
- 擱置項記錄: ✅ 已寫入 PENDING.md / ❌ 阻塞

**盤點結果**：
- ADR 總數：N 份
- Accepted: X / Superseded: Y / Draft: Z
- Branch protection 當前狀態：[四選一]

**遇到的阻礙**：（若無就寫「無」）
**決策建議**：（Paul 要做的下一個決定，條列）

**驗證結果**：
- V1 INDEX 完整性：ADR_COUNT = N, INDEX_ROWS = N ✅
- V2 INDEX 可用性：grep 測試 ✅
- V3 稽核報告：worklogs/branch-protection-audit-2026-04-25.md ✅
- V4 PENDING.md 擱置：6 條 `[-]` 記錄 ✅

**後續動作建議**：
- Paul 裁決 branch protection 是否啟用（a/b/c 三選一）
- 若選 (a)，另發 handoff 讓 Code 執行啟用
- 若選 (b)/(c)，本輪結束
```

---

## 本輪 metrics

- **Task Sizing**：M（預估 20-40 分鐘 Code 實際操作時間）
- **建議模型**：Sonnet（盤點 + 文件產出，不需要架構級判斷）
- **涉及 repo**：zarqarwi/paulkuo.tw
- **涉及檔案**：
  - 新增：`$INDEX_PATH`（依 Step 0.5 決定）
  - 新增：`worklogs/branch-protection-audit-2026-04-25.md`
  - 更新：`worklogs/PENDING.md`
- **不涉及**：Cloudflare 部署、KV、Worker、前端 build
- **Token budget**：建議 Code session context 使用 ≤ 50%（本任務不需要大範圍 grep）

---

## Integration Checklist

本次不涉及跨系統整合，略過。

（如果 branch protection 之後 Paul 選 (a) 啟用，下一輪 handoff 才需要）

---

## Cowork 校訂摘要（2026-04-25）

本檔從 Chat 原 handoff 修訂，改動如下：

**🔴 Blocker 修復**：
- B1 · V1 驗證動態化：新增 Step 0.5 決定 `$ADR_DIR` / `$INDEX_PATH` 變數，所有驗證步驟引用變數而非寫死路徑
- B2 · 五符號 schema：擱置項統一用 `[-]`（2026-04-24 立憲），不發明 `[觀察]` 新符號
- B3 · 拆 commit：D1 INDEX 與 D3 稽核+PENDING 分兩個 commit（遵守 CLAUDE.md「一個 commit 只做一件事」）

**🟡 建議修復**：
- S1 · `~/Desktop/...` 改絕對路徑 `/Users/apple/Desktop/01_專案進行中/paulkuo.tw`
- S2 · Step 0.2 find pattern 擴寬為 `*.md` + grep 過濾
- S3 · Step 2.2 產出位置固定為 `worklogs/branch-protection-audit-2026-04-25.md`

**❓ Q1 保守處理**：
Chat 原檔 Step 3 提到「Code 視角 D2（Handoff 生命週期）」「Code 視角 D4（多 session race condition）」兩個擱置項，引用來源為 `code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md`。此檔案 Cowork 未看過實體，來源待 Paul 確認：
- 若檔案實際存在 → Paul 回報後，在 PENDING.md 補兩行 `[-] Code 視角 D2/D4 ...`
- 若是 Chat 腦補模擬 → 不補，保持 6 條擱置項

---

## 產出源頭

這份 handoff 刻意不做 meta-report 的事：

1. 只做兩件事，不做七件
2. 不發明新術語（沒有 handbook/policy-as-code/Solo Chief 這些修辭）
3. 所有動作都對應具體檔案改動或明確決策節點
4. 不預期觸發 v2.2 或下一輪 meta 討論

如果 Code session 在執行過程中發現任何新的「治理改動建議」，**不要自己加進 scope**。記下來回報給 Paul，由 Paul 決定要不要排進觀察期或另開 handoff。

這不是限制 Code 的判斷，是實驗 Cowork v2.1 的建議：**知道什麼時候該停止精煉**。

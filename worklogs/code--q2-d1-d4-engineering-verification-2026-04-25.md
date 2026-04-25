# Q2 D1-D4 工程落地驗證紀錄

**產出日期**：2026-04-25
**產出 session**：Code（Sonnet 4.6）
**上游**：handoff `cowork--c-phase-adr-drafting-2026-04-25` Q2 裁決「補，但限定 D1-D4 落地檢查」
**紀律**：工程稽核風格，不做 framing，不立新 ADR，不命名為 v2.2

---

## D1 · ADR 索引可檢索性

**測試對象**：`docs/governance/ADR-INDEX.md`

- **檢索速度比**：INDEX grep = 70ms / full grep `docs/governance/` = 72ms（比例約 1:1）
  - ⚠️ **無量級優勢**：在 12 個 ADR 的規模下，INDEX 與全域 grep 耗時相當。這是預期內結果——速度優勢在 ADR 增長到 30+ 後才會顯現。當前規模不構成問題，但 INDEX 的價值主要在「結構化導航」不在速度。
- **覆蓋率**：INDEX = 12 行 / 實際 ADR 檔案 = 12 個（11 根目錄 + 1 `_drafts/`）✅
  - 數字相等，INDEX 維護 SOP 未失效
- **新 ADR 同步**：
  - H10（治理研究報告 git 紀律）✅ 在 INDEX 快速導航表有獨立行
  - H11（立法零產量合法收尾）✅ 在 INDEX 快速導航表有獨立行，狀態 Draft（觀察期至 2026-06-25）正確
  - 主題分組 ✅ 已更新
- **結論**：INDEX 機制有效，H10/H11 同步正確。速度優勢在當前規模不顯著，但這是設計預期。

---

## D2 · Handoff 生命週期 archive 完整度

**測試對象**：`handoffs/` 根目錄 + `handoffs/done/`

- **待歸檔**：79 份（handoffs/ 根目錄 .md 全數）/ **已歸檔**：19 份（handoffs/done/）
- **超 7 天未歸檔（依 git commit time）**：25 份
  ```
  AGE=25d: code--event-branding-mazu-today-2026-03-31.md
  AGE=25d: code--mazu-uiux-handoff-2026-03-31.md
  AGE=24d: code--formosa-line-i18n-2026-03-31.md
  AGE=23d: code--formosa-ci-quality-gate-2026-04-02.md
  AGE=21d: code--mazu-seo-aio-faq-2026-04-04.md
  AGE=21d: code--formosa-infra-doc-fix-2026-04-04.md
  AGE=20d: code--formosa-push-image-support-2026-04-05.md
  AGE=19d: cowork--formosa-feedback-triage-2026-04-07.md
  AGE=18d: chat--cron-improvement-plan-2026-04-06.md
  AGE=15d: code--formosa-push-broadcast-debug-2026-04-10.md
  AGE=15d: code--formosa-daily-footprint-ui-2026-04-10.md
  AGE=15d: code--formosa-admin-data-reset-2026-04-10.md
  AGE=11d: code--commit-mcp-register-script-2026-04-14.md
  AGE=11d: code--batch-commit-accumulated-2026-04-14.md
  AGE=11d: code--design-system-doc-commit-2026-04-14.md
  AGE=10d: code--governance-dashboard-redesign-phase-a-2026-04-14.md
  AGE=10d: code--governance-quick-fix-2026-04-14.md
  AGE=10d: code--stash-conflict-resolution-2026-04-15.md
  AGE=9d: code--wiki-batch1.5-concept-extraction-2026-04-16.md
  AGE=9d: code--wiki-batch1-commit-kv-seed-2026-04-16.md
  AGE=9d: code--wiki-column-frontmatter-scanner-2026-04-16.md
  AGE=9d: code--wiki-column-scanner-fixes-2026-04-16.md
  AGE=8d: code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md
  AGE=8d: code--paulkuo.tw-wiki-ingest-kickoff-2026-04-17.md
  （+ code--c-phase-cleanup-2026-04-25.md 無 commit time，今日新增）
  ```
- **抽查閉環（3 份 done/ handoffs）**：
  - `code--adr-index-branch-protection-2026-04-25.md` → worklog-2026-04-25.md L: `歸檔 handoff 本體 (807fac2)` ✅
  - `code--c-phase-rev2-deployment-2026-04-25.md` → worklog 查無引用 ⚠️
  - `code--repo-hygiene-icloud-residue-2026-04-24.md` → worklog 查無引用 ⚠️
  - 抽查結果：**1/3 有 worklog 閉環引用**
- **結論**：archive 機制（done/ 目錄）存在但維護嚴重滯後。25 份超 7 天未歸檔，抽查 3/3 中 2 份無 worklog 閉環引用。H10 §二第三款的 7 天門檻在當前狀態下已大規模超標。**不自行修正（批次歸檔屬 Paul 裁決範圍）。**

---

## D3 · Lint 護欄實測

**測試對象**：`scripts/governance-lint.sh`（H7 ADR）

- **既有 lint 5 項執行結果**：⚠️ **governance-lint.sh 不存在**
  - `find $REPO -name "governance-lint.sh"` → 無輸出
  - H7 ADR（`adr-governance-lint-he-lu-2026-04-25.md`）狀態為 **Accepted**，但腳本本體未實作
  - `scripts/` 中僅有 `skill-schema-lint.sh`（已有）和 `governance-kv-seed.cjs`，無 governance-lint.sh
  - `scripts/install-hooks.sh` 若執行，pre-commit 掛的是尚未存在的 `scripts/governance-lint-pre-commit.sh`

- **pre-commit hook 狀態**：❌ 未安裝（`.git/hooks/pre-commit` 不存在，只有 `.sample`）

- **commit-msg hook 狀態**：✅ 已安裝（跨子專案影響標注，`scripts/commit-msg-hook.sh`）

- **CI governance-scanner.yml**：✅ 存在，但這是 cross-project scanner（KV seed + audit-results），**不是 H7 governance lint**

- **測試一（superseded 缺欄）**：無法執行——腳本不存在，baseline = ❌ 未擋

- **測試二（[影響:] 標注錯位）**：
  - commit-msg hook 的邏輯是「shared file 被改但 message 缺 [影響:]」才攔截
  - 反向測試（message 寫 [影響: Wiki] 但 commit 不含對應檔）：hook **不會攔截**（無此邏輯）
  - baseline = ❌ 此方向未擋

- **測試三（H10 §三第二款 worklog 同 batch 要求 baseline）**：
  - H10 §三第二款規定：research 文件必須與 worklog 同 batch commit
  - 當前 lint 無此檢查；baseline = ❌ 未實作（H10 ADR 雖 Accepted，lint 整合尚在 Phase 2 roadmap）

- **H10 §三第二款 Issue #155 同步可實作性評估**：
  - GitHub MCP 可用工具：`mcp__github__get_issue`（只回傳 body）、`mcp__github__add_issue_comment`、`mcp__github__list_commits`
  - **沒有 list_issue_comments 工具**——無法程式化查詢 commit hash 是否已出現在 Issue #155 comments
  - 替代方案：(a) 人工抽查（當前 H10 §二第二款 SOP）；(b) GitHub Actions workflow 讀 Issue comments API + 比對 commit hash（需額外 workflow 實作）
  - 結論：當前 MCP 工具不足以全自動化，人工抽查是唯一可用路徑

- **結論**：
  - governance-lint.sh **完全未實作**，H7 ADR Accepted 與實際腳本存在間有 gap
  - 5 項 lint 檢查（欄位完整性/F-ID/pillar 白名單/PENDING 五符號/length-budget 時效）當前全部 0 coverage
  - 唯一有效護欄：commit-msg hook（跨子專案影響標注）+ branch protection（force-push 禁止）
  - lint 護欄完整度評分：**1/5 層面有效**（commit-msg hook 覆蓋影響標注，其餘 4 層缺失）

---

## D4 · 多 session race condition 盤點

**獨立稽核檔**：`worklogs/code--multi-session-race-audit-2026-04-25.md`

**摘要**：

- **已知散落實例**：5 條（R1 Cowork 撞車 / R2 CI push race / R3 worklog 並發寫 / R4 index.lock 跨 session / R5 index.lock rebase 中斷）
- **工程暴露面**：git ops（commit/push/pull-rebase 三項中高風險） + 非 git ops（PENDING.md 並發、worklog 並發、多 Cowork 視窗決策撞車）
- **既有緩解機制**：force-push 禁止 ✅ / CI concurrency group ✅ / Cowork 切 Code 本機 SOP ✅ / governance-lint 護欄 ❌
- **結論**：不需新工具，不立 ADR；PENDING.md 並發保護空白列為觀察候選

---

## 完成清單

- [x] D1 索引實測完成
- [x] D2 archive 盤點完成
- [x] D3 lint 實測完成
- [x] D4 race 盤點完成 + 獨立稽核檔產出
- [x] 全部驗證紀錄彙整為本檔
- [ ] worklog 補章四維度（待 Paul commit 後補入 worklog-2026-04-25.md）
- [ ] commit + push（Paul 本機）
- [ ] Issue #155 dashboard 同步 comment

---

## 給 Paul 的 commit oneliner

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw && git add worklogs/code--q2-d1-d4-engineering-verification-2026-04-25.md worklogs/code--multi-session-race-audit-2026-04-25.md && git commit -m "docs(governance): Q2 D1-D4 engineering verification + multi-session race audit [影響: governance]" && git push origin main
```

---

## 主要發現摘要（供 Issue #155 同步）

| 項目 | 狀態 | 說明 |
|------|------|------|
| D1 ADR 索引覆蓋率 | ✅ | 12/12，H10/H11 均已同步 |
| D1 檢索速度優勢 | ⚠️ | 12 ADR 規模下無量級差異，30+ 後才顯現 |
| D2 archive 機制存在 | ✅ | done/ 目錄有效 |
| D2 archive 執行狀況 | ⚠️ | 79 待歸 / 19 已歸 / 25 份超 7 天未歸 |
| D2 閉環引用完整 | ⚠️ | 抽查 1/3 有 worklog 引用 |
| D3 governance-lint.sh | ❌ | H7 Accepted 但腳本未實作 |
| D3 pre-commit hook | ❌ | 未安裝 |
| D3 commit-msg hook | ✅ | 已安裝（跨子專案影響標注） |
| D4 散落實例集中 | ✅ | 5 條實例已集中至稽核檔 |
| D4 既有緩解完整度 | ⚠️ | 4/5 層面有緩解，governance-lint 缺失 |

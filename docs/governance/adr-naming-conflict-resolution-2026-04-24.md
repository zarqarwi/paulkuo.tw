# ADR：A/B/C 命名衝突消歧 — skill 儲存層改描述性命名

> **Status**：Accepted
> **採納日期**：2026-04-24
> **採納者**：Paul（拍板方案 β）
> **起草**：Cowork session（Opus 4.6）
> **前置 ADR**：協作憲法 v0.2（2026-04-19）、`adr-skill-ownership-layer-draft-2026-04-20.md`

---

## Context

paulkuo 治理體系內「A/B/C 層」編號有兩套意義並存，2026-04-24 Cowork 回顧時被明確指出：

### 用法 1（主流，憲法第二條定義）
- **A 層** = repo `.claude/skills/`（正本，SSoT）
- **B 層** = 使用者級 `~/.claude/skills/`（下游 mirror）
- **C 層** = Claude.ai 雲端 Personal Skill（下游 mirror）

出現於：憲法 v0.2、WE rev2.3、速記卡 rev2、CLAUDE.md、session-handoff SKILL.md、`c-layer-snapshot.md`、`frozen-h1-h4-memo-2026-04-23.md`、`adr-constitution-v0.3-implementation-2026-04-20.md` 及多份 handoff/worklog/audit，共 40 個檔案。

### 用法 2（歧異，僅 1 檔）
- **A 層** = repo `.claude/skills/`
- **Cache 層** = Cowork temp（`/var/folders/.../claude-hostloop-plugins/*/skills/`）
- **C 層** = session-handoff 的 adaptation 版本（非 verbatim mirror）

出現於：auto-memory 的 `reference_skill_storage_layers.md`（1 個檔案）。

### 問題

兩套定義下的「C 層」語意不同：
- 用法 1 的 C 層 = Claude.ai 雲端
- 用法 2 的 C 層 = adaptation 版本（物理上存在 cache 目錄）

讀者遇到「C 層」必須判斷當前語境是哪一套，認知負擔複利累積。`adr-skill-ownership-layer-draft-2026-04-20.md` 已指出此議題但未解。

---

## Decision

採納 **β 方案**：

- **三視窗映射**（Code / Cowork / Chat）保留 A / B / C 編號，對應**用法 1**。憲法第二條不動。
- **skill 儲存位置**改用描述性命名：
  - `repo 層`（對應舊「A 層」，指 paulkuo.tw repo `.claude/skills/`）
  - `cache 層`（對應舊「Cache 層」，指 Cowork temp `/var/folders/.../claude-hostloop-plugins/*/skills/`）
  - `cloud 層`（對應舊「C 層 adaptation」，指 session-handoff 在 Claude.ai 的 adaptation 版本）

**衝突源頭改動範圍：僅 `reference_skill_storage_layers.md` 一個檔案。**

---

## Rationale

三維度評分（2026-04-24 Cowork 分析）：

| 維度 | α（A/B/C 專給 skill 儲存） | **β（描述性命名給 skill 儲存）** | γ（全部描述性） |
|---|---|---|---|
| 工程合理性 | 2/5（改憲法，牽動 41 檔） | **5/5（憲法不動，改 1 檔）** | 3/5（工程量最大） |
| 邏輯可驗證性 | 2/5（兩套並存難驗） | **5/5（grep 可自動驗）** | 4/5（漏改難辨） |
| 管理可執行性 | 3/5（仍要記 skill 層 A/B/C） | **5/5（描述性無學習成本）** | 2/5（失去口語簡潔） |
| 總分 | 7/15 | **15/15** | 9/15 |

三維度一致指向 β。核心理由：

1. **憲法穩定性**：憲法第二條是上位法，動它會連鎖影響下游 40 檔。β 完全不改憲法。
2. **改動範圍極小**：衝突源頭只有 1 個 memory 檔，改它就消掉所有衝突。
3. **口語習慣保留**：「C 層凍結」這種短說法在憲法脈絡下語意清楚（= Claude.ai 雲端），無需改口。
4. **未來可驗證**：`grep -n "Cache 層"` 應回傳 0 筆；將來 H7 的 governance-lint.sh 可加入此規則作自動回歸檢測。

---

## Consequences

### 正向
- 憲法 v0.2、CLAUDE.md、WE、速記卡、SKILL.md 等 40 個檔案**無需改動**
- `reference_skill_storage_layers.md` 單檔修改後，體系內 A/B/C 只有一種意義
- Paul 與三個 session 的口語溝通不受影響（「A 層正本 / C 層下游」沿用）
- 未來 governance-lint.sh 可加規則：禁止 `Cache 層` 出現在非 cache-related 脈絡

### 負向 / 需注意
- skill 儲存層脈絡下，必須使用新詞「repo 層 / cache 層 / cloud 層」；若再提「A/B/C 層」指 skill 儲存即為違憲
- 既有 handoff/worklog 歷史紀錄不回溯修改（保留歷史痕跡），讀歷史時仍可能看到舊用法 2
- `adr-skill-ownership-layer-draft-2026-04-20.md` 指出的另一議題（使用者級 skill 歸屬）**未解決**，仍是獨立 draft，不屬本 ADR 範圍

### 回滾路徑
若未來發現 β 方案有未預見的衝突，回滾成本仍低：只需把 `reference_skill_storage_layers.md` 改回舊用法 2，並註銷本 ADR。不會留下難清理的連鎖副作用。

---

## Execution checklist（2026-04-24 Cowork session）

- [x] 起草本 ADR（Status: Accepted）
- [ ] 修改 `reference_skill_storage_layers.md`：「A 層 / Cache 層 / C 層」→「repo 層 / cache 層 / cloud 層」
- [ ] grep 驗收：`Cache 層` 應回傳 0 筆（除本 ADR 的歷史引用段落外）
- [ ] 更新治理架構 artifact 的「編號衝突備註」section
- [ ] 更新 PENDING.md H6 條目標為已解決，附本 ADR 連結
- [ ] 寫入 worklog-2026-04-24.md 三維度紀錄
- [ ] Paul 本機 commit + push（oneliner 由 Cowork 提供）

---

## 參考

- 衝突源頭：`~/Library/Application Support/Claude/local-agent-mode-sessions/.../memory/reference_skill_storage_layers.md`
- 前置討論：`adr-skill-ownership-layer-draft-2026-04-20.md`（指出問題但未解）
- 憲法第二條：`adr-collaboration-constitution-v0.2-2026-04-19.md`
- Cowork 評審摘要：`cowork--governance-architecture-review-2026-04-24.md` A2
- 治理分層架構 artifact：`paulkuo-governance-architecture-2026-04-24`

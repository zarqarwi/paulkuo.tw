# Code Handoff · Q2 D1-D4 工程實況落地檢查

- **產出時間**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6，依 handoff `cowork--c-phase-adr-drafting-2026-04-25` Q2 裁決）
- **目標 session**：Code（建議 Sonnet）
- **任務類型**：工程實況落地檢查（不做 framing 修辭）
- **Status**：Ready for execution
- **上游**：本批次 (c) ADR 階段 Step 1 議題萃取 C2 Reject + Paul Q2 裁決「補但限定 D1-D4 落地檢查」

---

## 0. 開頭警示（執行紀律）

handoff §「已知陷阱 §3」明文：

> 不替 v2.2 補軌（除非 Q2 明確同意）——避免「為補軌而補軌」

Paul Q2 已同意，但**限定範圍**：

> Q2 裁決：「補，但限定 D1-D4 落地檢查」

本 handoff 的紀律：

- ✅ **跑 D1-D4 工程實況落地檢查**（lint 是否擋得住、archive 是否完整、多 session race 散落實例盤點）
- ❌ **不做 framing 修辭調整**（不寫第三輪治理 framing 報告、不重新詮釋 v1.0/v2.0/v2.1、不挑戰 v2.1 §1 GitLab framing 的根本質疑）
- ❌ **不命名為 v2.2**（避免重啟 v2.0 三軌挑戰的修辭設定）

產出格式：**工程驗證紀錄**（類似 `worklogs/branch-protection-audit-2026-04-25.md` 的稽核風格），不是 framing 報告。

---

## 1. 任務範圍（D1-D4 各自落地檢查）

### D1 · ADR 索引可檢索性實測

**Code feedback 原問題**（line 126）：

> ADR 從 H1-H9 成長到 H30+ 後，如何快速找到相關?目前是 grep?有 index 嗎?

**repo 實況確認**：✅ `docs/governance/ADR-INDEX.md` 已存在（commit `cbf81cb`）。

**Code 要做的工程驗證**：

1. **檢索速度實測**：跑下列指令並紀錄耗時
   ```bash
   time grep -E '^\| (H[0-9]|CON|SKL)' docs/governance/ADR-INDEX.md
   time grep -r 'lint' docs/governance/
   ```
   產出：兩種檢索方式的耗時比例（INDEX 應快至少一個量級，否則 INDEX 沒發揮設計價值）

2. **覆蓋率實測**：跑下列指令並比對結果
   ```bash
   # INDEX 行數
   grep -cE '^\| (H[0-9]|CON|SKL)' docs/governance/ADR-INDEX.md
   # 實際 ADR 檔案數
   ls docs/governance/adr-*.md | wc -l
   ```
   產出：兩數應相等。不等代表 INDEX 維護 SOP 失效（ADR-INDEX §四維護 SOP 第 3 條）

3. **新加 ADR 同步驗證**：本批次新加 H10/H11 兩份 Proposed ADR
   - 檢查 ADR-INDEX 「快速導航」表是否有 H10/H11 兩行（應有）
   - 檢查「主題分組」是否更新（應有）
   - 檢查總數是否從 10 → 12（應有）
   - 若發現 INDEX 未更新，紀錄差異 + 不自行修正（INDEX 修改屬 Cowork 範圍）

**驗證紀錄格式**：

```markdown
## D1 · ADR 索引可檢索性

- 檢索速度比：INDEX 0.0Xs / 全 grep 0.YYs（比例 X:Y）
- 覆蓋率：INDEX N 行 vs 實際檔案 M 個（N == M ✅ / N != M ⚠️）
- 新 ADR 同步：H10 ✅/⚠️ H11 ✅/⚠️
- 結論：{INDEX 機制有效 / 需補強什麼}
```

---

### D2 · Handoff 生命週期 archive 完整度

**Code feedback 原問題**：handoffs/ 目錄結構是什麼?有 archive 嗎?

**repo 實況確認**：✅ archive 機制已存在（worklog §3.2 D2 確認）。

**Code 要做的工程驗證**：

1. **archive 完整度盤點**：
   ```bash
   # handoffs/ 根目錄（待歸檔）
   ls -la handoffs/*.md | grep -v done | wc -l
   # handoffs/done/（已歸檔）
   ls -la handoffs/done/*.md 2>/dev/null | wc -l
   ```
   產出：兩數對比

2. **超過 7 天未歸檔的 handoff 清單**（H10 §二第三款的 7 天門檻）：
   ```bash
   find handoffs/ -maxdepth 1 -name '*.md' -type f -mtime +7 -exec ls -la {} \;
   ```
   產出：清單 + 各檔對應的 worklog 引用（grep `worklogs/*.md`）

3. **歸檔規則一致性**：抽查 `handoffs/done/` 3 份隨機檔，確認每份檔在 worklog / Issue #155 有閉環引用
   產出：3 份檔的閉環引用清單（檔名 → worklog 路徑 → Issue comment URL）

**驗證紀錄格式**：

```markdown
## D2 · Handoff 生命週期

- 待歸檔：N 份 / 已歸檔：M 份
- 超 7 天未歸檔：[清單 + 對應 worklog]
- 抽查閉環：3/3 ✅ / 2/3 ⚠️ / ...
- 結論：{archive 機制完整 / 有 N 份待補歸檔}
```

---

### D3 · Immutable ADR 工程基礎（lint 護欄實測）

**Code feedback 原問題**：repo 是 public 嗎?有 branch protection 嗎?

**repo 實況確認**：✅ branch protection 已稽核（`worklogs/branch-protection-audit-2026-04-25.md`，commit `d46ff7f`）。

**Code 要做的新驗證**：lint 護欄（H7 ADR）是否真的擋得住違憲行為。

1. **跑既有 lint** 並紀錄輸出：
   ```bash
   bash scripts/governance-lint.sh
   ```
   產出：lint 5 項檢查的通過/失敗紀錄

2. **手動觸發違憲 commit 測試**（在 sandbox 內，不要 push）：
   - 測試一：嘗試在 commit 中包含 ADR Accepted → Superseded 修改但無 superseded_by 欄位 → 預期 lint 警告
   - 測試二：嘗試在 commit message 加 `[影響: Wiki + 主站]` 但 commit 內容不含 `worker/src/translator.js` → 預期 lint Warning（CLAUDE.md「commit message 強制標注」對照）
   - 測試三：嘗試 commit 一份 `docs/governance/research-foo-2026-04-25.md` 但**未同 batch 加 worklog 引用** → 預期未來 H10 §三 lint Phase 2 增量項應觸發 Warning（當前可能未實作，紀錄 baseline）

3. **H10 §三第二款 24 小時 Issue #155 同步紀律的可實作性評估**
   - 是否有 GitHub MCP 工具可程式化檢查 commit hash 是否在 Issue #155 comment 出現？
   - 若有，提議實作為 lint Phase 2 增量項
   - 若無，紀錄替代方案（人工抽查 / 別的提醒機制）

**驗證紀錄格式**：

```markdown
## D3 · Lint 護欄實測

- 既有 lint 5 項：[通過/失敗各項]
- 測試一（superseded 缺欄）：[預期觸發 / 實際觸發 / 落差]
- 測試二（影響範圍標注錯位）：[同上]
- 測試三（H10 §三第二款 baseline）：[現狀 / 未來 Phase 2 規劃]
- H10 §三第二款 Issue #155 同步可實作性：[評估]
- 結論：{lint 護欄完整度評分 + 缺口清單}
```

---

### D4 · 多 session race condition 散落實例集中盤點

**Code feedback 原問題**：是否有實例?

**repo 實況**：⚠️ 無獨立稽核檔。worklog §3.2 D4 已標明散落實例。

**Code 要做的工程驗證**：

1. **散落實例集中盤點**（產出單一稽核檔 `worklogs/code--multi-session-race-audit-2026-04-25.md`）：
   - `worklogs/code--v5-1-D-cross-cowork-retro-2026-04-18.md` 摘要
   - `worklogs/worklog-2026-04-25.md` 「.git/index.lock 殘留」事件摘要
   - 透過 `git log --grep='race\|lock\|並發\|撞車' --since='2026-03-01'` 找其他相關 commit
   - 透過 `grep -r 'race condition\|index.lock\|cross.session' worklogs/ docs/` 找散落紀錄

2. **race condition 工程暴露面盤點**：
   - 哪些 git 操作有 lock 衝突風險（commit / pull / fetch / push）
   - 哪些非 git 操作有並發風險（多 session 同時改 PENDING.md / TODO.md）
   - 既有緩解機制（force-push 禁止、commit-msg hook、檔案鎖）

3. **不立 ADR 不擴大範圍**：
   - 本任務只盤點散落實例 + 暴露面
   - 不立法、不寫 framing 報告、不提案治理規則
   - 若盤點後發現有具體破洞，在稽核檔末尾寫「建議列入 PENDING.md 觀察期項目」（由 Paul 裁決是否升級）

**產出檔案**：`worklogs/code--multi-session-race-audit-2026-04-25.md`

**驗證紀錄格式**：

```markdown
## D4 · 多 session race condition 盤點

- 已知散落實例：N 條（含 commit hash + 簡述）
- 工程暴露面：[git ops / 非 git ops 清單]
- 既有緩解機制：[盤點現況]
- 觀察建議：[列 PENDING.md 候選 / 無建議]
- 結論：{是否需 ADR / 是否需新工具 / 還是純散落紀錄即可}
```

---

## 2. 完成標準

- [ ] D1 索引實測完成 + 驗證紀錄寫入
- [ ] D2 archive 盤點完成 + 驗證紀錄寫入
- [ ] D3 lint 實測完成 + 驗證紀錄寫入
- [ ] D4 race 盤點完成 + 獨立稽核檔產出
- [ ] 全部驗證紀錄統一彙整為 `worklogs/code--q2-d1-d4-engineering-verification-2026-04-25.md`（不是 v2.2，是工程稽核檔）
- [ ] 對應 worklog 補章四維度（H8 格式）
- [ ] commit + push 走 Paul 本機（憲法第二條 + memory `feedback_oneliner_for_paul_terminal`）
- [ ] Issue #155 dashboard 同步 comment（H10 §二第二款，雖 H10 仍 Proposed 但本批次自願套用）

---

## 3. 不做的事（明確邊界）

依 Paul Q2 裁決 + handoff §「已知陷阱」：

1. **不寫 v2.2**——本任務產出是工程稽核檔，不是 framing 報告
2. **不挑戰 v2.0/v2.1 任一條結論**——repo 中四份報告的事實衝突不在本任務範圍
3. **不立新 ADR**——若盤點發現破洞，紀錄到 PENDING.md 候選不立法
4. **不擴大檢查範圍**——只跑 D1-D4，不順便做 D5/D6 之類延伸
5. **不做修辭優化**——驗證紀錄是工程稽核風格不是文學作品

---

## 4. 源頭事實清單（F-ID）

| F-ID | 路徑 / URL | 用途 |
|---|---|---|
| F1 | `docs/governance/code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md` | D1-D4 議題原始來源 |
| F2 | `worklogs/worklog-2026-04-25-governance-exploration.md` §3.2 | D1-D4 各條 repo 實況確認 |
| F3 | `docs/governance/ADR-INDEX.md` | D1 索引測試對象 |
| F4 | `handoffs/done/` 目錄 + `handoffs/` 根目錄 | D2 archive 盤點對象 |
| F5 | `scripts/governance-lint.sh` + `worklogs/branch-protection-audit-2026-04-25.md` | D3 lint + branch protection 對象 |
| F6 | `worklogs/code--v5-1-D-cross-cowork-retro-2026-04-18.md` | D4 race condition 散落實例 |
| F7 | `docs/governance/adr-governance-research-git-discipline-2026-04-25.md`（H10） | D3 §三第二款 lint Phase 2 規劃對象（仍 Proposed） |
| F8 | https://github.com/zarqarwi/paulkuo.tw/issues/155 | Issue dashboard 同步目的地 |

---

## 5. 已知陷阱

1. **lint 還沒實作 H10 §三檢查**：H10 仍 Proposed，§三第二款的 lint Phase 2 增量項當前未實作。D3 測試三的「預期觸發」目前必為 false——紀錄 baseline 即可，不要 fail 整個檢查
2. **handoff 7 天未歸檔的計時起點**：用 `mtime` 還是「最後一次 commit 時間」？建議用 `git log --format="%cI" -1 -- <file>` 取 commit time 比 mtime 可靠（mtime 在 sandbox mount 不準）
3. **GitHub MCP 對 Issue #155 comment 的查詢限制**：MCP `get_issue` 只回傳 body，comments 需要另一個 endpoint。D3 第三項評估前確認可用工具
4. **D4 race 盤點不要包山包海**：只列已知散落實例 + 工程暴露面，不要寫 framing 章節（例：「為什麼會有 race condition」「對治理的影響」這類段落屬修辭）
5. **commit oneliner 走 Paul 本機**：sandbox 寫不到 `.git/`，commit/push 必須整理成單行給 Paul 跑

---

## 6. 給下一輪 Code session 的提示

worklog `worklog-2026-04-25-governance-exploration.md` §0 「開頭警示」+ 附錄 A「核心分工原則」是這次三步走的紀律核心：

> 方向性判斷 = Paul；程式 / 資料整理 / 快速消化 = Claude（Chat / Cowork / Code）。
> 唯一可信的事實源是 repo + worklog + GitHub Issue + handoff 檔案。
> 資料如果不在系統 log 裡，就是系統優化機會，不是用人腦補。

D1-D4 都是「資料是否在系統 log 裡」的工程驗證。如果驗證發現資料不在 log 裡，提議補資料；不要替它「補敘事」。

---

**handoff 產出者**：Cowork session（Sonnet 4.6）
**對應任務**：(c) ADR 階段 Q2 補軌
**下一步**：Paul 開 Code session，餵此 handoff 給 Code 執行

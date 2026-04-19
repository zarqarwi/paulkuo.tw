# Handoff: 協作憲法 v0.2 結案三件事（Cowork → Cowork）

> **建議模型**：Opus 4.6 + High
> **Task Size**：M（約 45-60 min）
> **信心等級**：高（所有素材已準備，git HEAD 已鎖定事實）
> **產出位置**：Issue #155 更新、worklog-2026-04-19.md 補完、handoff DONE marker
> **對應 PENDING.md 條目**：「待 Cowork 執行」第一條

---

## 1. 背景

2026-04-19 Cowork session 完成「協作憲法 v0.2」落地——這是 Paul 四視窗協作體系的第一份正式治理憲章，收斂了 skill 四層分裂、空中樓閣、worklog 內部矛盾三個痛點。

結案三步驟因 session 時間考量被 Paul 明示「只先 commit，其餘下輪做」，已於本輪 commit `a6550f9` 完成憲法 ADR + 四層盤點報告進 git HEAD。本 handoff 的任務就是把剩下的三件收尾事做完，讓憲法真的「活過來」（進儀表板、進 worklog、進 handoff DONE flag）。

**為什麼要做完**：憲法寫在 repo 但沒在儀表板出現 = 看不到 = 下輪 session 開場 reconcile 撈不到 = 未來空中樓閣風險。三件收尾事是憲法的「上線驗收」。

---

## 2. Step 0 偵察（先查再改）

動手前按順序跑：

```bash
# 2.1 確認本輪 commit 在 main
cd ~/Desktop/01_專案進行中/paulkuo.tw && git log --oneline -5
# 預期看到 a6550f9 "docs(governance): 落地協作憲法 v0.2 ADR + 四層 skill storage 盤點報告"

# 2.2 確認兩份文件存在且內容完整
ls -la docs/skill-storage-inventory-2026-04-19.md docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md
wc -l docs/skill-storage-inventory-2026-04-19.md docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md
# 預期：inventory ~145 行、ADR ~260 行

# 2.3 讀現行 worklog 4/19 狀態（本輪已寫了什麼）
cat worklogs/worklog-2026-04-19.md
# 預期：55 行左右，本輪 commit 進度應該已在裡面

# 2.4 讀 briefing v2 handoff，決定 DONE 要寫什麼
head -60 handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.md
```

Cowork 透過 GitHub MCP 查 Issue #155 現況：

```
mcp__github__get_issue(owner="zarqarwi", repo="paulkuo.tw", issue_number=155)
```

**重要**：動 Issue body 前，用 `get_issue` 看 `updated_at` 是不是在本輪 commit 之後；如果有人（Code/Chat）在本輪後又改過，先讀最新 body 再 edit，避免覆蓋（skill v4.13 術語定義章節的 race condition 警示）。

---

## 3. 具體步驟

### Step A — Issue #155 新增 governance 里程碑條目（15 min）

用 `mcp__github__get_issue` 拿最新 body，在「📜 Governance / Framework」或類似治理章節的「里程碑」清單（如無則在最頂部新增）加一條：

```markdown
### 2026-04-19 協作憲法 v0.2 落地

commit [`a6550f9`](https://github.com/zarqarwi/paulkuo.tw/commit/a6550f9) — docs(governance)

- 新增 `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`（5 條骨架 + v0.2 修正）
- 新增 `docs/skill-storage-inventory-2026-04-19.md`（四層分裂盤點）
- 憲法骨架：SSoT 原則 / 載體對等原則 / 權責分工原則（含剛性核查） / 記憶層次原則（含同層原子化補款）/ 記憶擴充原則
- 背景：收斂 skill 四層分裂、空中樓閣、worklog 內部矛盾三個結構性痛點
- 延伸排程：v0.3 會處理 session-handoff 雙樹合併、C 層 4 個 skill export schema、commit-msg hook for worklog 內部一致性
```

寫入用 `mcp__github__update_issue`，body 帶完整新版（不是只帶 diff）。

**寫後驗證（護欄 #15）**：寫完立刻再跑一次 `get_issue` 比對 body size + 抓 marker 字串（如 `a6550f9`、`協作憲法 v0.2`）確認在 body 裡。

### Step B — Worklog 4/19 三維度補完（20 min）

讀 `worklogs/worklog-2026-04-19.md`，按 skill v4.13 + CLAUDE.md 規範補三區塊。**必須三維度齊全，任一缺項就補「無」，不能省略。**

```markdown
## 狀態變更
- 協作憲法 v0.2：不存在 → ADR 落地（commit a6550f9，git HEAD 是 SSoT）
- session-handoff 四層分裂認知：模糊 → 正式盤點（7 份實例，不是 briefing v2 假設的 15 份）
- briefing v2 Q1-Q4 路徑：tactical 規劃 → 升級為憲法路徑（Paul 主動 reframe）
- Issue #155 儀表板：governance 區塊新增 2026-04-19 里程碑條目

## 決策紀錄
- 四層 skill storage 採「A=正本 / B+C=下游 mirror / D=N/A」分工：因為 Anthropic 2026-04 官方承認 Custom Skills 不跨 surface 同步，C 層永遠是手動下游，不進協作主幹。影響範圍：session-handoff skill 後續 major version 設計邏輯。
- 憲法第三條採「剛性核查義務」而非全彈性：因為權責遊走條款不夠結構化，Cowork 接 Code 輸出、Code 接 Chat handoff 都需要強制驗證，否則空中樓閣風險仍存在。影響範圍：所有跨 session handoff 模板。
- 憲法第四條補「同層文件原子化」條款：因為 v0.1 只處理跨層矛盾，沒處理同一份文件內部多區塊表達同事實（如 worklog 完成日誌 vs 狀態變更）的原子性要求。影響範圍：worklog / Issue body / ADR 等多區塊文件。
- 記憶擴充（Mem0/Letta/MCP memory server）走 ADR 流程而非直接採用：業界方向未定型，保持實驗期彈性但要求產物集中 `docs/governance/memory-experiments/`。影響範圍：未來外掛記憶評估路徑。
- Stage 3 交付被 scope 縮減為「只 commit」：因為 session 時間有限，結案三件事（Issue #155、worklog、DONE marker）延後到下輪 Cowork。影響範圍：本 handoff 的存在原因。

## 阻礙與踩坑
- briefing v2 假設 skill 在四層共有「15 copies」，實際盤點只有 7 份（1×3 session-handoff 三層分岔 + 4×1 C 層獨點）→ 解決：盤點報告 §2 糾正假設，指出 sandbox mount 是 C 層 mirror 不是 B 層
- Stage 2 原本規劃 Q1-Q4 tactical 討論，Paul 明示 reframe 為「協作憲法」meta 設計 → 解決：當場升維到 4 維度 SSoT 框架（A 狀態 / B 規則 / C 產物 / D 記憶），Q1-Q4 路徑廢棄改走憲法路徑
- 憲法 v0.1 寫完做痛點回測，發現第三條太軟（跨權驗證無強制義務）+ 第四條只處理跨層矛盾不處理同層文件內部矛盾 → 解決：v0.1 → v0.2 bump，Article 3 加剛性條款、Article 4 加同層原子化補款
- Cowork sandbox 寫不到 `.git/`，commit 要 Paul 在本機 Mac Terminal 跑 → 解決：按 feedback memory `feedback_oneliner_for_paul_terminal.md` 規範給 oneliner，Paul 執行 `a6550f9`

## 待辦快照
### 高優先 🔴
- [ ] briefing v2 DONE marker（本 handoff Step C）
### 中優先 🟡
- [ ] v0.3 session-handoff 雙樹合併 + C 層 export schema + commit-msg hook for worklog 原子化
- [ ] docs/governance/working-environment.md 統整進憲法系列
### 低優先 🟢
- [ ] CLAUDE.md 加憲法 reference（v0.2 migration step #2，下下輪）
```

寫完把整份 worklog 推回去（本機用 Edit tool，或 GitHub MCP 的 `create_or_update_file`，但因為檔案短 < 10KB 可直推，**仍要執行護欄 #15 的寫後驗證**）。

### Step C — 產出 briefing v2 DONE marker（10 min）

按 skill v4.13 的檔名規範，建立：

```
handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.DONE.md
```

內容不用太長（15-30 行夠），但要標明以下資訊：

```markdown
# DONE: briefing v2 結案標記

> 原 handoff：`handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.md`
> 結案日期：2026-04-19（執行跨到 04-20 收尾）
> 結案方式：**升維收尾**（非照原規格執行）

## 結案結論

briefing v2 的 Stage 1 照原規格跑完（盤點報告 commit `a6550f9`），
Stage 2 在 Paul 主動 reframe 下升維為「協作憲法 v0.2」meta 設計，
原 Q1-Q4 tactical 路徑廢棄改走憲法路徑（Q1-Q3 的問題本質已被憲法第三條、第四條吸收）。

Stage 3 交付部分拆兩輪：
- 2026-04-19：commit `a6550f9` 兩份文件進 git HEAD
- 2026-04-20（本輪）：Issue #155 里程碑 + worklog 三維度 + 本 DONE marker

## 未被吸收進憲法的 briefing v2 項目

- **Q4 未決**：C 層 4 個獨點 skill 的 export schema（憲法只處理原則，schema 屬 implementation）→ 排入 v0.3
- **Stage 3 延伸任務**：CLAUDE.md 加憲法 reference → 下下輪 Cowork

## 追溯路徑

憲法全文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
盤點報告：`docs/skill-storage-inventory-2026-04-19.md`
commit：`a6550f9`
Issue #155 里程碑條目：本輪 Step A 寫入
```

commit 給 Paul 跑的 oneliner：

```
cd ~/Desktop/01_專案進行中/paulkuo.tw && git add worklogs/worklog-2026-04-19.md handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.DONE.md && git commit -m "$(cat <<'EOF'
docs(governance): 憲法 v0.2 收尾 — worklog 三維度 + briefing v2 DONE marker

- worklog 4/19 補三維度（狀態變更 / 決策紀錄 / 阻礙與踩坑）
- briefing v2 標 DONE：升維收尾，Q1-Q4 被憲法路徑吸收

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## 4. 上游假設（接手方先驗證）

本 handoff 成立的前提，下輪 Cowork 開場先驗這幾條，不對就先回頭處理：

1. **commit `a6550f9` 在 main**：`git log --oneline -5` 能看到即 OK。看不到 = Paul 本輪結束後沒 push，需先追問。
2. **Issue #155 body 沒被 Code/Chat 在本輪後改過**：`get_issue` 看 `updated_at`。如有後續修改，讀新版 body 再合併不是直接覆蓋。
3. **worklog-2026-04-19.md 沒被其他 session 改過**：本輪收尾後 Paul 沒動其他 session 的話應該乾淨。
4. **Paul 目前沒在跑別的 session 同時改同一個 repo**：race condition 防線。

這四條全綠 → 執行 Step A-C。任一條紅 → 停，回報 Paul 決定。

---

## 5. 驗證方式

三步驟執行完後的驗證清單：

| 項目 | 驗證方法 | 驗證來源 |
|------|---------|---------|
| Issue #155 里程碑寫入 | `mcp__github__get_issue` 抓 body，grep `a6550f9` + `協作憲法 v0.2` | 線上 GitHub API |
| Issue #155 body 完整性 | 比對 body byte 長度（寫前 vs 寫後，差值應等於新增的里程碑條目長度 ± 10 bytes） | 線上（護欄 #15） |
| Worklog 三維度完備 | grep `## 狀態變更`、`## 決策紀錄`、`## 阻礙與踩坑` 三個 header | 本機檔案 |
| DONE marker 存在 | `ls handoffs/*.DONE.md` 能看到新檔案 | 本機檔案 |
| Commit 進 main | Paul 跑完 oneliner 回報新 commit SHA，`git log --oneline -3` 看到兩個新 commit（憲法 commit + 收尾 commit） | 本機 git + GitHub MCP |

---

## 6. 注意事項（含不可逆操作標記）

- ⚠️ **Issue #155 body edit 有 race condition 風險**：動之前先 `get_issue`，寫完馬上再 `get_issue` 驗。寫前建議先把現行 body 複製到本機備份（以防萬一要回滾）。
- ⚠️ **護欄 #15（MCP 寫入的寫後驗證）**：Issue body 寫入 + worklog `create_or_update_file` 寫入後都要跑 byte-level 驗證。Issue body 若大於 10KB 接近上限，不要用 `update_issue` 直推整份，拆成先 `get_issue` + 本地字串處理 + 再 `update_issue`——過程中驗每一步 size。
- ⚠️ **護欄 #12（Skill 版本同步閉環）**：本輪沒動 session-handoff skill 版本，不觸發。但若下輪 Cowork 發現憲法 v0.2 與 skill v4.13 有矛盾，要走 skill bump 流程（v4.14+）。
- **不可逆操作**：無（本 handoff 全部是 doc / issue 寫入，最壞情況是 revert commit 或 edit issue body 回滾）
- **Commit 必須 Paul 跑**：sandbox 寫不到 `.git/`（feedback `feedback_oneliner_for_paul_terminal.md`）

---

## 7. 信心等級

**高**。

理由：
- 所有輸入（憲法 v0.2 ADR、盤點報告、briefing v2 內容、commit SHA）都已鎖在 git HEAD 或 handoff 裡，下輪 Cowork 一開場就能讀到完整 context
- Step A-C 是純文件工作，沒有線上 API / Worker / Deploy 等動態環節
- 三維度 worklog 的內容已在本 handoff §3 Step B 完整草擬好，下輪只要按規範格式貼進去即可
- 唯一變數是 Issue #155 在本輪結束後是否被其他 session 動過（race condition），§4 上游假設已列為開場先驗

風險點：若 Paul 忘記跑本輪 commit oneliner，`a6550f9` 不會進 main，下輪開場 §4 assumption 1 直接紅燈——但這個風險前置到 §4 開場驗證擋住了，不會滑下去。

---

## 8. Integration Checklist

本次工作涉及的系統 / 檔案：

- [x] **Git HEAD**：本輪新增兩份 docs（已在 a6550f9）。下輪新增 worklog 補完 + DONE marker（Step C oneliner commit）
- [ ] **Issue #155**：governance 里程碑區塊新增一則條目（Step A）
- [ ] **worklogs/worklog-2026-04-19.md**：三維度補完（Step B）
- [ ] **handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.DONE.md**：新檔案（Step C）
- [ ] **PENDING.md**：本輪已追加「待 Cowork 執行」第一條，下輪做完後刪除或標 `[x]`

**沒有 API endpoint 新增**，護欄 #13 不適用。

**沒有跨 repo 部署**，護欄 #14 不適用。

**有 MCP write 操作**（Issue #155 update + worklog 可能走 create_or_update_file），護欄 #15 全程適用——三處寫入都要寫後驗證。

**共用檔案影響**：worklog / Issue 不算共用模組，`docs/shared-file-impact-map.md` 不觸發。

---

## 結案條件（做完下輪可刪 PENDING 條目）

- [ ] Issue #155 里程碑條目寫入 + 寫後驗證通過
- [ ] worklog-2026-04-19.md 三維度補完 + commit 進 main
- [ ] DONE marker 檔案存在 + commit 進 main
- [ ] Exit Gate Checklist 全部 ✅（按 skill v4.13 格式跑一次）
- [ ] PENDING.md「待 Cowork 執行」第一條標 `[x]` 或刪除

做完這五項 = 協作憲法 v0.2 完全落地，下下輪可以開始 v0.3 工作（session-handoff 雙樹合併、C 層 export schema、worklog 原子化 hook）。

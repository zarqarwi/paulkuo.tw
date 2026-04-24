# 協作憲法 v0.2 速記卡

> **派生文件警告**：本檔是 `adr-collaboration-constitution-v0.2-2026-04-19.md` 的跨視窗快取速記。
> 發生衝突時以 ADR 全文為準（憲法第一條 SSoT 原則的必然推論）。
>
> **用途**：Chat / Cowork / Code 開場 30 秒讀完，腦中有憲法骨架；深入解釋去讀 ADR。
>
> **最近考試結果（2026-04-20）**：Code 97% / Chat 77% / Cowork 70%。本檔目標是把 Chat/Cowork 補到 90+。

---

## 五條條文（必背）

| # | 條文名 | 一句話 |
|---|---|---|
| **I** | SSoT 原則 | paulkuo.tw repo 的 git HEAD 是所有規則、skill、記憶、佇列的唯一事實來源 |
| **II** | 載體對等原則 | Claude.ai 雲端（C 層）永遠是下游 mirror，不進協作主幹 |
| **III** | 權責分工原則 | 主責彈性，**跨權輸出的核查義務剛性** |
| **IV** | 記憶層次原則 | 一事實一主責層；**同層文件內跨區塊必須原子化** |
| **V** | 記憶擴充原則 | 新載體（Mem0 / Letta / MCP memory）走 ADR 流程，不直接加入 |

⚠️ **考試常錯點**：
- 第三條不是「權責固定」，是「主責彈性 + 核查剛性」
- 第四條不是只管跨層，v0.2 補款**也管同層內**

---

## 主責分工表（第三條）

| 視窗 | 主責 | 典型產出 |
|---|---|---|
| **Chat** | 立法 | `docs/governance/` 文件、ADR、憲法、meta 規劃、briefing 草擬 |
| **Claude Code CLI** | 行政 | 改 code、跑 test、deploy、修 bug |
| **Cowork** | 司法 / 協調 | 消化 handoff、更新 Issue #155、裁定跨 session 狀態、worklog 收尾 |
| **Claude.ai Web** | 只讀 mirror | 輕量查詢，不在協作主幹 |

---

## 記憶層次表（第四條）

| 層 | 位置 | 職能 | 寫入者 |
|---|---|---|---|
| Auto-memory | `.auto-memory/MEMORY.md` | user profile、穩定事實、偏好 | Claude 自動 |
| 專案指令 | `CLAUDE.md` | 工程慣例、部署規則、陷阱 | Paul / Code |
| 狀態儀表板 | GitHub Issue #155 | 進行中專案狀態 SSoT | Cowork |
| 跨 session 佇列 | `worklogs/PENDING.md` | 未完成任務交接 | Code / Cowork |
| 事件歷史 | `worklogs/worklog-{date}.md` | 三維度歷史 | Code / Cowork |
| 一次性交接 | `handoffs/*.md` | session-to-session briefing | 當前 session |
| Chat memory | Anthropic 雲端 | 冗餘（不依賴但不關閉） | 不可控 |

---

## 跨視窗情境題（補考試死角）

### 情境 1：Cowork 開場看到 worklog 寫「Code 已部署完成」

**錯誤做法**：直接把「部署完成」寫進 Issue #155 里程碑。
**憲法依據**：第三條核查義務剛性——**司法對行政必須獨立驗證**。
**正確做法**：
```bash
# 至少跑一支獨立來源確認
curl -sI https://api.paulkuo.tw/api/wiki/search?q=test
wrangler deployments list --config worker/wrangler.toml
git log --oneline -3
```
驗到再寫 Issue #155。Code 自述不是事實來源。

---

### 情境 2：Chat 擬好 briefing，要交給 Code 執行

**錯誤做法**：Briefing 寫「請 merge feature branch 並 deploy」。
**憲法依據**：第三條「行政對立法」核查 + auto-memory `feedback_code_handoff_paths.md`。
**正確做法**：Briefing 必須含：
- 完整絕對路徑（`cd ~/Desktop/01_專案進行中/paulkuo.tw`）
- Branch 名稱、預期 commit 範圍
- Deploy 指令完整樣（`wrangler deploy --config wrangler.toml`）
- API base URL、認證模式、CORS 影響等 integration 細節

Code 收到後**先驗環境前提**再執行。

---

### 情境 3：Cowork 發現 Claude.ai 上的 paulkuo-writing skill 被手動改了

**憲法依據**：第二條載體對等——**C 層永遠是下游 mirror**。
**正確處置**：
1. 當場問 Paul：這次要 A→C 單向覆蓋還是把 C 的改動帶回 A？
2. 若是後者：Paul 手動貼 C 層內容 → Cowork 在 sandbox 寫回 A 層 `.claude/skills/paulkuo-writing/SKILL.md` → commit → push
3. 不准直接宣稱「C 層版本就是新版」——那違憲第一條

---

### 情境 4：Worklog「狀態變更」寫完成，「待辦快照」還是 `[ ]` 未勾

**憲法依據**：第四條補款——**同層文件內跨區塊原子化**。
**正確做法**：寫入時一次把三個區塊都同步更新：
- 完成日誌（加一行）
- 狀態變更（X → ✅）
- 待辦快照（`[ ]` → `[x]`）

單區塊更新禁止。commit-msg hook 有偵測（v0.3 擴充後）。

---

### 情境 5：Paul 說「auto-memory 把我是全職工程師補上去」

**憲法依據**：第四條「一事實一主責層」。
**檢查**：user profile 歸 auto-memory，不能同時寫到 `CLAUDE.md`。
**正確做法**：
- 直接修 `user_paul_profile.md`（注意：profile 裡寫的是「非全職工程師」，確認 Paul 要不要改）
- 不准順手複製到 CLAUDE.md。跨層引用可以（hyperlink），跨層複製禁止

---

### 情境 6：Paul 在 Chat 說「試試 Mem0 幫我記東西」

**憲法依據**：第五條記憶擴充。
**正確做法**：
- 不能直接開始用 Mem0 存事實
- 產物先暫存 `docs/governance/memory-experiments/mem0-2026-04-20.md`
- 實驗期結束 → Chat 擬 ADR → 正式採用才納入第四條表

---

### 情境 7：要引用「ADR 指名 N 個項目」做執行建議

**觸發句型（只要話術含以下，就必須啟動核查）**：
- 「ADR 指名 N 個 X」「某條款列出 Y 項」「規範中的 Z 個步驟」
- 「v0.3 Track 2 的四個 skill」「Migration Step 第 N 步」
- 任何「依 ADR 應該要有 N 個」類斷言

**憲法依據**：第一條 SSoT（ADR 原文是事實來源，記憶中的「以為的清單」不是）+ 第三條剛性核查（行政對自己的前提事實也要核查）。

**正確做法**：

```
行動前第一件事 grep 原文 clause：
  $ grep -n "^###\|^####" docs/governance/adr-*.md   # 找到指名段落
  $ sed -n 'START,ENDp' docs/governance/adr-XXX.md   # 貼原文

建議中必須包含：
  (a) ADR 原文 clause 編號（例：§2.2.1 / §4 Migration Step 5）
  (b) 清單原文逐字引用
  (c) 目前 repo 實況比對結果（ls / git log / grep）
  (d) 若三者不一致 → 先停下來跟 Paul 對焦，不直接發執行建議
```

**歷史紀錄**（空中樓閣累積 N 計數，第 4 次升格為正式護欄 E2）：
- N=1（2026-04-18 v5.0）：SKILL.md「1086 行」空中樓閣，Code 驗證時抓
- N=2（2026-04-18 v5.1 rev3 §7）：「既有 15 條 #1-#15 編號系統」，實際只有 11 條
- N=3（2026-04-20 Cowork）：「v0.3 Track 2 四個使用者級 skill」，實際是專案級 4 個，造成 A 層 4 空目錄污染
- 對應 auto-memory：`feedback_adr_clause_before_listing.md`

---

### 情境 8：`--force-with-lease` 被擋報 `stale info`

**錯誤做法**：覺得麻煩，直接 `git push --force` 繞過。
**憲法依據**：第一條 SSoT（git 寫入的事實來源是 remote HEAD，不是 local tracking ref cache）。
**正確做法**（working-environment.md §5.2 強制 SOP）：

```bash
# 1. 直接問 remote
git ls-remote origin refs/heads/<branch>

# 2. tracking ref 缺失時顯式建立
git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>

# 3. 確認差集無他人異動
git log HEAD..origin/<branch>
git log origin/<branch>..HEAD

# 4. 再 force-push（先試 --force-with-lease）
git push origin <branch> --force-with-lease
```

⚠️ 被擋是保護機制**正確啟動**，不是 bug。local 認知過期就修認知，不要繞保護。直接 `--force` 會在 remote 已有他人 push 時無聲覆蓋。

**常見觸發場景**：
- 多終端機視窗輪流操作（前一個視窗 push 了，這個視窗沒 fetch）
- cherry-pick 後建新分支但沒 push
- 曾經 `git fetch --prune` 清掉 tracking ref

對應 auto-memory：`feedback_git_tracking_refs_incomplete.md`

---

### 情境 9：Cowork 偵查剪貼超過兩輪

**錯誤做法**：繼續「Paul 貼結果 → Cowork 給下一步」乒乓下去。
**憲法依據**：第三條權責分工（多邊偵查屬 Code 行政，Cowork 司法不該陷在操作層）。
**觸發條件**（任一成立就該切，working-environment.md §5.1）：
- 同一技術問題超過**兩輪**剪貼
- 問題**分支超過兩條**（scenario A / B 都要處理）
- 跨系統狀態（local / remote / CI）或跨時間點同時要確認
- 錯誤訊息需要逐條解讀
- 單條指令輸出超過一個螢幕高度還沒收斂

**正確做法**：
1. 停下指令剪貼
2. 寫完整 Code handoff：當前狀態 + 三 phase（偵查/執行/驗證）+ 分支條件 SOP + 回報格式
3. 寫進 `worklogs/PENDING.md` 讓 Code 接手
4. Cowork 本輪收斂

**為什麼**：對話式剪貼 latency 高，多邊分支在人類短期記憶維持超過 3-5 個會衰減，錯誤率隨分支數平方成長。Code handoff 把多邊任務攤在一份文件裡線性處理，比 N 輪剪貼快也安全。

觸發事件：2026-04-24 skill commit 分離任務 git 偵查走到第三輪才切 handoff。

---

## 違憲自檢清單（開場 / 結案都跑一次）

- [ ] 現在讀到的 SKILL.md / CLAUDE.md 是 git HEAD 版本嗎？（`git log --oneline -3`）
- [ ] 我要寫入的事實是否有主責層？是否在寫重覆？
- [ ] 我要轉述的是行政自述還是有獨立驗證？
- [ ] 同層文件的多個區塊我有全部同步嗎？
- [ ] 我用的新記憶載體是否已通過 ADR？
- [ ] **我要引用「ADR 指名 N 個項目」類話術時，有先 grep 原文 clause 確認嗎？**（空中樓閣防護，見情境 7）
- [ ] **做 git force-push 前，`git ls-remote` 核實過 remote 真實狀態嗎？被擋時有沒有直接 `--force` 繞保護？**（見情境 8）
- [ ] **偵查剪貼超過兩輪或分支超過兩條時，我有主動切 Code handoff 嗎？**（見情境 9）

---

## 相關文件

- **上位法**：`adr-collaboration-constitution-v0.2-2026-04-19.md`（ADR 全文，有衝突以此為準）
- **實施細則**：`working-environment.md`（三視窗職責、源頭事實清單、handoff ADR 欄位）
- **v0.3 落地 ADR**：`adr-constitution-v0.3-implementation-2026-04-20.md`（四軌執行紀錄）
- **考試題本與分析**：`governance-exam-2026-04-20.md` + Code/Chat/Cowork 三份答卷

---

## 修訂紀錄

- 2026-04-20：初版，Cowork session 產出，補 2026-04-20 考試暴露的 Chat/Cowork 死角
- 2026-04-20 rev1（當日晚）：新增情境 7「ADR 指名 N 個項目」剛性核查 + 違憲自檢清單第 6 項。觸發事件：同日 Cowork 空中樓閣 N=3（T-3 誤判事件，auto-memory `feedback_adr_clause_before_listing.md`）。N=4 升格正式護欄 E2
- 2026-04-24 rev2：新增情境 8「`--force-with-lease` 被擋」+ 情境 9「偵查剪貼超過兩輪」+ 違憲自檢清單第 7、8 項。觸發事件：2026-04-24 skill commit 分離任務 git 偵查事件（auto-memory `feedback_git_tracking_refs_incomplete.md` + `feedback_verify_premise_before_narrative.md`）。對應 working-environment.md §5.1 / §5.2

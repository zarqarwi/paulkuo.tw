# Cowork Handoff — 2026-04-24 Git 偵查事件衍生的治理待辦

> **建議模型**：Opus 4.6（治理判斷 + 條文編寫）
> **前置 session**：`dfd22e26-89b0-4ee4-9738-6d714b5ea040`（skill SSoT 整併 + session-handoff v5.7 + PR #184/#185）
> **產出去向**：Cowork 司法（`working-environment.md` 實施細則）
> **不動工**：憲法主文（v0.2）；這兩項都屬於實施細則層
> **初版修正**：檔名保留 `icloud-git-incident` 方便追溯，但實際跟 iCloud 無關（詳見下方背景）。

---

## 背景（為什麼有這份 handoff）

2026-04-24 這輪主軸完成了：

- PR #184 fix(acp): GraphQL commits_6m observability
- PR #185 feat(skills): Cowork cache sync v1 + session-handoff v5.7
- 新記憶 `feedback_git_tracking_refs_incomplete.md`（tracking refs 不完整時的核實 SOP）
- 新記憶 `feedback_verify_premise_before_narrative.md`（症狀到敘事之間要驗證前提）

**過程中暴露兩個治理題目**，當時決定不即時處理（免得稀釋主軸），寫成這份 handoff 讓下一輪接著消化：

**重要校正**：這輪事件最初誤判為「iCloud 同步 .git/ 造成 refs 不完整」，實際上 Paul 只有一台 Mac，是多終端機視窗的 fetch state 不同步造成的普通 git 行為。這個誤判本身已經衍生出第三條記憶（症狀到敘事的驗證前提規則）。原本 handoff 裡的「項目 1：iCloud repo 搬家 ADR」已刪除——不存在的問題。

---

## 待處理項目

### 項目 A — 🟡 憲法第一條實施細則補強：Git SSoT 在哪裡

**現況**

憲法第一條「SSoT 原則」規範 A 層 repo 是正本。但 git 操作的 SSoT 實際上是 **GitHub remote**，不是任何一個終端機視窗看到的 local `.git/`。

這次事件的本質：某個終端機視窗的 local refs 比 remote 狀態舊（其他視窗已 push 但這個視窗沒 fetch），`--force-with-lease` 的 lease 計算基於過期資訊所以被擋。擋下來是**對的保護**，不是 bug——真正該做的是修復 local 認知，不是繞過保護。

**要寫的條文**

在 `docs/governance/working-environment.md` 新增一節：

> **Git 狀態的 SSoT 規則**
>
> 所有 git 寫入操作（push、force-push、rebase onto origin、分支刪除）以 **GitHub remote** 為唯一可信源。任何單一終端機視窗看到的 local `refs/remotes/origin/` 都可能不完整或過期。
>
> 觸發場景：
> - `--force-with-lease` 被擋報 stale info
> - `git branch -r` 看起來不完整
> - 分支存在於 local 但不確定 remote 狀態
> - 多個終端機視窗輪流操作同一個 repo
>
> 強制 SOP：
> 1. `git ls-remote origin refs/heads/<branch>` 直接問 remote（繞過 tracking ref）
> 2. 如果 tracking ref 缺失，用顯式 refspec 補建：`git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`
> 3. `git log HEAD..origin/<branch>` 確認差集無他人異動
> 4. 才進行 force-push（先試 `--force-with-lease`，擋下來再考慮 `--force`）
>
> **不要繞過 `--force-with-lease` 的保護機制直接 `--force`。** 被擋表示 local 認知過期，修認知不修保護。

**產出去向**

Cowork 司法可以直接進 `working-environment.md`（這是實施細則不是憲法主文）。寫進去之後：
- 更新 `docs/governance/constitution-v0.2-quick-reference.md` 新增一個情境舉例
- PENDING.md 標記完成

**優先度理由**

這項最好處理——問題清楚、規則明確、已有現成 SOP 可抄（記憶 `feedback_git_tracking_refs_incomplete.md`）。

---

### 項目 B — 🟢 多邊偵查任務的模式切換閾值規則

**現況**

2026-04-24 這輪，git 偵查走到第三輪剪貼 Paul 才提醒「該停、該切 handoff 給 Code」。本質上是 Cowork 當時沒察覺「這個任務已經超出對話式剪貼能處理的複雜度」。

Paul 原話：「一次性的指令剪貼我可以，但是來回除錯偵查會讓事情沒效率且容易出錯。而且人類的記憶能力不擅長處理這種多邊分岔出去的任務」。

**要寫的規則**

在 `working-environment.md` 新增一節「多邊偵查任務的切換閾值」：

> **何時該從剪貼乒乓切到 Code handoff**
>
> 出現**任一**條件就該切：
>
> - 同一個技術問題超過兩輪「Paul 貼結果 → Cowork 給下一步指令」
> - 問題分支超過兩條（例如 scenario A / scenario B 都要處理）
> - 跨系統狀態（local / remote / CI）、跨時間點（過去狀態 vs 現在狀態）
> - 回報內容包含錯誤訊息需要逐條解讀
>
> 切換動作：
>
> 1. 停下指令剪貼，寫完整 Code handoff
> 2. handoff 包含：當前理解的狀態、三 phase（偵查/執行/驗證）、分支條件下的 SOP、回報格式
> 3. 寫進 `worklogs/PENDING.md` 讓 Code 接手
>
> **為什麼**：對話式剪貼適合線性任務；多邊分岔任務超出人類短期記憶的整合能力，Cowork 有責任主動識別並切模式。

**產出去向**

同項目 A——寫進 `working-environment.md`，更新 quick-reference。

**優先度理由**

這條最軟、最新、最依賴具體案例。趁記憶還熱寫下來，晚一週就寫不出同樣具體的版本。

---

## 執行順序建議

1. **先做項目 B**（記憶最熱，文字最快）
2. **再做項目 A**（規則清楚，有現成 SOP）

兩項完成後 close 本 handoff，PENDING.md 對應項目標 `[x]`。

---

## 不要做的事

- **不要動憲法主文（v0.2）**：這兩項都是實施細則層，動主文要走 Chat 立法程序。
- **不要動 skill（A 層 session-handoff）**：這些規則是治理文件層，不是 skill 觸發規則層。
- **不要試圖把兩項綁成一個大 ADR**：兩項獨立、產出都進 `working-environment.md` 的不同小節即可。
- **不要重提 iCloud 搬家**：原本初版 handoff 有這項，已確認前提不成立（只有一台 Mac），刪除。

---

## 參考連結

- 觸發事件 worklog：`worklogs/worklog-2026-04-24.md`
- 偵查 handoff（Code 執行用）：`handoffs/code--skill-commit-split-investigation-2026-04-24.md`
- 正確診斷記憶：`~/Library/.../memory/feedback_git_tracking_refs_incomplete.md`
- 誤判教訓記憶：`~/Library/.../memory/feedback_verify_premise_before_narrative.md`
- 憲法主文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
- 實施細則：`docs/governance/working-environment.md`
- 跨視窗速記：`docs/governance/constitution-v0.2-quick-reference.md`

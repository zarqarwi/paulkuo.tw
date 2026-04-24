---
adr_id: adr-cloud-sync-protocol-2026-04-25
title: Cloud 層同步協議（A → C Personal Skill）
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-chat-factual-query-limit-2026-04-25
related_issues: []
ratified_by: Chat-Opus-4.7
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# Cloud 層同步協議（A → C Personal Skill）

## Context

### 立法動機

協作憲法 v0.2 第二條規定「Claude.ai 雲端（cloud 層）永遠是 repo 層的下游 mirror」。但憲法通過後，**沒有任何配套的同步機制**——既沒有規定誰按按鈕、多久同步一次、如何驗證對齊，也沒有規定在 cloud 層與 repo 層脫鉤時要怎麼止血。結果是條文「存在但不運作」，實質上是死條文。

### 歷史脈絡：2026-04-17 起的脫鉤事件

- **2026-04-17**：session-handoff skill 在 repo 層推進到 v5.0，cloud 層沿用 v4.13
- **2026-04-18～04-19**：repo 層經歷 v5.1 / v5.2 / v5.3 三輪 minor bump（護欄 C4/C5 邊界定義固化、Handoff 接手方 MCP 路徑優化）
- **2026-04-20**：repo 層來到 v5.5 / v5.6（剛性核查正式護欄 + R1 觸發句型擴充類別 B），cloud 層仍停在 v4.13
- **2026-04-24**：repo 層與 cloud 層脫鉤滿 7 天，跨 8 個查詢點拿到 5 種答案（見 session-handoff §9 N=1 事件）

7 天是目前觀察到的最長脫鉤期。過程中**沒有任何自動告警**，每一次「repo 到新版」的訊號靠 Cowork 在下一個 session 偶然發現並口頭提醒 Paul。這不是治理，是碰運氣。

### 質性證據：人治而非法治

目前的隱性流程：

1. Code 推新版到 repo
2. 下一次 Cowork session 開場時，**如果** Cowork 記得檢查，**如果** Cowork 看到 snapshot 落後，才會提醒 Paul
3. Paul **如果** 有時間，到 Claude Desktop App → Customize → Skills 手動貼新內容
4. Paul **如果** 記得，回報「已同步」給 Cowork 更新 snapshot

四個「如果」疊起來，任何一環斷鏈就脫鉤。2026-04-17～04-24 的事件就是第 2 環斷鏈（Cowork 沒主動檢查）。

### 與 H2 共享的結構前提

Chat 的精確事實查詢結構性上限（H2 ADR）與本 ADR 共享同一個結構前提：**Chat 無法 Read、cloud 層脫鉤 → Chat 讀到的是舊版 snapshot → 用舊 snapshot 當一手事實引用 → 治理決策建立在失效基礎上**。

H2 處理「Chat 不該答什麼」，本 ADR 處理「cloud 層怎麼不脫鉤到讓 Chat 讀到的 snapshot 失效」。兩者必須同步立法，單獨一個都不夠：

- 只有 H2 沒有 H1 → Chat 會拒答，但 cloud 層仍永遠脫鉤，snapshot 是無人維護的化石
- 只有 H1 沒有 H2 → cloud 層同步得再勤快，Chat 仍會把偶然讀到的舊版當源頭

### 上位法依據

- **憲法 v0.2 第一條 SSoT**：repo git HEAD 是唯一事實來源——這是本 ADR 所有規則的基準，cloud 層永遠是下游。
- **憲法 v0.2 第二條 載體對等**：cloud 層永遠是下游 mirror，不進協作主幹——本 ADR 是第二條的實施細則，讓「下游 mirror」不只是名稱，而是有實際維護流程的結構。
- **憲法 v0.2 第三條 權責分工**：主責彈性，核查義務剛性——本 ADR §一的責任鏈每一環都有獨立驗證點，不信單方自述。

### 已有的參考資料

- `docs/governance/c-layer-snapshot.md`：cloud 層 session-handoff 的人工快照，目前對齊 repo 層 v5.6。內含「版本回答規則」：被問版本時回答「cloud 層 v1.0，對齊 repo 層 v5.6」；若 repo 層超過對齊版本 ≥ 2 minor，cloud 層會主動提示「可能需要更新」。本 ADR 把這條現存規則升格為成文責任鏈。

### 明確排除（治理限制承認）

Claude.ai Personal Skill 的同步 API 至今（2026-04）**不存在**。Anthropic 官方文件（`platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`）明確寫「Skills uploaded to Claude.ai must be separately uploaded」。因此本 ADR 無法完全消除「Paul 忘記同步」的殘留風險——這不是設計缺陷，是外部 API 邊界。本 ADR 做的是把殘留風險控制到治理體系可以接受的水位。

---

## Decision

### 第一條 · 同步協議責任鏈

repo 層 → cloud 層的同步流程由五環責任鏈構成，每一環有明確交付品與核查點：

```
┌─────────────┐   commit +    ┌──────────────┐
│  Code       │ ─────push───▶ │  repo 層     │
│  (行政)     │                │  (SSoT)      │
└─────────────┘                └───────┬──────┘
                                       │
                            下次 Cowork session 開場
                                       ▼
┌────────────────────────────────────────────┐
│  Cowork 開場檢查 (司法)                    │
│  1. git log --oneline -20 on skill path    │
│  2. 比對 c-layer-snapshot.md 對齊版本      │
│  3. 若 repo 有新版 → 繼續下一環；否則退出  │
└───────────────────┬────────────────────────┘
                    │ 發現落後
                    ▼
┌────────────────────────────────────────────┐
│  Cowork 通知 Paul                          │
│  產出：version bump 摘要 + diff highlights │
│  形式：worklog 條目 + 本輪對話提醒         │
└───────────────────┬────────────────────────┘
                    ▼
┌────────────────────────────────────────────┐
│  Paul 手動更新 cloud 層                    │
│  1. Claude Desktop App → Customize → Skills│
│  2. 貼新版 skill 內容                      │
│  3. 保存                                   │
└───────────────────┬────────────────────────┘
                    ▼
┌────────────────────────────────────────────┐
│  Paul 回報 + Cowork 更新 snapshot          │
│  1. Paul 回報「已同步到 vX.Y」             │
│  2. Cowork 更新 c-layer-snapshot.md:       │
│     - 版本標記 vX.Y                        │
│     - last-synced 時間戳                   │
│     - 本段 skill 內容 diff                 │
│  3. commit + push                          │
└────────────────────────────────────────────┘
```

**責任邊界**：

| 環 | 主責 | 交付品 | 核查點 |
|---|---|---|---|
| 1. Code commit/push | Code | commit hash + push 確認 | git push origin main 回傳 up-to-date 或新 HEAD |
| 2. Cowork 開場檢查 | Cowork | git log 摘要 + snapshot 對齊結論 | 獨立跑 `git log` 而非憑 Paul 或 Code 自述（憲法第三條剛性核查） |
| 3. Cowork 通知 | Cowork | worklog 條目 + 對話提醒 | 通知內容含具體 version bump + diff |
| 4. Paul 更新 cloud | Paul | cloud 層實際貼上新內容 | Paul 自行執行，無程式化驗證 |
| 5. Paul 回報 + snapshot 更新 | Paul + Cowork | snapshot 檔案更新 + commit | Cowork commit 前驗 Paul 宣稱版本與 snapshot 內容一致 |

### 第二條 · 同步頻率

不是每一次 commit 都觸發同步——頻率太高會壓垮 Paul 的手動環節。採三級觸發：

| 變更類型 | 同步觸發 | 等待期上限 |
|---|---|---|
| **Patch**（措辭微調、typo 修正、格式美化） | 不觸發 | — |
| **Minor** bump（護欄增刪、流程步驟增減、區塊新增移除） | **累積 2 版**才觸發 | 4 週內至少 1 次（防止累積但每版很小導致永遠不觸發） |
| **Major** bump（框架結構性重組、核心架構改變） | 立即觸發 | — |

**累積 2 版的理由**：session-handoff 大多數 minor bump 都是護欄微調（見 v4.7～v4.13），單一版不足以改變 Chat 讀 cloud 層的判斷力；累積 2 版後改動量通常已跨越「值得手動同步」的門檻。但也不能無限累積，設 4 週時效防慢性脫鉤。

**判定版本類型**：由 commit message 的 `[bump: patch|minor|major]` 標記決定（如果 commit message 未標，預設 minor，保守觸發）。H7 ADR 第一條的檢查 5 項未來可擴充此欄位為結構檢查。

### 第三條 · 驗證方式

Cowork 驗證 cloud 層是否對齊 repo 層時，**不**採逐字 diff——cloud 層是 adaptation，本來就跟 repo 層不逐字相同（針對 Chat 能力裁切）。採「版本號比對 + 關鍵條款 spot check」二階段：

1. **第一階段 · 版本號比對**：
   - cloud 層 snapshot 的 `對齊 repo 層 vX.Y` 欄位，與 repo 層 CHANGELOG 最新版本比對
   - 差 0 版 → 通過
   - 差 ≥ 2 minor → 觸發第一條責任鏈（cloud 層需更新）
   - 差 1 minor + 4 週內 → 暫時通過，排入下次檢查
   - 差 1 minor + 超過 4 週 → 觸發責任鏈

2. **第二階段 · 關鍵條款 spot check**（當第一階段觸發責任鏈時）：
   - 隨機抽 repo 層最新版的 3 條關鍵條款（例：護欄清單、四動機、三錨點、剛性核查觸發句型白名單）
   - 檢查 cloud 層 snapshot 是否已含該條款（或明示不含的 adaptation 標注）
   - 3 條皆對齊 → 同步完成，更新 snapshot 對齊版本
   - 任一不對齊 → Paul 需補更新 cloud 層內容

**為什麼不用 verbatim diff**：cloud 層 adaptation 有意識地為 Chat 裁切（例：移除 Code-only 指令、簡化 Cowork 專用流程），strict diff 會產出大量 false positive，讓 Cowork 花大量時間分辨「這是 adaptation 還是漏同步」。spot check 抓真漏接，同時承認 adaptation 的存在。

### 第四條 · Chat 側止血條款

Chat 讀到 c-layer-snapshot 時，**必須**執行以下檢查，不是建議而是義務：

1. 讀 snapshot 的 `對齊 repo 層 vX.Y` 欄位（每份 c-layer snapshot 都應在檔案頭部標注此欄位）
2. 若有 GitHub MCP，嘗試讀 repo 層最新 CHANGELOG，取最新版本號
3. 比對：
   - 差 0 版或 1 minor：本輪 Chat 正常使用 snapshot
   - 差 ≥ 2 minor：**Chat 必須主動提示 Paul**：「本次對話使用的 cloud 層 snapshot 對齊 v{A}，repo 層已到 v{B}，差距 ≥ 2 minor。本次裁決/討論可能受影響，建議先同步 cloud 層或改走 Cowork 讀 repo 層」
4. 若 GitHub MCP 不可用（沒裝、Chat 側環境限制等），Chat 不能假裝沒差距——依 H2 第三條模板說「我無法確認 cloud 層對齊狀態」

**「必須」的強制性來源**：憲法第三條跨權核查義務剛性條款。Chat 讀 cloud 層 snapshot 是「接收下游」，要產出「立法建議」是「跨權輸出」，輸出前核查屬剛性義務，不可退讓為建議。

### 第五條 · 與 H2 口徑統一

cloud 層的「版本回答規則」必須引用 H2 ADR（`adr-chat-factual-query-limit-2026-04-25.md`）編號做雙向綁定，避免邏輯衝突：

- 當 Paul 在 Chat 裡問「session-handoff 目前第幾版？」
  - cloud 層 snapshot 現行規則：回答「cloud 層 v1.0，對齊 repo 層 v5.6」
  - H2 規則：屬觸發句型 #1（版本號），必須走拒答模板
  - **口徑統一**：cloud 層 snapshot 的「版本回答規則」升級為「cloud 層的對齊版本可以答（穩定事實），但 repo 層當前最新版屬 H2 管轄，走 H2 §三模板」

具體執行：
- cloud 層 snapshot 檔頭部加一行：「本 snapshot 對齊 repo 層 vX.Y（見本檔 §對齊欄位）。若被問 repo 層當下最新版，依 `adr-chat-factual-query-limit-2026-04-25.md` §三拒答。」
- H2 第二條例外清單第 2 項「對話內已出現事實」涵蓋 snapshot 對齊欄位（它是 cloud 層內置事實，不是即時查詢結果）

### 第六條 · 殘留風險與重新評估觸發

本 ADR **承認**以下殘留風險：

1. **Paul 忘記更新 cloud 層**：責任鏈第 4 環純人工，Paul 若忙碌或忘記，cloud 層仍會脫鉤。
2. **Paul 更新時貼錯內容**：責任鏈第 4 環缺輸出端驗證（Cowork 在第 5 環只驗 snapshot 檔案，不驗 Claude Desktop App 裡 Paul 真的貼了什麼）。
3. **Anthropic 改 Claude Desktop App 介面**：若 Skills 編輯路徑改版，本 ADR 第一條第 4 環的 SOP 需要重新校準。

**重新評估觸發條件**：

- **Claude.ai Personal Skill 開放 API** → 重寫本 ADR，責任鏈第 4-5 環改為程式化同步
- **cloud 層連續 3 次觸發但未在期限內同步** → 代表 Paul 手動環節不可持續，需評估替代方案（cloud 層凍結？改用 Claude Code 專案 skill 取代 Personal Skill？）
- **H2 ADR 觸發句型白名單擴充** → 本 ADR 第五條口徑定義可能需要更新
- **憲法 v0.2 升級到 v0.3** → 第二條載體對等若有修訂，本 ADR 須回應

---

## Consequences

### 正面影響

- **憲法第二條從死條文變活條文**：有責任鏈、有頻率、有驗證、有止血。「cloud 層是下游 mirror」不再是口號，而是可以跑的流程。
- **脫鉤事件有早期偵測**：第一條第 2 環的 Cowork 開場檢查，把脫鉤訊號從「事後痛感」前移到「下次 Cowork 開場 ≤ 7 天」。實戰上 Cowork 週頻率約 2-3 次，脫鉤時效縮到 2-3 天。
- **Chat 讀舊 snapshot 有止血**：第四條強制提示讓 Paul 知道「這次對話可能受影響」，決策失誤前有 circuit breaker。
- **為其他跨載體 mirror 立模板**：Chat memory、`.auto-memory/` 跨視窗不對稱（H3 問題）未來需要類似同步協議時，本 ADR 的五環責任鏈可直接借用骨架。

### 負面影響

- **Cowork 開場負擔增加**：每次 Cowork session 開場多一個檢查項（版本號比對）。估算每次增加 30-60 秒。Cowork 本身已有開場 checklist（憲法第四條、五符號 schema），再疊一個不至於太重，但長期累積需觀察。
- **Paul 手動負擔仍在**：第四環「Paul 手動貼 cloud 層」沒被消除，只是減少觸發次數（從「每次 minor」降到「累積 2 minor」）。Paul 若一週內有 3 次 minor bump，仍需手動同步 1 次，無可避免直到 Anthropic 開 API。
- **spot check 可能漏真差距**：第三條第二階段只抽 3 條，有機率錯過真正重要的未對齊條款。緩解措施：下次責任鏈觸發時換一組 3 條抽樣；長期累積漏網率可評估是否改成全量 diff。

### 中性觀察

- **本 ADR 不解決 C 層 4 個獨點 skill**：paulkuo-writing、paulkuo-social、formosa-feedback、organize-downloads 這 4 個只住 cloud 層、沒有 repo 層副本的 skill，屬憲法第二條違憲（憲法 §3.3 遷移步驟第 5 項，v0.3 排程）。本 ADR 只處理「A 層有副本、需要同步到 C 層」的流程，不處理「A 層沒副本」的前置 export。
- **本 ADR 只規範 session-handoff skill**：現況 cloud 層的正式治理 mirror 只有 session-handoff 一個（`c-layer-snapshot.md`）。若未來 cloud 層加更多 mirror（例：憲法速記卡 cloud 版），本 ADR 的責任鏈可複用，但 `c-layer-snapshot.md` 這個特定檔案名要重新抽象。這屬範圍擴充問題，不在本 ADR 範圍。
- **本 ADR 與 H7 的交集**：H7 ADR 第一條檢查 5 項之一是「length-budget-status.md 時效檢查」，未來可擴充為「c-layer-snapshot 對齊版本 + last-synced 時效檢查」。這屬 H7 的 Phase 4+ 未規劃項目，不在本 ADR 範圍，但預留擴充空間。

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2 第二條「載體對等」：本 ADR 是第二條的實施細則，沒有上位法就沒有本條。
- `adr-chat-factual-query-limit-2026-04-25.md` §三 + §二：本 ADR 第四條 Chat 止血與第五條口徑統一直接 cite H2，H2 先立法本 ADR 才能鎖住 Chat 側行為。

### 被依賴的 ADR（這些 ADR 需要我存在）

- 無（本 ADR 是責任鏈協議，不被其他 ADR 直接引用）。未來 H7 若擴充為包含 c-layer-snapshot 時效檢查，將依賴本 ADR。

### 相關但不依賴的檔案

- `docs/governance/c-layer-snapshot.md`：cloud 層 session-handoff 的人工快照。本 ADR 第一條第 2 環、第三條第一階段、第四條 Chat 止血、第五條口徑統一都圍繞此檔運作。本 ADR 立法後，該檔的「版本回答規則」區塊要更新為引用本 ADR + H2。
- `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md` §3.3「遷移步驟」第 5 項「C 層 4 個獨點 skill export 到 A 層（individual ADR）」：範圍外但相關——cloud 層 4 個獨點 skill 待 individual ADR，export 完成後可進入本 ADR 的責任鏈管轄。
- `.claude/skills/session-handoff/SKILL.md` §16「Maintenance」（目前佔位）：本 ADR 通過後，該佔位段落應更新為「詳見 `adr-cloud-sync-protocol-2026-04-25.md`」的 hyperlink。

---

## Appendix

### 附錄 A · 責任鏈失效模式清單

下列是責任鏈五環的已知失效模式與緩解：

| 失效環 | 失效描述 | 緩解 |
|---|---|---|
| 第 1 環 | Code 推 commit 但未 push | commit-msg hook 在未 push 時拒絕 commit（憲法第三條「Code 完成三態宣告」護欄 #14 實施） |
| 第 2 環 | Cowork 開場忘了跑檢查 | H7 governance-lint.sh Phase 3+ 考慮擴充為「Cowork 開場 checklist 強制項」 |
| 第 2 環 | Cowork 跑了檢查但判斷落後閾值錯誤（例：把 minor 看成 patch） | 把第二條的三級觸發表寫進 session-handoff §16 Maintenance，Cowork 開場直接查表 |
| 第 3 環 | Cowork 通知但 Paul 沒看到 | worklog 條目加 Paul 可見標記 + 下次 Cowork session 主動複查未響應通知 |
| 第 4 環 | Paul 忘記更新 | 超過 4 週無回報時，Cowork 強制升級為「高優通知」+ Issue #155 顯示紅色狀態 |
| 第 4 環 | Paul 貼錯內容 | 第五環 Cowork 更新 snapshot 時做 spot check，3 條關鍵條款中任一漏掉代表貼錯 |
| 第 5 環 | Cowork 更新 snapshot 但未 commit | session-handoff 結案 checklist 加「snapshot 更新 = 需 commit」檢查項 |

### 附錄 B · 版本差距判定範例

假設 repo 層 CHANGELOG 最新版本為 v5.8，cloud 層 snapshot 對齊 v5.6：

- 差距 = 5.8 - 5.6 = 0.2 minor = 2 個 minor 版
- 依第二條：累積 2 minor → **觸發**責任鏈
- 依第三條第一階段：差 ≥ 2 minor → 進入第二階段 spot check
- 依第四條：Chat 若本輪讀到此 snapshot，必須主動提示「本次對話 cloud 層 v5.6 vs repo 層 v5.8，差距 2 minor，受影響」

反例：repo 層 v5.7 vs cloud 層 v5.6
- 差距 1 minor + 時間 < 4 週 → 第二條第一階段「暫時通過」，不觸發責任鏈
- 第四條仍需 Chat 提示，但措辭可降級為「差 1 minor，一般裁決可接受，若涉及該 minor 新增內容請切 Cowork 核實」

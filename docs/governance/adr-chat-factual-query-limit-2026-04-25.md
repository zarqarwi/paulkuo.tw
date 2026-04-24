---
adr_id: adr-chat-factual-query-limit-2026-04-25
title: Chat 精確事實查詢結構性上限（含 A3 併入）
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-cloud-sync-protocol-2026-04-25
  - adr-governance-lint-he-lu-2026-04-25
related_issues: []
ratified_by: Chat-Opus-4.7
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# Chat 精確事實查詢結構性上限（含 A3 併入）

## Context

### 立法動機

Chat session 在 paulkuo.tw 協作體系內擔任「立法部門」（憲法 v0.2 第三條主責分工表），但 Chat 本身具備**結構性弱點**：
沒有 Read 工具、沒有 terminal、無法觸達 repo 層事實。遇到「版本號、行數、commit hash、清單項數、時序狀態、檔案存在性」等精確事實問題時，Chat 既沒有可靠的查證途徑，也往往不自覺地把二手資訊（來自 Cowork artifact / handoff 拷貝的數字）當成一手事實引用。

這不是 bug，是能力邊界的結構事實。本 ADR 把「Chat 遇到精確事實應該拒答並引導」從散落的 session-handoff §9 剛性核查規則，升格為憲法實施細則層級的成文立法，並明文禁止 Chat 以二手來源充當源頭事實。

### 量化證據：治理考試（2026-04-20）

三視窗同題考試結果：

| 視窗 | 分數 | 主要失分類型 |
|---|---|---|
| Code | 97% | 近滿分，可直接 Read/grep 源頭 |
| Chat | 77% | 精確事實類問題連鎖失分（version、line count、clause count） |
| Cowork | 70% | sandbox mirror 過期造成的二手事實誤判 |

Chat 77% 的水位在「精確事實類」題目上特別明顯——即使憲法原文條列類問題 Chat 能答得好，只要題目問「第幾版 / 多少行 / 幾個 clause」就會倒向記憶拼湊，分數打折。

### 質性證據：2026-04-24 Cowork 發現

Chat 在起草 `cowork--governance-architecture-review-2026-04-24.md` 的「來源事實（F-ID）」段落時，引用了下列數字：

- F-skill-v5.6：session-handoff SKILL.md **639 行**
- F-cheatsheet-rev2：速記卡 rev2 **238 行**
- F-constitution-v0.2：憲法 **299 行**

這些數字全部從 Cowork artifact 拷貝而來，Chat 沒有任何機制可以直接 Read 檔案驗證。Chat 在寫 handoff 時**沒有意識到自己在引用二手數字**，把它當成「源頭事實」命名為 F-ID。這本身就是本 ADR 要處理的現象——Chat 不只「可能答錯」精確事實，而是「系統性分不清一手與二手」。

### 歷史脈絡：A3 併入

2026-04-24 Cowork 治理回顧 artifact 的 A3 段原建議「Paul 每次開 Chat 對話先貼 skill 摘要」，嘗試用人工手動注入繞過 Chat 的 Read 缺失。該方案於同日被否決，理由是違反 auto-memory `feedback_passive_vs_active_defense.md` 記載的「被動文件不等於主動防線」：

- 依賴 Paul 每次手動貼，Paul 會忘
- 就算貼了，Chat 長對話 context drift 仍會把精確事實漂移成記憶拼湊
- 這是典型治標式工作流建議，auto-memory `feedback_reject_symptomatic_workflow_suggestions.md` 記為 A3 案例

否決 A3 後，問題回到「如何從 Chat 側直接處理」——於是併入本 ADR 的立法本體：讓 Chat **reflexively** 在遇到觸發句型時先宣告自己不可靠，而不是試著答、答錯、事後收拾。

### 上位法依據

- **憲法 v0.2 第一條 SSoT**：repo git HEAD 是唯一事實來源，任何載體讀到的版本低於 HEAD 視為失效。Chat 物理上無法讀 HEAD，因此對「需要以 HEAD 為準」的精確事實，本質上就是失效載體。
- **憲法 v0.2 第三條權責分工**：主責彈性，**跨權輸出的核查義務剛性**。Chat 往下游產出立法文件時，涉及精確事實的片段需要剛性核查才能離開 Chat 視窗。

---

## Decision

### 第一條 · 觸發句型白名單

Chat 遇到下列六類問題時，**必須**啟動拒答流程（先用第三條模板回應，再依第二條確認是否屬於例外）：

1. **版本號**：「SKILL.md 目前第幾版？」「session-handoff skill 是 v5 還 v6？」「憲法 v0.2 最新 minor 是多少？」
2. **行數**：「SKILL.md 幾行？」「速記卡現在多長？」「CLAUDE.md 有沒有越 200 行？」
3. **Commit hash**：「最後一個 commit 是什麼 hash？」「那個修 bug 的 commit 是哪一個？」
4. **清單項數**：「ADR 指名幾個 skill 要 migrate？」「護欄清單有幾條？」「PENDING.md 有幾項 pending？」
5. **時序狀態**：「某檔案最後一次更新是什麼時候？」「這個待辦是幾天前加的？」「H7 裁決是哪一天？」
6. **檔案存在性**：「這個檔案目前在不在 repo？」「某個 script 現在有沒有 `--pillar` flag？」「某 API endpoint 還活著嗎？」

觸發標準採**最寬認定**：任何對「當下 repo 真實狀態」的定量或存在性提問都落入白名單，即使話術不完全匹配上面的樣句。

### 第二條 · 例外清單

下列四類**不**觸發拒答，Chat 可直接回答：

1. **憲法五條條文本身**：五條條文的名稱與一句話摘要是穩定事實，由 Chat 在立法時產生，不隨 repo 狀態飄移。
2. **對話內已出現的事實**：同一對話中 Cowork/Code 已經引用過並標記為 F-ID 的數字，Chat 可在對話內沿用（但必須標注「承 F-ID」，不能重新包裝成源頭）。
3. **公開穩定外部事實**：官方文件條文（例：Anthropic skill 200 行軟上限出自 `code.claude.com/docs/en/skills`）、法規條文、已發表學術論文編號。這類事實不隨 paulkuo.tw repo 狀態改變。
4. **原則非可變量**：「憲法第三條講權責分工」這類「是什麼」的陳述，而非「有幾條」「多長」的計量。

### 第三條 · 標準回應模板

觸發第一條時，Chat **不試著回答**，直接回覆以下模板（可視語境微調標點，但三項資訊必須齊備）：

> 此問題涉及 paulkuo.tw repo 的精確事實（{類別，例：版本號／行數／清單項數}），Chat 結構性不可靠（依 `adr-chat-factual-query-limit-2026-04-25.md` §一）。
>
> 建議查證路徑：
> - **Cowork**（推薦）：`wc -l <path>` / `cat <path>` / `grep -n '<pattern>' <path>`
> - **Code**：直接在 session 內 Read 檔案或跑 git 指令
> - **GitHub MCP 繞道**：`get_file_contents`，但大於 1000 行會被截斷（見 session-handoff §8 護欄 B1）
>
> 核實後如需我協助後續判斷，請把指令輸出貼回對話。

**三項資訊**：
1. 明示「Chat 結構性不可靠」+ 本 ADR 編號（建立知識錨點）
2. 給出**具體指令**（不只「去 Cowork 查」，而是 `wc -l ...` 可複製貼上）
3. 指定「核實後怎麼繼續」（讓 Paul 不會卡在「驗完要幹嘛」）

### 第四條 · 裁決層級特殊規則

Chat 進行立法（起草 ADR、修憲提案、裁決 handoff）時，遇到精確事實相關決策，**額外適用**以下三條強化規則：

1. **結構性立法優先原則**：立規則不立具體數字。例：H5 裁決立「超軟上限 15% 觸發拆分 ADR」，不立「CLAUDE.md 現在幾行該不該拆」——後者是執行層，交 Cowork 核實後決定。
2. **二手引用強制標注**：必須引用精確事實時，標「二手，待核實」而非「已確認」。任何從 Cowork artifact / handoff 拷貝的數字，不得重新包裝成 F-ID 當源頭。
3. **絕不拿 Cowork artifact 當源頭**：Cowork artifact 本身是 Cowork session 的產出，引用它的數字是二手的二手（Cowork 也是從 sandbox 讀，sandbox 可能過期）。Chat 看到數字要問「這個 F-ID 的驗證指令是什麼」，驗證鏈斷了的就不能當源頭。

### 第五條 · GitHub MCP 的地位

Chat 有 GitHub MCP `get_file_contents` 可作為精確事實的**繞道查證**，但須明文承認以下限制：

1. **繞道，非原生能力**：GitHub MCP 讀到的是 GitHub 遠端 HEAD，對「local 未 commit 變更」完全看不到。遇到「Cowork 剛寫了但還沒 commit」的狀態會產生錯覺。
2. **大檔案截斷風險**：約 20KB 或 1000 行以上會截斷（session-handoff B1 護欄），讀長檔案不能斷言完整性。
3. **大檔警告 user**：Chat 用 GitHub MCP 讀超過 800 行檔案時，必須在回覆中標「本查詢可能受截斷影響」。
4. **不取代 H1 cloud 同步**：GitHub MCP 是 Chat 查 repo 事實的應急通道，不是解決「Chat 整體事實觸達困難」的結構方案。H1 ADR（cloud sync protocol）才是解決 cloud 層長期脫鉤的治理方案；兩者分工，不替代。

### 第六條 · 寫入位置與同步鎖

本 ADR 為規則源頭（SSoT）。**三處同步引用**位置：

1. `docs/governance/working-environment.md`：未來 WE rev2.4+ 在 §1.3「禁止事項清單」Chat 段落新增一條指向本 ADR。
2. `docs/governance/constitution-v0.2-quick-reference.md`：速記卡情境 10「Chat 被問精確事實」，引用本 ADR §一 + §三模板。
3. `.claude/skills/session-handoff/SKILL.md`：A 層 skill 的「Chat 能力邊界與否決條件」（§7）一欄「精確事實斷言」該列指向本 ADR 編號；C 層 snapshot 同步更新。

三處為**引用非複製**（憲法第四條「一事實一主責層」推論）：條文異動時改本 ADR，三處引用點在下次 SSoT 變更後下游重驗（護欄 C5）時更新。

---

## Consequences

### 正面影響

- **Chat 77% 水位有明確 ceiling 突破路徑**：精確事實類失分從「考試變數」變成「憲法他律範圍外」，Chat 分數評估可以剝離這類題目，把 Chat 能力評估聚焦在真正由 Chat 負責的立法/決策品質。
- **二手當一手的現象被鎖死**：第四條明文禁止「Cowork artifact → Chat F-ID」的包裝路徑，避免未來再出現 2026-04-24 那種「Chat 引用 639 / 238 / 299 但無法驗證」的治理文件。
- **回應模板降低 Paul 的溝通成本**：Paul 不用每次手動提醒「Chat 你不知道」，Chat 自己會宣告並給指令。
- **為 H1/H7 提供鎖點**：H1 ADR §五「cloud 層版本回答規則」、H7 ADR §六「prompt-time vs commit-time 邊界」都引用本 ADR 作為 Chat 側規則的基準。

### 負面影響

- **Chat 在輕度對話會顯得拘謹**：有時 Paul 只是隨口問「那份文件大概幾行？」——嚴格執行會讓 Chat 回覆模板，比直接答「大概 200 多行」累贅。這是接受的成本，因為「隨口答」和「正式引用」的界線機器難辨，寧可一律走正式通道。
- **模板重複使用可能讓對話機械化**：第三條模板會重複出現，可能給 Paul 帶來「制式回應疲勞」。未來可觀察是否需要加「簡短版」（例如 Paul 閒聊時模板可壓到一句話），這屬第七條重新評估範圍。
- **例外清單邊界會有灰色案例**：「憲法五條條文本身」vs「憲法第三條的主責有幾個」看起來像例外但其實不是——前者是條文名稱、後者是清單項數，後者落在白名單。Chat 需要具體語境判斷，可能偶爾判錯。依靠 auto-memory 累積邊緣案例處理。

### 中性觀察

- **H2 立法後 Chat 分數不會自動提升**：本 ADR 不讓 Chat「答得更對」，而是讓 Chat「正確地不答」。考試分數統計方式若不改，Chat 仍在這類題目拿 0 分（因為拒答 ≠ 正確）。若要反映新政策，考試評分應把「正確觸發拒答」也列為滿分。這屬治理考試框架的附帶調整，不在本 ADR 範圍。
- **本 ADR 是 H7 governance-lint.sh 的前置**：H7 第六條「prompt-time vs commit-time 邊界」明示 H2 屬 prompt-time（對話行為層），H7 屬 commit-time（檔案結構層），兩者互補不重疊。H2 本身不接 lint 腳本——對話層的規則沒辦法用 bash 檢查，只能靠 Chat 自律 + Paul 糾錯回饋。

### 第七條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條適用範圍：

1. Anthropic 開放 Claude.ai 的 skill API，讓 Chat 能以結構化方式取得 repo metadata（部分消解結構性弱點）
2. Chat 的模型能力升級到能穩定區分一手 vs 二手引用（例：模型內建「引用完整性檢查」）
3. 連續兩個月出現三次以上「Chat 嚴格執行本 ADR 但反而造成協作卡頓」的反例
4. 新的憲法修訂版本將 Chat 職責範圍調整到不再需要精確事實查詢

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2「載體對等原則」+ §2「權責分工原則」：本 ADR 是這兩條的實施細則，沒有上位法就沒有本條。

### 被依賴的 ADR（這些 ADR 需要我存在）

- `adr-cloud-sync-protocol-2026-04-25.md` §五「與 H2 口徑統一」：cloud 層 snapshot 的版本回答規則引用本 ADR §三模板，確保 Chat 被問「cloud 層 vs repo 層哪個較新」時不走舊 snapshot 直接硬答。
- `adr-governance-lint-he-lu-2026-04-25.md` §六「與 H2 邊界明文」：H7 只管 commit-time 結構檢查，H2 管 prompt-time 對話行為；兩者互補不重疊，H7 文本必須 cite 本 ADR 劃清界線。

### 相關但不依賴的檔案

- `docs/governance/working-environment.md` §1.3「禁止事項清單」Chat 段落：待 WE rev2.4+ 新增一條指向本 ADR（本 ADR 不動 WE，交 H5 觸發的下一輪 Cowork 順勢補）。
- `docs/governance/constitution-v0.2-quick-reference.md` 情境 10（預計新增）：速記卡的「Chat 被問精確事實」情境題，引用本 ADR §一白名單 + §三模板。
- `.claude/skills/session-handoff/SKILL.md` §7「Chat 能力邊界」、§9「剛性核查」：本 ADR 把這兩節的散落規則升格為成文立法，未來 SKILL.md 下一次 minor bump 可把這兩節改為「詳見 ADR」的 hyperlink。
- `docs/governance/c-layer-snapshot.md` §「版本回答規則」：cloud 層 snapshot 的現行條款要跟本 ADR 口徑對齊（由 H1 ADR §五負責鎖定）。
- `auto-memory/project_chat_secondhand_citation_blind_spot.md`：記載 2026-04-24 Chat 引用二手當一手的案例，本 ADR Context 的實證基礎。

---

## Appendix

### 附錄 A · 歷史案例：Chat 三模型同答 v4.7 事件（2026-04-20）

治理考試中，Chat 三個模型（Opus 4.7 / Sonnet 4.6 / Opus 4.6）被問「session-handoff SKILL.md 目前第幾版」時**全部答 v4.7**。同時：

- Code 答 v5.5（正確，已 commit）
- Cowork 答 v4.13（部分正確，指向 cloud 層對齊版本）
- Chat ×3 答 v4.7（錯誤，疑似雲端記憶殘影）

這是本 ADR 立法的最強單一事件證據：三個 Chat 模型**獨立地**給出相同錯誤答案，代表錯誤來源不是隨機模型幻覺，而是共同的底層記憶源被污染。依本 ADR 第一條，「SKILL.md 目前第幾版」屬觸發句型 #1（版本號），未來 Chat 遇到必須走第三條模板拒答。

紀錄於 session-handoff SKILL.md §9「剛性核查 - 新類別（跨載體精確事實分裂）- N=1」。

### 附錄 B · 觸發句型辨識 FAQ

**Q：Paul 問「那個功能上週做完了吧？」算不算精確事實？**
A：算，屬時序狀態類（第一條第 5 項）。Chat 應走第三條模板。Paul 可能覺得是閒聊，但 Chat 無法精確判斷「上週」對應哪個 commit。正確回應：「上週的完成狀態我無法精確核實，建議 Cowork 查 `git log --since=...`」

**Q：Paul 問「為什麼我們要有憲法第三條？」**
A：不算，屬原則陳述（第二條例外清單第 4 項）。Chat 可直接引用憲法 v0.2 第三條原文與歷史脈絡回答。

**Q：Chat 起草 H9 ADR 時要寫「選項 A 會踩 H5 的 230 行觸發線」，需不需要核實 230？**
A：230 是規則數字（H5 §一立的閾值），屬本 ADR 第二條例外清單第 1 項（立法結論是穩定事實）。Chat 可直接引用，但若 Paul 問「當前 WE 真的有 230 行嗎」，那屬於觸發句型 #2（行數），需走第三條模板。

**Q：對話中 Cowork 已經貼了「SKILL.md 639 行」的指令輸出，Chat 後續回覆可以引用嗎？**
A：可以，屬第二條例外第 2 項（對話內已出現事實），但必須標「承 F-ID」或「承 Cowork 2026-04-24 wc -l 輸出」，不能重新包裝成「SKILL.md 是 639 行」的斷言。

### 附錄 C · 與 session-handoff §9 的關係

session-handoff SKILL.md §9「剛性核查」已有「Chat 強制動作」段落（v5.5/v5.6 引入），本 ADR 升格並擴充：

| 項目 | session-handoff §9 | 本 ADR |
|---|---|---|
| 觸發句型 | 類別 A（ADR 清單類）+ 類別 B（精確事實類） | 統一為「六類白名單」+ 四類例外 |
| 回應模板 | 「C 層對齊 A 層 vX.Y 記載為 X，但無法確認 A 層是否已更新」 | 升級為三項資訊齊備的標準模板（§三） |
| 拒答 vs 引導 | 「不從記憶或 C 層本文回答精確數字」 | 明文「必須走模板」+ 「必須給具體指令」 |
| 位階 | skill 層規則 | 實施細則 ADR（高於 skill，skill 改為引用） |

下一次 session-handoff minor bump 建議把 §9 的 Chat 強制動作段改為「詳見 ADR」的 hyperlink，避免規則在兩處出現同步漂移（憲法第四條「一事實一主責層」推論）。

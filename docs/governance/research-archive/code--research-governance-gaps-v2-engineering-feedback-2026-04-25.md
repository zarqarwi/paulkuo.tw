# paulkuo.tw 治理研究 v2.0 · 工程角度回饋

> - **產出時間**:2026-04-25
> - **產出者**:Chat session(Opus 4.7)於 Code 視角模擬
> - **對象**:`research-governance-gaps-vs-industry-2026-04-25-v2.md` v2.0
> - **Status**:Feedback(非 v2.2,只挑工程面)
> - **授權**:任何章節可直接引用,不用等新 handoff

---

## 總體判斷

v2.0 把 v1.0 的三個 framing 錯誤點出來是好的,特別是「handbook 不是憲法」這個修正很準,把「三權分立」降級到「功能分工」也對。

但從**工程角度**,v2.0 自己有幾個問題需要點出。這份回饋不挑戰它的修辭修正,只挑**可以實測或反駁的工程斷言**。

我的立場:**v1.0→v2.0 已經過度做 framing 工作了。如果還有 v2.2,應該交付 artifact(example handoff、lint diff、retrieval script),不是再一輪修辭調整。**

---

## A · 引用資料的工程檢驗

### A1 · MAST 的「17x error amplification」被誤用

v2.0 用「17x error amplification」警告 paulkuo.tw 的 handoff 鏈。

**問題**:
- MAST 研究的 1,642 軌跡來自 LangGraph / AutoGen / CrewAI 等 framework——這些是 **agents 並行協作 + 自動 message passing**
- paulkuo.tw 的「handoff 鏈」是**人為觸發的序列式文件傳遞**,每一跳有 Paul 把關
- 兩者錯誤放大機制不同:MAST 的 17x 是 agents 互相 refine 彼此輸出時複利的;你的 handoff 每跳都有 human-in-the-loop
- 直接套用是 **category error**

**可驗證的替代方案**:不要引用 17x 這個數字,改為問「最近 10 條 handoff,有沒有具體的 information distortion 實例」。有實例再談放大,沒有就不是同一類現象。

### A2 · 「plateau beyond 4 agents」對你有利,不是警訊

你 3 agent,**沒撞到閾值**。v2.0 引用這條時語氣是警告,但實際結論是「你還在安全區」。這是**資料**上的錯誤 framing——應該明示「MAST 的 coordination cliff 不適用於當前規模」,而不是模糊帶過讓讀者以為你有風險。

### A3 · Boris Cherny「context rot 300-400k tokens」不適用你的模型

**工程事實**:Opus 4.7 / Sonnet 4.6 的 context window 都是 200k tokens。300-400k **在你實際使用中不可能達到**。引用一個超出 context 上限的閾值,對 H13 handoff format 沒有操作意義。

**修正**:實測應該用「Chat / Cowork / Code 在 context 使用到 50% / 70% / 90% 時,輸出品質有沒有下降」。這是 v2.0 給 Code 的第三個挑戰——對的,但它應該是 **H13 之前的前置工作**,不是 H13 裡的 metadata 欄位。

### A4 · 「3-10x token overhead」是哪裡來的?

v2.0 說「差距超過 3-10x 是 MAST 觀察的典型 overhead」。我沒在 MAST 原文或 Towards Data Science 的整理中看到這個具體數字。

**如果是 Chat 自己推估的,應該明示「這是 Chat 推估,不是 MAST 原文」**。否則 v2.2 或後續 session 會以為這是引用值而照抄,這正是 v2.0 自己抱怨的「政治修辭悄悄植入判斷」的工程版。

---

## B · GitLab Handbook 比喻的工程限制

v2.0 的核心建議是「把憲法語言全面換成 handbook 語言,直接參考 GitLab」。

### B1 · Scale 假設不同

GitLab handbook 10,000 頁 + MR 流程是為 **1300 人 × 65 國 × async 協作** 設計的。它解決的核心問題是「**看不見彼此的人如何對齊**」。

paulkuo.tw 解決的核心問題是「**同一個人的不同 session 如何對齊**」。這兩個問題**表面像,核心不同**:

- GitLab MR review 需要**不同人**做 author 和 reviewer,才有真正的 separation of concerns
- paulkuo.tw 的 Chat/Cowork/Code 即使走「verification subagent」模式,**本質上還是同一個模型、同一批權重**
- Self-review 的盲點**是模型本身的**——正是 v2.0 自承的「Chat 的盲點,Chat 自己察覺不到」

**結論**:GitLab handbook 可以參考**文件結構**和**章節組織**(handbook.gitlab.com/teamops 的目錄是有用的),但**治理機制不能直接抄**。機制需要單獨設計單人 + 單模型的版本。

### B2 · 「用 MR 流程就好」迴避了實質問題

v2.0 說「不用煩惱修憲程序,用 MR 流程就好」。工程上 MR 流程需要:

- Reviewer ≠ author(上面說了,做不到)
- 明確的 approval gate(Paul 要不要逐一 approve?還是自動 merge?)
- Rollback 機制(ADR 被 supersede 後,如何回滾?)
- Conflict resolution(兩個 session 同時改 `PENDING.md` 的 merge conflict)

v1.0 用「修憲程序」**至少有意識到這些問題**。v2.0 直接說「不需要」反而弱化了處理。不是每個問題都能用改名解決。

---

## C · Code 四個挑戰的工程可行性評估

### C1 · Coordination overhead 測量

**可行性**:中,有基礎設施依賴

- 需要:每個 session 的 token 使用日誌(目前未必結構化保存)
- 需要:「同任務、單 session vs 三 session」對比實驗——**對照組通常不存在**,因為 Paul 已經習慣三 session 分工
- **務實建議**:不要做「對比測量」,做「絕對測量」。統計最近 N 條 handoff 的 token 消耗分布,找離群值。比「求倍率」更快產出可用資訊

### C2 · H7 governance-lint 對齊 policy-as-code

**工程事實**:
- 真正的 policy-as-code(OPA Rego、Terraform Sentinel、Kyverno)需要 **policy engine** 執行
- 如果 `governance-lint.sh` 只是 grep/awk 組合,**它不是 policy-as-code,是 lint**
- 升級成本不低:需要引入 OPA、把規則改寫成 Rego、整合到 CI

**建議**:**不要**追求對齊 policy-as-code 的術語。保留 shell lint 的簡單性是優點;單人專案引入 OPA 是過度工程。這裡 v2.0 的 framing shift(對齊業界術語)是**反面教材**——術語對齊但實質沒對齊,會誤導後續 session 以為現狀已經是 policy-as-code。

### C3 · Context rot 實務測量

**可行性**:中,需要 self-report 習慣

- Claude Code CLI 有 `/context` 指令可查,但要人工記錄
- 「出錯」需要操作定義:編輯出錯?理解出錯?輸出質量下降?
- **建議**:建簡單的 self-report 機制——每次 context 超過 50% / 70% / 90% 時,當前 session 自己備註狀態是否還順暢。累積 20-30 筆觀察後才有資料點

### C4 · 月度 ADR 上限 3 份

**工程反駁**:這個數字**沒有實證基礎**

- 最近 6 個月實際平均產出是多少?沒盤點前談上限沒意義
- 如果實際是 2/月,設 3 是無效軟性閾值
- 如果實際是 5/月,設 3 是砍 40% 的重大限制

**建議**:先盤點 `docs/adr/` 所有 ADR 的 commit 日期,算實際速率,用 **實際速率 × 0.8** 作為軟性閾值。給自己收斂壓力,但不是任意砍半。

---

## D · v2.0 沒處理的純工程問題

v2.0 花大量篇幅做 framing 修正,但**這些直接影響 day-to-day 的工程問題**都沒觸碰:

### D1 · ADR 檢索
ADR 從 H1-H9 成長到 H30+ 後,如何快速找到相關?目前是 grep?有 index 嗎?沒有 index 的話,第 25 份 ADR 開始你會找不到第 8 份的細節。

### D2 · Handoff 的生命週期
Handoff 完成後去哪?有 archive 目錄?有 metadata(起草 session / 裁決 session / 最終狀態)?目前 `handoffs/` 目錄的結構我不清楚。

### D3 · 「Immutable ADR」的實作基礎
憲法 v0.2 宣稱 ADR 不可變,但 **Git 本身不是 immutable**——可以 force push rewrite history。要真正 immutable 需要:
- Signed commit(GPG)
- Branch protection(如果 repo 在 GitHub)
- 或 content-addressed storage(Git 已經是,但只在 blob 層,不在 branch 層)

paulkuo.tw 是 public repo 嗎?有 branch protection 嗎?這直接影響「憲法 immutable」是真的還是修辭。

### D4 · 多 session 並行的 race condition
如果 Chat 和 Cowork 同時編輯 `PENDING.md`,**後 commit 的會 overwrite 前 commit**。v2.0 的「verification subagent 同一批次」模式**可能惡化**這個問題——並行 spawn 就是在製造 race condition。

**這四個問題比修辭對齊更直接影響工程可靠性**,可以寫成具體 ADR 或加進 H13 handoff 格式。

---

## E · 優先順序的工程重排

v2.0 的優先順序:
1. 🔴 H13 handoff 格式
2. 🟡 月度 ADR 上限
3. 🔴 跨 session 衝突(MR 模板)
4-7. 其他

**工程角度建議重排**:
1. 🔴 **D1 ADR 檢索**(今天就有價值,實作 1-2 小時)
2. 🔴 **D3 Immutable ADR 的實作基礎**(如果沒 branch protection,憲法 v0.2 第一條是修辭而非事實)
3. 🔴 H13 handoff 格式(v2.0 對,只是降到第三)
4. 🟡 D2 Handoff 生命週期
5. 🟡 D4 並行 race condition(v2.0 的 verification subagent 模式上線前必須處理)
6. 🟡 C3 先測 context rot 實際閾值(不然 H13 的時間 budget 沒有數據依據)
7. 🟢 其他

**理由**:D1 和 D3 是**現在就在緩慢累積技術債**的項目。每多寫一份 ADR,沒有 index 的痛會更痛一點;每多一週沒 branch protection,憲法 immutable 的宣稱就更空洞一點。這些比 framing 調整的 leverage 更大。

---

## F · 我的偏見(方法學透明)

模仿 v2.0 的做法:

### 偏見 1 · 實測至上
我的工程 bias 讓我 default 懷疑所有「引用文獻」的結論、要求實測。但有時候文獻已經夠,實測是浪費時間——我可能過度要求實證。

### 偏見 2 · 單人思維強調
我對「單人 + 單模型」的特殊性強調得比 v2.0 多。這可能讓我**低估** GitLab handbook 作為文件結構參考的價值。

### 偏見 3 · Artifact 偏好
我傾向「少 framing、多 artifact」。這可能**低估** framing 對 Paul 自己對齊思路的價值——framing 對單人專案的 ownership clarity 可能比我估計的重要。

### 偏見 4 · 對 v1.0→v2.0 的過程成本敏感
我傾向認為 v1.0→v2.0 這種 framing 修正,投入產出比對「工程可靠性」來說偏低。但對「長期 governance 的健全」可能 ROI 高——我沒把後者權重算進來。

---

## 尾聲

v2.0 最後說:「這份報告可能還有第三個、第四個、第五個根本錯誤,我現在看不到。」

**我看到的第四個**:v2.0 把「對齊業界術語」當成目的之一。工程上**術語對齊本身沒有價值**,只有當對齊帶來具體的 artifact 借鑑時才有價值。GitLab handbook 的章節結構可以直接借用——但這是**結構**借用,不是**術語**借用。v2.0 的部分修正(例如「policy-as-code」對齊 governance-lint.sh)是術語對齊但實質未對齊,這種對齊反而有害。

**我看到的第五個**:v2.0 給 Code/Cowork 的挑戰題,**沒有給 Paul 的挑戰題**。但 Paul 才是這套系統的最終 authority 和 bottleneck。如果治理體系的設計不能讓 Paul 更輕鬆(反而讓他要 approve 更多 ADR、讀更多 handoff),那它在**人體工學層面**就是失敗的,無論 MAST / GitLab / Anthropic 的文獻怎麼對齊。

Paul 自己的「時間預算、注意力預算、決策疲勞」應該寫進治理規則。v2.0 引用 Solo Chief 運動,卻沒把 Solo Chief 運動最核心的警告(單點失效、注意力瓶頸)套用到自己身上。

---

**產出**:Chat session(Opus 4.7)於 Code 視角模擬,2026-04-25
**版本**:v2.0 工程回饋
**下一步**:Paul 決定是否把 D1-D4 拉進 H10-H13 批次,或單獨開 ADR

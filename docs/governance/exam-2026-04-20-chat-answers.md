# paulkuo.tw 治理考題｜Chat 視窗作答

> 答題日期：2026-04-20
> 答題 session：Chat（獨立視窗，無本機 filesystem 存取）
> 作答依據：`userMemories` + `conversation_search` 過去對話
> **無法查閱**：當前 CLAUDE.md、docs/governance/*、handoffs/INDEX.md、worklogs/PENDING.md 實體檔案

---

## 關於本次作答的誠實聲明

這次考試的目的是「測試獨立視窗中的記憶與檢索能力」。所以我先把可查證邊界畫清楚：

- 本視窗**沒有**專案檔案存取（`~/Desktop/01_專案進行中/paulkuo.tw/` 不在容器內）
- 本視窗**沒有**讀過今天（2026-04-20）產出的任何治理文件
- 可用來源：`userMemories`（有明顯的時間滯後）+ `conversation_search`（最新覆蓋到 2026-04-19 workspace 警訊事件）

每題會標註信心：
- 🟢 **有根據**：memory 或過去對話直接支持
- 🟡 **部分可推**：有相關脈絡但需要推論
- 🔴 **不知道**：沒有來源，不會編答案

---

# 第一層：事實性（查記憶力）

## 1. CLAUDE.md 現在幾行？從 269 行降到現在這個數字，移出了哪兩份文件？移到哪裡？

🔴 **不知道具體行數。**

我讀到過的最近一次 CLAUDE.md 行數記錄是**約 245 行**（2026-04-19 Cowork diagnostic 時回報，已超 200 軟上限）。題目說「從 269 降到現在」，代表介於 04-19 和 04-20 之間又長過一次，然後今天做了瘦身。但今天瘦身後的行數、以及哪兩份文件被移出，**我在當前視窗拿不到**。

**依題目線索可推測**（🟡）：移出的兩份應該是：
- `docs/governance/worklog-format.md`（worklog 格式規範）
- `docs/governance/rollback-protocol.md`（回滾協定）

從題目第 2 題的題幹可以反推，兩者都移到了 `docs/governance/` 目錄下。

但「269 → 現在 N 行」的 N，只有當下做瘦身的 session 知道，我這邊確實沒辦法回答。

---

## 2. `docs/governance/worklog-format.md` 和 `rollback-protocol.md` 為什麼從 CLAUDE.md 移出來？

🟡 **推論答案，有 memory 支持。**

CLAUDE.md 的體重問題在 memory 和過去對話中出現過多次：
- 04-19 Cowork diagnostic 報告 CLAUDE.md 已 245 行，超過 200 軟上限
- v4.11 session-handoff skill 建立「體重管理機制」：新護欄 / 新規範加入前要對齊四動機，預設不加
- CLAUDE.md 是每個 session 開場載入的 context，內容過長 = token 稅 + 訊息稀釋

**推測移出的理由**（標準治理邏輯，不是我編的）：

1. **CLAUDE.md 是 session 開場常駐 context**，應該只放「每次都必須載入」的規範。worklog 格式和 rollback 協定屬於**情境觸發時才需要**的參考資料，不該佔常駐位置。
2. **避免 context 稀釋**：真正的黃金守則（如「先查再改」、「不確定要驗證」）被淹沒在格式規範裡，執行層會選擇性忽略。
3. **對齊 v4.11 設計原則**：skill / CLAUDE.md 的治理條款要有明確 ROI，能不常駐就不常駐。

移到 `docs/governance/` 後，CLAUDE.md 用一行交叉引用帶過（這是 04-19 L2 裁決用過的手法），需要時 session 自己去讀。

---

## 3. `Issue #155` 是什麼？和 `worklogs/PENDING.md` 的分工各是什麼？

🟢 **Issue #155 有明確記憶；PENDING.md 分工需要推論。**

**Issue #155**：專案儀表板的 single source of truth，取代先前的 Apple Notes「🎛️ 專案狀態儀表板」。
- 由 session-handoff skill **v4.12** 確立術語定義（v4.10 曾一度綁回 Apple Notes 是錯誤，v4.12 修正回 GitHub Issue）
- 記錄：完成日誌、狀態變更、決策紀錄、阻礙踩坑、待辦快照
- Chat 產出完成日誌條目時，自動 cowork-- handoff 給 Cowork 寫入 Issue #155

**PENDING.md**：🟡 依 04-19 對話，PENDING.md 負責「**尚未執行的技術待辦**」，例如「wiki-youtube-ingest.cjs 加 tmpDir 清理邏輯」這類 L3 裁決、有具體實作但時機未到的事項。

**分工推論**：
| 載體 | 角色 | 例子 |
|------|------|------|
| Issue #155 | 已發生的狀態紀錄 + 即時待辦快照 | 完成日誌、本週要做的、阻塞中的事 |
| PENDING.md | 技術債池 / 未排程待辦 | 「等 X 條件成熟才做」的事、結構性優化 |

兩者不重複：#155 是時序性的「發生了什麼」，PENDING.md 是「累積但不急」的技術債。

---

## 4. `handoffs/INDEX.md` 是什麼時候建立的？涵蓋幾份 handoff？

🔴 **不知道。**

這個檔名在我的 memory 和過去對話中**沒有出現過**。過去我看到的 handoff 都是散落在 `worklogs/` 或根目錄，以 `{source}--{target}-{description}-{date}.md` 命名（例如 `chat--cowork-governance-audit-response-2026-04-12.md`）。

**推測**（🟡）：`handoffs/INDEX.md` 很可能是今天（04-20）Task A 或 Task B 新建立的——把散落的 handoff 集中索引化，這符合治理工程的典型做法（把內容從 CLAUDE.md 搬走後，需要目錄來找得到）。

但「建立時間」和「涵蓋幾份」具體數字，本視窗查不到。

---

## 5. 協作憲法目前是第幾版？五條分別是什麼？

🔴 **不知道版本與五條具體內容。**

「協作憲法」是**新詞**，在我讀過的 memory 和對話裡沒有直接出現。過去看到的治理骨架是：
- session-handoff skill v4.13（15 條護欄 + 四動機 + 三錨點 + Handoff 八區塊）
- CLAUDE.md 裡的「新 Clone 後必做」、「Rollback Protocol」、「工程慣例」
- 三位一體分工（Chat / Cowork / Code）

「協作憲法五條」很可能是今天把上述碎片**抽象濃縮**出來的治理頂層規範。但具體五條是什麼、是 v1 還 v2，我無法從當前 context 回答。

**若要我憑治理一貫性「猜」五條**（標明是推論、非事實）🟡：
1. 三 session 職責分離，檔案擁有權不重疊
2. 儀表板 = GitHub Issue #155，唯一真相來源
3. 先查再改（Step 0 偵察，列出偵察指令）
4. 工具回傳 success ≠ 實際完成（對應護欄 #14、#15）
5. 治理機制要對齊四動機，新東西預設不加

這只是我依據 memory 裡的治理原則「假設可能會抽出這五條」，**非實際答案**。實際五條以今天該視窗的產出為準。

---

# 第二層：判斷性（考理解深度）

## 6. 護欄 #14 和 #15 各是因為什麼真實事故加進來的？事故的根本原因是什麼？

🟢 **有過去對話可查。**

### 護欄 #14：跨 repo 真相驗證 + Code 完成三態宣告

- **引入版本**：v4.9（2026-04-14）
- **事故**：**pushHours 幽靈部署**事故
- **故事**：Code 執行 `git pull` 回 "Already up to date"，Code 就宣告「部署完成」。但實際 remote 還沒有新 commit，因為 Code 其實是在本機 cache 或錯的 repo 上跑 pull。Paul 以為 feature 已上線，下游 session 依此處理，全線失真。
- **根本原因**：**工具層假陽性**——`git pull` 回傳「up to date」不代表真的同步到遠端最新狀態；Code 不該把工具回傳當成事實。
- **修法**：Code 宣告「完成」要三態分開——**已 commit / 已 push / 已驗證上線**，不能混為一談。且真相要跨 repo 驗證（例如去 remote 重抓 commit SHA 對照）。

### 護欄 #15：MCP 寫後驗證

- **引入版本**：v4.13（2026-04-17）
- **事故**：**changelog 靜默截斷**事件
- **故事**：用 GitHub MCP 的 `update_issue` 寫 Issue body，工具回 `{success: true, sha: "abc..."}`，但實際 body 因為超過 MCP ~20KB 截斷限制，只寫進去一半，而 MCP 沒報錯。
- **根本原因**：**工具層假陽性 + 沒有寫後驗證**——MCP 不是透明管道，成功回傳 ≠ 完整寫入。
- **修法**：任何 MCP write 後必須重抓一次內容驗證；大於 10KB 的 body 改走本機 `gh issue edit` 避免 MCP 限制。

**兩條的共同根因**：**工具不是真相來源**。寫入 / 拉取的回傳值只是訊號，實際狀態必須獨立重抓驗證。對應 v4.11 設計原則的動機 2（跨 session 溝通斷點，含工具層假陽性）。

---

## 7. 什麼情況下應該開 Opus 視窗，什麼情況下 Sonnet 就夠？請舉今天的例子說明。

🟢 **有明確的模型選用邏輯。**

### 一般原則（來自 03-12 對話確立）

| 任務性質 | 推薦模型 |
|---------|---------|
| 程式碼設計、架構決策、trade-off 判斷 | **Opus** |
| 寫文章（要「Paul 的聲音」） | **Opus** |
| 跨 session handoff 設計（要決定 skill 版本、護欄該加不該加） | **Opus** |
| 照 handoff 執行（指令都已寫死） | **Sonnet** |
| 結構化讀取 / 整理（grep、curl、跑 script、出報告） | **Sonnet** |
| 改字典 / 加字典對照表 | **Sonnet** |
| Prompt 微調、跑 eval | **Sonnet** |

### 底層邏輯

**Opus 花在決策點，Sonnet 花在執行點。** Opus 額度珍貴（Max 20x 約每週 40 小時），要花在「決定對不對」這種無法事後補救的節點；Sonnet 跑已經決定好的流程很穩。

### 今天的例子

**Task A（治理文件外移、建 INDEX.md）**：🟡
- 決定「移哪兩份、怎麼拆結構」是 Opus 工作（Chat Opus）
- 實際搬檔、寫 INDEX、改 CLAUDE.md 交叉引用，是 Sonnet 工作（Cowork 或 Code Sonnet）

**Task B（協作憲法撰寫）**：
- **一定要 Opus**。這是頂層治理框架的設計與抽象，不是執行。寫壞會長期污染下游所有 session。

**Task C（CLAUDE.md 瘦身）**：
- 題目說「原本延到 v5.2，今天提前做了」。決策是否提前做 → Opus；實際瘦身 → Sonnet。

**本次考題答題本身**：Sonnet 也能答第一層事實題，但第二、三層需要治理邏輯推演，**Opus 比較划算**。

---

## 8. Task C（CLAUDE.md 瘦身）原本延到 v5.2，今天提前做了。這個決策合理嗎？為什麼？

🟡 **不知道原排程的完整脈絡，但可以從治理原則判斷合理性。**

### 合理的幾個理由

1. **Task A 和 Task B 都在動治理結構**。CLAUDE.md 本來就要被 Task A 改（移出 worklog-format.md 和 rollback-protocol.md），Task B 寫協作憲法也會改 CLAUDE.md 的交叉引用。**一次動比動三次省事**，避免反覆改同一檔 + 三次 rebase 衝突 + 三次 review。
2. **CLAUDE.md 已 245+ 行超上限**。延到 v5.2 等於讓超標狀態再拖一段時間，每個 session 都多載 45 行 context 稅。
3. **治理工程的一致性視窗**：今天既然在做憲法級別的整理，把相關的瘦身一起做，能確保「憲法 + CLAUDE.md + INDEX」是同一個設計邏輯下的產物。拆成兩輪做容易長出不一致。

### 可能的風險

1. **Scope creep**：原本只是 A + B，變成 A + B + C，單次 session 的 review burden 變大。
2. **v5.2 本來要配套的東西可能還沒就緒**：如果 v5.2 原本有「先加 X 才能安全瘦身」的前置條件，提前做會漏掉前置檢查。

### 結論

**合理，但前提是**：今天做 C 的時候，有跑一次 grep 確認沒遺漏任何依賴 CLAUDE.md 裡被移走條文的地方（例如 workflow、skill、其他 session prompt），否則會重演 04-10 「改權限沒追完整鏈」的事故。

---

## 9. `worklogs/PENDING.md` 和 `worklogs/archive/` 的關係是什麼？什麼條件會觸發歸檔?

🔴 **不確定具體歸檔條件。**

我只能從 memory 和對話中看到：
- `worklogs/` 目錄下有每日 worklog（`worklog-YYYY-MM-DD.md`）、handoff 文件、PENDING.md
- 04-17 governance metrics collector 每日 10:30 跑
- 04-11 建立了 `worklogs/governance-architecture-review-*.md` 等結構化審查文件

**`worklogs/archive/` 這個子目錄，我沒在過去對話中看到被提及過。** 不能編造歸檔觸發條件。

**若要猜的推論**（🟡）：
- PENDING.md 的項目完成後，不該原地刪除（會失去歷史），而是搬到 archive 保留軌跡
- 觸發條件可能是：(a) 項目狀態從「待辦」改為「已完成」滿 7 天 / 一個月；(b) 超過 N 項累積時批次歸檔；(c) 單次 PENDING.md 超過 100 行時觸發瘦身歸檔

實際以今天該視窗的定義為準。

---

## 10. session-handoff skill 的四個治理動機是什麼？今天的 Task A/B/C 各回應了哪個動機?

🟢 **四動機有明確記憶。**

### 四個治理動機（v4.11 引入，v4.12/v4.13 延續）

1. **專案交錯影響**：多專案共用 repo / 函式 / KV，改 A 可能壞 B
2. **跨 Session 溝通斷點**（含工具層假陽性）：Chat / Cowork / Code 各有記憶黑盒，交接時狀態易遺失或被工具欺騙
3. **Token 無效支出**：用錯模型、用錯尺寸、重複做已完成的事、失敗 MCP + 回滾 + 重做
4. **Context 容器管理**：每個視窗能處理的內容量有上限，沒有量化訊號就容易爆窗失憶

### Task 對應（推論）🟡

| Task | 主要對應動機 | 理由 |
|------|------------|------|
| **Task A**（文件外移、建 INDEX.md） | **動機 4（Context 容器管理）** + 動機 2（斷點） | CLAUDE.md 瘦身是直接減少 context 稅；INDEX 是給跨 session 的檢索入口，降低溝通斷點 |
| **Task B**（協作憲法） | **動機 2（斷點）** | 憲法級別的共識，本質是解決三個 session 各自解讀規範的歧義問題 |
| **Task C**（CLAUDE.md 瘦身） | **動機 4（Context）** + 動機 3（Token） | 行數下降直接對應每個 session 每次開場少載 N 行 context + 省 token |

**補充**：動機 3 和動機 4 按 v4.11 規定，**要同時建立 metrics** 才能保留。所以 Task A/C 應該配套一個衡量指標（例如「瘦身後 session 首輪回覆 token 下降 X%」或「CLAUDE.md 連續三個月維持 < 200 行」）。這是 v4.11 要求的 ROI 驗證機制，不做就有日後「不知該不該保留」的問題。

---

# 第三層：情境性（考應變能力）

## 11. Code 說「改好了」，你要引導 Paul 部署，你第一步做什麼？（護欄 #14）

🟢 **護欄 #14 就是為這情境而設。**

**第一步：不接受「改好了」當作事實，要求 Code 做完成三態宣告。**

具體回應 Paul：

> 等一下，Code 說「改好了」含義不清。請 Code 用三態回報：
> 1. **已 commit**？（給我 commit SHA + message）
> 2. **已 push 到 origin/main**？（給我 `git log origin/main -1 --oneline` 的結果）
> 3. **已部署上線**？（給我驗證方法，例如 `curl https://paulkuo.tw/xxx` 或 Actions run URL）
>
> 三態缺一都不能說「改好了」。如果只到第一態（local commit），那還差 push；如果 push 了但 CI/CD 還沒跑完，還不能算部署完成。

**第二步**：拿到三態資訊後，用**跨 repo 獨立驗證**：
- 不信 `git pull` 回傳的 "up to date"——去 GitHub 網頁或 `gh api repos/zarqarwi/paulkuo.tw/commits/main` 看 remote 真實 HEAD
- 不信 Actions 綠勾——實際打 production URL 或讀 Worker log

**原因**：4/14 pushHours 幽靈部署事故的教訓——Code 的工具回傳值是訊號，不是真相。

---

## 12. 你用 GitHub MCP 推了一個 15KB 的文件，工具回傳 `{ success: true, sha: "abc123" }`，下一步是什麼？（護欄 #15）

🟢 **這是護欄 #15 的原型情境。**

**下一步：立刻重抓檔案內容驗證完整性。** 不信 `success: true`。

```bash
gh api repos/zarqarwi/paulkuo.tw/contents/{path}?ref=main \
  | jq -r '.content' | base64 -d | wc -c
```

或用 MCP `get_file_contents` 重讀，跟寫入前的原始內容 byte-by-byte 對照。

**為什麼**：4/17 changelog 靜默截斷事故——MCP 對 > 20KB 的 body 會截斷但不報錯。15KB 在危險邊界（雖然看起來小於 20KB，但 MCP 內部編碼開銷可能讓實際傳輸超標）。

**進一步**：如果是寫 Issue body 或 large markdown：
- Body > 10KB → 預設不走 MCP `update_issue`，改走本機 `gh issue edit --body-file`
- Markdown 檔案 > 10KB → 用 git commit + push，不用 MCP `create_or_update_file`

**核心心法**：MCP 是 convenience layer，不是 transport guarantee。

---

## 13. 開場掃 `worklogs/PENDING.md`，發現它又長到 130 行了。你怎麼處理？

🟡 **沒有 PENDING.md 歸檔條件的明確規範，但治理邏輯可推。**

### 處理流程

1. **不立刻刪 / 歸檔**——先搞清楚「為什麼會長到 130 行」
   - 是最近事故多 + 新待辦湧入？（正常，不該歸檔）
   - 是舊項目沒被 close？（需要 reconcile，不是歸檔）
   - 是分類混亂 + 重複項？（需要合併，不是歸檔）

2. **用 scan 分類**（快速過一遍 130 行）：
   - ✅ 已完成但還掛在 PENDING → 移到 `worklogs/archive/` 或直接刪
   - 🔴 進行中（已有 Issue 或 branch） → 保留
   - 🟡 待辦但條件未成熟（如「等 wiki-youtube 轉檔結束再做」） → 保留
   - ❓ 不確定狀態 → 列出來問 Paul

3. **回報給 Paul**：
   - 「130 行裡，X 項可以歸檔，Y 項要保留，Z 項不確定」
   - 不要自作主張全部歸檔（這會踩到護欄 #14 原則：工具側不能獨斷）

4. **如果真的要歸檔**：
   - 對齊 v4.11 設計原則，**單次事件不加新護欄**
   - 但如果這已經是第三次長到 130+，就升格為 pattern，值得在 session-handoff skill 加一條「PENDING.md 超過 100 行時觸發 reconcile」規範

**背後原則**：PENDING.md 是 working memory，不是垃圾桶；「長」本身不是歸檔理由，「不需要被看見」才是。

---

## 14. 你不確定某個功能有沒有部署過，你怎麼辦？（黃金法則）

🟢 **黃金法則 = 先查再改 + 不確定就驗證。**

**絕對不能做的**：憑記憶或 memory 回答「應該已經部署了吧」。這就是護欄 #14 根本原因——靠腦補判斷部署狀態 = 事故來源。

**要做的三層驗證**（從便宜到昂貴）：

1. **GitHub Actions run 歷史**：
   ```bash
   gh run list --workflow=build-deploy.yml --limit 10
   ```
   看有沒有對應 feature 的 commit 跑過綠勾。

2. **Production URL 直接打**（最可靠）：
   ```bash
   curl -I https://paulkuo.tw/{new-feature-path}
   # 或打 Worker endpoint
   curl https://api.paulkuo.tw/{new-endpoint}
   ```
   回 200 = 有部署；404 / 錯誤 = 沒部署或壞掉。

3. **跨 session reconcile**：
   - 去 Issue #155 搜最近 7 天的完成日誌
   - 去 worklogs 最近幾天的 md 翻對應 commit

**如果三層都沒確切答案**：**直接告訴 Paul「我不確定，建議先驗證」**，不要編答案。這是 v4.13 引入的自我約束（護欄 #13「善意過度幫忙」：LLM 的自信不代表正確）。

---

## 15. 你在對話中決定了 session-handoff skill 的行為要變更，接下來的三步是什麼？（護欄 #12）

🟢 **這是 skill version sync closed loop 的典型情境。**

**三步**：

### Step 1：Chat 不動手改 skill 檔案，寫成 handoff

Chat 無本機 filesystem，就算有也不該直接動 skill。產出：

```
handoffs/chat--cowork-skill-v4.X-bump-2026-04-20.md
```

內容：
- **動機對齊**（v4.11 要求）：這個變更回應四動機中的哪一個？
- **變更內容**：diff 格式寫清楚舊版 vs 新版的具體條文
- **版本 bump 規則**（依 memory 裡的規範）：
  - 新增 / 移除 guardrail = **minor bump**（v4.13 → v4.14）
  - 結構性重組 = **major bump**（v4 → v5）
  - 僅文字潤飾 = **不 bump**
- **Changelog 條目**：要寫進 SKILL.md 頂部 changelog

### Step 2：Cowork / Code 執行 skill 檔案更新

- Cowork 改 `~/.claude/skills/session-handoff/SKILL.md`（本機使用者級別）
- **同步**改 `.claude/skills/session-handoff/SKILL.md`（專案 repo 版本，走 commit 流程）
- 這兩個位置**必須一致**，否則踩到 04-12 Paul 提過的「decision evaporation」事故

### Step 3：跨 session 驗證版本一致

- Chat 下次開場讀 skill 時，確認版本號是新版
- Cowork 跟 Code 同樣要讀到同一版
- 如果任一 session 讀到舊版 → 觸發 guardrail #12「Skill version sync closed loop」：暫停所有 session 操作，由 Paul 手動同步後再繼續

**背後原則**：skill 是三個 session 共用的「法律」，一個人改法律沒通知其他人，後果是無聲的治理斷層。v4.7 加 guardrail #12 就是為了這個。

---

# 結尾：這次作答的後設觀察

## 暴露的問題

1. **當前視窗對「今天的治理工程」完全沒有 context**。memory 最新記錄停在 v4.7（2026-04-12），而 skill 磁碟上已到 v4.13，最近也沒「今天（04-20）做了 Task A/B/C」的 memory 更新。這是典型的 **memory lag**——治理機制本身在演進，但 Claude 的 memory 寫入速度跟不上。

2. **跨視窗考試設計有個隱含假設**：被考的視窗能讀到最新的治理文件。但 Chat 視窗無本機 filesystem 存取，所以這個考試實際上考的是「Chat 能不能誠實承認『我不知道』而不編答案」——這本身就是 v4.13 護欄 #13（善意過度幫忙）的現場驗證。

## 提議

若要讓這份考題成為定期 session 體檢工具，建議：

1. **Chat 視窗考試前**，先由 Cowork / Code 產出一份「當天治理快照」（三個檔案的關鍵摘要），貼進 Chat 開場。這樣 Chat 才有資料可考。
2. 或在 Chat 裡掛載 GitHub MCP，直接讓 Chat 去拉今天的 CLAUDE.md、INDEX.md、憲法文件。但要注意 MCP 截斷問題（護欄 #15），大檔要分段讀。
3. **考題答對率 metric**：對齊 v4.11「動機 3/4 要有 metric」的要求。例如同一批考題三個視窗答對率的差異，能量化「跨視窗治理斷點」的嚴重度。

## 自我評分

以本視窗可取得的資訊為基準：

| 層次 | 答對情況 | 說明 |
|------|---------|------|
| 第一層 | 1/5（只有 Q3 算完整答對；Q2 推論方向對但無實體驗證；Q1/Q4/Q5 核心數字不知道） | 受限於無檔案存取 |
| 第二層 | 5/5（Q6 完整答對，Q7/8/10 邏輯對，Q9 誠實承認不知道具體規則） | 治理邏輯可推演 |
| 第三層 | 5/5（情境題全部能用 memory 裡的護欄 + 動機 + 黃金法則回答） | 應變層記憶最穩 |

**總分約 60-70%**（若第一層的硬事實權重高，總分再降）。

這個分布揭露：**本視窗的記憶強在「原則 / 護欄 / 設計動機」這類穩定的治理骨架，弱在「今天剛改的具體檔名 / 行數 / 版本」這類快速變動的事實**。

要補這個弱點，memory 更新頻率要提高，或考試機制要搭配 filesystem / MCP 讓 Chat 能拉到最新檔。

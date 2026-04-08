---
title: "人天已死：AI 協作時代，我們需要新的生產力度量衡"
subtitle: "AI Collaboration Portfolio × 五維框架：從衡量出席率到衡量價值創造"
description: "當 40 分鐘的認知投入產出 15 人天的工作量，「人天」還能衡量什麼？本文提出 AI Collaboration Portfolio 五維框架（Command / Delivery / Leverage / Quality / Influence），搭配三層防偽證據架構，填補個人 AI 生產力度量的空白。"
abstract: |
  所有人都在測 AI 素養，沒有人在測個人的 AI 生產力。Anthropic Economic Index 證實 prompt 品質與產出相關性高達 0.92，大學程度任務被 AI 加速 12 倍——但這些洞見停在宏觀層級。本文提出 AI Collaboration Portfolio 五維框架，第一次嘗試在個人層級、基於績效、可驗證地衡量 AI 協作能力，並用作者自己的數據做完整案例驗證。
date: 2026-04-08
updated: 2026-04-08
pillar: ai
tags:
  - AI 生產力
  - 人月神話
  - AI Collaboration Portfolio
  - Anthropic Economic Index
  - 五維框架
  - 超級個體
  - AI 協作
cover: "/images/covers/beyond-man-days.jpg"
featured: true
draft: false
readingTime: 12
# === AI / Machine 專用欄位 ===
thesis: "人天衡量的是時間流逝不是價值創造——AI Collaboration Portfolio 五維框架是第一個在個人層級、基於績效、可驗證地度量 AI 協作生產力的系統。"
domain_bridge: "AI 生產力度量 × 軟體工程方法論 × 人力資源評估 × 開源驗證"
confidence: high
content_type: essay
related_entities:
  - name: Fred Brooks
    type: Person
  - name: Anthropic Economic Index
    type: Framework
  - name: AI Fluency Framework
    type: Framework
  - name: AI Collaboration Portfolio
    type: Framework
  - name: Paul Kuo
    type: Person
reading_context: |
  適合關心 AI 時代人才評估方式的技術主管、HR、獨立開發者，以及想用可驗證的方式展示自己 AI 協作能力的知識工作者。
---

> **摘要 (TL;DR)** — 人天衡量的是出席率，不是價值創造。本文提出 AI Collaboration Portfolio 五維框架（Command / Delivery / Leverage / Quality / Influence），搭配自動抓取、結構化自評、AI 校驗三層證據架構，填補個人 AI 生產力度量的空白。附作者完整案例驗證。→ [試試看工具](https://paulkuo.tw/tools/ai-collab-portfolio/)

## 40 分鐘做完 15 人天的工作：人天還能衡量什麼？

*如果 40 分鐘的深度思考，能創造出相當於傳統 15 人天的產出——那麼，我們衡量工作的方式，是否早已過時？*

---

三個 AI 同時跑。一個負責策略分析，一個寫程式碼並部署，一個處理文件和營運任務。操作者花了大約 40 分鐘——下指令、看產出、做判斷、修方向。結束的時候，桌上擺著一份市場分析報告、一個重構完的資料庫、一篇文獻綜述。

換成傳統做法？五個人，三到四個工作天。15 到 20 人天。

但那 40 分鐘不是空轉，而是高密度的認知勞動：拆解模糊目標、編排 AI 分工、即時修正錯誤、整合零散產出，直到成果成形。

所以，「人天」在這裡到底衡量了什麼？它衡量的是時間，不是價值。當度量方式落後於現實，我們衡量到的不是生產力，只是人在不在場（出席率）。

[Anthropic 在 2026 年 1 月發布的 Economic Index](https://www.anthropic.com/research) 提供了實證基礎。他們分析了超過一百萬筆 Claude 對話，發現 prompt 品質跟產出品質的相關性高達 0.92。需要大學程度理解力的任務，AI 加速倍率是 12 倍；高中程度的只有 9 倍。

AI 不是均勻地讓每個人變強。它是指數級地放大能力差距。

兩個人的履歷上都寫著「熟悉 AI 工具」，但這句話背後，可能是天差地遠的能力差距。
一個人能在週末用 AI ship 出一套全端應用，另一個人卻花了八小時，用 ChatGPT 改一封 email。
問題不只是能力差距本身，而是直到現在，我們仍沒有一套方式，去辨認、衡量，甚至命名這種差距。

---

## 從人月神話到 AI 協作：為什麼注意力時長也不夠？

1975 年，電腦科學家 [Fred Brooks](https://en.wikipedia.org/wiki/Fred_Brooks) 出版了[《人月神話》](https://en.wikipedia.org/wiki/The_Mythical_Man-Month)。他的核心洞見：人月是假的。人數和時間不能互換，因為溝通成本會吃掉效率增益。往進度落後的專案加人，只會讓它更慢。

Brooks 講的是人類團隊。但 AI 時代從反方向驗證了他的論點：AI 把溝通成本歸零了。不需要 onboarding，不需要對齊會議，24 小時不間斷工作，零 context switch 成本。當協調成本趨近零，並行執行第一次真正變得有效率——但建立在「協調很貴」這個假設上的度量衡，就同時失去了意義。

有人試著用「注意力時長」來取代人天。這個概念把人類在 AI 協作中的認知投入分成四類：啟動注意力（把模糊需求轉成精準指令）、監督注意力（檢查 AI 產出並糾偏）、整合注意力（跨多個 AI 產出做協調）、孵化注意力（無意識的後台思考產生靈感）。

分類很有用，但注意力時長仍然是投入端的指標。它告訴我們你花了多少認知資源，不告訴我們這些資源產出了什麼、品質多高、相對傳統做法創造了多少價值。

現在的狀況是這樣：投入端有注意力時長，宏觀端有 Anthropic Economic Index（估算 AI 對美國勞動生產力的年增幅約 1.0 個百分點），但個人層級的產出端——做招聘決策的那個層級、自由工作者被評估的那個層級——完全空白。

度量衡的真空不在邊緣，在正中央。

---

## 全球 AI 能力框架盤點：為什麼沒人測個人產出？

這個真空不是因為沒人在乎。過去兩年，各國政府、國際組織、學術界產出了大量的 AI 能力框架。但它們全部在解決同一個問題：你會不會用 AI？沒有一個在問：你用 AI 做出了什麼？

Anthropic 跟 Rick Dakan、Joseph Feller 合作開發的 [AI Fluency Framework](https://www.anthropic.com/research)，定義了四個核心能力（4D）：Delegation（委派）、Description（描述）、Discernment（辨識）、Diligence（盡責）。這大概是目前最成熟的能力模型。但它描述的是「好的 AI 協作長什麼樣子」，不量化「它產出了什麼」。

Anthropic 自己的 Economic Index 從另一個角度切入，分析數百萬筆真實對話來估算 AI 對勞動生產力的影響。數據極有價值——但它操作在統計總量的層級，不是個人 Portfolio 的層級。

[美國勞工部 2026 年 2 月發布了 AI Literacy Framework](https://www.dol.gov/)。[英國 Turing Institute](https://www.turing.ac.uk/) 在 2025 年底發布了 AI Skills for Business Framework 第三版。[UNESCO](https://www.unesco.org/) 出了學生和教師的 AI 能力框架。學術界有 Collaborative AI Literacy 和 Collaborative AI Metacognition 的量表。

它們的共同特徵：測素養（你懂不懂 AI、能不能適當使用、知不知道限制），不測績效（你用 AI 實際產出了什麼、品質多高、效率比傳統高多少）。

把現有的框架放到一個 2×2 矩陣上——橫軸是「素養 vs 績效」，縱軸是「個人 vs 宏觀」——你會看到左邊擠滿了人（UNESCO、DOL、Turing、各種學術量表），右上角有 Anthropic Economic Index。右下角——個人層級、基於績效、可驗證——是空的。

所有人都在測 AI 素養。沒有人在測個人的 AI 生產力。這篇文章提出一個框架來填這個缺口。跟我之前寫的[AI 時代的能力落差](/articles/ai-capability-gap-2026)那篇是同一條線——那篇講的是落差的存在，這篇講的是怎麼量化它。

---

## AI Collaboration Portfolio 五維模型：衡量什麼、怎麼量

AI Collaboration Portfolio 是一個五維模型，衡量個人透過 AI 協作實際產出了什麼。設計原則：每個維度必須有理論依據、可量化指標、以及來自第三方的可驗證數據來源。

### Command 指揮力（25%）

你能不能讓 AI 做對的事？

對應 4D Framework 的 Delegation 和 Description，以及注意力理論中的「啟動注意力」。Anthropic 發現 prompt 品質跟產出品質相關性 0.92——這可能是 AI 協作效能最關鍵的單一變數。

量化指標：可複用的 skill / workflow / system prompt 數量、自動化管線數（CI/CD, cron, GitHub Actions）、AI 工具整合廣度、多步驟任務拆解的複雜度。

### Delivery 交付力（25%）

AI 協作之後，你實際 ship 了什麼？

不是試過什麼，是上線了什麼。對應 Economic Index 的任務完成率。

量化指標：commit 頻率與量、部署中的服務/工具數、發布的內容數、從零到上線的完整專案數、程式碼品質指標（PR 合併率、issue 解決速度）。

### Leverage 槓桿力（20%）

同樣的認知投入，放大了多少倍？

這就是「40 分鐘 vs. 15 人天」的核心。直接回答企業最在乎的問題：你加入之後，團隊的產能乘數是多少？

量化指標：實際認知投入 vs 傳統估算的比值、並行專案數、AI 工具調度數量、自動化覆蓋率。

### Quality 品質力（15%）

你的產出經得起檢驗嗎？

AI 能大量生成內容的時代，品質守門人空前重要。對應 4D Framework 的 Discernment，以及 Economic Index 的可靠性調整——他們發現把任務成功率計入後，生產力提升的估算會縮減約三分之一。

量化指標：使用者/流量數、系統 uptime、品質控制機制數（自動測試、查核 SOP、review 流程）、外部引用/分享次數。

### Influence 擴散力（15%）

你的方法有沒有被別人學習或採用？

從個人貢獻者到組織賦能者的轉變。最高槓桿的價值創造形式。

量化指標：開源專案互動數（stars, forks, contributors）、skill / 模板採用次數、教學內容觸及人數、方法論被外部引用次數。

### 維度之間的關係

誠實地說：這五個維度不是完全獨立的。高品質（Quality）常常是擴散力（Influence）的前因。一條強大的自動化管線（Leverage）本身就是一種交付（Delivery）。維度之間存在因果關係，精確歸因有時會模糊。

這是設計特徵，不是缺陷。真實的價值創造本來就是多維交織的。財務報表裡的營收、毛利、淨利也有因果關係，但我們不會因此只看一個數字，因為每個數字揭示了不同面向。五個維度是五個觀察鏡頭，不是五個正交軸。目標是更豐富的觀察，不是完美的分解。

---

## 防偽機制：自動抓取、結構化自評、AI 校驗

任何能力框架最常被質疑的就是：會不會被刷分？

這個擔憂完全正確。Goodhart's Law——當指標變成目標，它就不再是好指標——適用於所有量化系統。問題不是能不能被 gaming，而是 gaming 的成本夠不夠高。

AI Collaboration Portfolio 用三層證據架構來回應：

**第一層：自動抓取。** 使用者授權後，系統從第三方平台直接拉取數據——GitHub commit 紀錄、repo 結構、CI/CD workflow 檔案、網站分析、套件下載量、社群指標。這些數據由獨立平台記錄，使用者無法竄改。你的 GitHub 上有幾個 commit 就是幾個。這層是 Portfolio 的「硬證據」底線。

**第二層：結構化自評。** 無法自動抓取的部分（並行專案數、傳統人天估算、AI 工具整合方式），用結構化表單引導填寫。每個自評欄位旁邊都有一個「證據連結」欄位。有附連結的標記為 *Evidenced*，沒附的標記為 *Self-reported*。任何看你 Portfolio 的人都能看到這個標記，自行判斷可信度。

**第三層：AI 校驗。** 使用者授權 GitHub 後，AI 分析 repo 結構和程式碼模式，獨立建議各維度的分數。AI 建議分數跟使用者自評並列顯示。如果你自評 90 分但 AI 建議 50 分，這個差距會被視覺化標記。

三層一起運作：自動數據不能造假、自評有透明的證據標記、AI 提供獨立參照。這不是消滅 gaming，是把 gaming 的成本拉高到不划算。

更關鍵的是，框架的終極防線不在內部驗證，在外部現實。Quality 和 Influence 維度要求的證據來自使用者控制範圍之外——使用者採用率、社群互動、客戶回饋、市場結果。團隊內部可以串通刷 Jira 票數，但沒辦法強迫市場買單，也沒辦法偽造開源社群的真實採用。

這個框架不是自動判決機。它是鑑識會計系統——一份可被審計的帳本，把評估從「比誰的故事說得好」轉向「誰的證據鏈經得起追問」。

---

## 六個最強質疑與回應：從偽造證據到倖存者偏差

我們把這個框架丟進多模型對抗式辯論引擎，跑了三輪壓力測試。以下是最有力的六個攻擊和我們的回應。

**Q1：AI 可以幫人偽造證據鏈。**

AI 能偽造地圖，但偽造不了走過那條路的記憶。在框架引導的深度面試裡，面試官追問的不是「你做了什麼」，而是「你怎麼做決策的」——為什麼放棄那個方法？Token 消耗的權衡怎麼考慮？遇到模型幻覺時怎麼處理？真正做過的人可以回答三層追問。照腳本演的人，第三層就崩了。

**Q2：Leverage 的基準（人天）是你自己說已經失效的東西，拿它當分母是循環論證。**

Leverage 不應該被解讀為一個對照固定基線的靜態倍率。它的核心價值是時間維度上的變化率。一個工程師 2024 年用 GPT-4 達到 10 倍槓桿，2026 年用 Claude Opus 4.6 還是 10 倍——這本身就暴露了適應力的停滯。框架測的是成長斜率，不是絕對值。AI 工具在進化，基線在移動（紅皇后效應），真正有預測力的是你適應每一次典範轉移的速度。

**Q3：為什麼不加「適應力」和「倫理力」維度？**

適應力不是獨立維度，它是五個維度對時間的微分。一個人的 Command、Delivery、Leverage 分數在 AI 範式轉移之間持續提升，他就是高適應力的。同樣的邏輯適用於「反思迴路」——用 AI 分析和優化自身工作模式的元技能。它表現為五個維度隨時間的上升軌跡，不是第六欄的靜態分數。倫理是底線約束，不是績效指標——違反倫理應該直接取消資格，而不是扣 15 分。

**Q4：維度之間有因果關係，無法精確歸因。**

承認。見上方「維度之間的關係」。框架追求的是更豐富的觀察，不是數學上的正交性。歸因模糊的地方，三層證據架構提供原始數據讓評估者自行判斷——這正是框架的設計意圖：它不取代人類判斷，它給人類判斷更好的材料。

**Q5：框架聚焦個人，但 AI 時代最高價值的貢獻往往是共享認知資產。**

這是 v1 的真實局限。一個人建了一套 Prompt 指令庫讓整個部門都能用、設計了一個讓所有人效率翻倍的 workflow——這種網絡效應確實無法被個人維度完整捕捉。Influence 維度部分觸及，但不夠。團隊版框架——衡量一個人如何放大系統的產能而不只是自己的——是 v2 最重要的演化方向。

**Q6：作者拿自己當案例是倖存者偏差。**

方法論上完全成立。一個框架的設計者當然會挑對自己有利的證據。回應不是否認偏差，而是讓偏差變得結構上不重要：下面案例中的每一項宣稱，都可以透過公開 URL、GitHub repo、或第三方分析 API 獨立驗證。這個案例的價值不是統計上的——它是工程上的。它提供一個完整、可檢視、可複製的藍圖，任何人都能用自己的數據跑一遍。把它想成開源釋出，不是臨床試驗。初始版本難免反映創作者的脈絡，但它的價值取決於社群是否覺得值得 fork、攻擊、改進。

---

## 案例驗證：Paulkuo.tw

為了驗證框架的實際可操作性，我拿自己的數據跑了一遍。我長期投入多項專案推動與企業數位轉型，聚焦於跨領域整合開發、商務拓展及策略落地執行。近半年亦積極導入 AI Agent 應用，為個人與企業賦能，提升決策效率、優化營運流程，加速組織數位升級與成長。以下所有數據皆可公開驗證。

**Command：L4（Architect）。** 維護 7 套以上的自訂 AI workflow 規格（包括 v2.3 的寫作規範、多 session 交接協定、社群發布管線），從 12 次生產事故中提煉出可複用的決策規則，同時調度四種以上 AI 模型並設有路由邏輯（例：中文語音用 Qwen、英文用 Groq、其他語言用 Deepgram）。CI/CD 管線包含每日自動評估、排程數據更新、單次 commit 觸發四語言內容生成。全部記錄在 [github.com/zarqarwi](https://github.com/zarqarwi)。

**Delivery：L4（Architect）。** 產出包括：[paulkuo.tw](https://paulkuo.tw) 上 80 多篇四語言文章、三個已部署的網頁工具（AI-Ready Dashboard、Builder's Scorecard、社群動態牆）、一個 55 語言的 Chrome 擴充功能（Claude 用量喵喵）、一套三路語音辨識的即時會議記錄系統（Agora Translator）、一個完成定價策略並上架 momo 的電商營運（每日餐桌）。每一項都可以在線上直接看到。

**Leverage：L3-4。** 以上所有東西由一個人建置和維護。Timing App 的時間追蹤數據整合在網站的即時儀表板上，提供實際認知投入時數。同時維護 8 個以上活躍專案——橫跨軟體開發、內容出版、電商、顧問——傳統上需要五到八人團隊。

**Quality：L3。** GitHub Actions 自動化 CI/CD 部署搭配 pre-commit hooks、兩階段事實查核協定（L1 素材查證 + L2 成稿查證）應用於全部 82 篇文章、AI-Ready 評估系統對自身基礎設施的評分為 90/100。Cloudflare 網站分析透過密碼保護的儀表板提供獨立流量數據。

**Influence：L2。** 這是我最弱的維度——我知道。開源專案存在（claude-usage-nyan、multi-agent-debate-engine）但社群互動有限。社群媒體在 X、Threads、Bluesky 上活躍但尚未規模化。LinkedIn 和 Medium 完全沒用。重要的演講和外部方法論引用幾乎為零。

框架的診斷價值在這裡就看得到：它不只是驗證強項，它用令人不舒服的精確度暴露了弱項在哪裡。我的 Command 和 Delivery 很強，Influence 直接告訴我下一步該做什麼。

但更關鍵的觀察不是分數本身，是證據的性質。上面每一項宣稱都可以透過公開 URL、GitHub repo、或網站分析 API 獨立驗證。沒有任何一項只靠自我宣稱。這就是這個框架跟所有問卷式評估的根本差異：證據存在於系統之外。

---

## 不做 AI 生產力度量的代價：能力落差正在隱形擴大

為什麼這件事重要？因為不做度量的代價，比做錯度量更大。

Anthropic Economic Index 記錄了一個 deskilling 效應：AI 優先接管工作中的高技能成分，留下低技能的部分。如果我們無法辨識誰真正擅長 AI 協作，高能力者會被系統性低估，而面試表現好但實際產出差的人會被高估。

生產力差距是真實的、而且在擴大。大學程度任務被 AI 加速 12 倍，高中程度只有 9 倍。這不是隨時間慢慢累積的小差距——這是結構性的分歧。而且目前對勞動市場完全不可見，因為沒有度量系統能把它顯現出來。

關於這個主題「在 AI 時代，生產力該怎麼算？」，我用多模型交叉比對驗證，幾個誠實的局限變得更清楚了：

**個人 vs 系統價值。** 框架衡量個人產出，但 AI 時代最有價值的貢獻往往是共享認知資產——整個部門都在用的 Prompt 庫、讓所有人加速的自動化 workflow。衡量一個人如何放大系統的產能——而不只是自己的——是 v2 最重要的延伸方向。

**反思迴路。** AI 協作中最高階的技能，可能是用 AI 分析和優化自己的工作模式——一種驅動所有維度成長的元認知能力。目前的框架透過分數的時間軌跡間接捕捉，但沒有明確衡量。未來版本可以把自我迭代速度作為一級信號。

**跨組織遷移性。** AI 協作發生在極其不同的文化、法律、經濟脈絡中。集體主義文化可能系統性地壓低自評分數。GDPR 限制自動數據抓取。小型組織負擔不起 AI 校驗的基礎設施。一個只在資源充沛的英語系科技公司才能用的框架，不是真正通用的框架。

**公平性與可及性。** 能取得最新 AI 工具的人在這個框架裡天然佔優勢。如果度量系統本身放大了數位落差而不是揭示能力，它就失敗了。

這些不是要掩蓋的缺陷。它們是下一輪迭代的研究方向。

但一個不完美框架的替代方案，不是一個完美的框架——是根本沒有框架。是繼續用履歷上的關鍵字和面試時的印象來評估 AI 協作能力，在一個「熟悉 AI 工具」和「能用 AI 一個人做整個團隊的事」之間差了一個數量級的世界裡。

能被量化的，才能被重視。不能的，就會隱形。

AI Collaboration Portfolio 是第一次嘗試，讓隱形的變成可見的。它是一張不完美的地圖。但替代方案不是一張更好的地圖——是蒙著眼睛在新大陸上狂奔。

→ *試試看：[paulkuo.tw/tools/ai-collab-portfolio/](https://paulkuo.tw/tools/ai-collab-portfolio/)*

---

### 參考文獻

1. Brooks, F. P. (1975). *[The Mythical Man-Month: Essays on Software Engineering](https://en.wikipedia.org/wiki/The_Mythical_Man-Month)*. Addison-Wesley.
2. Dakan, R. & Feller, J. (2025). "Framework for AI Fluency." Ringling College of Art and Design / University College Cork. Version 1.5.
3. Anthropic. (2026, January). "[Anthropic Economic Index report: Economic primitives](https://www.anthropic.com/research)." anthropic.com/research.
4. Anthropic. (2026, March). "Anthropic Economic Index report: Learning curves." anthropic.com/research.
5. Anthropic. (2026, March). "Estimating AI productivity gains from Claude conversations." anthropic.com/research.
6. Anthropic. (2026, March). "Labor market impacts of AI: A new measure and early evidence." anthropic.com/research.
7. [US Department of Labor](https://www.dol.gov/). (2026, February). "AI Literacy Framework."
8. [Alan Turing Institute](https://www.turing.ac.uk/) / UK DSIT. (2025). "AI Skills for Business Competency Framework." Version 3.
9. [UNESCO](https://www.unesco.org/). (2026). "AI competency framework for students." unesdoc.unesco.org.
10. Schleiger, E. et al. (2025). "Generative AI in Human-AI Collaboration: Validation of the Collaborative AI Literacy and Collaborative AI Metacognition Scales." *Interacting with Computers*. Taylor & Francis.
11. Chee, K.N. et al. (2025). "A Competency Framework for AI Literacy." *British Journal of Educational Technology*. Wiley.

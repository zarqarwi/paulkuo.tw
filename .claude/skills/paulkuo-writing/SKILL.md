---
name: paulkuo-writing
description: "Writing standard and quality control for paulkuo.tw articles. Use this skill whenever Paul asks to write, rewrite, edit, improve, audit, or fact-check articles for paulkuo.tw. Also trigger when working with markdown files in the zarqarwi/paulkuo.tw repository under src/content/articles/, when discussing article frontmatter fields, when upgrading articles from draft/rough to finished quality, or when Paul mentions 寫作腳本, 六幕結構, 文章改寫, 半成品, 毛坯, FM補齊, or content pillar articles. Also trigger for cover image generation, multilingual translation pipeline, or article deployment workflow. Do NOT trigger for social media posts (that is paulkuo-social), Apple Notes drafts, or general conversation."
---

# paulkuo.tw 寫作規格 v2

Paul Kuo 的個人網站文章寫作標準。涵蓋內容產出、封面圖生成、多語言翻譯、到部署上線的完整管線。

## Version

**Current: v2.6** (2026-04-23)

| 版本 | 日期 | 變更摘要 |
|------|------|---------|
| v1.0 | 2026-03 | 初版。六幕結構、FM 17 欄位、L1/L2 查證、品質清單。 |
| v2.0 | 2026-03-19 | 新增：封面圖生成流程、多語言翻譯管線 SOP、完整 Pipeline 定義、與 paulkuo-social skill 的銜接點。 |
| v2.1 | 2026-03-22 | Pipeline Phase 3 重構：Chat 透過 osascript 一站完成（寫檔+產圖+commit+push），移除 Code handoff 依賴。封面圖 osascript 超時 workaround（背景執行模式）。 |
| v2.2 | 2026-03-26 | 新增「AI 味自檢」六項模式檢查（Paul 聲音特徵段落），品質檢查清單加入對應 checkbox。 |
| v2.3 | 2026-04-01 | 新增「SEO + AIO 優化規範」章節。Pipeline Phase 1 整合 SEO+AIO 步驟，品質檢查清單加入 6 項 SEO/AIO checkbox。文章生成即同步完成搜尋引擎與 AI 引擎優化，不再需要事後補做。 |
| v2.4 | 2026-04-16 | 修復 SKILL.md 內 pillar enum 錯別字（circular-economy → circular，2 處）。新增「Pillar 白名單（硬性驗證）」章節，含五值對照表、常見錯誤、build 失敗訊號、pre-push 驗證指令。品質檢查清單新增 pillar 驗證項（列為第一項）。 |
| v2.5 | 2026-04-23 | AI 味自檢從六項擴充為九項。新增：對仗式否定句（英文 Not X but Y 直譯）、概念名詞化（○○感/○○性軟綿綿詞組）、沒有氣味的抽象金句。新增「可拍成電影」五秒測試、讀出聲音測試、人味本質定義、具體修改方向指引。 |
| v2.6 | 2026-04-23 | AI 味自檢再擴充三項（共十二項）。新增：慣用詞黑名單（賦能/底層邏輯等）、段落長度均勻、過度平衡病（不必要的多方觀點）。素材來源：英中文編輯圈網路搜集整合。 |

**演化規則：**
- MINOR（v2.1, v2.2...）：欄位調整、查核規則更新、翻譯規則微調
- MAJOR（v3.0...）：架構變更（如新增語言、Pipeline 重構、skill 拆分）
- 每次修改在此表新增一行

---

## 文章完整產出 Pipeline

### Phase 1：內容產出（Chat）
1. 素材收集 + L1 素材查證 → Paul 確認
2. 中文定稿（六幕結構 + FM 17 欄位）
3. **SEO + AIO 優化**（見「SEO + AIO 優化規範」章節）— 在定稿階段同步完成，不事後補做
4. L2 成稿查證 + 引用 spot check → Paul 確認
5. 封面圖生成（見「封面圖生成」章節）
6. 內文配圖（如需要，Visualizer 生成或截圖）
7. 多語言翻譯 en / ja / zh-cn（見「多語言翻譯管線」章節）
8. 品質檢查清單全過

### Phase 2：地端確認（Paul）
8. Paul 本機確認中文版 + 圖片呈現
9. Paul 確認翻譯品質（至少掃一眼）

### Phase 3：部署上線（Chat 透過 osascript — 不由 Paul 手動執行）
10. Chat 透過 `Control your Mac:osascript` 寫入 4 語言版本檔案到 repo
11. Chat 透過 osascript 執行 commit + push（必須用 && 串聯）
12. CI/CD 自動部署 + 上線驗證

**⚠️ 不再產出 Code handoff。** 所有檔案操作由 Chat 透過 osascript 直接在 Paul 的 Mac 上完成。

### Phase 4：收尾
13. 儀表板更新（Apple Notes 專案狀態儀表板）
14. [選做] 觸發 paulkuo-social skill 產社群素材

---

## Frontmatter 規格（17 欄位，全部必填）

### 人類讀者欄位（12 項）

```yaml
title: "文章標題"
subtitle: "一句話立場宣言 + 核心關鍵字"
description: "SEO 用，2-3 句概述，含核心數據亮點與關鍵字"
abstract: |
  3-5 句。包含核心論點 + Paul 為什麼寫這篇 + 讀者能得到什麼。
date: 2025-01-01
updated: 2026-02-28
pillar: ai                # ai | circular | faith | startup | life
tags:
  - 關鍵詞1
cover: "/images/covers/{slug}.jpg"
featured: false
draft: false
readingTime: 5
```

### AI/Machine 欄位（5 項）

```yaml
# === AI / Machine 專用欄位 ===
thesis: "一句話核心主張"
domain_bridge: "領域A × 領域B × 領域C"
confidence: high
content_type: essay
related_entities:
  - name: 某人或概念
    type: Person
reading_context: |
  描述適合什麼樣的讀者。
```

---

## Pillar 白名單（硬性驗證）

`pillar` 是 Astro content collection schema 的 enum 欄位。合法值**只有五個短代碼**：

| 值 | 中文名 | 典型主題 |
|----|--------|---------|
| `ai` | 智能與秩序 | AI 技術、數位秩序、演算法社會 |
| `circular` | 循環再利用 | 循環經濟、ESG、永續、材料流 |
| `faith` | 文明與人性 | 神學、倫理、文明反思 |
| `startup` | 創造與建構 | 創業、產品、工程實踐 |
| `life` | 沉思與記憶 | 個人反思、哲學、生命經驗 |

常見錯誤：`circular-economy`（應為 `circular`）、`AI`（應為 `ai`，小寫敏感）。
Build 失敗時會丟 `InvalidContentEntryDataError`，不會在 L1/L2 被抓到。

Pre-push 驗證：
```bash
grep -rh "^pillar:" src/content/articles*/ | awk -F": " "{print \$2}" | sort -u | grep -vE "^(ai|circular|faith|startup|life)\$"
```
預期輸出為空。

---

## 內容結構：六幕敘事

1. **開場鉤子**（無標題）：具體場景、數字、對話、或個人經驗。絕對不寫「本文探討⋯」。
2. **張力建立**：揭露矛盾或反直覺的事實。
3. **展開分析**：2-3 段，帶入外部知識 + Paul 的跨域視角。
4. **Paul 經驗接入**：個人經歷——至少一處明確的 Paul 聲音。
5. **觀點收斂**：回到 thesis，但比開頭更深一層。
6. **結尾**：不是摘要。是一個餘韻——問題、畫面、或行動呼籲。

---

## Paul 的聲音特徵

### 語氣規則
- 口語化但不隨便。像跟聰明朋友在咖啡廳聊深度話題。
- 禁用：「首先、其次、最後」「值得注意的是」「鑑於此」。
- 台灣用語：影片、軟體、網路、品質、想法（不用大陸用詞）。
- 可以有情緒，但克制。不煽情。

### 思維特色
- 跨域連結是招牌：AI × 神學、半導體 × 循環經濟、創業 × 文明觀察。
- 不怕表態，但表態有根據。
- 偏好結構性分析（「不是個人問題，是系統問題」）。
- 常用概念：能量主權、秩序、超級個體、結構性的罪。

### 開頭手法
- **場景法**：「一位人資朋友跟我吃飯時講了一件事⋯」
- **數字衝擊法**：「我看到一個數字，停下來了。」
- **假設情境法**：「你被任命為科技部長⋯」
- **結論先行法**：「12 天。23,000 行程式碼。一個不會寫程式的人⋯」

### 結尾手法
- **問題餘韻**：「金絲雀已經在哀鳴。但我們做了什麼改變？」
- **行動召喚**：「你只需要把『我不會』改成『我來試看看』的決定。」
- **意象收束**：「有趣，往往就是通往偉大的唯一方向。」

### AI 味自檢（推 GitHub 前掃一遍）

**人味的本質：你有活過的證據。** 具體的時間、地點、人名。不對稱的句子。有汗、有油、有溫度的細節。一個你能看見的「誰」，而不是「人們」。AI 寫字的來源是統計平均值——把一百萬篇文章融在一起的共同樣貌。Paul 寫字只有一個來源：自己這具身體，自己的經歷。

以下十二種模式是 AI 輔助寫作最常不自覺滲入的。每篇完稿後快速掃描，命中就改寫：

1. **對仗式否定句**：「她不是 X，她是 Y」「這不是 A，這是 B」— 英文 Not X, but Y 的直譯，能用最少的字製造最大的「金句感」，但通常只是把同一句話說兩遍。人味版本用「而」結構加上具體脈絡：「她哀悼的其實不是過去，而是再也回不去的童年——那個還相信故事會有結局的自己。」

2. **二元對比句型**：「X 不僅僅是 Y，更是 Z」「真正的關鍵不在 A，而在 B」— 一篇出現超過一次就該警覺。

3. **遞進三連（乾淨的甜）**：「高效。精準。零成本。」「她笑著、流著淚、輕輕地擁抱了那個曾經的自己。」三個短句排比當結論——太工整、太對稱、太有節奏感。**測試方法：把段落讀出聲音。如果讀起來像演講比賽稿或頒獎典禮致詞，就太甜了。**

4. **假主詞**：「數據說出了真相」「市場給出了答案」「技術正在重塑未來」— 無生命的東西不會主動做事，換成具體的人或行為。

5. **萬用填空體**：「掌握 X 就等於掌握 Y 的核心競爭力」「如果你還在用舊方法，你注定被淘汰」— 把主詞換掉整句還成立的，就是空話。

6. **概念名詞化（軟綿綿）**：「自我的探索」「認同感的建構」「孤獨的覺察」「情感的流動」— 把動詞變成名詞、把具體的東西吹成霧。改法：「找自己」「知道自己是誰」「發現自己很寂寞」「哭了 / 笑了」。好的中文靠動詞推動，堆名詞堆不出力氣。

7. **沒有氣味的抽象金句**：「成長是一段孤獨的旅程，需要勇氣去面對內在的真實。」— 你聞不到任何東西，看不到任何人。人寫東西是從身體寫的，會有溫度、氣味、聲音、皮膚的感覺。**五秒測試：這段文字，你能拍成電影嗎？如果不能，基本上就是 AI 產的。**

8. **假脆弱開場**：「老實說，我以前也這樣迷惘過」「這篇可能會得罪人」— Paul 的個人經驗是具體的（場景、時間、人物），不是這種沒有細節的假坦白。

9. **儀式感結尾**：「讓我們拭目以待」「你準備好了嗎」「這不是科幻，是現實」— Paul 的結尾要有餘韻，不是口號。


10. **慣用詞黑名單**：「賦能」「底層邏輯」「維度」「格局」「閉環」「破圈」「生態」「躍遷」「範式」「降維」——這些詞本身不是錯，但在一篇文章裡出現兩次以上就是 AI 組裝語言的訊號。用白話取代：「賦能」→「讓人可以」，「底層邏輯」→「根本原因」，「範式」→「做事的方式」。

11. **段落長度太均勻**：掃一眼全文的段落，如果每段都差不多長——三到五行，整整齊齊——那就是 AI。人類寫作有時一段只有一句，有時突然跑出一個很長的段落，然後又急速收短。不對稱才是真實的節奏。**改法：主動插入一個只有一行的短段，強調一個關鍵轉折。**

12. **過度平衡病**：「當然，也有人認為⋯⋯」「這個問題確實有兩面性⋯⋯」「不同立場的人可能會有不同看法⋯⋯」— AI 被訓練成永遠不得罪人，所以在不需要平衡的地方也自動加上反方觀點，讓文章失去立場和力度。Paul 的文章本來就有明確主張，潤稿時特別容易被 AI 稀釋掉。命中就砍，保留原本的立場。

**修改方向：** 把「在某個午後」改成「上禮拜三下午三點」。把「我認識一個朋友」改成「我大學同學阿芳」，再加一句她那天喝的是冰拿鐵還是熱美式。如果一個句子把主題詞替換掉、放到任何文章裡都成立，那它就沒有 Paul 的密度，砍掉重寫。

---

## SEO + AIO 優化規範

每篇文章在定稿階段就要同步完成以下優化。

### FM 關鍵字強化
- **subtitle**：除了立場宣言，要包含 1-2 個搜尋目標關鍵字。
- **description**：2-3 句，帶入核心數據亮點（如具體數字）和關鍵字。
- **tags**：5-7 個，涵蓋主題詞、技術棧、方法論、領域詞。不只放大類，要放具體搜尋會用到的詞。
- **thesis**：用可量化的語言，避免「蘊含巨大潛能」這種模糊說法。
- **domain_bridge**：具體化到能被 AI 模型抓取為交叉領域特徵。

### TL;DR 摘要區塊
在正文開頭插入 blockquote 格式的 TL;DR（> **TL;DR** — ...），保持在 3 行以內。
Google Featured Snippet 和 Perplexity、ChatGPT Search 會優先擷取。

### H2 標題問題化 / 關鍵字化
優先用問句或帶關鍵字的陳述句。保留一個文學感標題作為結尾。每個 H2 要能獨立成為一個搜尋結果的標題。

### 關鍵數據區塊
有量化數據的分析文和 case study 在段落後插入：
> **📊 關鍵數據**
> - **[指標名]**：[數值]（[來源]）

### 外部權威連結
政府/機構數據來源、書名首次出現、組織/協會首次提及時加連結。

### 已自動化（不需逐篇處理）
- JSON-LD BlogPosting + BreadcrumbList
- robots.txt 8 個 AI 爬蟲 Allow
- llms.txt / llms-full.txt 動態產生
- OpenGraph meta + hreflang
- sitemap-index.xml 自動更新

---

## 站內互連規則

- 用 Markdown 連結：`[文章名](/articles/slug)`
- 自然嵌入段落中，不另起「延伸閱讀」段落。
- 每篇至少嘗試連結 1 篇站內文章（同柱子優先，跨柱子更好）。

---

## 封面圖生成

### 規格
- 尺寸：1792×1024（DALL-E 3 HD 橫幅）
- 輸出格式：JPG，壓縮品質 85%
- 存放路徑：`public/images/covers/{slug}.jpg`

### 風格規範（對齊內容柱子色系）

| 柱子 | 基底色 | 強調色 | 視覺意象 |
|------|--------|--------|---------|
| ai | 深藍 #1a1a3e | 電光藍 #4A90D9 / 霓虹紫 #8B5CF6 | 神經網路、數據流、光線交織 |
| circular | 深綠 | 翡翠綠 #059669 / 大地色 | 循環箭頭、材料流、綠色工業 |
| startup | 深灰 | 暖橘 / 琥珀 #B45309 | 工作場景、路徑分叉、建造意象 |
| faith | 深金 / 石墨 | 金色 / 暖白 | 建築結構、光影、書頁 |
| life | 深藍灰 | 柔藍 / 淡粉 #7C3AED | 日常場景、窗景、城市剪影 |

共通規則：不含文字；乾淨現代略帶抽象；留白足夠。

### 技術鏈
Chat 寫 DALL-E prompt → osascript 在 Mac 跑 Python → DALL-E 3 API → urllib 下載 PNG → sips 壓縮轉 JPG。
DALL-E 3 API 回應 30-60 秒，必須用 nohup 背景模式執行，不能用同步 do shell script。

### 已知坑
1. osascript 不讀 .zshrc，需用 /bin/zsh -l -c
2. Python 3.13 SSL 需加 ssl._create_default_https_context = ssl._create_unverified_context
3. openai SDK 裝在 user site-packages，系統 Python 找不到
4. API key 在 ~/.zshrc 的 OPENAI_API_KEY

---

## 多語言翻譯管線

### 檔案結構
src/content/articles/ 下：{slug}.md（主檔）、en/{slug}.md、ja/{slug}.md、zh-cn/{slug}.md

### FM 欄位翻譯規則
**要翻**：title, subtitle, description, abstract, thesis, domain_bridge, reading_context, tags
**不動**：pillar, date, updated, cover, featured, draft, readingTime, confidence, content_type, related_entities

### 各語言注意事項
- **English**：自然英文表達，保留 Paul 的口語感（conversational but not casual）
- **日本語**：敬體（です/ます）為基調，技術術語保留英文
- **簡體中文**：主動調整用語（軟體→软件、網路→网络、品質→质量）

---

## 事實查核 SOP

### 觸發規則
- 新文章完稿 / 舊文改寫：L1 + L2
- 既有完成文章修訂：L2 only
- 純 FM 補齊：不觸發
- 社群貼文：僅具體數據

### L1：素材查證（寫作前）
掃描所有事實宣稱，四欄格式：原文 / 問題 / 修正版 / 改了什麼。
只列 corrected 和 unverifiable。Paul 確認後才進改寫。

### L2：成稿查證（推 GitHub 前）
查核結果：confirmed / corrected / unverifiable / approximation。
Paul 確認後才推 GitHub，corrected/unverifiable 必須全部處理完。

**要查**：人名+頭銜、研究/論文引用、統計數字、因果宣稱、時間線、引述
**不查**：Paul 個人經驗和觀點、公認常識、比喻和修辭

### 發布前引用 Spot Check
每篇推 GitHub 前，掃描所有引用外部來源的段落，逐條 spot check（人名、數據、歸因、引述——逐條 web search 驗證）。

---

## 品質檢查清單

推 GitHub 前逐項確認：

- [ ] **pillar 值在白名單內**（ai | circular | faith | startup | life）
- [ ] FM 17 欄位齊全
- [ ] subtitle 是立場不是摘要
- [ ] abstract 有 Paul 為什麼寫的動機
- [ ] thesis 一句話可獨立引用
- [ ] domain_bridge 至少跨兩個領域
- [ ] 開頭前三行能抓住注意力（場景/數字/問題）
- [ ] 至少一處明確的 Paul 個人經驗
- [ ] 至少一處站內連結
- [ ] 結尾不是摘要重述，有餘韻
- [ ] 無大陸用語
- [ ] AI 味自檢通過（十二項模式無命中，或已改寫）
- [ ] L1 素材查證已完成（Paul 已確認）
- [ ] L2 成稿查證已完成（corrected/unverifiable 全部處理）
- [ ] 引用外部來源 spot check（人名、數據、歸因、引述——逐條 web search 驗證）
- [ ] 封面圖已生成（JPG, 1792×1024, 放在 public/images/covers/）
- [ ] 4 語言版本翻譯完成（tags 已翻、FM 文字欄位已翻）
- [ ] 4 語言版本同步（如有修正）
- [ ] subtitle 含搜尋目標關鍵字
- [ ] description 含核心數據亮點
- [ ] tags 5-7 個（含技術棧詞 + 領域交叉詞，避免純抽象詞）
- [ ] TL;DR blockquote 已插入文章開頭
- [ ] H2 標題問題化/關鍵字化（至少 3 個 H2 含可搜尋問句，保留 1 個文學感標題）
- [ ] 外部權威連結 ≥ 2 條

---

## 三級文章分類標準

| 級別 | 檔案大小 | FM 完整度 | 內容特徵 |
|------|---------|----------|---------|
| ✅完成 | >6KB | 17欄全有 | 六幕結構、Paul聲音、站內連結 |
| ⚠️半成品 | 3-6KB | 缺3+機器欄位 | 內容OK但缺結構或聲音 |
| ❌毛坯 | <3KB | 僅基本欄位 | 壓縮摘要，需從頭改寫 |

---

## 改寫工作流程

1. 讀取現有文章，對照本規格判斷缺什麼
2. L1 素材查證 → Paul 確認
3. 補齊 FM 欄位
4. 改寫/補強內容，確保六幕結構 + Paul 聲音
5. L2 成稿查證 → Paul 確認
6. 跑品質檢查清單（含查核確認項 + 引用 spot check）
7. 封面圖生成（如尚未有）
8. 多語言翻譯（en / ja / zh-cn）
9. 給 Paul 確認後推 GitHub（一篇一推）

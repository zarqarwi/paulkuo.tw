---
name: paulkuo-writing
description: "Writing standard and quality control for paulkuo.tw articles. Use this skill whenever Paul asks to write, rewrite, edit, improve, audit, or fact-check articles for paulkuo.tw. Also trigger when working with markdown files in the zarqarwi/paulkuo.tw repository under src/content/articles/, when discussing article frontmatter fields, when upgrading articles from draft/rough to finished quality, or when Paul mentions 寫作腳本, 六幕結構, 文章改寫, 半成品, 毛坯, FM補齊, or content pillar articles. Also trigger for cover image generation, multilingual translation pipeline, or article deployment workflow. Do NOT trigger for social media posts (that's paulkuo-social), Apple Notes drafts, or general conversation."
---

# paulkuo.tw 寫作規格 v2

Paul Kuo 的個人網站文章寫作標準。涵蓋內容產出、封面圖生成、多語言翻譯、到部署上線的完整管線。

## Version

**Current: v2.4** (2026-04-16)

| 版本 | 日期 | 變更摘要 |
|------|------|---------|
| v1.0 | 2026-03 | 初版。六幕結構、FM 17 欄位、L1/L2 查證、品質清單。 |
| v2.0 | 2026-03-19 | 新增：封面圖生成流程、多語言翻譯管線 SOP、完整 Pipeline 定義、與 paulkuo-social skill 的銜接點。 |
| v2.1 | 2026-03-22 | Pipeline Phase 3 重構：Chat 透過 osascript 一站完成（寫檔+產圖+commit+push），移除 Code handoff 依賴。封面圖 osascript 超時 workaround（背景執行模式）。 |
| v2.2 | 2026-03-26 | 新增「AI 味自檢」六項模式檢查（Paul 聲音特徵段落），品質檢查清單加入對應 checkbox。 |
| v2.3 | 2026-04-01 | 新增「SEO + AIO 優化規範」章節。Pipeline Phase 1 整合 SEO+AIO 步驟，品質檢查清單加入 6 項 SEO/AIO checkbox。文章生成即同步完成搜尋引擎與 AI 引擎優化，不再需要事後補做。 |
| v2.4 | 2026-04-16 | 修復 SKILL.md 內 pillar enum 錯別字（`circular-economy` → `circular`，2 處）。新增「Pillar 白名單（硬性驗證）」章節，含五值對照表、常見錯誤、build 失敗訊號、pre-push 驗證指令。品質檢查清單新增 pillar 驗證項（列為第一項）。觸發事件：2026-04-16 SB 253 文章因此錯別字導致 Build & Deploy #3642 失敗。 |

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
    - 用 `do shell script "python3 -c '...'"` 或 `cat > path << 'EOF'` 寫檔
    - 配圖（手繪圖、截圖等）用 `sips` 壓縮後 `cp` 到 `public/images/articles/`
11. Chat 透過 osascript 執行 commit + push：
    ```
    do shell script "cd ~/Desktop/01_專案進行中/paulkuo.tw && git add -A && git commit -m 'feat(article): ...' && git push origin main 2>&1"
    ```
    - 必須用 `&&` 串聯，不能分開跑（cron 每 10 分鐘 stash/pop 會清掉 staging）
    - pre-commit hook 輸出可能干擾 osascript，但 commit 通常仍成功，用 `git log --oneline -1` 確認
    - 如果 push 失敗，先 `git pull --rebase origin main` 再 push
12. CI/CD 自動部署 + 上線驗證（osascript curl 或請 Paul 瀏覽器確認）

**⚠️ 不再產出 Code handoff。** 所有檔案操作由 Chat 透過 osascript 直接在 Paul 的 Mac 上完成。
Code session 僅在需要大量程式碼修改、grep 偵察、或複雜 git 操作時才介入。

### Phase 4：收尾
13. 儀表板更新（Apple Notes「🎛️ 專案狀態儀表板」）
14. [選做] 觸發 paulkuo-social skill 產社群素材：
    - 母文 = title + subtitle + abstract + thesis
    - 最小發布：X + Threads（已通管線）
    - 預備發布：LinkedIn / Bluesky / FB / Medium（規則已定，版本先產出備用）
    - 社群配圖另外用 DALL-E 生成（4:5 直幅，規格見 social skill）

---

## Frontmatter 規格（17 欄位，全部必填）

### 人類讀者欄位（12 項）

```yaml
title: "文章標題"
subtitle: "一句話立場宣言 + 核心關鍵字（不是摘要，但要含搜尋目標詞）"
description: "SEO 用，2-3 句概述，含核心數據亮點與關鍵字"
abstract: |
  3-5 句。包含核心論點 + Paul 為什麼寫這篇 + 讀者能得到什麼。
date: 2025-01-01          # 首發日期
updated: 2026-02-28       # 最近修改日期
pillar: ai                # ai | circular | faith | startup | life（必須五選一，打錯會 build fail）
tags:
  - 關鍵詞1               # 5-7 個（含技術棧、方法論、領域詞）
  - 關鍵詞2
cover: "/images/covers/{slug}.jpg"
featured: false
draft: false
readingTime: 5            # 預估閱讀分鐘數（整數）
```

### AI/Machine 欄位（5 項，放在註解後）

```yaml
# === AI / Machine 專用欄位 ===
thesis: "一句話核心主張（可獨立引用的濃縮版）"
domain_bridge: "領域A × 領域B × 領域C"
confidence: high           # high / medium / low
content_type: essay        # essay / analysis / case-study / reflection
related_entities:
  - name: 某人或概念
    type: Person           # Person / Concept / Organization / Framework
reading_context: |
  描述適合什麼樣的讀者。
```

---

## Pillar 白名單（硬性驗證）

`pillar` 是 Astro content collection schema 的 enum 欄位。合法值**只有五個短代碼**：

| 值 | 中文名 | 色系 | 典型主題 |
|----|--------|------|---------|
| `ai` | 智能與秩序 | 深藍 × 電光藍 | AI 技術、數位秩序、演算法社會 |
| `circular` | 循環再利用 | 深綠 × 翡翠綠 | 循環經濟、ESG、永續、材料流 |
| `faith` | 文明與人性 | 深金 × 暖白 | 神學、倫理、文明反思 |
| `startup` | 創造與建構 | 深灰 × 暖橘 | 創業、產品、工程實踐 |
| `life` | 沉思與記憶 | 深藍灰 × 柔藍 | 個人反思、哲學、生命經驗 |

### 常見錯誤對照

| ❌ 錯誤寫法 | ✅ 正確寫法 | 原因 |
|-----------|-----------|------|
| `circular-economy` | `circular` | 白名單是短代碼 |
| `circular_economy` | `circular` | 同上 |
| `AI` / `Ai` | `ai` | 小寫敏感 |
| `Life` | `life` | 小寫敏感 |
| `tech` / `technology` | `ai` 或 `startup`（看主題） | 不在白名單 |
| `esg` / `sustainability` | `circular` | 不在白名單 |

### Build 失敗訊號

若 pillar 填錯，`npm run build` 會在 `content sync` 階段丟 `InvalidContentEntryDataError`：

```
articles → {slug} data does not match collection schema.
pillar: Invalid enum value. Expected 'ai' | 'circular' | 'faith' | 'startup' | 'life', received '{你填錯的值}'
```

這個錯誤**不會**在 L1/L2 查證階段被抓到，必須靠 pre-commit 或品質檢查清單第一項。

### Pre-push 驗證指令

任何新文章或 frontmatter 修改，推 GitHub 前跑：

```bash
# 掃描所有 article 檔的 pillar 欄位，列出非白名單值
grep -rh "^pillar:" src/content/articles*/ | \
  awk -F': ' '{print $2}' | sort -u | \
  grep -vE "^(ai|circular|faith|startup|life)$"
```

**預期輸出為空**。任何非空輸出代表有檔案 pillar 值不合法，需修正。

---

## 內容結構：六幕敘事

用 `##` 標題分段，通常 5-8 段。不用明寫幕次，但邏輯要依序：

1. **開場鉤子**（無標題，直接進）：具體場景、數字、對話、或個人經驗。絕對不寫「本文探討⋯」。
2. **張力建立**：揭露矛盾或反直覺的事實。
3. **展開分析**：2-3 段深入探討，帶入外部知識 + Paul 的跨域視角。
4. **Paul 經驗接入**：個人經歷、SDTI/CircleFlow、創業經驗、神學訓練——至少一處明確的 Paul 聲音。
5. **觀點收斂**：回到 thesis，但比開頭更深一層。
6. **結尾**：不是摘要。是一個餘韻——問題、畫面、或行動呼籲。短。

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

### 開頭手法（從完成文章歸納）
- **場景法**：「一位人資朋友跟我吃飯時講了一件事⋯」
- **數字衝擊法**：「我看到一個數字，停下來了。」
- **假設情境法**：「你被任命為科技部長⋯」
- **結論先行法**：「12 天。23,000 行程式碼。一個不會寫程式的人⋯」

### 結尾手法
- **問題餘韻**：「金絲雀已經在哀鳴。但我們做了什麼改變？」
- **行動召喚**：「你只需要把『我不會』改成『我來試看看』的決定。」
- **意象收束**：「有趣，往往就是通往偉大的唯一方向。」

### AI 味自檢（推 GitHub 前掃一遍）

以下六種模式是 AI 輔助寫作最常不自覺滲入的。每篇完稿後快速掃描，命中就改寫：

1. **二元對比句型**：「X 不僅僅是 Y，更是 Z」「真正的關鍵不在 A，而在 B」— 這是 AI 最愛的句型，一篇出現超過一次就該警覺。
2. **遞進三連**：「高效。精準。零成本。」三個短句排比當結論 — Paul 的節奏不是這樣，用具體描述取代。
3. **假主詞**：「數據說出了真相」「市場給出了答案」「技術正在重塑未來」— 無生命的東西不會主動做事，換成具體的人或行為。
4. **萬用填空體**：「掌握 X 就等於掌握 Y 的核心競爭力」「如果你還在用舊方法，你注定被淘汰」— 把主詞換掉整句還成立的，就是空話。
5. **假脆弱開場**：「老實說，我以前也這樣迷惘過」「這篇可能會得罪人」— Paul 的個人經驗是具體的（場景、時間、人物），不是這種沒有細節的假坦白。
6. **儀式感結尾**：「讓我們拭目以待」「你準備好了嗎」「這不是科幻，是現實」— Paul 的結尾要有餘韻，不是口號。

**判斷原則：** 如果一個句子把主題詞替換掉、放到任何文章裡都成立，那它就沒有 Paul 的密度，砍掉重寫。

---

## SEO + AIO 優化規範

每篇文章在定稿階段就要同步完成以下優化。paulkuo.tw 的 Astro 模板已經自動處理 JSON-LD（BlogPosting + BreadcrumbList）、robots.txt（8 個 AI 爬蟲全開）、llms.txt 動態收錄，所以不需要每篇手動處理這些。以下是需要逐篇處理的內容層優化。

### FM 關鍵字強化

FM 的 subtitle、description、tags、thesis、domain_bridge 是 JSON-LD 和 OG meta 的直接來源，AI 爬蟲會優先讀取這些欄位來理解文章主題。

- **subtitle**：除了立場宣言，要包含 1-2 個搜尋目標關鍵字。格式參考：「{品牌/主題} × {領域}：{立場}」
- **description**：2-3 句，帶入核心數據亮點（如具體數字、百分比）和關鍵字。這段文字會出現在 Google 搜尋結果的摘要。
- **tags**：5-7 個，涵蓋主題詞、技術棧（如 Cloudflare Workers）、方法論（如遊戲化設計）、領域詞。不只放大類，要放具體搜尋會用到的詞。
- **thesis**：用可量化的語言。避免「蘊含巨大潛能」這種模糊說法，改成帶具體數字或明確機制的表述。
- **domain_bridge**：具體化到能被 AI 模型抓取為交叉領域特徵，例如「ESG 碳足跡 × 宗教民俗 × 邊緣運算 × 遊戲化設計」而不是「永續 × 信仰 × AI」。

### TL;DR 摘要區塊

在正文開頭（frontmatter `---` 之後、第一段之前）插入一個 blockquote 格式的 TL;DR：

```markdown
> **TL;DR** — [1-2 句核心摘要，帶入關鍵數據和結論。讓 AI 搜尋引擎和快速掃描的讀者在第一眼就抓到全文精華。]
```

這個區塊會被 Google Featured Snippet 和 AI 搜尋引擎（Perplexity、ChatGPT Search）優先擷取。保持在 3 行以內。

### H2 標題問題化 / 關鍵字化

H2 標題是搜尋引擎和 AI 爬蟲判斷文章結構的主要信號。文學感的標題對 SEO 沒幫助。

**原則：**
- 優先用問句（「徒步進香能減多少碳？」）或帶關鍵字的陳述句（「四週打造萬人等級碳足跡追蹤系統」）
- 保留一個文學感標題作為結尾（如「四十萬雙腳的聲音」），但其他 H2 都要有搜尋價值
- 每個 H2 要能獨立成為一個搜尋結果的標題

**對照範例：**
| 文學感（改前） | SEO 友善（改後） |
|-------------|---------------|
| 信仰裡的碳帳本 | 徒步進香能減多少碳？一套計算邏輯 |
| 四週，從零到萬人可用等級的系統 | 四週打造萬人等級碳足跡追蹤系統 |
| 煉氣到飛升：把信仰的儀式感放進數據 | 從煉氣到飛升：九級香客等級的遊戲化設計 |

### 關鍵數據區塊

文章中有明確數據支撐論點時（排放係數、轉換率、比較數字等），在相關段落後插入一個獨立的數據摘要區塊：

```markdown
> **📊 關鍵數據**
> - **[指標名]**：[數值]（[來源]）
> - **[指標名]**：[數值]
> - **[等同/比較]**：[視覺化對比]
```

這讓 AI 搜尋引擎能直接擷取結構化數據回答問題，也幫助讀者快速掌握核心數字。不是每篇都需要，但有量化數據的分析文和 case study 一定要做。

### 外部權威連結

文章引用外部數據、概念或人物時，加上指向原始來源的超連結。這對 SEO（outbound authority signals）和 AIO（可追溯性）都有幫助。

**必連的情境：**
- 政府/機構數據來源（如環境部排放係數資料庫）
- 書名首次出現時（連到博客來或出版社頁面）
- 組織/協會首次提及時（連到官網）

**不需要連的：**
- 公認常識（不需要連維基百科說「二氧化碳是溫室氣體」）
- Paul 自己的觀點和經驗
- 已經在站內有對應文章的概念（用站內連結取代）

### 部署後：Google Search Console 提交

每次新文章部署後，四個語言版本的 URL 都要提交 Google Search Console 做 indexing request。這步由 Paul 手動操作（URL 檢查工具 → 要求建立索引，一次一個 URL）。

### 已自動化（不需逐篇處理）

以下由 Astro 模板和站點配置自動處理，列在這裡方便確認：
- ✅ JSON-LD BlogPosting + BreadcrumbList（ArticlePage.astro）
- ✅ robots.txt 8 個 AI 爬蟲 Allow（GPTBot, ClaudeBot, PerplexityBot 等）
- ✅ llms.txt / llms-full.txt 動態產生（新文章自動收錄）
- ✅ OpenGraph meta + hreflang（BaseLayout.astro / SiteHead.astro）
- ✅ sitemap-index.xml 自動更新

---

## 站內互連規則

- 用 Markdown 連結：`[文章名](/articles/slug)`
- 自然嵌入段落中，不另起「延伸閱讀」段落。
- 每篇至少嘗試連結 1 篇站內文章（同柱子優先，跨柱子更好）。

---

## 封面圖生成

每篇文章推 GitHub 前需要封面圖。

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

**共通規則：**
- 不含文字（避免 AI 生成亂碼字）
- 乾淨、現代、略帶抽象的概念插畫
- 留白足夠，構圖不雜亂
- 風格描述：clean modern digital illustration, flat design with subtle depth

### Prompt 設計原則
1. 從文章的 thesis + pillar 萃取視覺意象
2. 基底色 + 強調色從上方柱子色系表取用
3. prompt 結尾固定加：`No text, no watermarks, no letters, no numbers.`
4. 尺寸指定：`Size: 1792x1024, landscape orientation.`

**Prompt 模板：**
```
Create a clean, modern digital illustration. Style: flat design with subtle depth.
Color palette: [基底色] base, [強調色] accents, white highlights.
Subject: [從 thesis + pillar 萃取的視覺意象]
Composition: centered, with breathing room. No text, no watermarks, no letters, no numbers.
Mood: [根據文章情緒：thoughtful / forward-looking / contemplative / urgent]
Size: 1792x1024, landscape orientation.
```

### 技術鏈

**完整路徑：** Chat 寫 DALL-E prompt → osascript 在 Mac 跑 Python → OpenAI DALL-E 3 API 生圖 → urllib 下載 PNG → sips 壓縮轉 JPG → 存到 `public/images/covers/`

**Python 腳本模板（暫存用完即刪，不留 API key 明文）：**
```python
import os, openai, ssl, urllib.request
from subprocess import run

ssl._create_default_https_context = ssl._create_unverified_context
client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

response = client.images.generate(
    model='dall-e-3',
    prompt='YOUR_PROMPT_HERE',
    size='1792x1024',
    quality='hd',
    n=1
)

url = response.data[0].url
urllib.request.urlretrieve(url, '/tmp/cover.png')
run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85',
     '/tmp/cover.png', '--out', 'TARGET_PATH.jpg'])
print('DONE')
```

**執行方式（Chat session 透過 osascript）：**

DALL-E 3 API 回應時間約 30-60 秒，超過 osascript 預設 timeout。必須用背景執行模式：

```applescript
-- Step 1: 寫入 Python 腳本
do shell script "cat > /tmp/gen_cover.py << 'PYEOF'\n...\nPYEOF"

-- Step 2: 背景執行（nohup + &）
do shell script "/bin/zsh -l -c 'nohup python3 /tmp/gen_cover.py > /tmp/gen_cover.log 2>&1 &' && echo 'Started'"

-- Step 3: 等候後查看結果（間隔 15-30 秒）
do shell script "cat /tmp/gen_cover.log 2>&1"

-- Step 4: 驗證圖片
do shell script "ls -la TARGET_PATH.jpg && sips -g pixelWidth -g pixelHeight TARGET_PATH.jpg"

-- Step 5: 清理暫存
do shell script "rm /tmp/gen_cover.py /tmp/gen_cover.log /tmp/cover.png 2>/dev/null; echo 'cleaned'"
```

**⚠️ 不要用同步模式**（`do shell script "python3 script.py"`），會因 API 回應慢導致 osascript timeout。

### 已知坑（必讀）
1. **osascript 環境變數**：`do shell script` 不讀 `.zshrc`，需要用 `/bin/zsh -l -c '...'` 或手動 source
2. **Python 3.13 SSL**：需要加 `ssl._create_default_https_context = ssl._create_unverified_context`
3. **openai SDK 路徑**：裝在 user site-packages（Python 3.13），系統 Python（/usr/bin/python3）找不到
4. **API key 位置**：在 `~/.zshrc` 裡設為 `OPENAI_API_KEY` 環境變數
5. **image_prompt_templates.md**：原本在 `~/02_參考資料/`，已遺失待重建
6. **osascript timeout**：DALL-E API 回應 30-60 秒，同步呼叫會 timeout。必須用 `nohup ... &` 背景模式（見執行方式）
7. **pre-commit hook 干擾**：osascript commit 時 hook 輸出可能導致 osascript 報錯，但 commit 通常已成功。用 `git log --oneline -1` 確認

---

## 多語言翻譯管線

paulkuo.tw 所有文章都有四個語言版本。翻譯品質直接影響 AI crawler 的多語言主題理解。

### 檔案結構

```
src/content/articles/
├── {slug}.md              ← zh-TW 原版（主檔）
├── en/{slug}.md           ← English
├── ja/{slug}.md           ← 日本語
└── zh-cn/{slug}.md        ← 簡體中文
```

四個版本檔名完全相同，只放不同資料夾。

### FM 欄位翻譯規則

**要翻的（影響 JSON-LD keywords / OG meta / AI 語意理解）：**
- title, subtitle, description, abstract, thesis
- domain_bridge, reading_context
- tags — 全部翻成對應語言（專有名詞如 Vibe Coding, DALL-E 等不翻）

**不動的：**
- pillar, date, updated, cover, featured, draft, readingTime
- confidence, content_type
- related_entities（人名不翻，type 欄位不翻）

### 正文翻譯規則
- 全文翻譯，保持段落結構一致
- 站內連結路徑不變（`/articles/...`，Astro 各語言 page route 會自動加 prefix）
- 產品/工具名稱不翻（Builder's Scorecard, CircleFlow, Agora Plaza 等）
- 人名不翻
- 圖片路徑不變

### 各語言注意事項

**English (en)：**
- 自然的英文表達，不是逐句直譯
- Paul 的口語感要保留（conversational but not casual）

**日本語 (ja)：**
- 敬體（です/ます）為基調，但分析段落可用常體增加力度
- 技術術語保留英文原文（AI Agent, LLM 等）

**簡體中文 (zh-cn)：**
- OpenCC S2T 轉換不夠，用語要主動調整（軟體→软件、網路→网络、品質→质量）
- 注意語境差異：台灣說法要轉成大陸讀者習慣的表達

### AI-Ready 考量
- tags 翻譯直接影響 JSON-LD `keywords` 欄位，這是 AI crawler 理解文章主題的關鍵信號
- hreflang 由 Astro build 自動產生（SiteHead.astro），不需手動處理
- 每個語言版本的 OG locale 也自動處理（zh_TW / en_US / ja_JP / zh_CN）
- `llms.txt` 和 `llms-full.txt` 目前只列 zh-TW 路徑，多語言索引是未來優化項目

### 翻譯執行方式
- Chat 產出翻譯內容 → Chat 透過 osascript 直接寫入 repo 對應路徑
- 修正時四語言版本必須同步更新
- 寫入方式：osascript `do shell script "python3 -c '...'"` 或 `cat > path << 'EOF'`

---

## 事實查核 SOP

### 觸發規則

| 情境 | 觸發 | 層級 |
|------|------|------|
| 新文章完稿 / 升級到 ✅完成 | ✅ | L1 + L2 |
| 舊文改寫（半成品/毛坯 → 完成） | ✅ | L1 + L2 |
| 既有完成文章的內容修訂 | ✅ | L2 only |
| 純 FM 補齊（不動正文） | ❌ | — |
| 社群貼文 | ⚠️ | 僅具體數據 |

### L1：素材查證（寫作前）

拿到素材/草稿/舊文要改寫時，先跑 L1。掃描所有事實宣稱，四欄格式輸出：

| 原文 | 問題 | 修正版 | 改了什麼 |
|------|------|--------|---------|

- 只列 `corrected` 和 `unverifiable`，正確的不列
- Paul 確認後才進改寫

### L2：成稿查證（推 GitHub 前）

文章完成後，推 GitHub 前跑 L2。產出查核報告：

| 宣稱 | 查核結果 | 信心度 | 建議 |
|------|---------|--------|------|

查核結果分類：
- `confirmed` — 通過，保留
- `corrected` — 有誤，已修正（附修正內容）
- `unverifiable` — 無可靠來源，建議移除或加模糊語
- `approximation` — 近似值，需標「約」或給範圍

Paul 確認後才推 GitHub。corrected/unverifiable 必須全部處理完。

### 查核範圍

**要查**：人名+頭銜、研究/論文引用、統計數字、因果宣稱、時間線、引述
**不查**：Paul 個人經驗和觀點、公認常識、比喻和修辭

### 查核方法

1. Claude 內建知識（常見事實）
2. Web Search（最新數據、論文、產品時間線）
3. 辯論引擎 + Perplexity（爭議性主題才動用）

### 批次查核策略

- featured 文章優先 > 高流量 > 其他
- 每次 session 3-5 篇
- confidence: high 快速過，medium/low 仔細查
- 同來源被多篇引用，查一次套用多篇

### 實戰教訓

- GitHub MCP 推 >8KB 檔案會截斷，改走本機 git CLI
- 修正要同步 4 語言版本（zh-tw/en/ja/zh-cn）
- abstract 和 description 也可能有錯誤數據，不只正文

### 發布前引用 Spot Check（L2 防線延伸）

L2 批次查核的經驗顯示，錯誤集中在「引用他人」的地方：
- 人名寫錯（薛丁格、沈旭暉）
- 歸因搞混（把 A 的觀點歸給 B）
- 數據不精確（比例、時間線）
- 術語誤用（hallucination 定義）

Paul 自己的觀點、經驗、分析框架從未出錯。

**規則：每篇文章推 GitHub 前，Claude 主動掃描所有引用外部來源的段落，逐條 spot check。** 不需要跑完整 L2 報告，但每個人名、數據、歸因、引述都要過一遍 web search。這比回頭掃舊文有效率得多。

---

## 品質檢查清單

推 GitHub 前逐項確認：

- [ ] **pillar 值在白名單內**（`ai | circular | faith | startup | life`——參見「Pillar 白名單」章節）
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
- [ ] AI 味自檢通過（六項模式無命中，或已改寫）
- [ ] L1 素材查證已完成（Paul 已確認）
- [ ] L2 成稿查證已完成（corrected/unverifiable 全部處理）
- [ ] 引用外部來源 spot check（人名、數據、歸因、引述——逐條 web search 驗證）
- [ ] 封面圖已生成（JPG, 1792×1024, 放在 public/images/covers/）
- [ ] 4 語言版本翻譯完成（tags 已翻、FM 文字欄位已翻）
- [ ] 4 語言版本同步（如有修正）
- [ ] subtitle 含搜尋目標關鍵字（不只文學感，要有人會搜的詞）
- [ ] description 含核心數據亮點（具體數字比形容詞更吸引點擊）
- [ ] tags 5-7 個（含技術棧詞 + 領域交叉詞，避免純抽象詞）
- [ ] TL;DR blockquote 已插入文章開頭（> 格式，2-3 句濃縮）
- [ ] H2 標題問題化/關鍵字化（至少 3 個 H2 含可搜尋問句，保留 1 個文學感標題）
- [ ] 外部權威連結 ≥ 2 條（數據來源官網、書籍出版頁、組織官方頁面）

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
2. **【L1 素材查證】** → 四欄格式 → Paul 確認
3. 補齊 FM 欄位（參照同柱子已完成文章的格式）
4. 改寫/補強內容，確保六幕結構 + Paul 聲音
5. **【L2 成稿查證】** → 查核報告 → Paul 確認
6. 跑品質檢查清單（含查核確認項 + 引用 spot check）
7. 封面圖生成（如尚未有）
8. 多語言翻譯（en / ja / zh-cn）
9. 給 Paul 確認後推 GitHub（一篇一推）

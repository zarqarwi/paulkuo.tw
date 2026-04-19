---
name: paulkuo-social
description: "Paul 的社群貼文多平台改寫與發布 skill。當 Paul 提到「社群版本」、「改寫成貼文」、「發社群」、「多平台版本」、「幫我發文」、「社群貼文」、「X 版」、「Threads 版」、「LinkedIn 版」時觸發。也在 Paul 要求產出配圖 prompt、討論社群策略、或提到 /social/publish 時觸發。當 paulkuo-writing skill 的 Pipeline Phase 4 觸發社群素材產出時也應觸發此 skill。即使 Paul 只說「這篇幫我發出去」或「幫我推一下」，只要語境涉及社群平台，就應該觸發此 skill。不要用於 paulkuo.tw 長文寫作（那是 paulkuo-writing skill 的範疇）。"
---

# paulkuo-social：社群貼文多平台改寫

Paul Kuo 的社群內容管線。從一篇「母文」改寫成多平台版本，含配圖生成，最終透過 Worker API 發布。

## Version

**Current: v1.1** (2026-03-19)

| 版本 | 日期 | 變更摘要 |
|------|------|---------|
| v1.0 | 2026-03-17 | 初版。6 平台規格（X/Threads/LinkedIn/Bluesky/FB/Medium）、改寫流程、DALL-E 配圖模板、Paul 聲音規則、品質檢查清單。 |
| v1.1 | 2026-03-19 | 新增：paulkuo.tw 新文章作為第四條母文管線、配圖完整技術鏈（對齊 writing skill）、管線狀態標示與最小可行發布策略、與 paulkuo-writing skill 的銜接點。 |

**演化規則：**
- MINOR（v1.2, v1.3...）：平台規格更新、新增 prompt 模板、調整語氣規則
- MAJOR（v2.0, v3.0...）：架構變更（如新增平台、發布路徑改變、skill 拆分）
- 每次修改在此表新增一行，註明日期和變更摘要

## 核心哲學

paulkuo.tw 的品牌建立在「Paul 對世界的理解與可提供的貢獻」上。社群貼文不是縮短版的文章，是用不同的語言跟不同的人說同一件重要的事。

三條原則：
- **人格密度 > 工具性**：每篇貼文都要有 Paul 的觀點、經驗或立場，不是資訊搬運
- **一次思考、多次輸出**：先有完整的母文觀點，再根據平台特性改寫
- **精準轉換 > 大量曝光**：三級讀者（核心協作者 / 持續讀者 / 路過訪客）各有對應的平台策略

---

## 與 paulkuo-writing 的銜接

當 paulkuo-writing Pipeline Phase 4 觸發時：

**輸入：**
- 母文萃取自文章 FM：title + subtitle + abstract + thesis
- 文章 URL：`https://paulkuo.tw/articles/{slug}`
- 內容柱子：從 pillar 欄位取得

**發布策略：**
- **最小發布**：X + Threads（管線已通，立即發）
- **預備發布**：LinkedIn / Bluesky / FB / Medium（版本先產出存檔，等管線通了再發）

**配圖：** 社群配圖另外用 DALL-E 生成（不裁切文章封面圖），尺寸 1080×1350（4:5 直幅）。

---

## 工作流程

### Step 1：確認母文

母文來源有四條管線：
1. **Chat brainstorm**：Paul 跟 Claude 在對話中即時產出的觀點
2. **Multi-agent engine**：辯論引擎 v5.2（GPT / Gemini / Grok 交叉辯論 + Perplexity 事實查核）的產出
3. **Content inbox**：Apple Notes「📥 品牌素材收件匣」裡的種子
4. **paulkuo.tw 新文章**：文章推上 GitHub 後，從 FM 的 title + subtitle + abstract + thesis 萃取母文

不管來源是哪條，在進入平台改寫前，先確認：
- 核心觀點是什麼（一句話能說清楚）
- 對應哪根內容柱子（ai / circular-economy / faith / startup / life）
- Paul 的獨特切入角度是什麼（跨域連結、個人經驗、結構性分析）

### Step 2：平台改寫

根據下方「平台規格表」，為每個目標平台生成改寫版本。改寫不是刪字，是重新用那個平台的語言說同一件事。

改寫順序（從最受限到最自由）：
1. X（280 字，最精煉）
2. Bluesky（300 字，類似但社群氣氛不同）
3. Threads（500 字，對話感）
4. LinkedIn（3,000 字，但 hook 在前 210 字）
5. Facebook（長文 OK，故事感）
6. Medium（完整文章，可直接用 paulkuo.tw 版本調整）

每個版本獨立成段，格式如下：

```
### X（280 字）
[貼文內容]

hashtags: #tag1 #tag2 #tag3
配圖建議: [描述 or DALL-E prompt]
```

### Step 3：配圖生成

根據內容柱子選擇對應的圖片風格。

**社群配圖規格：**
- 尺寸：1080×1350（4:5 直幅，適用最多平台）
- 生成方式：另外用 DALL-E 生成（不裁切文章封面圖）
- 不含文字（避免 AI 生成亂碼字）

**柱子對應風格：**

| 柱子 | 強調色 | 視覺意象 |
|------|--------|---------|
| AI 技術趨勢 | 電光藍 / 霓虹紫 | 神經網路、數據流、光線交織 |
| 循環經濟 | 翡翠綠 / 大地色 | 循環箭頭、材料流、綠色工業 |
| 創業真實 | 暖橘 / 琥珀 | 工作場景、對話泡泡、路徑分叉 |
| 信仰與文明 | 深金 / 石墨 | 建築結構、光影、書頁 |
| 生活觀察 | 柔藍 / 淡粉 | 日常場景、窗景、城市剪影 |

**DALL-E prompt 模板（社群配圖用）：**

```
Create a clean, modern digital illustration. Style: flat design with subtle depth.
Color palette: deep navy (#1a1a3e) base, [柱子強調色] accents, white highlights.
Subject: [根據貼文主題填入]
Composition: centered, vertical orientation, with breathing room. No text, no watermarks, no letters, no numbers.
Mood: [thoughtful / forward-looking / contemplative / urgent]
Aspect ratio: 4:5 (1080x1350px)
```

### 配圖技術鏈

生成方式同 paulkuo-writing 的封面圖技術鏈：

**完整路徑：** Chat 寫 prompt → osascript 在 Mac 跑 Python → OpenAI DALL-E 3 API → urllib 下載 → sips 壓縮

**Python 腳本差異（與封面圖的不同）：**
```python
# 社群配圖：尺寸用 1024x1792（DALL-E 的直幅選項）
response = client.images.generate(
    model='dall-e-3',
    prompt='YOUR_PROMPT_HERE',
    size='1024x1792',      # ← 直幅（封面圖是 1792x1024 橫幅）
    quality='hd',
    n=1
)
# 下載後用 sips resize 到 1080x1350
run(['sips', '-z', '1350', '1080', '/tmp/social.png', '--out', 'TARGET_PATH.jpg'])
```

**已知坑：** 同 paulkuo-writing skill 的「封面圖生成 > 已知坑」章節（osascript 環境變數、SSL、SDK 路徑等）。

### Step 4：發布

**管線狀態（2026-03-19 更新）：**

| 平台 | API 狀態 | 發布策略 |
|------|---------|---------|
| X | ✅ 已通 | 最小發布 — 立即發 |
| Threads | ✅ 已通 | 最小發布 — 立即發 |
| Bluesky | ⏳ 規則已定，API 待串 | 預備發布 — 先產出存檔 |
| LinkedIn | ⏳ 規則已定，API 待串 | 預備發布 — 先產出存檔 |
| Facebook | ⏳ 規則已定，API 待串 | 預備發布 — 先產出存檔 |
| Medium | ⏳ 規則已定，API 待串 | 預備發布 — 先產出存檔 |

**路徑 A — Worker API（推薦，雲端）**
```bash
curl -X POST https://api.paulkuo.tw/social/publish \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "貼文內容", "platforms": ["x", "threads"]}'
```
發文成功後自動更新首頁動態牆 feed。

**路徑 B — poster.py（本機備用）**
```bash
cd ~/Desktop/01_專案進行中/social-poster
python3 poster.py --text "貼文內容" --platforms x,threads
```
會呼叫 feed_hook.py 推送 KV。

未來方向：poster.py 改成 thin client，只打 Worker API，不再直接打各平台 API。

---

## 平台規格表

### X
- **字數**：280 字元（Premium 可 25,000，Paul 目前 Free tier）
- **圖片**：1280x720（16:9 橫幅）或 1280x1280（1:1）；max 5MB；最多 4 張
- **語氣**：銳利開頭、觀點鮮明、金句收尾。Paul 風格：不是資訊分享，是立場表態
- **結構**：hook → 觀點 → 佐證/數字 → 行動呼籲或金句。hashtags 3-5 個放最後
- **注意**：URL 不計入字數。圖片不計入字數。Free tier 每月 500 則
- **管線狀態**：✅ 已通

### Threads
- **字數**：500 字元（+ 10,000 字 text attachment）
- **圖片**：1080x1350（4:5 直幅，佔最多螢幕空間）；最多 10 張 carousel
- **語氣**：對話感、像跟朋友聊天但有深度。可以用「你有沒有想過⋯」「我最近發現⋯」這種開頭
- **結構**：開場提問或觀察 → 展開思考 → 留一個開放問題讓人回覆
- **注意**：URL 不計入字數。演算法偏好回覆互動。不需要 hashtags
- **管線狀態**：✅ 已通

### LinkedIn
- **字數**：3,000 字元（前 210 字是 hook，「顯示更多」之前）
- **圖片**：1200x1200（1:1）或 1200x627（link preview）；max 10MB
- **語氣**：專業但有個人觀點。Paul 風格：不寫「我很榮幸宣布⋯」，寫「上週跟一個客戶開會，他說了一句話讓我停下來想了很久⋯」
- **結構**：前 210 字必須有 hook（故事開頭或反直覺主張）→ 3-5 個短段落 → 觀點收束 → 問讀者一個問題
- **注意**：換行很重要，段落之間空一行。演算法偏好原生文字內容（不帶外部連結）
- **管線狀態**：⏳ 待串接（Sign In with LinkedIn scope）

### Bluesky
- **字數**：300 字元（比 X 多 20 字，但仍然很短）
- **圖片**：1000x1000（1:1）；max 1MB；最多 4 張
- **語氣**：實質內容、社群感、技術深度 OK。Bluesky 社群偏好有料的短文，不喜歡行銷腔
- **結構**：類似 X 但可以稍微展開。觀點 → 一個佐證 → 結尾。不需要 hashtags
- **注意**：URL 固定算 22 字元。1MB 圖片限制比其他平台嚴格。threading（回覆自己）可以做長文
- **管線狀態**：⏳ 待串接（AT Protocol，最簡單）

### Facebook（粉絲頁）
- **字數**：~10,000 字元（實際上不宜超過 500，太長沒人看完）
- **圖片**：1080x1350（4:5）或 1200x630（link preview）；max 8MB
- **語氣**：故事導向、溫度高一點。可以帶情緒但不煽情。Paul 風格：「今天看到一件事讓我很感慨⋯」
- **結構**：故事開頭 → 拉出觀點 → 連結到讀者的生活 → soft CTA（「如果你也有類似經驗⋯」）
- **注意**：演算法偏好帶圖的原生內容。外部連結會被降權
- **管線狀態**：⏳ 需要 Meta App Review

### Medium
- **字數**：無上限（文章形式）
- **圖片**：1400x788（header）；文中插圖不限
- **語氣**：最接近 paulkuo.tw 長文。可以直接改編 paulkuo.tw 文章，調整為 Medium 讀者習慣的格式
- **結構**：標題 → subtitle → 正文（段落式，非列點）→ 結尾。Medium 支持 H1/H2/H3、引用區塊、程式碼區塊
- **注意**：Integration Token 發文，不需要 OAuth。SEO 標題跟 paulkuo.tw 要差異化避免重複內容
- **管線狀態**：⏳ 待確認 token

---

## Paul 的社群聲音（跨平台一致）

不管在哪個平台，這些特質要保持：

- **跨域連結是招牌**：AI × 神學、半導體 × 循環經濟、創業 × 文明觀察
- **表態有根據**：不怕站隊，但每個立場都有數據或經驗支撐
- **結構性思考**：偏好「這不是個人問題，是系統問題」的分析角度
- **台灣用語**：影片、軟體、網路、品質、想法（絕不用大陸用詞）
- **口語但不隨便**：像跟聰明朋友聊天，不是在寫報告

---

## 禁止事項

- 不寫「首先、其次、最後」的列點結構
- 不用「值得注意的是」「鑑於此」等書面詞
- 不寫空泛的行動呼籲（「讓我們一起⋯」）
- 不在貼文中提及配偶或伴侶
- 不在貼文中暴露公司名稱（用通稱：「一家環保上市公司」）
- 不發純轉貼沒有觀點的內容

---

## 品質檢查

每組社群貼文產出後，逐條確認：

- [ ] 每個平台版本都在字數限制內
- [ ] 每個版本都有 Paul 的獨特觀點（不是通用資訊）
- [ ] X 版讀起來像立場表態，不像新聞摘要
- [ ] LinkedIn 版前 210 字有 hook
- [ ] Threads 版結尾有引導互動的提問
- [ ] 配圖 prompt 對應正確的內容柱子風格
- [ ] 無大陸用語
- [ ] 未提及公司名稱或配偶
- [ ] 文章連結正確（如母文來自 paulkuo.tw）

---

## 快速指令

Paul 可能用以下方式觸發：

| Paul 說 | Claude 做 |
|---------|----------|
| 「社群版本」| 從當前對話的母文改寫全平台版本 |
| 「幫我發 X 跟 Threads」| 只改寫指定平台 + 生成 curl 指令 |
| 「配圖」| 根據內容柱子生成 DALL-E prompt |
| 「這篇推一下」| 改寫 + 生成發布指令（Worker curl）|
| 「社群策略」| 討論平台選擇、發文頻率、受眾分析 |
| 「文章上了，發社群」| 從最新文章 FM 萃取母文 → 改寫全平台 → 最小發布 X+Threads |

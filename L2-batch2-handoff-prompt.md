# L2 Fact-Check Batch 2 接續提示詞

請貼到新對話開頭使用。

---

## 背景

我正在對 paulkuo.tw（GitHub repo: zarqarwi/paulkuo.tw）的文章進行 L2 事實查核。每批 5 篇，查核外部引用的事實宣稱是否正確，累積修正到 master file，最後由 Cowork 統一執行 str_replace。

### 工作流程（已定案）
1. **Chat**：讀文章 → web search 驗證 → 記錄需修正項目到 master file（不做 file editing）
2. **Cowork**：所有批次查完後，一次執行所有 str_replace
3. **Local**：git pull → review → push

### 進度追蹤檔
- `/mnt/user-data/outputs/L2-factcheck-progress.md`（主進度檔）
- `/mnt/user-data/outputs/cowork-L2-factcheck-handoff.md`（Cowork 執行用）

### 已完成
- **Batch 1**（5篇，已 push）：sam-altman-sora-energy-ai, jensen-huang-ai-mirror, cioran-on-suffering-and-clarity, reformation-printing-politics, falsification-market-crisis
  - 修正 2 篇（commits a7e126d, 02b3f48），其餘 3 篇 0 corrections

### 總量
- 62 篇文章，53 篇需 L2 查核（扣除 Batch 1 的 5 篇 = 剩 48 篇）

---

## Batch 2 狀態：進行中

### 選定 5 篇
1. `kevin-kelly-mirror-world-third-information-revolution.md`
2. `burnout-society-self-exploitation.md`
3. `moral-person-immoral-society.md`
4. `addiction-economy-lonely-generation.md`
5. `jd-ai-supply-chain-revolution.md`

### 已完成的查核（上一輪 chat 中已搜尋驗證）

#### Article 1: kevin-kelly-mirror-world
- ✅ KK Wired 2019 Mirrorworld 文章：確認存在（February/March 2019 cover story）
- ✅ 三次資訊革命框架（資訊→人類→物理世界）：與 KK 原文一致
- ✅ 波音 787 感測器數據：文章寫「每一秒都有數百個感測器回傳資訊」。實際數據是 787 每次飛行產生約 500GB 數據，約 1000 個引擎參數持續監測。文章的描述合理，不需修正。
- ⚠️ **需修正**：文章寫「Kelly 在 2025 年的補充文章中提到」——實際上是 2025 年出版的**書**《2049: Possibilities in the Next 10,000 Days》（與吳晨合著），不是「補充文章」。需改為更準確的表述。
- ❓ 互見性（Mutual Visibility）概念：KK 確實使用此概念，2025 書中也是五大核心概念之一。OK。

#### Article 4: addiction-economy-lonely-generation
- ✅ 色情網站流量超過 Netflix + Amazon + Twitter：2013 HuffPost 首次報導（來源是 Paint Bottle 資訊圖表），2023 年 Journal of Sex Research 學術論文用 Similarweb 數據再次確認頂級色情網站排名高於 Amazon、Netflix 等。文章說「年度流量」，原始資料是「月度訪客」，但整體宣稱方向正確，可接受。
- ✅ Galloway 談男性孤獨危機/成癮/色情：大量確認。他 2025 年出版《Notes on Being a Man》，多次公開討論此議題。
- ❓ **待查**：「Homo solo」這個詞是否是 Galloway 本人使用的？搜尋結果中未找到 Galloway 直接使用此詞。文章寫「借用 Galloway 對男性孤獨危機的觀察，我用『Homo solo』來描述這個現象」——這句話的主詞是「我」（Paul），所以如果是 Paul 自創並歸因正確（借用觀察，自己命名），則 OK。需再確認。
- ❓ **待查**：「性愛的麥當勞」比喻是否來自 Galloway？文章寫「借用 Scott Galloway 對色情產業的觀察，我把它稱為『性愛的麥當勞』」——同樣主詞是「我」。如果是 Paul 的比喻而非 Galloway 原話，歸因已正確。需再確認 Galloway 是否用過類似比喻。

### 尚未開始查核

#### Article 2: burnout-society-self-exploitation
待查重點：
- 韓炳哲《倦怠社會》核心論點（功績社會 vs 規訓社會、積極性暴力概念）
- 傅柯的規訓社會描述是否準確
- 韓炳哲是否提出「重新學會無聊」作為解方

#### Article 3: moral-person-immoral-society
待查重點：
- 尼布爾《Moral Man and Immoral Society》出版年份（文章寫 1932）
- 「個人可以有良知，但群體幾乎必然是自私的」是否準確反映尼布爾論點
- 結構性的罪（structural sin）概念歸因

#### Article 5: jd-ai-supply-chain-revolution
待查重點：
- 史丹佛 Hau L. Lee（李效良）+ 沈祖鈞 Triple-A 論文是否發表在 SSRN
- 京東 7 億用戶、1,600+ 座自營倉庫數據
- 京東工業 IPO 獲港交所批准、上半年營收 103 億人民幣
- 物流超腦 2.0 效率數據（標準化 15%、調度效率 20%、人機協作 20%）
- 京東物流 VAN 無人輕卡規格（400km 續航、L4）
- JoyExpress 進軍歐洲、Gartner 供應鏈前 25 強
- 「狼族」系列機器人全球 500+ 座倉庫部署

---

## 請繼續的指令

請接續 Batch 2 的 L2 事實查核：

1. 先完成 Article 4（addiction-economy）的兩個待查項（Homo solo 歸因、性愛麥當勞歸因）
2. 查核 Article 2（burnout-society）
3. 查核 Article 3（moral-person-immoral-society）
4. 查核 Article 5（jd-ai-supply-chain-revolution）——這篇數據密度最高
5. 完成後，將 Batch 2 所有需修正項目彙整到 master correction file
6. 更新 L2-factcheck-progress.md

修正原則：
- 只改**事實錯誤**（錯誤歸因、錯誤數字、錯誤年份）
- 模糊但方向正確的表述不改
- Paul 的個人觀點/詮釋不改
- 記錄每個修正的 old_str → new_str，供 Cowork 執行

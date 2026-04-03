# Code Handoff: mazu.today SEO/AIO — FAQ 頁面 + JSON-LD

**日期**：2026-04-04
**來源**：Cowork session
**優先級**：🟡 中（SEO 內容，不影響既有功能）
**素材包位置**：`worklogs/` 或直接看本文件（素材包太大不推 repo，Paul 的 Cowork workspace 有完整版）

---

## 背景

mazu.today 目前缺乏 SEO/AIO 基礎建設。距離 4/12 起駕剩 8 天，需要在活動前建立：
1. FAQ 頁面（給搜尋引擎和 AI 助手引用）
2. JSON-LD 結構化資料（Event、FAQPage、Organization）
3. 首頁內容強化（靜態文字給爬蟲索引）

**這是純新增性質的工作，不應修改任何既有功能。**

---

## ⚠️ 安全守則（Paul 特別交代）

1. **先調查再動手**：改任何檔案前，先讀現有 Astro layout/component 結構，確認不會動到既有功能
2. **新增為主、修改為輔**：如果必須改共用 layout（例如加 JSON-LD），要確認影響範圍
3. **Smoke Test 必做**：每個改動部署後確認：
   - `mazu.today/` 首頁正常載入
   - `mazu.today/tracker/` 打卡功能正常（GPS、送出、等級顯示）
   - `mazu.today/my/` 個人頁面正常
   - `mazu.today/dashboard/` 後台正常
   - 新增的 `mazu.today/faq/` 正確顯示
   - JSON-LD 可在 DevTools 或 Rich Results Test 驗證

---

## Step 0 偵察

```bash
# 1. 了解 Formosa 頁面的 Astro 結構
ls src/pages/projects/formosa-esg-2026/
ls src/layouts/

# 2. 看現有頁面怎麼設定 <head>（找 JSON-LD 的插入點）
grep -rn 'application/ld+json' src/ --include='*.astro'
grep -rn '<head' src/layouts/ --include='*.astro'

# 3. 確認 formosaRoutes 在 Worker 的位置
grep -n 'formosaRoutes' worker/src/index.js

# 4. 看現有 guide/ 頁面怎麼建的（作為 FAQ 頁面的參考）
ls src/pages/projects/formosa-esg-2026/guide/
```

---

## 具體步驟

### Step 1：新增 FAQ 頁面

在 `src/pages/projects/formosa-esg-2026/faq/` 建立 `index.astro`。

FAQ 內容（15 題，分 5 類）：

#### 【基本資訊】4 題
- Q1：2026 白沙屯媽祖進香什麼時候出發？→ 4/12 深夜 23:55，8天7夜，4/20 回宮
- Q2：路線是什麼？→ 全台唯一無固定路線，媽祖神意指引，來回 300-400 km
- Q3：2026 報名人數？→ 436,653+ 人（歷史新高）
- Q4：歷史多久？→ 超過 200 年，2010 年國家重要無形文化資產

#### 【參與指南】3 題
- Q5：怎麼報名？→ 拱天宮服務台，700元含進香服帽子臂章（服裝發完降為500元）
- Q6：第一次要帶什麼？→ 中古運動鞋、五指襪、撒隆巴斯、行動電源、健保卡等
- Q7：有什麼禁忌？→ 喪事迴避、不摸鑾轎香擔、起馬下馬儀式、環保自律

#### 【文化知識】4 題
- Q8：什麼是香燈腳？→ 進香信徒稱謂，在地也寫「香丁腳」
- Q9：什麼是刈火儀式？→ 北港朝天宮引聖火回白沙屯，萬年香火流傳
- Q10：為什麼叫粉紅超跑？→ 神轎速度快方向不可測 + 粉紅佈置
- Q11：完整儀式流程？→ 放頭旗→出發→停駕→刈火→回宮→開爐

#### 【ESG 永續】2 題
- Q12：ESG 進香是什麼？→ Formosa ESG 2026 用 GPS 追蹤碳足跡
- Q13：怎麼計算碳排？→ ≤15km/h 零排放，>15km/h 用 0.47515 kgCO₂e/km

#### 【學術視角】2 題
- Q14：有哪些學術研究？→ 呂玫鍰（人類學）、齊偉先（物質文化）、Turner（朝聖理論）
- Q15：人數暴增原因？→ 齊偉先：開放性儀式結構 + 物質中介（進香旗、GPS）

**完整 FAQ 答案文字在 Paul 的 Cowork workspace 素材包裡（`mazu-today-seo-aio-素材包.md`）。如果 Code 讀不到，請 Paul 提供。**

UI 建議：折疊式 accordion，預設收合。

### Step 2：嵌入 JSON-LD

在 FAQ 頁面和首頁的 `<head>` 中加入 `<script type="application/ld+json">`。

**首頁**放 Event + Organization：
- Event：startDate 2026-04-12T23:55:00+08:00，location 拱天宮 (24.5697, 120.6997)，offers price 700 TWD
- Organization：白沙屯拱天宮，url baishatunmazu.org.tw

**FAQ 頁**放 FAQPage：
- 選 8 題最核心的放進 FAQPage JSON-LD（Q1-Q5, Q8-Q10）

完整 JSON-LD 範本在素材包裡。

### Step 3：Worker 路由更新（Paul 手動 deploy）

在 `worker/src/index.js` 的 `formosaRoutes` 陣列加上 `'/faq/'`：

```js
const formosaRoutes = ['/', '/tracker/', '/my/', '/guide/', '/guide/admin/', '/guide/admin-flow/', '/guide/user-flow/', '/privacy/', '/dashboard/', '/feedback/', '/data/', '/faq/'];
```

⚠️ 這一步需要 Paul 本機跑 `wrangler deploy --config wrangler.toml`，Code 無法自行部署 Worker。沒做這步的話 `mazu.today/faq/` 會回 404。

---

## mazu.today Routing 架構（供參考）

Worker `handleMazuToday()` 的機制：
- `mazu.today/{短路徑}` → rewrite 到 `paulkuo.tw/projects/formosa-esg-2026/{短路徑}`
- `paulkuo.tw/projects/formosa-esg-2026/*` HTML 請求 → 302 到 `mazu.today/*`
- i18n：`mazu.today/en/*` → `paulkuo.tw/en/projects/formosa-esg-2026/*`
- 靜態資源（`/_astro/`, `/fonts/`, `/images/`）直接 pass through

---

## 驗證方式

1. `mazu.today/faq/` 頁面正確渲染 15 題 FAQ
2. Chrome DevTools → Elements → 搜尋 `application/ld+json` 確認 JSON-LD 存在
3. Google Rich Results Test (`https://search.google.com/test/rich-results`) 貼入 URL 驗證
4. **既有功能 smoke test**：tracker 打卡、my 頁面、dashboard 都正常

---

## 注意事項

- 不要改 `_TrackerPage.astro` 或任何打卡相關邏輯
- JSON-LD 如果要放在共用 layout，用條件判斷只在特定頁面載入
- FAQ 頁面的 CSS 盡量用既有 design token，不要引入新的 dependency
- 4/11~4/13 是活動凍結期，非緊急不部署。這個任務要在 4/10 前完成

---

## 回報格式

完成後在 worklog 記錄：
- 新增了哪些檔案
- JSON-LD 放在哪個 layout/component
- Smoke test 結果
- commit hash
- Paul 需要做的事（Worker deploy 指令）

# Handoff: AI/Bot Dashboard → Agentic SEO KPI 儀表板升級

> 建立：2026-04-17 Cowork session
> 交給：Code session
> Task size：M（3 個小改動串起來，~60-90 min，含 deploy + smoke test）
> 信心等級：高（bug 位置明確、改動局部、有現成 API 可驗證）

---

## 開場指令（請直接執行）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
git log --oneline -5
```

---

## 背景：為什麼這件事重要

AI/Bot 流量儀表板**不是普通的訪客統計 widget**。它是 Paul 的 **Agentic SEO 策略專案**的核心 KPI 儀表板。

**策略假設**：AI Crawler（GPTBot、ClaudeBot、PerplexityBot 等）造訪網站的頻率會越來越高——LLM 訓練抓取 + 線上檢索 + Agentic Browsing 三股需求會疊加。傳統 SEO 目標是「Google 排名高」，Agentic SEO 目標是「被 AI 引用、被 AI 理解、被 AI 當成可靠來源」。

這個儀表板要回答的問題是：**「我的網站對 AI 越來越友善，還是越來越冷門？」** 以及**「哪幾家 AI 特別喜歡我的內容？」**

所以：
- AI Crawler 是**目標讀者**，不是 bot 噪音
- 呈現上要讓**趨勢變化**清晰（週/月成長率、各家 AI 的變化）
- 百分比要對得上使用者直覺，不能誤導

---

## Cowork 調查發現（4/17）

Paul 在後台看到 4/16 有一根明顯的紅色長條（AI Crawler），但下面的 Top Crawlers 顯示 GPTBot/ClaudeBot/Googlebot 全部 0%，數字兜不上。我調查了程式碼和線上數據，確認：

**事實 1**：4/16 確實有 7 次 AI Crawler 訪問（`ai: 7, generic: 0`），數據沒問題。  
**事實 2**：Top Crawlers 的 `percent` **算錯了**。分母用了「網站總流量 6,183」（含估算的歷史 bot 回填），而不是「已分類的 bot 總數」，導致 GPTBot 2 次 / 6,183 = 0.03% → 四捨五入變 0%。  
**事實 3**：單日 KV（`analytics:bot-visits:{date}`）有存 `byName` 明細，但 aggregate 時只累加到 30d 總量，沒把每日的 `byName` 往前端傳——所以使用者滑鼠 hover 單日長條時看不到「那天是誰」。

---

## 要做的三件事

### Task 1：修正 `topCrawlers.percent` 分母 🔴 必做

**檔案**：`worker/src/visitors.js`  
**位置**：`aggregateBotAnalytics()` 函式，第 809 行附近

**現況**（錯誤）：
```js
percent: total30d.total > 0 ? +(count / total30d.total * 100).toFixed(1) : 0,
```

`total30d.total` 包含了 backfill 的歷史推估（6,000+），所以 bot 次數相對分母極小。

**改成**（分母換成「已分類 bot 總數」）：
```js
const classifiedTotal = Object.values(byNameAll).reduce((a, b) => a + b, 0);
// ...
percent: classifiedTotal > 0 ? +(count / classifiedTotal * 100).toFixed(1) : 0,
```

驗證：跑完 cron 後，`topCrawlers[0].percent + topCrawlers[1].percent + ...` 應該接近 100（扣掉 slice(0,15) 截斷的殘差）。

### Task 2：把每日 `byName` 傳到前端 🟡 建議做

**目的**：讓 Paul 能看到「4/16 那波 7 次 AI 訪問，具體是哪幾家」，而不是只能從 30 天累積推敲。

**後端改動**（`worker/src/visitors.js` 第 788 行）：
```js
// 現況
daily.unshift({ date: dateStr, total: parsed.total, ai: parsed.ai, generic: parsed.generic, estimated: parsed.estimated || 0, backfilled: !!parsed.backfilled });

// 改成（加上 byName）
daily.unshift({
  date: dateStr,
  total: parsed.total,
  ai: parsed.ai,
  generic: parsed.generic,
  estimated: parsed.estimated || 0,
  backfilled: !!parsed.backfilled,
  byName: parsed.byName || {},  // ← 新增
});
```

**前端改動**（`src/components/TrafficAnalytics.astro` 第 496 行附近 chartHtml）：
每根長條加上 `title` attribute（原生 tooltip，不需 JS library）：
```js
// 在 barsHtml 組字串時，加上 title
// 例如：'<div class="ta-bot-bar" title="' + day.date + ': AI ' + day.ai + ' / 一般 ' + day.generic + (day.byName ? ' (' + Object.entries(day.byName).map(([n,c]) => n+'×'+c).join(', ') + ')' : '') + '">'
```

滑鼠 hover 就能看到「04-16: AI 7 / 一般 0 (GPTBot×2, ClaudeBot×1, Googlebot×1, other×3)」這種摘要。

### Task 3：Agentic SEO 趨勢指標 🟢 Nice-to-have（可延後）

目前只呈現靜態 30d 累積。Paul 想知道**趨勢**，建議在 Bot 區塊多加一行小字：

```
過去 7 天 AI Crawler：11 次（比上週 +X%）
```

**後端**：`aggregateBotAnalytics` 裡已經算了 `total7d`，再補一個 `total7dPrev`（前 7-14 天）比較：
```js
const total14d = sum(daily.slice(-14));
const total7dPrev = {
  total: total14d.total - total7d.total,
  ai: total14d.ai - total7d.ai,
  generic: total14d.generic - total7d.generic,
};
// 包進 result
```

**前端**：在 `botKpiHtml` 下方加一行 delta 顯示。

如果時間不夠就先不做 Task 3，Task 1 + 2 是重點。

---

## Deploy 與驗證

### Deploy
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
wrangler deploy --config wrangler.toml
cd ..
npm run build && wrangler deploy
```

### Smoke Test（部署後立刻做，結果寫進 worklog）

**Worker API 驗證**：
```bash
# 1. Bot analytics 沒壞（200 OK + 有 topCrawlers）
curl -s "https://api.paulkuo.tw/analytics" | python3 -c "
import sys, json
d = json.load(sys.stdin)
bt = d['botTraffic']
print('topCrawlers 前三名:')
for c in bt['topCrawlers'][:3]:
    print(f\"  {c['name']}: {c['count']} 次 = {c['percent']}%\")
print('百分比合計:', sum(c['percent'] for c in bt['topCrawlers']))
print('daily 最後一筆有 byName:', 'byName' in bt['daily'][-1])
"
```

**預期**：
- 百分比合計接近 100（不是 0.4% 那種）
- GPTBot / ClaudeBot 百分比 > 0
- 最新一筆 daily 有 `byName` 欄位（Task 2 做了才會有）

**跨子專案影響**：`visitors.js` 是共用模組，影響 ⚠️ Wiki + 主站 + Formosa + TQEF 所有前端。必須驗證沒打壞其他 endpoint：
```bash
curl -sI "https://api.paulkuo.tw/ticker" | head -1   # 200
curl -sI "https://api.paulkuo.tw/visitors" | head -1 # 200
curl -sI "https://paulkuo.tw/wiki/" | head -1        # 200
curl -sI "https://paulkuo.tw/projects/formosa-esg-2026/" | head -1  # 200
```

**前端人工驗證**（https://paulkuo.tw/#feed）：
1. 無痕視窗打開 → scroll 到 AI/Bot 區塊
2. Top Crawlers 列表的百分比不再是 0%
3. Hover 4/16 紅色長條 → 看到 bot 明細 tooltip（Task 2 做了才有）

---

## Commit message 範例

Task 1 + 2 合併一個 commit：
```
fix(analytics): 修正 topCrawlers 百分比分母 + 暴露每日 bot 細節 [影響: Wiki + 主站 + Formosa + TQEF]

- topCrawlers.percent 分母從總流量改為已分類 bot 總數（原本 GPTBot 0.03% → 現在 8%+）
- daily 陣列補上 byName 欄位，讓前端可顯示單日 bot 明細 tooltip
- 前端 TrafficAnalytics.astro 長條加 title attribute 顯示摘要

Context: AI/Bot 儀表板是 Agentic SEO KPI，非單純訪客統計
```

---

## 回報給 Cowork

完成後在 `worklogs/worklog-2026-04-17.md` 底部「狀態變更」區塊寫：
```
## 狀態變更
- Handoff code--agentic-seo-bot-dashboard-upgrade-2026-04-17：未完成 → 已完成（commit {hash}）
  - Task 1 ✅ / Task 2 ✅ / Task 3 {✅ or ⏳延後}
```

然後把這個 handoff 檔案 move 到 `handoffs/done/`（如果目錄存在的話）。

---

## 不要做的事

- ❌ **不要**把 AI Crawler 當 bot 噪音排除。它們是目標讀者。
- ❌ **不要**改 `classifyBot` 的判斷邏輯（正則表）——現在的分類沒問題，只是百分比算錯。
- ❌ **不要**把 `total30d.total` 從回傳拿掉——前端 Bot 總訪問的 KPI 還要用。
- ❌ **不要**省略跨子專案 smoke test。`visitors.js` 碰到的話 impact map 寫得很清楚。

# Handoff: Bot 分類重構為三軌（Agentic SEO 精準度升級）

> 建立：2026-04-17 Cowork session（第二輪）
> 交給：Code session
> 前置：已完成 `code--agentic-seo-bot-dashboard-upgrade-2026-04-17.md`（Task 1+2 commit 已部署）
> Task size：M（~60-90 min，後端 + 前端 + smoke test）
> 信心等級：高（純分類/顏色變更，不觸碰計數邏輯）

---

## 開場指令

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
git log --oneline -5
```

---

## 背景：為什麼要做這次重構

前一輪修完百分比 bug 之後，Paul 從線上數據發現一個**策略層級的問題**：

```
4/16 那根紅色「AI Crawler」長條 = 7 次 = 全部是 Ahrefs
```

**Ahrefs 根本不是 AI Crawler，它是傳統 SEO 工具**（反向連結分析、關鍵字排名追蹤）。但目前後端 `AI_CRAWLERS` 陣列把 Ahrefs / Semrush / DataForSeo 也標成 `type: 'ai'`，導致：

1. **Agentic SEO KPI 被污染** — 看起來 LLM 流量有起色，其實都是 SEO 工具在刷
2. **策略決策誤判** — Paul 是要知道「LLM 有沒有越來越常來抓我」，不是「我在 SEO 工具資料庫裡有沒有被收錄」
3. **前後端不一致** — 前端 `TrafficAnalytics.astro:465` 的 `AI_NAMES` 其實只列 LLM（沒含 Ahrefs），後端卻把 Ahrefs 算進 `ai` 計數

**這是 Agentic SEO 專案的核心 KPI 純淨度問題**。修完才能信任數據做後續 Auto Research 自我優化循環。

---

## 要做的事：三軌分類體系

把 bot 分成三個類別，各自有獨立計數、顏色、KPI、在 Top Crawlers 用三色 dot 區分：

| 類別 | 定義 | 顏色 | Agentic SEO 意義 |
|---|---|---|---|
| **LLM** | 大型語言模型抓取（訓練/檢索/Agentic browsing）| 🔴 紅色 `#ef4444` | **核心 KPI**，要拉高 |
| **Search** | 傳統搜尋引擎爬蟲 | 🟣 紫色 `#8b5cf6` | 傳統 SEO 指標，維持即可 |
| **SEO Tools** | 第三方 SEO/行銷工具 | 🟠 橘色 `#f59e0b` | 背景雜訊，知道有就好 |
| ~~Generic~~ | 雜項爬蟲（curl、python 等）| 🔘 灰色 `#94a3b8` | 噪音，最低關注 |

---

### Task 1：後端重構分類邏輯 🔴 必做

**檔案**：`worker/src/visitors.js`  
**位置**：第 6-38 行的分類宣告與 `classifyBot` 函式

**改動 1 — 把單一陣列拆成三個分組**：

```js
// ── Bot 分類：三軌 Agentic SEO 體系 ──

// LLM Crawler：大型語言模型的抓取（訓練資料、線上檢索、Agentic browsing）
const LLM_CRAWLERS = [
  { pattern: /GPTBot/i, name: 'GPTBot' },
  { pattern: /ChatGPT-User/i, name: 'ChatGPT' },
  { pattern: /OAI-SearchBot/i, name: 'OAI-SearchBot' },
  { pattern: /ClaudeBot/i, name: 'ClaudeBot' },
  { pattern: /Claude-Web/i, name: 'Claude' },
  { pattern: /anthropic-ai/i, name: 'Anthropic' },
  { pattern: /PerplexityBot/i, name: 'PerplexityBot' },
  { pattern: /Perplexity-User/i, name: 'Perplexity-User' },
  { pattern: /Bytespider/i, name: 'Bytespider' },
  { pattern: /Cohere-ai/i, name: 'Cohere' },
  { pattern: /Meta-ExternalAgent/i, name: 'Meta' },
  { pattern: /CCBot/i, name: 'CCBot' },
  { pattern: /Google-Extended/i, name: 'Google-Extended' },
  { pattern: /Applebot-Extended/i, name: 'Applebot-Extended' },
  { pattern: /Amazonbot/i, name: 'Amazonbot' },
  { pattern: /YouBot/i, name: 'YouBot' },
  { pattern: /Diffbot/i, name: 'Diffbot' },
];

// Search Engine：傳統搜尋引擎爬蟲
const SEARCH_CRAWLERS = [
  { pattern: /Googlebot/i, name: 'Googlebot' },
  { pattern: /Bingbot/i, name: 'Bingbot' },
  { pattern: /Applebot/i, name: 'Applebot' },  // 注意：必須在 Applebot-Extended 之後才能匹配
  { pattern: /DuckDuckBot/i, name: 'DuckDuckBot' },
  { pattern: /Baiduspider/i, name: 'Baidu' },
  { pattern: /YandexBot/i, name: 'Yandex' },
  { pattern: /PetalBot/i, name: 'PetalBot' },
  { pattern: /Sogou/i, name: 'Sogou' },
];

// SEO Tools：第三方 SEO / 行銷分析工具（背景雜訊）
const SEO_TOOLS = [
  { pattern: /AhrefsBot/i, name: 'Ahrefs' },
  { pattern: /SemrushBot/i, name: 'Semrush' },
  { pattern: /DataForSeoBot/i, name: 'DataForSeo' },
  { pattern: /MJ12bot/i, name: 'Majestic' },
  { pattern: /MegaIndex/i, name: 'MegaIndex' },
  { pattern: /BLEXBot/i, name: 'BLEXBot' },
  { pattern: /serpstatbot/i, name: 'Serpstat' },
];

const GENERIC_BOT_RE = /bot|crawler|spider|scraper|curl|wget|python|go-http|headless|phantom|selenium/i;

function classifyBot(ua) {
  if (!ua || ua === 'unknown') return { isBot: true, type: 'unknown', name: 'unknown' };

  // 順序重要：先 LLM（含 Applebot-Extended、Google-Extended）→ 再 Search（含 Applebot、Googlebot）→ 再 SEO Tools
  for (const c of LLM_CRAWLERS) {
    if (c.pattern.test(ua)) return { isBot: true, type: 'llm', name: c.name };
  }
  for (const c of SEARCH_CRAWLERS) {
    if (c.pattern.test(ua)) return { isBot: true, type: 'search', name: c.name };
  }
  for (const c of SEO_TOOLS) {
    if (c.pattern.test(ua)) return { isBot: true, type: 'seo_tool', name: c.name };
  }
  if (GENERIC_BOT_RE.test(ua)) return { isBot: true, type: 'generic', name: 'other' };
  return { isBot: false, type: 'human', name: null };
}
```

**⚠️ 順序關鍵點**：`Applebot-Extended` 和 `Google-Extended` 必須在 `Applebot` / `Googlebot` **之前**匹配，因為前者含後者字串，順序反了會被誤判成 Search 類。LLM 分組放最前面就對了。

**改動 2 — 計數邏輯同步更新**：

找到寫入 `analytics:bot-visits:{date}` 的地方（約第 654-666 行）：

```js
// 現況（兩類）
botData = raw ? JSON.parse(raw) : { total: 0, ai: 0, generic: 0, byName: {} };
// ...
if (botInfo.type === 'ai') botData.ai += 1;
else botData.generic += 1;
```

改成（保留 `ai` 做向後相容，但 `ai` = `llm + seo_tool`，新增 `llm` / `search` / `seo_tool` 獨立計數）：

```js
botData = raw ? JSON.parse(raw) : {
  total: 0,
  llm: 0, search: 0, seo_tool: 0, generic: 0,
  ai: 0, // deprecated: = llm，保留給尚未更新的 client
  byName: {}
};
botData.total += 1;
if (botInfo.type === 'llm') { botData.llm += 1; botData.ai += 1; }
else if (botInfo.type === 'search') { botData.search = (botData.search || 0) + 1; }
else if (botInfo.type === 'seo_tool') { botData.seo_tool = (botData.seo_tool || 0) + 1; }
else botData.generic += 1;
botData.byName[botInfo.name] = (botData.byName[botInfo.name] || 0) + 1;
```

**向後相容重點**：`ai` 欄位保留，但意義改為「只含 LLM」。這樣歷史 KV 資料（還帶著 Ahrefs 算在 `ai` 裡）跟新資料混讀時不會崩。

**改動 3 — `aggregateBotAnalytics` 的 30d 彙總跟著更新**：

第 777 行左右：
```js
let total30d = { total: 0, ai: 0, generic: 0 };
// 改成
let total30d = { total: 0, llm: 0, search: 0, seo_tool: 0, generic: 0, ai: 0 };
```

第 789-791 行的累加：
```js
total30d.total += parsed.total;
total30d.ai += parsed.ai;
total30d.generic += parsed.generic;
// 改成
total30d.total += parsed.total;
total30d.llm += parsed.llm || 0;
total30d.search += parsed.search || 0;
total30d.seo_tool += parsed.seo_tool || 0;
total30d.generic += parsed.generic || 0;
total30d.ai += parsed.ai || 0; // 歷史相容
```

`daily.unshift({...})` 那行（第 788 行）也把新欄位塞進去：
```js
daily.unshift({
  date: dateStr,
  total: parsed.total,
  llm: parsed.llm || 0,
  search: parsed.search || 0,
  seo_tool: parsed.seo_tool || 0,
  generic: parsed.generic || 0,
  ai: parsed.ai || 0,
  estimated: parsed.estimated || 0,
  backfilled: !!parsed.backfilled,
  byName: parsed.byName || {},
});
```

`sum()` helper 跟 `total7d` / `total1d` 計算也要同步——每個欄位都加起來。

**改動 4 — handleBotBackfill 回填的歷史資料**：

第 887-893 行的 `botData = { total, ai, generic, ... }`。回填的歷史資料無法辨別類型，就全部塞進 `generic`（保守作法，避免污染 LLM KPI）：
```js
const botData = {
  total: botTotal,
  llm: 0, search: 0, seo_tool: 0,
  generic: botTotal,  // ← 歷史推估全算 generic，不影響新數據
  ai: 0,
  estimated: botTotal,
  backfilled: true,
};
```

---

### Task 2：前端三色呈現 🔴 必做

**檔案**：`src/components/TrafficAnalytics.astro`  
**位置**：第 461-526 行的 `updateBotView()`

**改動 1 — KPI 卡片改成四張**（或視空間改三張）：

```js
// 現況（第 472-477 行）
var botKpiHtml =
  '<div class="ta-bot-kpis">' +
    '<div class="ak"><span class="ak-v" style="color:#f59e0b">' + fmt(totals.total) + '</span><span class="ak-l">Bot 總訪問</span></div>' +
    '<div class="ak"><span class="ak-v" style="color:#ef4444">' + fmt(totals.ai) + '</span><span class="ak-l">AI Crawler (' + aiPct + '%)</span></div>' +
    '<div class="ak"><span class="ak-v" style="color:#8b5cf6">' + fmt(totals.generic) + '</span><span class="ak-l">一般爬蟲</span></div>' +
  '</div>';

// 改成（四項 KPI，LLM 放第一個強調策略重要性）
var llmPct = totals.total > 0 ? (totals.llm / totals.total * 100).toFixed(1) : 0;
var botKpiHtml =
  '<div class="ta-bot-kpis">' +
    '<div class="ak"><span class="ak-v" style="color:#ef4444">' + fmt(totals.llm) + '</span><span class="ak-l">LLM 抓取 (' + llmPct + '%)</span></div>' +
    '<div class="ak"><span class="ak-v" style="color:#8b5cf6">' + fmt(totals.search) + '</span><span class="ak-l">搜尋引擎</span></div>' +
    '<div class="ak"><span class="ak-v" style="color:#f59e0b">' + fmt(totals.seo_tool) + '</span><span class="ak-l">SEO 工具</span></div>' +
    '<div class="ak"><span class="ak-v" style="color:#94a3b8">' + fmt(totals.generic) + '</span><span class="ak-l">其他爬蟲</span></div>' +
  '</div>';
```

**改動 2 — stacked bar 堆疊四色**：

第 482-498 行的 `barsHtml`。原本只有 AI + Generic 兩層，現在要四層：

```js
var barsHtml = sliced.map(function(d) {
  var h = Math.max(2, (d.total / maxBotDay * 60));
  var llmH    = d.total > 0 ? (d.llm      / d.total * h) : 0;
  var searchH = d.total > 0 ? (d.search   / d.total * h) : 0;
  var seoH    = d.total > 0 ? (d.seo_tool / d.total * h) : 0;
  var genH    = h - llmH - searchH - seoH;
  var label = d.date.slice(5).replace('-', '/');
  var byNameStr = d.byName && Object.keys(d.byName).length > 0
    ? ' (' + Object.entries(d.byName).map(function(e) { return e[0] + '×' + e[1]; }).join(', ') + ')'
    : '';
  var titleAttr = d.date + ': LLM ' + (d.llm||0) + ' / 搜尋 ' + (d.search||0) + ' / SEO工具 ' + (d.seo_tool||0) + ' / 其他 ' + (d.generic||0) + byNameStr;
  return '<div class="ta-bot-bar-col" title="' + titleAttr + '">' +
    '<div class="ta-bot-bar-stack" style="height:' + h.toFixed(0) + 'px">' +
      '<div class="ta-bot-bar-llm"    style="height:' + llmH.toFixed(0)    + 'px;background:#ef4444"></div>' +
      '<div class="ta-bot-bar-search" style="height:' + searchH.toFixed(0) + 'px;background:#8b5cf6"></div>' +
      '<div class="ta-bot-bar-seo"    style="height:' + seoH.toFixed(0)    + 'px;background:#f59e0b"></div>' +
      '<div class="ta-bot-bar-gen"    style="height:' + genH.toFixed(0)    + 'px;background:#94a3b8"></div>' +
    '</div>' +
    (sliced.length <= 7 ? '<span class="ta-bot-bar-label">' + label + '</span>' : '') +
  '</div>';
}).join('');
```

（原本的 `.ta-bot-bar-ai` / `.ta-bot-bar-gen` CSS class 可以保留當 fallback，但新四色直接用 inline `background` style 最簡單，不用改 CSS。）

**改動 3 — Legend 改成四色**：

第 500-504 行：
```js
var chartHtml = '<div class="ta-bot-bars">' + barsHtml + '</div>' +
  '<div class="ta-bot-legend">' +
    '<span class="ta-legend-item"><span class="ta-dot" style="background:#ef4444"></span>LLM</span>' +
    '<span class="ta-legend-item"><span class="ta-dot" style="background:#8b5cf6"></span>搜尋引擎</span>' +
    '<span class="ta-legend-item"><span class="ta-dot" style="background:#f59e0b"></span>SEO 工具</span>' +
    '<span class="ta-legend-item"><span class="ta-dot" style="background:#94a3b8"></span>其他</span>' +
  '</div>';
```

**改動 4 — Top Crawlers 列表的 dot 顏色要對得上後端 type**：

第 465 行的 `AI_NAMES` 陣列要拆成三個：

```js
// 現況
var AI_NAMES = ['GPTBot','ChatGPT','ClaudeBot','Claude','Anthropic','Google-Extended','Bytespider','PerplexityBot','Cohere','Meta','CCBot'];

// 改成
var LLM_NAMES = ['GPTBot','ChatGPT','OAI-SearchBot','ClaudeBot','Claude','Anthropic','PerplexityBot','Perplexity-User','Bytespider','Cohere','Meta','CCBot','Google-Extended','Applebot-Extended','Amazonbot','YouBot','Diffbot'];
var SEARCH_NAMES = ['Googlebot','Bingbot','Applebot','DuckDuckBot','Baidu','Yandex','PetalBot','Sogou'];
var SEO_TOOL_NAMES = ['Ahrefs','Semrush','DataForSeo','Majestic','MegaIndex','BLEXBot','Serpstat'];
```

第 511-513 行 dot 顏色判斷改成：
```js
var dotColor;
if (LLM_NAMES.indexOf(c.name) >= 0) dotColor = '#ef4444';
else if (SEARCH_NAMES.indexOf(c.name) >= 0) dotColor = '#8b5cf6';
else if (SEO_TOOL_NAMES.indexOf(c.name) >= 0) dotColor = '#f59e0b';
else dotColor = '#94a3b8';
```

---

### Task 3：Smoke Test + Deploy

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
wrangler deploy --config wrangler.toml
cd ..
npm run build && wrangler deploy
```

**⚠️ 前次踩過的坑**（上次 handoff 的紀錄）：
- Astro build 544 頁前景跑約 30 秒，背景執行容易卡住——**用前景執行**
- Worker deploy 後若數據沒更新，打 `/analytics?refresh=1` 強制重算（會觸發 `aggregateBotAnalytics`）

**API 驗證**：
```bash
curl -s "https://api.paulkuo.tw/analytics?refresh=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
bt = d['botTraffic']
t = bt['total30d']
print('=== 30d 總量（新舊欄位並存） ===')
print(f\"total={t['total']}  llm={t.get('llm', 'MISSING')}  search={t.get('search', 'MISSING')}  seo_tool={t.get('seo_tool', 'MISSING')}  generic={t['generic']}  ai(legacy)={t['ai']}\")
print()
print('=== 最近一筆 daily 的新欄位 ===')
last = bt['daily'][-1]
print(f\"{last['date']}: llm={last.get('llm','?')} search={last.get('search','?')} seo_tool={last.get('seo_tool','?')} generic={last.get('generic','?')}\")
print()
print('=== Top Crawlers ===')
for c in bt['topCrawlers'][:10]:
    print(f\"  {c['name']:<20} {c['count']:>3} 次  {c['percent']:>5}%\")
"
```

**預期**：
- `total30d` 多出 `llm` / `search` / `seo_tool` 三個欄位
- Ahrefs 應該在 `seo_tool` 計數裡，不在 `llm` 裡
- GPTBot / ClaudeBot 在 `llm` 計數裡

**跨子專案驗證**（`visitors.js` 是共用模組，一定要做）：
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://api.paulkuo.tw/ticker"
curl -s -o /dev/null -w "%{http_code}\n" "https://api.paulkuo.tw/visitors"
curl -s -o /dev/null -w "%{http_code}\n" "https://paulkuo.tw/wiki/"
curl -s -o /dev/null -w "%{http_code}\n" "https://paulkuo.tw/projects/formosa-esg-2026/"
```
全部要 200。

**前端人工驗證**（https://paulkuo.tw/#feed 無痕視窗）：
1. KPI 卡片顯示 LLM / 搜尋引擎 / SEO 工具 / 其他 四張
2. 4/16 那根長條應該從全紅變成全橘（Ahrefs 歸 SEO 工具）
3. Top Crawlers 列表裡 Ahrefs 的 dot 是橘色、GPTBot 是紅色、Googlebot 是紫色
4. Hover 長條看 tooltip 顯示四類明細

---

## Commit message

```
refactor(analytics): Bot 分類重構為三軌 LLM/Search/SEO-Tool [影響: Wiki + 主站 + Formosa + TQEF]

Context: Agentic SEO KPI 純淨度修正

- 後端 classifyBot 拆成 LLM_CRAWLERS / SEARCH_CRAWLERS / SEO_TOOLS 三組
- KV 儲存新增 llm/search/seo_tool 三欄獨立計數（ai 欄位保留向後相容）
- 前端 TrafficAnalytics 改四色 stacked bar + 四張 KPI + Top Crawlers dot 區分
- Ahrefs/Semrush 從 AI Crawler 移到 SEO 工具（真正 LLM 流量才是 Agentic SEO 核心 KPI）

Backward-compat: ai 欄位 = llm（前端歷史 client 還能讀到有意義數字）
```

---

## 回報給 Cowork

完成後：
1. 在 `worklogs/worklog-2026-04-17.md` 狀態變更區塊寫：
   ```
   - Handoff code--agentic-seo-three-tier-classification-2026-04-17：未完成 → 已完成 (commit {hash})
     - 分類拆成 LLM/Search/SEO Tool 三軌，Ahrefs 不再污染 LLM KPI
   ```
2. `handoffs/code--agentic-seo-three-tier-classification-2026-04-17.md` 移到 `handoffs/done/`
3. PENDING.md 該項目標 `[x]`

---

## 不要做的事

- ❌ **不要**移除 `ai` 欄位——它保留做向後相容（含 legacy dashboard、其他 session 的快取等）
- ❌ **不要**清空 KV 歷史資料（`analytics:bot-visits:*`）。新計數欄位會在新資料寫入時自動出現，舊資料讀取時 fallback 到 `|| 0`
- ❌ **不要**更改 `GENERIC_BOT_RE` 的正則（那個是兜底，OK）
- ❌ **不要**把 Googlebot 放進 LLM 類——Googlebot 是搜尋爬蟲，Google-Extended 才是 LLM 訓練爬蟲
- ❌ **不要**省略 `Applebot-Extended` 要在 `Applebot` 之前判斷的順序

---

## 附註：為什麼這不只是換顏色

這次重構的策略意義是**讓儀表板誠實反映 Agentic SEO 的真實狀態**。

重構前，Paul 看到「AI Crawler 55.6%」會以為 LLM 開始認識他的網站；重構後會看到「LLM 3.2%」的真相，這才是真正需要優化的起點。數據誠實之後，下一輪 Auto Research 自我優化循環（例如測試不同 schema.org 結構、llms.txt 內容、語義化 HTML 重寫）的效果才能被精確量測。

# Handoff: 三軌分類歷史資料回填（補救）

> 建立：2026-04-17 Cowork session（第三輪）
> 交給：Code session
> 前置：`6fa2a26` 三軌分類重構已上線，但歷史 KV bucket 還是舊 schema
> Task size：S（~20-30 min，單一 admin endpoint + 一次呼叫）
> 信心等級：高（純資料重寫，分類邏輯已驗證）

---

## 開場指令

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
git log --oneline -5
```

---

## 問題診斷

三軌重構 `6fa2a26` 部署後，Cowork 打 `/analytics?refresh=1` 驗證，發現：

```
30d 總量：
  🔴 LLM        0  0.0%
  🟣 搜尋引擎    0  0.0%
  🟠 SEO 工具    0  0.0%
  🔘 其他爬蟲   11  0.2%
  ai (legacy)  20  ← 跟 llm 對不上
```

**根因**：每日 KV bucket（`analytics:bot-visits:{date}`）是**歷史資料**，只有 `ai / generic` 兩欄。新程式碼讀取時用 `parsed.llm || 0`，永遠回 0。新的分類只對「重構上線之後的新訪問」生效，歷史 30 天的 bucket 需要用新規則重新分類。

但好消息是：**每日 bucket 的 `byName` dict 還在**（所以 topCrawlers 看得到 Ahrefs、GPTBot 等）。只要讀 `byName`，就能用新規則重新推算每類計數。

---

## 要做的事

### Task 1：新增 admin endpoint `/analytics/reclass`

**檔案**：`worker/src/visitors.js`

新增一個函式，掃過去 35 天每日 bucket，用新的分類規則重算 `llm / search / seo_tool / generic` 四欄並寫回：

```js
/**
 * 一次性歷史回填：重讀每日 bucket 的 byName，用新三軌分類規則重算計數。
 * 只動 bucket 內的計數欄位，不動 byName（保留原始細節）。
 *
 * GET /analytics/reclass?key=FORMOSA_ADMIN_TOKEN
 */
export async function handleReclassify(request, env, corsHeadersFn) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== env.FORMOSA_ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 403, headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) }
    });
  }

  // 建立 name → type 的 lookup（從已經定義的三個陣列反推）
  const nameToType = {};
  for (const c of LLM_CRAWLERS)    nameToType[c.name] = 'llm';
  for (const c of SEARCH_CRAWLERS) nameToType[c.name] = 'search';
  for (const c of SEO_TOOLS)       nameToType[c.name] = 'seo_tool';

  const now = new Date();
  const results = [];

  for (let i = 0; i < 35; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const bucketKey = `analytics:bot-visits:${dateStr}`;

    try {
      const raw = await env.TICKER_KV.get(bucketKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      // 如果是 backfill 推估資料（全 generic），保持不動
      if (parsed.backfilled) {
        results.push({ date: dateStr, skipped: 'backfilled', total: parsed.total });
        continue;
      }

      // 用 byName 重算四欄
      const byName = parsed.byName || {};
      let llm = 0, search = 0, seo_tool = 0, generic = 0;
      for (const [name, count] of Object.entries(byName)) {
        const type = nameToType[name];
        if (type === 'llm')       llm      += count;
        else if (type === 'search')   search   += count;
        else if (type === 'seo_tool') seo_tool += count;
        else                          generic  += count;  // 'other' 或未分類 name 全歸 generic
      }

      const updated = {
        ...parsed,
        llm, search, seo_tool, generic,
        ai: llm,  // legacy：等於 llm
        // total 不動，保持原值做 sanity check
      };

      // Sanity: llm + search + seo_tool + generic 應 ≤ parsed.total（差異來自 unknown UA 等）
      const sumClasses = llm + search + seo_tool + generic;
      await env.TICKER_KV.put(bucketKey, JSON.stringify(updated), { expirationTtl: 86400 * 35 });

      results.push({
        date: dateStr,
        total: parsed.total,
        llm, search, seo_tool, generic,
        sumClasses,
        matches: sumClasses === parsed.total,
      });
    } catch (e) {
      results.push({ date: dateStr, error: e.message });
    }
  }

  // 重建 30d 彙總
  await aggregateBotAnalytics(env);

  return new Response(JSON.stringify({ ok: true, reclassified: results.length, results }, null, 2), {
    headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) }
  });
}
```

**位置建議**：放在 `handleBotBackfill` 後面（第 900 行左右），邏輯最接近。

### Task 2：路由註冊

**檔案**：`worker/src/index.js`  
**位置**：第 276 行 `/analytics/backfill` 路由旁邊

```js
// 現況
if (path === '/analytics/backfill' && method === 'GET') return handleBotBackfill(request, env, corsHeaders);

// 加一行
if (path === '/analytics/reclass' && method === 'GET') return handleReclassify(request, env, corsHeaders);
```

**import 也要加**（第 28 行）：
```js
import { ..., handleBotBackfill, handleReclassify } from './visitors.js';
```

### Task 3：Deploy + 觸發回填 + 驗證

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
wrangler deploy --config wrangler.toml
cd ..
# 前端不用改，不必 rebuild

# 取得 admin token（與 /analytics/backfill 同一把）
ADMIN_TOKEN=$(wrangler secret list --config worker/wrangler.toml 2>/dev/null | grep -i FORMOSA_ADMIN || echo 'MANUAL: 查 wrangler secrets 或 .dev.vars')
# 如果 secret list 查不到，請 Paul 提供 FORMOSA_ADMIN_TOKEN（他之前用過 /analytics/backfill 就有這個 token）

# 跑一次 reclass
curl -s "https://api.paulkuo.tw/analytics/reclass?key=${FORMOSA_ADMIN_TOKEN}" | python3 -m json.tool | head -60
```

**⚠️ 這個 endpoint 需要 `FORMOSA_ADMIN_TOKEN`**。如果 Code 拿不到，handoff 完成時在 worklog 註明「需 Paul 用瀏覽器訪問 URL 觸發」並留下完整 URL 讓 Paul 貼 token。

### Task 4：驗證三軌數字出來了

```bash
curl -s "https://api.paulkuo.tw/analytics?refresh=1" | python3 -c "
import sys, json
bt = json.load(sys.stdin)['botTraffic']
t = bt['total30d']
print(f\"LLM={t.get('llm',0)}  Search={t.get('search',0)}  SEO={t.get('seo_tool',0)}  Generic={t['generic']}  ai(legacy)={t['ai']}\")
for c in bt['topCrawlers'][:6]:
    print(f\"  {c['name']:<15} {c['count']:>3}  {c['percent']}%\")
"
```

**預期**：
- `LLM` 至少 3-4（GPTBot 2 + ClaudeBot 1 + 可能的其他）
- `SEO` 至少 17-20（Ahrefs 16 + Semrush/其他）
- `ai (legacy)` 等於 `llm`（不再虛胖）
- Ahrefs 還在 Top Crawlers 第一，但 LLM 總量變成個位數——這才是真相

---

## Commit message

```
feat(analytics): 新增 /analytics/reclass 一次性回填 endpoint

Context: 三軌分類 6fa2a26 上線後歷史 KV bucket 仍為舊 schema，
導致 30d 彙總 llm/search/seo_tool 三欄全為 0。

- 讀每日 bucket 的 byName，用新 LLM/SEARCH/SEO_TOOLS lookup 重算計數
- backfill 推估日（無 byName）保持不動，避免污染
- 寫完呼叫 aggregateBotAnalytics 重建 30d 總量
- 需 FORMOSA_ADMIN_TOKEN 驗證，與 /analytics/backfill 同機制
```

---

## 回報給 Cowork

完成後：
1. worklog 狀態變更區塊寫：
   ```
   - Handoff code--bot-classification-historical-reclass-2026-04-17：未完成 → 已完成 (commit {hash})
     - 歷史 35 天 bucket 用新三軌規則重分類完成
     - 30d 彙總 LLM/Search/SEO 三欄現在反映真實數字
   ```
2. handoff 移到 `handoffs/done/`
3. PENDING.md 該項標 `[x]`，把**實際的 LLM / Search / SEO 30d 數字貼上來**（這是 Paul 最想看的）

---

## 不要做的事

- ❌ **不要**動 bucket 裡的 `byName`——那是原始細節，不能改
- ❌ **不要**對 `backfilled: true` 的日子重算（那些是歷史 Zone Analytics 推估，沒 UA 可查）
- ❌ **不要**讓 reclass 變成定期 cron——這是一次性修正
- ❌ **不要**把 endpoint 暴露成公開——必須過 FORMOSA_ADMIN_TOKEN
- ❌ **不要**在 reclass 邏輯裡重新定義分類陣列——**直接 import 或共用** `LLM_CRAWLERS / SEARCH_CRAWLERS / SEO_TOOLS`，避免未來漏同步

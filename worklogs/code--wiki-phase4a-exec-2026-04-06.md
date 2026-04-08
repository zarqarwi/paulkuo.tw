# Code Handoff: Wiki Phase 4A — 執行版

> 來源：Cowork 2026-04-06
> 前置：Phase 4 Cross-Pillar ✅ 完成（13 concepts / 47 edges / 跨 pillar 38.9%）
> 目標：把 Cowork 已產出的 3 個檔案搬進 repo 正確位置，patch index.js 掛路由，deploy

---

## Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認現狀
git log --oneline -3
ls worker/src/ | wc -l          # 預期 19 個 modules
ls src/content/wiki/concepts/    # 預期 13 個 .md（含 3 個新 life concept）
cat src/content/wiki/graph.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'nodes:{len(d[\"nodes\"])}, edges:{len(d[\"edges\"])}')"
# 預期: nodes:23, edges:47
```

---

## Step 1 搬檔（Cowork 已產出，在 repo 根目錄）

```bash
# 三個檔案已由 Cowork 產出，在根目錄：
mv wiki-api.js worker/src/wiki-api.js
mv wiki-kv-seed.js scripts/wiki-kv-seed.js
mv ask.astro src/pages/wiki/ask.astro

# 確認到位
ls worker/src/wiki-api.js scripts/wiki-kv-seed.js src/pages/wiki/ask.astro
```

⚠️ 如果根目錄找不到這三個檔，也可能在 Cowork 的輸出資料夾。
用 `find . -name "wiki-api.js" -o -name "wiki-kv-seed.js" -o -name "ask.astro"` 找。

---

## Step 2 Patch worker/src/index.js

在 index.js 加入 wiki 路由。先偵察現有結構：

```bash
grep -n 'import.*from' worker/src/index.js | head -20
grep -n '/api/' worker/src/index.js | head -20
```

然後加入：

### 2a. Import（檔案頂部，跟其他 import 放一起）

```javascript
import { handleWikiSearch, handleWikiConcept, handleWikiGraph, handleWikiAsk } from './wiki-api.js';
```

### 2b. 路由（在現有 /api/ 路由區塊中加入）

```javascript
// Wiki API
if (path === '/api/wiki/search') return handleWikiSearch(request, env);
if (path === '/api/wiki/graph') return handleWikiGraph(request, env);
if (path.startsWith('/api/wiki/concept/')) {
  const slug = path.replace('/api/wiki/concept/', '');
  return handleWikiConcept(request, env, slug);
}
if (path === '/api/wiki/ask' && request.method === 'POST') return handleWikiAsk(request, env);
```

---

## Step 3 Patch worker/wrangler.toml — 加 Workers AI binding

```toml
[ai]
binding = "AI"
```

加在現有的 bindings 區塊附近。

---

## Step 4 確認 wiki-api.js 的 import 相容性

wiki-api.js 用了 `checkRateLimit` from `./utils.js`。先確認 utils.js 是否已有這個 function：

```bash
grep -n 'checkRateLimit\|rateLimit' worker/src/utils.js
```

如果沒有，需要加一個簡單版：

```javascript
// worker/src/utils.js 新增
const rateLimitMap = new Map();
export function checkRateLimit(key, maxPerMinute) {
  const now = Date.now();
  const minuteKey = `${key}:${Math.floor(now / 60000)}`;
  const count = rateLimitMap.get(minuteKey) || 0;
  if (count >= maxPerMinute) return false;
  rateLimitMap.set(minuteKey, count + 1);
  // 清理舊 key
  for (const [k] of rateLimitMap) {
    if (!k.endsWith(`:${Math.floor(now / 60000)}`)) rateLimitMap.delete(k);
  }
  return true;
}
```

---

## Step 5 Commit + Push 前端

```bash
git add worker/src/wiki-api.js scripts/wiki-kv-seed.js src/pages/wiki/ask.astro worker/src/index.js worker/wrangler.toml
# 如果改了 utils.js 也加上
git commit -m "feat: wiki Phase 4A — API endpoints + ask page + KV seed script"
git push origin main
```

---

## Step 6 Deploy Worker + Seed KV

```bash
# Deploy Worker
wrangler deploy --config worker/wrangler.toml

# Seed wiki 資料到 KV
node scripts/wiki-kv-seed.js
```

---

## 驗證 Checklist

```bash
# 1. Search API
curl -s https://api.paulkuo.tw/api/wiki/search?q=agent | python3 -m json.tool | head -10
# 預期: results 陣列包含 ai-agent-economy

# 2. Concept API
curl -s https://api.paulkuo.tw/api/wiki/concept/ai-agent-economy | head -5
# 預期: 回傳 concept markdown 或 JSON

# 3. Graph API
curl -s https://api.paulkuo.tw/api/wiki/graph | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'nodes:{len(d[\"nodes\"])}, edges:{len(d[\"edges\"])}')"
# 預期: nodes:23, edges:47

# 4. Ask 頁面
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/wiki/ask/
# 預期: 200

# 5. 跨 pillar search
curl -s https://api.paulkuo.tw/api/wiki/search?q=mental | python3 -m json.tool | head -10
# 預期: results 包含 mental-models（life pillar）
```

---

## 注意事項

- Deploy 指令：`wrangler deploy --config worker/wrangler.toml`（⚠️ 不要用 `-c`）
- KV namespace: TICKER_KV，wiki 用 `wiki:` prefix
- ANTHROPIC_API_KEY 是可選的（Workers AI 是主力，Anthropic 是 fallback）
- 如果 Workers AI binding 報錯，先確認 wrangler.toml 的 `[ai]` 區塊格式正確

---

## 回報格式

完成後寫入 `worklogs/worklog-2026-04-06.md`：

```
- {HH:MM} Wiki Phase 4A 搬檔+路由+deploy 完成（{commit}）Code
```

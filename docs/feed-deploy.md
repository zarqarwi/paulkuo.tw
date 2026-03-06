# Feed 動態化部署步驟

## 改了什麼

### 1. Worker (`worker/src/index.js`) +65 行
- `GET /feed` — 公開端點，從 KV 讀取最新貼文，1 分鐘快取
- `POST /feed/push` — admin only，寫入/更新單一平台貼文到 KV

### 2. 前端 (`src/pages/index.astro`)
- 移除 `import feedJson from '../data/feed.json'`
- feed 區塊改為 client-side fetch from Worker `/feed`
- 加入 skeleton loading 動畫（shimmer 效果）
- 每則貼文可點擊連到原始平台

### 3. social-poster (`feed_hook.py` + `poster.py`)
- 新增 `feed_hook.py`：發文成功後推送到 Worker KV
- `poster.py` broadcast 函數：成功後自動呼叫 push_to_feed

---

## 部署順序（重要：Worker 先，前端後）

### Step 1: 部署 Worker
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
npx wrangler deploy --config wrangler.toml
```

### Step 2: 驗證 Worker
```bash
# 應該回傳空 feed
curl https://paulkuo-ticker.paul-4bf.workers.dev/feed | jq .

# 確認 /health 正常
curl https://paulkuo-ticker.paul-4bf.workers.dev/health | jq .
```

### Step 3: Seed 初始資料
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
ADMIN_CODE=你的admin碼 bash scripts/seed-feed.sh
```

### Step 4: 驗證 feed 有資料
```bash
curl https://paulkuo-ticker.paul-4bf.workers.dev/feed | jq '.items | length'
# 應該回傳 7
```

### Step 5: 推前端
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git add src/pages/index.astro scripts/seed-feed.sh worker/src/index.js
git commit -m "feat: dynamic social feed via Worker KV (replaces static feed.json)"
git push origin main
```

### Step 6: 設定 social-poster
```bash
cd ~/Desktop/01_專案進行中/social-poster
# 在 .env 加入:
# WORKER_ADMIN_CODE=你的admin碼
```

---

## 之後的工作流程

每次用 `python poster.py` 發文 → 自動推送到 Worker KV → 首頁即時更新

也可以手動推單一平台:
```bash
curl -X POST https://paulkuo-ticker.paul-4bf.workers.dev/feed/push \
  -H 'Content-Type: application/json' \
  -d '{"code":"你的admin碼","platform":"X","icon":"𝕏","color":"#1DA1F2","content":"新貼文內容","url":"https://x.com/zarqarwi/status/xxx"}'
```

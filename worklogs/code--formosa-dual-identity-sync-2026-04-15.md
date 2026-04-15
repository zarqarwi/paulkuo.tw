# Code Handoff — Formosa 雙身份等級不同步（Issue #172）

> 日期：2026-04-15
> 來源：Feedback #31（2026-04-14 01:59）
> 優先級：P1 · 風險等級 L2（API + 前端登入）
> 建議模型：Sonnet + medium effort（需跨 worker + LIFF 登入流）

## 背景

一名 LINE 使用者（`U14164b4b3b7b6997b7b19feed35d22c8`，Android LINE 26.4.0）回報：
- 「網頁版」看到的進香等級還停在最初階香客
- 「LINE 內建瀏覽器」看到的等級已經很進階
- 兩邊資料不同步

用戶認為是測試資料殘留，但 4/12 起駕前 D1 三表（users / gps / surveys）已全清（見 Issue #155 dashboard 4/12 條目）。因此更可能是 user 身份識別產生兩個 row 或兩個不同 id。

Memory `project_r3_audit_results.md` 提到「吳心恬雙等級 bug 待查」，症狀與本次高度吻合。

## Step 0 — 偵察（必做）

```bash
# A. 看該 line_user_id 在 D1 中有幾筆 row
cd ~/Desktop/01_專案進行中/paulkuo.tw
wrangler d1 execute paulkuo --remote --config worker/wrangler.toml \
  --command "SELECT id, line_user_id, display_name, level, total_checkins, total_km, created_at FROM formosa_users WHERE line_user_id = 'U14164b4b3b7b6997b7b19feed35d22c8' ORDER BY created_at DESC;"

# B. 全表找重複的 line_user_id
wrangler d1 execute paulkuo --remote --config worker/wrangler.toml \
  --command "SELECT line_user_id, COUNT(*) AS cnt FROM formosa_users GROUP BY line_user_id HAVING cnt > 1;"

# C. 看 anonymous 帳號數量（line_user_id 為 null）
wrangler d1 execute paulkuo --remote --config worker/wrangler.toml \
  --command "SELECT COUNT(*) FROM formosa_users WHERE line_user_id IS NULL;"

# D. 看登入流程裡怎麼產 user row
grep -rn "formosa_users" worker/src/formosa.js | head -20
grep -rn "INSERT OR IGNORE\|INSERT INTO formosa_users" worker/src/formosa.js
grep -rn "liff.getProfile\|line_user_id" src/pages/projects/formosa-esg-2026/ | head -40
```

## 可能原因（排序）

1. **Anonymous → Named merge 缺失**：使用者先在未登入狀態打卡（產生 anonymous row），登入後又產生 named row，舊資料未 merge。若 Step 0-C 回傳 >0 表示有 anonymous row。
2. **LIFF vs External browser 產生不同 user_id**：如果 LIFF Channel 和外部 Login Channel 不同，LINE 會回傳不同 `sub`。
3. **D1 race condition**：`INSERT OR IGNORE` 若搭配 upsert 沒做好，會產生重複 row。

## 修復步驟

### Phase 1 — 資料盤點
- 跑 Step 0 A/B/C 並把結果貼回 Issue #172 comment。
- 若發現重複 row，先手動把該使用者兩個 row 的 stats 合併（total_checkins/total_km/level 取 max），保留較新 row，刪掉舊 row。

### Phase 2 — 修登入流程（視 Phase 1 結果決定）
- 若是 Anonymous → Named 漏 merge：在登入 callback 加上 merge SQL（把同 device/session 的 anonymous row 移到 named row 下）。
- 若是雙 Channel：統一只走 LIFF，外部瀏覽器登入改 redirect 進 LIFF。

### Phase 3 — 防呆
- 加 `UNIQUE(line_user_id)` constraint（若目前沒有）。
- 前端登入完一律呼叫 `/api/formosa/me/sync` 確認 server 資料。

## 驗證方式

1. 同一台 Android 分別用「LINE 內建瀏覽器」+「Chrome 外部瀏覽器」登入，確認看到相同的 level + total_checkins。
2. Step 0-B 應該回傳空集合。
3. 回到 feedback id 31 用戶身上，跑 Step 0-A 確認只剩 1 筆 row。

## 注意事項

- 活動期間（4/12-4/20 左右）任何 D1 schema 改動都是 L3 風險，必須 PR + Paul 驗收。
- 合併 row 前務必 `wrangler d1 backup` 或先 dump CSV。
- 如果 Step 0 結果顯示只是 cache 問題（同一個 row 但顯示不一致），改查 Dashboard / tracker 前端的 fetch 邏輯，而不是 D1。

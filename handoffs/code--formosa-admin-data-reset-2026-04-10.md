# Handoff: 重置 7 個 Admin 的測試資料

> 來源：Cowork session（2026-04-10）
> 目標：Code session
> 風險等級：**L2**（直接改 D1，不可逆，請先備份確認）
> 建議模型：Sonnet + High Effort

---

## 背景

活動 4/12 起駕前，Paul 想把 7 個 admin 的測試資料全部清零，讓他們可以繼續協助壓測和驗收，像新用戶一樣重新開始。

**要清的內容：**
1. GPS 打卡紀錄（`formosa_gps_points`）→ 等級歸零（等級是由里程+打卡次數動態計算）
2. 問卷填答（`formosa_surveys`）
3. 每日日誌（`formosa_daily_reports`）
4. `formosa_users` 的狀態欄位：`participant_status` → `'active'`、`completed_at` → NULL、`photo_count` → 0

**對象：** `role = 'admin'` 的所有用戶（目前 7 人）

---

## Step 0 偵察（先查再改）

```bash
# 用 wrangler d1 execute 查看目前 admin 狀態
cd ~/Desktop/01_專案進行中/paulkuo.tw

wrangler d1 execute paulkuo-auth --command "
SELECT line_user_id, display_name, role, participant_status, photo_count, phone, completed_at
FROM formosa_users WHERE role = 'admin';
" --config worker/wrangler.toml

# 查 GPS 打卡筆數
wrangler d1 execute paulkuo-auth --command "
SELECT u.display_name, COUNT(g.id) as gps_count
FROM formosa_users u
LEFT JOIN formosa_gps_points g ON g.user_id = u.line_user_id
WHERE u.role = 'admin'
GROUP BY u.line_user_id;
" --config worker/wrangler.toml

# 查問卷筆數
wrangler d1 execute paulkuo-auth --command "
SELECT u.display_name, COUNT(s.id) as survey_count
FROM formosa_users u
LEFT JOIN formosa_surveys s ON s.user_id = u.line_user_id
WHERE u.role = 'admin'
GROUP BY u.line_user_id;
" --config worker/wrangler.toml
```

確認人數是 7 人，資料筆數合理後再執行清除。

---

## 執行清除

```bash
# Step 1: 清 GPS 打卡紀錄（等級來源）
wrangler d1 execute paulkuo-auth --command "
DELETE FROM formosa_gps_points
WHERE user_id IN (SELECT line_user_id FROM formosa_users WHERE role = 'admin');
" --config worker/wrangler.toml

# Step 2: 清問卷
wrangler d1 execute paulkuo-auth --command "
DELETE FROM formosa_surveys
WHERE user_id IN (SELECT line_user_id FROM formosa_users WHERE role = 'admin');
" --config worker/wrangler.toml

# Step 3: 清每日日誌
wrangler d1 execute paulkuo-auth --command "
DELETE FROM formosa_daily_reports
WHERE user_id IN (SELECT line_user_id FROM formosa_users WHERE role = 'admin');
" --config worker/wrangler.toml

# Step 4: 重置 formosa_users 狀態欄位
wrangler d1 execute paulkuo-auth --command "
UPDATE formosa_users
SET participant_status = 'active',
    completed_at = NULL,
    photo_count = 0,
    updated_at = datetime('now')
WHERE role = 'admin';
" --config worker/wrangler.toml
```

> ⚠️ **注意**：`phone` 欄位這次**不清**，保留 admin 的手機號碼。
> 如果 Paul 後來需要清 phone 也一併重新走流程，再另外執行：
> ```sql
> UPDATE formosa_users SET phone = NULL WHERE role = 'admin';
> ```

---

## 驗證

```bash
# 清完後確認 admin 狀態歸零
wrangler d1 execute paulkuo-auth --command "
SELECT display_name, participant_status, photo_count, completed_at,
       (SELECT COUNT(*) FROM formosa_gps_points WHERE user_id = formosa_users.line_user_id) as gps_count,
       (SELECT COUNT(*) FROM formosa_surveys WHERE user_id = formosa_users.line_user_id) as survey_count
FROM formosa_users WHERE role = 'admin';
" --config worker/wrangler.toml
```

預期結果：`gps_count = 0`、`survey_count = 0`、`participant_status = 'active'`、`photo_count = 0`

---

## 注意事項

- 必須帶 `--config worker/wrangler.toml`，否則會找到根目錄的 og-worker
- D1 database 名稱是 `paulkuo-auth`（非 `formosa`）
- 等級是動態計算（`formosa.js` 裡的 `TITLES` 陣列，根據 km + checkin_count 判斷），不是存欄位，清完 GPS 資料等級自動歸零
- 這個操作**不可逆**，清之前記得先跑 Step 0 偵察確認

---

## 回報格式

完成後更新 `worklogs/worklog-2026-04-10.md`，包含：
- 7 個 admin 清除前各自的 gps_count / survey_count
- 清除後驗證結果截圖或 output

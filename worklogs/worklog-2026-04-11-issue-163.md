# Worklog 2026-04-11

## 完成日誌（最新在上）
- 08:43 fix(#163): GPS drift + straight-line track bugs (9627838) Code

## 狀態變更
- Issue #163 GPS 定位飄移 + 繞圈移動但軌跡只顯示直線：open → closed（兩個症狀均修復）

## 決策紀錄
- Speed outlier 閾值選 150 km/h：低於此不過濾真實車輛移動，高於此幾乎確定是 GPS 跳點（繞境情境不需過濾車輛）
- Auto-upload 間隔選 5 分鐘：和 KV flush cron 同頻，GPS 點在 10 分鐘內必進 D1
- auto-upload 不影響 D1 儲存量（unique index 擋重複），KV 短暫暫留量不變

## 阻礙與踩坑
- `getCurrentPosition` fallback 完全沒有 accuracy 過濾，是隱藏的飄移來源（原本以為 watchPosition 已修）
- 直線問題根因不是 clustering/simplification，是中間點沒有定期上傳到 server
- auto-upload 和手動打卡有 race condition 可能導致 KV 短暫重複，但 D1 INSERT OR IGNORE 已保護

## 待 Paul 執行
- [ ] 4/12 起駕前 Smoke Test（GPS + 打卡 + /my/ 頁面地圖）→ 驗證: 問 Paul（需 Android LINE WebView 真機）

## 待辦快照
### 高優先 🔴
- [ ] 4/12 起駕前真機 Smoke Test
### 中優先 🟡
- 無
### 低優先 🟢
- 無

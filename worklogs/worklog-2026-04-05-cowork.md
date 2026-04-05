# Worklog 2026-04-05 (Cowork Session)

## 完成日誌（最新在上）
- 20:28 開 GitHub Issue #104：Dashboard 加入 LINE 推播功能 Cowork
- 20:21 LINE OA 推播已發送（ID: 614992828）→ 49 位好友，卡片訊息（交通疏導圖＋「跟媽祖繞境」按鈕）Cowork
- 20:00 LINE OA Manager 建立 Card-based message（Pictures 類型），填入 tag/action label/URL Cowork
- 19:50 消化苗栗通霄分局交通管制公告，整理起駕日(4/12)＋回鑾日(4/19-20)管制重點 Cowork

## 本 Session 產出
1. **LINE 推播已發送**：卡片訊息（交通疏導圖＋按鈕），但只有圖沒有文字
2. **文案已存檔**：`line-broadcast-交通管制文案.txt`（含 URL 的完整版，等 Dashboard 推播功能做好後使用）
3. **Issue #104 已開**：Dashboard 加入 LINE 推播功能（文字＋連結）

## 待 Code Session 執行（Issue #104）
- [ ] Dashboard 管理後台加「推播訊息」區塊（textarea + role 選單 + 發送按鈕）
- [ ] 串接現有 `POST /api/formosa/push` endpoint（Worker 已有 multicastLineMessage）
- [ ] 發送前確認 dialog（防誤發）
- [ ] 驗證: Dashboard 發送 → 手機收到含可點擊 URL 的文字訊息

### 技術備忘給 Code
- Worker 已有 `POST /api/formosa/push`（requireAdmin），支援 role filter（all/participant/volunteer/admin）
- `multicastLineMessage()` 已實作，每批 500 人自動分批
- LINE text message 中的 URL 原生支援可點擊，不需特殊處理
- LINE channel token: env `FORMOSA_LINE_TOKEN`
- Admin auth: `X-Admin-Token` header
- 中用量 3000 則/月，目前用了 57 則

## 待下個 Cowork Session
- [ ] Code 完成 #104 後，瀏覽器驗收 Dashboard 推播功能
- [ ] 用 Dashboard 正式發送交通管制文案（含文字＋URL）
- [ ] 更新 Apple Notes 儀表板

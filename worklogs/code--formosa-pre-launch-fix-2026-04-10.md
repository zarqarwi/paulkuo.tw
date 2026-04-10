# Handoff: Formosa ESG 起駕前 🔴 緊急修復（4 項）

**From**: Cowork  
**To**: Code (建議 Sonnet + High effort — 都是精準定位改動，不需要大範圍探索)  
**Date**: 2026-04-10  
**Priority**: 🔴🔴🔴 P0 — 4/12 起駕倒數 2 天，必須今天改完+部署  
**風險等級**: L2 — 每項改動都小，但影響核心體驗，需逐項驗證

---

## 背景

剛跑完起駕前五面向程式碼盤點（`worklogs/code--formosa-pre-launch-audit-2026-04-10.md`），
發現 6 個 🔴 高風險，其中 4 個必須在起駕前修：

| # | 問題 | 預估 | 影響 |
|---|------|------|------|
| FIX-1 | 成就卡永遠無法解鎖 | 5 min | 所有香客都領不到成就卡 |
| FIX-2 | 等級門檻三處不一致 | 10 min | 同一用戶不同頁面看到不同等級 |
| FIX-3 | 碳排係數三套數字 | 10 min | 碳足跡各說各話 |
| FIX-4 | LINE Bot 等級查詢邏輯錯誤 | 10 min | Bot 回報錯誤等級 |

活動後再處理的 2 項（不在本次範圍）：
- `formosa_daily_reports` 表不在 backup workflow → 活動後補
- API 文件仍寫舊值 0.47515 → 活動後更新

---

## FIX-1: 成就卡永遠無法解鎖（最優先）

### 問題
成就卡的三個解鎖條件：打卡≥3次 + 完成問卷 + 留電話。
其中 `formosa_phone` **從未被寫入 localStorage**，所以第三個條件永遠是 false。
結果：不管香客做了多少事，成就卡永遠解鎖不了。

### 修復方向
1. `grep -rn "formosa_phone" src/` — 找到所有引用點
2. 找到問卷提交或電話號碼輸入的位置，確認提交成功後有沒有 `localStorage.setItem('formosa_phone', ...)`
3. 如果沒有 → 在電話號碼成功提交的 callback 加上寫入
4. 同時確認讀取端（成就卡判定邏輯）是讀 `localStorage.getItem('formosa_phone')`

### 注意
- LINE in-app browser 和 Safari 的 localStorage 是隔離的（已知陷阱）
- 如果寫入點在 LIFF 環境，確認 LIFF 裡 localStorage 可用
- 考慮是否應該改用 API 回傳的值來判定（而非依賴 localStorage），這樣更可靠

### 驗證
```bash
grep -rn "formosa_phone" src/ worker/
# 確認 setItem 和 getItem 都存在且邏輯對得上
```

---

## FIX-2: 等級門檻三處不一致

### 問題
兩套完全不同的等級門檻同時存在：
- **Dashboard / MyPage** 用：`1, 3, 5, 6, 8, 10, 12, 14, 14` (km)
- **Tracker / Worker** 用：`1, 5, 10, 15, 20, 25, 30, 35, 40` (km)

同一個走了 8km 的香客，在 Tracker 看到 Lv.2，在 MyPage 看到 Lv.5。

### 修復方向
1. **確定正確的門檻**：Tracker/Worker 的 `1/5/10/15/20/25/30/35/40` 是原始設計（白沙屯到北港約 300km 來回，8-9 天），這組比較合理
2. `grep -rn "1.*3.*5.*6.*8.*10.*12.*14" src/` — 定位錯誤門檻
3. `grep -rn "1.*5.*10.*15.*20.*25.*30.*35.*40" src/ worker/` — 定位正確門檻
4. 將所有門檻統一到 `1/5/10/15/20/25/30/35/40`
5. **最佳做法**：門檻值應只定義在一個地方（Worker 或 shared config），前端從 API 取得，不要 hardcode

### 驗證
```bash
# 修完後全局搜尋，確認只剩一組門檻
grep -rn "levelThreshold\|LEVEL_THRESHOLD\|距離門檻" src/ worker/
# 確認舊門檻完全消失
grep -rn "1.*3.*5.*6.*8.*10.*12.*14" src/ worker/
```

---

## FIX-3: 碳排係數三套數字

### 問題
三個地方用三個不同的碳排係數：
- **Worker 計算邏輯**：`0.12013`（正確 — ecoinvent regular bus, person·km）
- **LINE Bot 訊息**：`0.48`（錯誤 — 舊值或其他來源）
- **MyPage 顯示**：`0.21`（錯誤 — 不明來源）

### 修復方向
1. `grep -rn "0\.48\|0\.21\|0\.12013\|0\.47515\|carbonFactor\|CARBON_FACTOR" src/ worker/` — 找出所有碳排係數
2. 全部統一為 `0.12013`
3. **最佳做法**：定義為常數 `CARBON_FACTOR_PER_KM = 0.12013`，只在一個檔案定義，其他地方引用
4. 如果 LINE Bot 訊息是用字串模板嵌入數字（不是計算出來的），那要手動改字串

### 驗證
```bash
# 修完後確認只剩 0.12013
grep -rn "0\.48\|0\.21\|0\.47515" src/ worker/
# 預期結果：0 matches
grep -rn "0\.12013\|CARBON_FACTOR" src/ worker/
# 預期結果：所有引用都指向同一個常數
```

---

## FIX-4: LINE Bot `buildStatsMessage` 等級邏輯錯誤

### 問題
`buildStatsMessage`（LINE Bot 回覆用戶查詢等級的函式）判定等級時**只查打卡次數**，不查里程。
但系統設計是「等級 = 依累計里程判定」，跟打卡次數無關。

### 修復方向
1. `grep -rn "buildStatsMessage" worker/src/` — 定位函式
2. 檢查裡面的等級判定邏輯，應該改為讀取 `totalDistance` 再對照等級門檻
3. 確認門檻用的是 FIX-2 統一後的值（`1/5/10/15/20/25/30/35/40`）
4. 確認回覆訊息的里程和碳足跡數字也是從正確的欄位來的

### 驗證
```bash
# 確認等級判定用的是 distance 不是 checkin count
grep -n "level\|等級\|checkin\|distance" worker/src/*Stats* worker/src/*stats* worker/src/*line*
```

---

## 修復順序建議

```
FIX-1（成就卡）→ FIX-3（碳排係數）→ FIX-2（等級門檻）→ FIX-4（Bot 等級）
```

理由：FIX-1 最致命且最快修。FIX-3 先於 FIX-2 是因為碳排只需要統一數字，而 FIX-2 可能需要重構門檻的定義方式。FIX-4 依賴 FIX-2 的門檻統一結果。

---

## 提交規範

- 每個 FIX 一個 commit，commit message 格式：`fix: [FIX-N] {簡述} (pre-launch audit)`
- 四個 commit 做完後，一次性告知 Paul 需要 deploy（前端 git push 已自動觸發，Worker 需手動）
- 寫入 `worklogs/worklog-2026-04-10.md` 記錄修復內容

---

## 部署提醒

修完後需要 Paul 執行：
```bash
# 先拉最新
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull

# Worker 部署（FIX-3, FIX-4 改了 Worker 端）
cd worker && wrangler deploy --config wrangler.toml
```

前端的改動（FIX-1, FIX-2 的前端部分）會透過 git push → Cloudflare Pages 自動部署。
⚠️ CDN 快取 max-age=3600，新部署最多等 1 小時生效。

---

## Cowork 驗收計畫

Code 修完並通知後，Cowork 會做以下驗收：
1. curl Tracker 頁面確認等級門檻 JS 只有一組
2. curl Worker API 確認碳排回傳值用 0.12013
3. Chrome MCP 開 Tracker 頁面檢查成就卡判定流程
4. 確認 LINE Bot 回覆格式（需 Paul 手機實測）

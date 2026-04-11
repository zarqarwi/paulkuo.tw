# Handoff: R5 全面性程式碼健康檢查

> **來源**: Cowork session（2026-04-11）
> **目標**: Code session
> **模型建議**: Opus + Max effort（大量程式碼閱讀 + 邏輯推理）
> **優先級**: 🔴 起駕前最後一輪盤點

---

## 背景

明天（4/12）起駕。R1-R4 已完成四輪盤點，分別從數據一致性、修復驗證、資料品質防禦、使用者旅程四個角度掃過系統。R5 是第一次在本機環境做地毯式掃描，補上 Cowork 因 GitHub MCP 截斷而無法觸及的死角。

R5 的核心價值：**活動期間 hotfix 時，你需要在乾淨的程式碼裡快速定位問題。死碼、散落的重複邏輯、不清楚的 error log，都會拖慢反應速度。**

### R1-R4 已覆蓋（不需重複）

| 輪次 | 已修復 | 不需再查 |
|------|--------|---------|
| R1 | 等級門檻統一、碳排係數統一、成就卡 localStorage、LINE Bot 里程判定 | 這四項的數值一致性 |
| R2 | R1 修復驗證通過 | 同上 |
| R3 | computeFilteredKm 共用函數、VALID_SOURCES 白名單 | 里程計算三處統一、source 驗證 |
| R4 | stats rollback guard、KV TTL 7天、multicast retry、LINE 費用確認 | 這四項的實作 |

---

## Step 0：偵察（先查再報）

在開始掃描前，先確認工作範圍：

```bash
# 確認 formosa.js 行數（預期 2400+ 行）
wc -l worker/formosa.js

# 確認前端 formosa 相關檔案
find src -name "*formosa*" -o -name "*tracker*" -o -name "*Tracker*" | head -20

# 確認 worker 目錄結構
ls -la worker/

# 確認最近的 commit（確保是最新版本）
git log --oneline -5
```

---

## 面向 A：死碼與殘留

### 目標
找出已經沒用到的函數、路由、變數、被註解掉的舊邏輯。起駕後 hotfix 時，死碼會干擾判讀。

### 檢查項目

**A1. Worker 死碼（formosa.js + index.js）**
```bash
# 列出 formosa.js 所有 function/const/let 宣告
grep -n "^function \|^async function \|^const \|^let \|^export " worker/formosa.js

# 列出 index.js 的路由定義
grep -n "router\.\|\.get(\|\.post(\|\.delete(\|\.put(" worker/index.js

# 找被註解掉的大段邏輯（連續 3 行以上的註解）
grep -n "^//" worker/formosa.js | awk -F: '{print $1}' | awk 'NR>1{if($1==prev+1)count++;else{if(count>=3)print start"-"prev" ("count+1" lines)";count=0;start=$1}prev=$1}END{if(count>=3)print start"-"prev" ("count+1" lines)"}'
```

對每個找到的函數，確認是否有被路由或其他函數呼叫。**沒被呼叫的就是死碼**。

**A2. 前端死碼**
```bash
# 掃 formosa 相關的 Astro/JS 檔案
find src -name "*.astro" -o -name "*.js" -o -name "*.ts" | xargs grep -l "formosa\|tracker\|checkin" | head -20

# 在這些檔案中找未使用的 function 宣告
# 對每個檔案：列出 function 宣告 → grep 確認有沒有被呼叫
```

**A3. 被遺留的 console.log / debug 輸出**
```bash
# Worker
grep -n "console.log\|console.debug\|console.warn\|console.error" worker/formosa.js worker/index.js

# 前端
find src -name "*.astro" -o -name "*.js" | xargs grep -n "console.log\|console.debug" | grep -i "formosa\|tracker\|checkin"
```

標記哪些是有意義的 production log（保留），哪些是開發殘留（應移除）。

### 產出格式
```
## A. 死碼與殘留

### 死函數（未被任何路由或函數呼叫）
- `functionName` (L行號): 推測用途，為何判定為死碼

### 死路由（已定義但功能已被取代）
- `METHOD /path` (L行號): 說明

### 註解殘留（被註解掉的舊邏輯）
- L行號-行號: 內容摘要

### console.log 審查
- 🟢 保留: 列出有意義的 log（錯誤捕捉、關鍵狀態）
- 🔴 移除: 列出 debug 殘留
```

---

## 面向 B：跨檔案邏輯一致性

### 目標
R3 抓到里程計算不同步，R5 擴大範圍，掃所有「同一件事在多處實作」的模式。

### 檢查項目

**B1. 等級計算邏輯**
```bash
# 找所有等級相關的門檻定義
grep -rn "level\|等級\|rank\|LEVEL\|milestones" worker/formosa.js src/ --include="*.js" --include="*.astro" | grep -i "threshold\|門檻\|\[1,\|km\|里程"
```
確認：MyPage、Tracker、LINE Bot、分享卡——等級計算是否都走同一套門檻？R1 修過，但要確認沒有其他角落遺漏。

**B2. 打卡條件判定**
```bash
# 找打卡（checkin）相關的驗證邏輯
grep -rn "checkin\|check-in\|check_in\|打卡" worker/formosa.js | grep -i "valid\|allow\|reject\|error\|if\|guard"
```
確認：前端和 Worker 對「什麼情況下允許打卡」的判定是否一致。

**B3. 成就卡解鎖邏輯**
```bash
# 門檻：打卡>=3 + 問卷完成 + 電話號碼
grep -rn "achievement\|成就\|unlock\|解鎖" worker/formosa.js src/ --include="*.js" --include="*.astro"
```
確認：前端顯示邏輯 vs Worker 判定邏輯，門檻是否完全一致。

**B4. 碳排計算**
```bash
# R1 統一為 0.12013，確認沒有其他地方殘留舊值
grep -rn "0\.21\|0\.48\|0\.47515\|0\.12013\|carbon\|碳排" worker/ src/ --include="*.js" --include="*.astro"
```

**B5. i18n key 完整性**
```bash
# 列出所有語系檔
find src -path "*/i18n/*" -name "*.json" -o -path "*/locales/*" -name "*.json" | sort

# 比對 key 數量是否一致
# 對每個語系檔：jq keys | wc -l
```
確認：四個語系（zh-TW, en, ja, zh-CN）的 key 數量是否一致，有沒有某語系漏了 key。

**B6. API 路由 vs 前端呼叫比對**
```bash
# Worker 端定義的所有 formosa 路由
grep -n "router\.\|formosa" worker/index.js | grep -i "get\|post\|delete\|put"

# 前端實際呼叫的所有 API endpoint
grep -rn "fetch\|/api/formosa" src/ --include="*.astro" --include="*.js"
```
比對：有沒有前端呼叫了但 Worker 沒定義的路由？有沒有 Worker 定義了但沒人呼叫的路由？（後者歸入面向 A 死碼）

### 產出格式
```
## B. 跨檔案邏輯一致性

### B1 等級計算
- 出現位置: [檔案:行號, ...]
- 一致性: ✅ 全部一致 / ⚠️ 有偏差（列出偏差）

### B2 打卡條件
...（同上格式）

### B3-B6
...
```

---

## 面向 C：活動期間 hotfix 準備度

### 目標
確保活動期間出問題時，log 能快速定位根因，error handling 不會吞掉關鍵資訊。

### 檢查項目

**C1. try/catch 品質**
```bash
# 找所有 try/catch
grep -n "} catch" worker/formosa.js
```
對每個 catch：
- 有沒有 log 錯誤訊息？（空 catch = 吞錯誤 = 🔴）
- 錯誤訊息有沒有包含足夠的 context（哪個函數、哪個 userId、什麼操作）？
- 有沒有正確回傳 error response 給前端？

**C2. Cron 失敗路徑**
```bash
# 找 cron/scheduled 相關邏輯
grep -n "scheduled\|cron\|flush\|batch" worker/formosa.js worker/index.js
```
確認：Cron flush 失敗時：
- 是否有 retry 機制？
- 失敗的 KV key 是否會被保留（不被刪除），等下次 flush？
- 是否有 alert 機制通知？

**C3. Rate limit 邊界行為**
```bash
grep -n "rate.limit\|rateLimit\|RATE\|429\|too.many" worker/formosa.js worker/index.js
```
確認：被 rate limit 擋下的請求，前端會看到什麼？使用者體驗是否合理？

**C4. D1 寫入失敗 fallback**
```bash
grep -n "D1\|\.prepare\|\.run\|\.first\|\.all\|INSERT\|UPDATE\|SELECT" worker/formosa.js | head -40
```
確認：D1 操作失敗時的 fallback 路徑是否完整。KV buffer 機制是否能接住？

**C5. 前端離線/斷線行為**
```bash
grep -rn "offline\|navigator\.onLine\|queue\|retry\|sw\.\|serviceWorker" src/ --include="*.astro" --include="*.js"
```
確認：斷線時打卡資料是否正確進 queue？恢復連線後是否自動重送？

### 產出格式
```
## C. Hotfix 準備度

### C1 try/catch 品質
| 位置 | 函數 | 有 log? | context 足夠? | 正確回傳? | 評級 |
|------|------|---------|--------------|----------|------|
| L行號 | funcName | ✅/❌ | ✅/⚠️/❌ | ✅/❌ | 🟢/🟡/🔴 |

### C2-C5
...（結構化表格或列表）
```

---

## 回報格式

完成後寫入 `worklogs/worklog-2026-04-11-r5.md`，格式：

```markdown
# R5 全面性程式碼健康檢查

## 摘要
- 掃描範圍: {列出掃了哪些檔案}
- 發現: P0={n}, P1={n}, P2={n}, 🟢={n}
- 總評: {一句話}

## A. 死碼與殘留
{按上面的格式}

## B. 跨檔案邏輯一致性
{按上面的格式}

## C. Hotfix 準備度
{按上面的格式}

## 建議修復清單
### 🔴 P0（起駕前必修）
- {編號} {描述} → 修復方案

### 🟡 P1（活動前 24 小時內修）
- {編號} {描述} → 修復方案

### 🟢 P2（活動期間或活動後）
- {編號} {描述}

## 待 Cowork 研判
- {列出需要 Cowork 做決策的項目}
```

---

## 注意事項

1. **不要修任何程式碼**。R5 是純掃描，產出報告就好。修不修由 Cowork + Paul 決定。
2. **不要重複檢查 R1-R4 已修復的項目**（見上方表格）。如果掃到相關程式碼，確認修復仍在即可，不需要重新審查。
3. **行號可能已變動**。用 grep 定位，不要依賴 memory 裡的舊行號。
4. **formosa.js 有 2400+ 行**。這是你在本機的優勢，一次完整讀取不會截斷。
5. **產出報告後不要 deploy、不要 git push**。寫完 worklog 後 commit + push 即可，Cowork 會接手研判。
6. **如果發現 P0 等級的問題**（影響核心功能、可能導致資料遺失），在報告最前面用 `⚠️ P0 ALERT` 標示，Cowork 會優先處理。

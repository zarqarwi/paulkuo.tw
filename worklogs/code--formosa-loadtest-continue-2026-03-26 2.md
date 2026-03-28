# Handoff: Formosa ESG 2026 壓力測試 — 驗證腳本 + 綜合報告

**來源**: Code session (2026-03-26)
**目標**: Code session (下一個視窗)

---

## 背景

Paul 要對白沙屯媽祖進香打卡系統進行完整壓力測試，結果要當文件交代給團隊。
三輪測試已全部完成，但 Paul 在看完 R3 驗證結果後提出了關鍵問題：

> 「這個測試是理論值對吧，實際上使用者在用的時候壓力能承受得住嗎？有沒有我沒考慮到的變量？」

我分析了測試與實際的落差，提出兩個額外驗證腳本：
1. **Cron flush 壓力驗證** — 確認 KV 累積大量資料後 cron 能正確刷入 D1
2. **多端點混合測試** — 同時打 checkin + data + user API 看混合負載影響

Paul 回覆：「請寫驗證腳本。並且出測試報告。我們的測試日後都要當文件交代出去。」
然後說「給 handoff 下個視窗做」。

---

## 已完成的三輪測試

### Round 1: 容量測試 (tests/ — 腳本已刪或移動)
- C-10K / C-50K / C-100K 容量測試
- S-BURST / S-WAVE / S-EXTREME 峰值測試
- PDF: `~/Desktop/01_專案進行中/白沙屯ESG繞境/Formosa-ESG-2026-壓力測試報告.pdf`

### Round 2: 行為測試 (tests/round2-test.js — 已刪，結果在 R2 PDF)
| 場景 | VU | 成功率 | P95 | 結果 |
|------|-----|--------|-----|------|
| B-500 | 500 | 100% | 821ms | PASS |
| B-800 | 800 | 99.9995% | 946ms | PASS |
| ST-1000 | 1000 | 99.70% | 1424ms | PASS |
| ST-1200 | 1200 | 96.56% | 765ms | FAIL |
| BR-3000 | 3000 | 91.13% | 776ms | PASS |
| WV-3Cycle | 3500 | 81.85% | — | PASS |
| RC-AfterBurst | 3000 | 54.28% | — | FAIL |
- PDF: `~/Desktop/Formosa-ESG-2026-壓力測試報告-R2.pdf`

### Round 3: 真實世界驗證 (tests/round3-verify.js)
| 場景 | 發現 |
|------|------|
| DI-500 | D1 延遲寫入 + 重複寫入（24,837 請求 → 37,462 筆記錄，+51%）|
| MX-500 | checkin 回 200 但 D1 寫入 0 筆（Data API 重讀導致） |
| MX-1000 | Data API 99.97% 失敗 |
- PDF: `~/Desktop/Formosa-ESG-2026-驗證測試報告-R3.pdf`
- 腳本: `tests/round3-verify.js`
- 報告生成器: `tests/gen-r3-report.py`

---

## Step 0: 偵察

開始前先確認現場狀態：

```bash
# 確認腳本和目錄
ls tests/round3-verify.js tests/results/

# 確認 Worker 端點可達
curl -s https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/data | head -c 200

# 確認 k6 可用
k6 version

# 查看 formosa.js checkin handler 是否有 KV buffer
grep -n "KV\|TICKER_KV\|kv_buffer" worker/src/formosa.js | head -20

# 查看 cron handler
grep -n "handleScheduled\|cron\|flush" worker/src/index.js | head -20
```

---

## 具體步驟

### Step 1: 寫 Cron Flush 壓力驗證腳本

目的：確認 D1 的 cron flush 機制在大量 KV 累積後能否正確刷入。

方法：
1. 用 B-800 級別持續灌 checkin 10 分鐘
2. 等待 cron 觸發（或手動查詢 D1）
3. 比對 KV 寫入數 vs D1 最終記錄數

注意：
- 先查 `formosa.js` 是否已經改為 KV buffer 模式（上次測試時 checkin 是直接寫 D1）
- 如果還是直寫 D1，這個測試的意義就是驗證「D1 在持續寫入下的累積延遲和丟失率」
- 用 `r4_CF_` prefix 方便事後用 SQL 過濾

### Step 2: 寫多端點混合測試腳本（增強版）

R3 的 MX-500/MX-1000 已經是混合測試，但發現了嚴重問題。
Paul 提出的新關注點是「真實場景變量」，所以這次要模擬更真實的使用模式：

- 60% checkin（POST）+ 30% tracker/data（GET）+ 10% user query（GET）
- 加入真實的 think time：GPS 定位延遲 3-10 秒
- 加入 LINE LIFF 載入延遲 2-5 秒
- 測試時間拉長到 10-15 分鐘（模擬一個打卡高峰段）
- VU 設 300-500（真實場景的合理併發估計）

### Step 3: 執行測試

```bash
# 確保 results 目錄存在
mkdir -p tests/results

# 執行 Cron flush 驗證（預計 12-15 分鐘）
k6 run -e TEST=CF-800 tests/round4-realworld.js 2>&1 | tail -80

# 等 5 分鐘讓 cron 完成 flush，然後查 D1
# (Paul 需要手動跑 wrangler d1 指令)

# 執行真實場景混合測試（預計 15-20 分鐘）
k6 run -e TEST=RW-500 tests/round4-realworld.js 2>&1 | tail -80
```

### Step 4: 產生綜合報告 PDF

Paul 要求：「結論應該寫在前面」「我們的測試日後都要當文件交代出去」

報告結構：
1. **封面 + 結論摘要**（第一頁就看到關鍵結論）
   - 系統能力邊界：800 VU 穩定，1000 VU 邊界，1200+ 超載
   - 白沙屯場景評估：可承受（理由）
   - 已發現風險 + 建議修復項目
2. **Round 1 容量測試摘要**
3. **Round 2 行為測試摘要**
4. **Round 3 驗證測試詳情**（含 D1 風險發現）
5. **Round 4 真實場景驗證**
6. **風險矩陣與修復建議**
7. **術語表**

輸出: `~/Desktop/Formosa-ESG-2026-壓力測試綜合報告.pdf`

### Step 5: 更新 worklog

---

## 驗證方式

- [ ] 新腳本可以正常執行 `k6 run -e TEST=xxx tests/round4-realworld.js`
- [ ] tests/results/ 有對應的 JSON 輸出檔
- [ ] PDF 報告存在且可開啟，結論在第一頁
- [ ] worklog 已更新

---

## 注意事項

1. **MacBook Air + 手機熱點**：VU 不要超過 1000，超過就是測客戶端瓶頸不是伺服器
2. **BR-5000 已跳過**：客戶端網路瓶頸，測試數據不可信
3. **tests/results/ 目錄**：之前反覆遇到目錄不存在的問題，務必先 `mkdir -p`
4. **k6 timeout 洪水**：高 VU 時大量 WARN 會灌爆終端，用 `2>&1 | tail -80` 只看結尾
5. **wrangler deploy 不能跑**：Code session 網路限制，需要 deploy 時產出指令給 Paul
6. **D1 查詢需要 Paul 跑**：`wrangler d1 execute` 同樣有網路限制

---

## 回報格式

完成後在 worklog 記錄：
```
- {HH:MM} 完成 Round 4 真實場景驗證測試 (CF-800 + RW-500) Code
- {HH:MM} 產生壓力測試綜合報告 PDF（含四輪測試、結論前置） Code
```

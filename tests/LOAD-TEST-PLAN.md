# Formosa ESG 2026 — 負載測試計畫

**日期：2026-03-26**
**系統：白沙屯媽祖進香 GPS Tracker**
**目標用戶規模：329,000 香燈腳（2025 年報名數據）**

---

## 一、系統架構

```
[香客手機打卡] → [Cloudflare Worker] → [KV.put 單次寫入 ~10ms]
                                              ↓
                                    [Cron 每分鐘觸發]
                                              ↓
                                    [D1 批次 INSERT ~100筆/批]
```

**核心設計：KV 緩衝層**
- 打卡請求不直接寫 D1（SQLite），而是寫入 Cloudflare KV（全球分散式鍵值儲存）
- Cron 每分鐘將 KV 中的待處理打卡批次寫入 D1
- 這讓打卡延遲從 ~200-500ms 降到 ~10-50ms

---

## 二、測試場景矩陣

### A. 容量測試（Capacity Test）— 驗證持續負載下的吞吐量與資料完整性

| 場景 | 目標請求數 | 峰值 VU | 持續時間 | 主要驗證 |
|------|-----------|---------|----------|----------|
| C-10K | ~10,000 | 500 | ~3 分鐘 | 基準線、管線正確性 |
| C-50K | ~50,000 | 1,000 | ~8 分鐘 | 中規模持續壓力 |
| C-100K | ~100,000 | 1,500 | ~12 分鐘 | 高負載長時間穩定性 |

### B. 尖峰測試（Spike Test）— 模擬瞬間流量爆發

| 場景 | 峰值 VU | 爬升速度 | 持續時間 | 模擬情境 |
|------|---------|----------|----------|----------|
| S-BURST | 2,500 | 10 秒爆升 | ~4 分鐘 | 起駕瞬間 |
| S-WAVE | 2,200 | 多波段 | ~6 分鐘 | 途中停駕再起駕 |
| S-EXTREME | 3,000 | 5 秒爆升 | ~2 分鐘 | 找系統斷裂點 |

---

## 三、通過標準（Pass/Fail）

### 容量測試

| 指標 | C-10K | C-50K | C-100K |
|------|-------|-------|--------|
| P95 延遲 | < 1,000ms | < 1,500ms | < 2,000ms |
| 錯誤率 | < 5% | < 8% | < 10% |
| 資料完整性 | = 100% | ≥ 99.9% | ≥ 99.5% |

### 尖峰測試

| 指標 | S-BURST | S-WAVE | S-EXTREME |
|------|---------|--------|-----------|
| P95 延遲 | < 3,000ms | < 3,000ms | 僅記錄 |
| 錯誤率 | < 15% | < 15% | < 30%（探索性） |
| 恢復力 | 尖峰後 30s 回穩 | 波谷期 P95 < 1s | 僅記錄 |
| 資料完整性 | ≥ 99% | ≥ 99% | ≥ 95% |

**關鍵原則：**
- **資料完整性是最重要的指標**。錯誤率高但資料沒丟 = KV 緩衝有效
- S-EXTREME 是探索性測試，不設硬性 pass/fail

---

## 四、執行指令

### 執行前準備
```bash
# 提高 macOS 檔案描述符限制
ulimit -n 10240

# 確認網路延遲
ping -c 5 paulkuo-ticker.paul-4bf.workers.dev
```

### 容量測試
```bash
# C-10K（先跑這個確認腳本正確）
k6 run -e STAGE=10k tests/load-test-checkin.js

# C-50K
k6 run -e STAGE=50k tests/load-test-checkin.js

# C-100K
k6 run -e STAGE=100k tests/load-test-checkin.js
```

### 尖峰測試
```bash
# S-BURST（起駕瞬間）
k6 run -e SPIKE=burst tests/spike-test-checkin.js

# S-WAVE（多波段）
k6 run -e SPIKE=wave tests/spike-test-checkin.js

# S-EXTREME（找斷裂點）
k6 run -e SPIKE=extreme tests/spike-test-checkin.js
```

---

## 五、建議執行順序

```
1. C-10K     ← 暖身，確認端點可用
   ↓ 等 2-3 分鐘
2. C-50K     ← 中規模驗證
   ↓ 等 2-3 分鐘
3. C-100K    ← 長時間高負載
   ↓ 等 5 分鐘
4. S-BURST   ← 起駕場景（核心測試）
   ↓ 等 2-3 分鐘
5. S-WAVE    ← 多波段場景
   ↓ 等 2-3 分鐘
6. S-EXTREME ← 選做，探索天花板
```

每次測試之間等待 2-3 分鐘，讓 KV flush 完畢。

---

## 六、資料完整性驗證

每次測試完成後，等 2 分鐘，執行：

### 步驟 1：記錄 k6 成功數
從測試輸出中取得「成功數」，記為 **S**

### 步驟 2：查 KV 殘留
```bash
# 查看 KV 中還有多少 pending checkins
wrangler kv:key list --namespace-id=c066a2fd7942494c8ead37cc518b191b --prefix="gps:pending:" --config worker/wrangler.toml 2>/dev/null | python3 -c "import sys,json; print(f'KV 待處理: {len(json.load(sys.stdin))} 筆')"
```
記為 **K**（應為 0）

### 步驟 3：查 D1 寫入數
```bash
# 查詢 D1 中 loadtest 用戶的打卡數
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "SELECT COUNT(*) as cnt FROM formosa_gps_points WHERE user_id LIKE 'loadtest_%' OR user_id LIKE 'spike_%'"
```
記為 **D**

### 步驟 4：計算
```
資料完整性 = (D + K) / S × 100%
```

---

## 七、測試限制說明

### 客戶端限制（MacBook Air + 行動熱點）

| 限制 | 影響 | 說明 |
|------|------|------|
| 行動熱點頻寬 | 上行約 5-15 Mbps | 限制最大 RPS |
| 單機 TCP 連線 | MacBook Air ~2000-3000 | k6 VU 超過此數會自身瓶頸 |
| 網路延遲抖動 | RTT 30-200ms 波動 | P95/P99 含網路延遲 |
| 單一來源 IP | 所有請求同 IP | 可能觸發 Cloudflare 防護 |

### 伺服器端限制

| 限制 | 說明 |
|------|------|
| KV 寫入 | Paid plan 無硬上限，但有 soft limit |
| KV 最終一致性 | put 後 get 可能數秒延遲 |
| D1 批次寫入 | 每次 batch 上限 100 條 |
| Cron 精確度 | ±10 秒偏差 |

### 解讀注意
1. **RPS 偏低 ≠ Worker 慢** — 瓶頸可能在客戶端網路
2. **HTTP 錯誤 ≠ 資料遺失** — KV.put 成功即 HTTP 200，資料已寫入
3. **應以 P95 為主要判斷**，P99 受行動網路影響大

---

## 八、團隊報告模板

```markdown
# 負載測試報告 — [場景編號]

## 基本資訊
- 日期時間：2026-03-XX HH:MM
- 場景：[C-10K / C-50K / C-100K / S-BURST / S-WAVE / S-EXTREME]
- 測試端：MacBook Air M1, macOS, 行動熱點
- Worker 版本：[commit hash]

## 測試結果

| 指標 | 數值 | 通過標準 | 結果 |
|------|------|----------|------|
| 總請求數 | | — | — |
| 成功數 | | — | — |
| 失敗數 | | — | — |
| RPS | | — | — |
| 平均延遲 | | — | — |
| P95 延遲 | | < Xms | ✅/❌ |
| P99 延遲 | | — | — |
| 錯誤率 | | < X% | ✅/❌ |

## 資料完整性

| 項目 | 數值 |
|------|------|
| k6 成功數 (S) | |
| KV 殘留 (K) | |
| D1 行數 (D) | |
| 完整性 (D+K)/S | |

## 綜合判定：PASS / CONDITIONAL PASS / FAIL
```

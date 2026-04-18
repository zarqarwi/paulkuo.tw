# Handoff: Governance KV Reseed

**From**：Cowork（Opus 4.6）
**To**：Code
**建議模型**：**Sonnet 4.6 + Medium**（單一腳本執行 + 2 步 smoke test，非純機械）
**Task Sizing**：**S**（預計 10-15 min，腳本 2 分鐘 + 驗證 5 分鐘 + worklog 5 分鐘）
**日期**：2026-04-18
**信心等級**：**高**（偵查環節完整，指令已實測可達）

---

## 1. 背景

2026-04-17 Cowork 自動跑 `governance-metrics-collector` 收集當日 metrics（commit `28a09de`），隨後回溯補 04-04 到 04-16 的 metrics JSON（commit `bf0705b`）。push 後 `/governance/` Dashboard 顯示錯誤：各專案「本週 commits」全是 `—`，累計 commits bar chart 顯示 135/45/38/0/0/3，與實際 549/80/52/14/3/1 嚴重不符。

根因：Dashboard 讀 TICKER_KV 的 `gov:*` key，metrics 檔 push 後 KV 沒重 seed，所以 Dashboard 還在顯示 04-03 的舊資料。執行 `scripts/governance-kv-seed.cjs` 即可修復。

Cowork 已完成「白沙屯是否受影響」的純偵查（Paul 指示 read-only），結論零風險，細節見第 4 節「上游假設」。

---

## 2. Step 0 偵察（先查再改）

接手後**先跑這 4 個指令確認環境**，任一項結果不符立刻停下回報：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# ① 確認 metrics 檔確實 push 到 main（預期 04-04 到 04-17 每天都有）
ls worklogs/metrics/paulkuo-main/ | head -20

# ② 確認 seed 腳本存在且是最新版
git log -1 --oneline scripts/governance-kv-seed.cjs

# ③ 確認 wrangler auth 狀態（seed 會用 npx wrangler）
npx wrangler whoami

# ④ Dashboard 當前錯誤狀態（seed 前基準）— 用 governance token
curl -s -H "Authorization: Bearer $GOVERNANCE_TOKEN" \
  https://paulkuo.tw/api/governance/summary | jq '.projects[] | {id, total_commits}'
```

**④ 預期輸出**（seed 前）：數字跟截圖一樣偏低（例如 paulkuo-main `135`）。如果數字已經對了，表示有人搶先 seed 過，直接跳 Step 4「完成後」標 `[x]` 即可。

---

## 3. 具體步驟

### 3.1 執行 seed

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
node scripts/governance-kv-seed.cjs
```

**預期 stdout**：

```
=== Governance KV Seeder ===

1. gov:projects
  ✓ gov:projects (X.XKB)
2. gov:automation
  ✓ gov:automation (X.XKB)
3. gov:metrics:{project_id}
  ✓ gov:metrics:paulkuo-main (XX.XKB)
  ✓ gov:metrics:formosa-esg (X.XKB)
  ✓ gov:metrics:llm-wiki (X.XKB)
  ✓ gov:metrics:acp (X.XKB)
  ✓ gov:metrics:ai-ready (X.XKB)
  ✓ gov:metrics:agora (X.XKB)
4. gov:summary
  ✓ gov:summary (X.XKB)
5. gov:audit
  ✓ gov:audit (X.XKB)

=== Seed Complete ===
Projects: 6, Metrics entries: XX
Automation coverage: 70%
```

⚠️ 腳本內部 hardcode `--namespace-id c066a2fd7942494c8ead37cc518b191b`，不需要帶 `--config`、不需要帶 `--remote`（npx wrangler 預設走 remote）。

⚠️ **不需要** `wrangler deploy`。這次只動 KV 值，Worker 程式碼沒改。

### 3.2 API 層驗證

```bash
curl -s -H "Authorization: Bearer $GOVERNANCE_TOKEN" \
  https://paulkuo.tw/api/governance/summary | jq '.projects[] | {id, total_commits}'
```

預期各專案 `total_commits` 數字接近：paulkuo-main ~549、formosa-esg ~80、llm-wiki ~52、acp ~14、ai-ready ~3、agora ~1。誤差 < 10 屬於分類邊界 case 可接受。

### 3.3 前端驗證

**無痕視窗** hard refresh `https://paulkuo.tw/governance/`（sessionStorage 會干擾）：

- 六個專案卡片「本週 commits」都有數字（不再是 `—`）
- 累計 commits bar chart 數字接近 3.2 的 API 輸出
- Automation coverage 仍 70%
- 稽核面板（scanner trend）正常

---

## 4. 上游假設（接手方先驗證再執行）

Cowork 的偵查基於以下 5 個假設，Code 執行前掃一眼，任一不成立就回報：

| # | 假設 | 驗證方式 | 若不成立 |
|---|------|---------|---------|
| 1 | `scripts/governance-kv-seed.cjs` 只寫 `gov:*` prefix（5 組 key、共 10 把） | Step 0 ②+ 檢視 L143-L241 的 `uploadToKV(...)` 呼叫 | 停下，Cowork 偵查前提失效 |
| 2 | 白沙屯 (formosa.js) 的 KV key prefix 是 `formosa_*`、`formosa:*`、`gps:*`、`gps_count:*`、`checkin_dedup:*`、`invite_codes`、`admin:*`、`sync:*`、`survey:*`，與 `gov:*` 零重疊 | `grep -Eoh "TICKER_KV\.(put\|get\|list)\([^,)]+" worker/src/formosa.js \| sort -u` | 停下，可能有新增的白沙屯 key 會跟 gov:* 撞 |
| 3 | `governance-api.js` 純讀 `gov:*`、無 list/delete | `grep -E "TICKER_KV\.(put\|list\|delete)" worker/src/governance-api.js` → 預期無輸出 | 停下，偵查結論失效 |
| 4 | `worklogs/PENDING.md` 無未結案白沙屯待辦 | `grep -iE "formosa\|mazu\|白沙屯\|繞境" worklogs/PENDING.md \| grep -E "^- \[ \]"` → 預期無輸出 | 先跟 Paul 對齊再 seed，避免 seed 剛好影響他手上的白沙屯工作 |
| 5 | TICKER_KV namespace id 為 `c066a2fd7942494c8ead37cc518b191b` | `grep -A1 "kv_namespaces" worker/wrangler.toml` | 停下，seed 腳本寫錯 namespace |

---

## 5. 驗證方式

| 驗證項 | 方法 | 來源標注 |
|-------|------|---------|
| seed 完成無報錯 | stdout 出現 `=== Seed Complete ===` + `Projects: 6` | 本機 CLI |
| KV 寫入成功 | Step 3.2 的 curl 回應 `projects[].total_commits` 皆 > 之前的基準值 | 線上 API |
| Dashboard 顯示正確 | 無痕 hard refresh `/governance/`，本週 commits 有值、bar chart 數字接近實際 | 瀏覽器 |
| 白沙屯未受影響 | **Cowork 已偵查確認**（第 4 節假設 1-5）；Code 端免重驗 | — |

若 API 已對但前端還錯：CDN `max-age=3600`，等或換區域試。Worker 沒改**不要**重部署。

---

## 6. 注意事項

### 已知陷阱

- ⚠️ `/governance/` 使用 sessionStorage 存 token，**smoke test 一律用無痕視窗**（見 `handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md`）
- ⚠️ CDN 快取 1 小時，hard refresh（Cmd+Shift+R）+ 無痕視窗雙保險
- ⚠️ seed 腳本是**順序寫入**，中途 fail 會留下部分更新狀態。直接修 fail 原因後重跑即可，`wrangler kv key put` 是 idempotent，不要 rollback

### 不可逆操作標記

- ✅ `wrangler kv key put` — **可逆**（idempotent，重跑會覆蓋）
- ✅ `node scripts/governance-kv-seed.cjs` — **可逆**（只是 put 動作的封裝）
- ⚠️ **禁止** `wrangler deploy`（這次不該部署，如果腳本出錯不是 deploy 能修的）
- ⚠️ **禁止** 動 `wrangler kv key delete`（seed 只有 put 沒有 delete，跟著腳本即可）

### 護欄相關

- **護欄 #11 Propose-then-Commit**：此任務屬於可逆操作，但由 Paul 在本機執行，自然滿足「提議→確認→執行→驗證」四步
- **護欄 #14 跨 repo 真相驗證**：本任務不改 code，純 KV 資料更新，不適用
- **護欄 #15 MCP 寫入的寫後驗證**：本任務透過 CLI 執行非 MCP，不適用

---

## 7. 信心等級

**高。**

- 偵查環節完整：governance-kv-seed.cjs 全檔已讀、formosa.js 所有 KV 呼叫已枚舉、governance-api.js 確認純讀
- 指令可達性：`scripts/governance-kv-seed.cjs` 8683 bytes 在 main 上存在（commit `be42206` fix `--remote` 參數後再無變動）
- 預期數字有 baseline：Cowork 手算 commit 分類得到 549/80/52/14/3/1，跟 seed 後應該一致（±10 容忍）

唯一不確定點：ai-ready 和 agora 的 commit 分類規則可能漏了 `.github/workflows/*.yml` 路徑（次要 follow-up，不阻塞本任務）。

---

## 8. Integration Checklist

這次改動**只動 KV 值**，不改 code、不改 schema、不改 route，理論上影響範圍極小。檢查項目：

- ✅ **白沙屯 (formosa-esg)**：KV key prefix 完全不重疊，零影響（詳見第 4 節假設 2）
- ✅ **LLM Wiki**：wiki 用 `wiki:*` 系列 key（另由 `scripts/wiki-kv-seed.cjs` 管理），跟 `gov:*` 也不重疊
- ✅ **TQEF / ACP / Builders Scorecard**：這些專案沒用 TICKER_KV（或用其他 prefix），不受影響
- ✅ **governance-api endpoints**（`/api/governance/{summary,projects,metrics,automation,audit}`）：全部會讀到新值，屬於預期效果
- ✅ **主站其他 Worker 邏輯**：`visitors.js`、`stock.js`、`feed.js`、`gsc.js` 等都用自己的 cache key，跟 `gov:*` 無交集

### 新 endpoint 防護繼承（護欄 #13）

**不適用**——本任務未新增 API endpoint。

### MCP 寫入驗證（護欄 #15）

**不適用**——本任務透過 `node scripts/...` + `npx wrangler kv key put` 本機執行，不走 MCP write 工具。但 Cowork 產出這份 handoff 檔案時已透過 GitHub MCP `create_or_update_file` 寫入 repo，byte-level 驗證方式：

```bash
# 接手時順手驗一下 handoff 自身沒截斷
curl -s https://raw.githubusercontent.com/zarqarwi/paulkuo.tw/main/handoffs/cowork--governance-kv-reseed-2026-04-18.md | wc -c
```

預期 ~8-10 KB，<2KB 表示截斷，立即回報。

---

## 完成後（Code 端動作）

### Worklog（按 skill 格式 + CLAUDE.md 三維度）

寫入 `worklogs/worklog-2026-04-18.md`（台灣時間 UTC+8）：

```markdown
## 完成日誌（最新在上）
- {HH:MM} 跑 governance-kv-seed.cjs 修復 Dashboard 數字（04-17 metrics 回溯補完後 KV 未同步）(no commit, 純 KV 寫入) Code
  - 障礙：{如實寫，沒有就省略}

## 狀態變更
- Dashboard 數字對不上：未解決 → 已解決（KV 重新 seed，無程式碼變更）
- worklogs/PENDING.md: 🟢 governance KV reseed → [x]

## 待 Paul 執行
- 無

## 技術備忘
- seed 腳本 idempotent，失敗直接重跑即可
- 次要 follow-up：classifier 對 `.github/workflows/ai-ready-*.yml` 和 agora workflow 分類規則可能漏判（影響 < 10 commits，下次整理 collector 時處理）
```

### PENDING.md

將 🟢 待辦標 `[x]` 並附短註：

```markdown
- [x] 🟢 跑 `node scripts/governance-kv-seed.cjs` 補 Dashboard 數字 → ✅ 已完成 (2026-04-18)
  - 完整 handoff：`handoffs/cowork--governance-kv-reseed-2026-04-18.md`
```

---

## Source References

- `scripts/governance-kv-seed.cjs` L10-L30（uploadToKV 函式）、L143-L246（main seed 流程）
- `worker/src/formosa.js` L9、L576-L648（KV key 使用一覽）
- `worker/src/governance-api.js` 全檔（純讀 `gov:*`）
- `worker/wrangler.toml`（TICKER_KV namespace id）
- `worklogs/PENDING.md`（白沙屯待辦掃描結果：無未結案項目）
- 前次相關 handoff：`handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md`、`handoffs/code--wiki-batch1-commit-kv-seed-2026-04-16.md`

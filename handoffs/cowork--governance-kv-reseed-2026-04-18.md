# Handoff: governance-kv-reseed

- **From**：Cowork（Opus 4.6）
- **To**：Code
- **建議模型**：Sonnet（純執行，3-5 分鐘）
- **日期**：2026-04-18
- **Task size**：XS（單一腳本執行 + 瀏覽器驗證）
- **前置閱讀**：本檔即可，不需翻其他歷史

---

## TL;DR

跑一支 KV seed 腳本，把 `/governance/` Dashboard 的數字補上。純讀寫 KV 的 `gov:*` prefix，對白沙屯專案零影響（已在 Cowork 視窗完整偵查過）。

---

## Context：為什麼要做

2026-04-17 Cowork 視窗自動跑了 `governance-metrics-collector`，收集當日 metrics（commit `28a09de`），然後補了 04-04 到 04-16 的回溯資料（commit `bf0705b`）。

**結果**：metrics JSON 檔已在 `worklogs/metrics/{project_id}/` 就位，但 `/governance/` Dashboard 顯示錯誤——

- 各專案「本週 commits」全空白（`—`）
- 累計 commits bar chart 顯示 135/45/38/0/0/3，實際應該是 549/80/52/14/3/1

**根因**：Dashboard 讀 TICKER_KV 裡的 `gov:*` key，但 metrics 檔 push 後沒重跑 seed，KV 還是舊值。

---

## 執行指令

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
node scripts/governance-kv-seed.cjs
```

腳本會依序寫 5 把 key（每把都會印 `✓ {key} ({size}KB)`）：
- `gov:projects`
- `gov:automation`
- `gov:metrics:{paulkuo-main|formosa-esg|llm-wiki|acp|ai-ready|agora}`（6 把，迴圈寫）
- `gov:summary`
- `gov:audit`

**最後會印**：`Projects: 6, Metrics entries: XX` + `Automation coverage: 70%`

⚠️ 內部用 `npx wrangler kv key put ... --namespace-id c066a2fd7942494c8ead37cc518b191b`，會自動帶 `--remote`（腳本第 20 行 hardcoded）。不需要另外加 flag。

**不需要** `wrangler deploy`——這次只動 KV 值，Worker 程式碼沒改。

---

## Smoke Test（必做）

開 **無痕視窗**（避免 sessionStorage 干擾），hard refresh `https://paulkuo.tw/governance/`：

1. ✅ 六個專案卡片「本週 commits」都有數字（不再是 `—`）
2. ✅ 累計 commits bar chart 數字對：
   - paulkuo-main: ~549
   - formosa-esg: ~80
   - llm-wiki: ~52
   - acp: ~14
   - ai-ready: ~3
   - agora: ~1
3. ✅ Automation coverage 仍顯示 70%
4. ✅ 稽核面板（scanner trend）仍正常

數字有小幅誤差正常（分類邊界 case），差到兩位數以上就回報。

---

## 白沙屯安全確認（已偵查完）

Cowork 視窗已做完 pure investigation，結論：**零風險**。

| 方面 | 結果 |
|---|---|
| 寫入的 KV key prefix | 只有 `gov:*`（共 10 把左右） |
| 白沙屯用的 prefix | `formosa_*`、`formosa:*`、`gps:*`、`gps_count:*`、`checkin_dedup:*`、`invite_codes`、`admin:*`、`sync:*`、`survey:*` |
| Prefix 重疊 | **零重疊** |
| Namespace 共用 | 是（都是 TICKER_KV `c066a2fd...`），但 KV 是 key-value，不同 key 互不干擾 |
| governance-api.js 行為 | 純讀 `gov:*`，無 list/delete |
| 需要 redeploy | 否 |
| PENDING.md 白沙屯待辦 | 全部已結案 |

source ref：`scripts/governance-kv-seed.cjs` L10-L30, L143-L246；`worker/src/formosa.js` L9-L648；`worker/src/governance-api.js` 全檔

---

## 完成後

1. 改 `worklogs/PENDING.md`：把 `🟢 跑 governance-kv-seed 補 Dashboard 數字` 標 `[x]`
2. 寫 worklog `worklogs/worklog-2026-04-18.md`（按三維度：做了什麼 / 決策紀錄 / 阻礙與踩坑，沒有就寫「無」）
3. 狀態變更欄位補一筆：「Dashboard 數字對不上：未解決 → 已解決（KV 重新 seed）」
4. 不需要 commit（只動了 worklog，照 `CLAUDE.md` 規則自然追加）

---

## 次要 follow-up（非阻塞，不要這次做）

`scripts/collect-session-metrics.sh` 或上層 Python classifier（Cowork 視窗在記憶體裡跑的）對 `.github/workflows/ai-ready-*.yml` 和 agora 相關 workflow 的分類規則可能漏了。影響：回溯資料把兩支 workflow commit 算去了 paulkuo-main。量很小（個位數），下次整理 collector 時再修。

---

## 出事時

如果 seed 跑一半 fail（`✗ Failed to upload gov:XXX`）：
- 腳本是順序執行，已寫的 key 會留在 KV（部分更新）
- 直接修完 fail 原因重跑即可，`wrangler kv key put` 是 idempotent
- 不用 rollback

如果 Dashboard 還是錯：
- 確認 `gov:summary` 有寫入：`wrangler kv key get gov:summary --namespace-id c066a2fd7942494c8ead37cc518b191b --remote`
- 檢查 CDN（`max-age=3600`），可能要等或換區域測
- Worker 沒改不用重部署

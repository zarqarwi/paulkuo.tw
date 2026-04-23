# AI Ready 自動化重啟 Handoff

> 建立：2026-04-23
> Cowork session：paulkuo.tw 專案盤點（`worklogs/2026-04-23-project-audit.md`）
> 目標 session：Code [AI Ready Continuous evolution]
> 來源：Project Audit §3 + §6 R3 + §8.3
> **建議模型**：Claude Sonnet 4.6 + Effort Medium（需跑 calibration + 觀察 eval 結果）

---

## 問題描述

AI Ready 自動優化引擎實質停擺一個月：

- `ai-ready-opt/experiments.json` 是**空的**（0 筆實驗紀錄）
- `ai-ready-opt/calibration_report.json` 最後校準時間 **2026-03-22**（mean=50.63, stddev=5.86）
- 目前 4 層評分 **85/100**，目標 95/100，差 10 分
- JSON-LD 層號稱從 12 補到 22（commit `b5f604d`，2026-04-21），但**沒跑過 eval 確認**
- AI Comprehension 層 Q10「Paul 在哪？」答案精度問題，等 eval 確認後處理

這個專案是 Paul 用來驗證「autoresearch 迴圈搬到網站優化」的核心實驗，引擎不轉等於整個假設沒在被驗證。

---

## 需要做的事

### Phase A：確認現況（先跑不改）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/ai-ready-opt

# 1. 確認 experiments.json 是否真的空
cat experiments.json

# 2. 跑一次現況 eval（不做突變，純評分）
python optimize.py --dry-run --eval-only 2>&1 | tee /tmp/ai-ready-eval-baseline.log

# 3. 跑 Perplexity 外部驗證基準（13 題題庫）
python multi_model_query.py --mode baseline 2>&1 | tee /tmp/ai-ready-perplexity-baseline.log
```

⚠️ 如果 `--eval-only` 或 `--mode baseline` 這些 flag 不存在，**先讀 `optimize.py` 和 `multi_model_query.py` 的 argparse 區塊**確認正確 flag，再回報 Cowork。不要自己瞎猜 flag。

### Phase B：產出 baseline report

把 Phase A 三份輸出的結果貼到本 handoff 底部「Code 回報 Phase A」，內容包含：

- 4 層目前實際分數（llms.txt / JSON-LD / MCP+A2A / AI Comprehension）
- Perplexity 13 題引用率
- 和 2026-03-22 calibration 相比變化

### Phase C：決定下一步（等 Cowork / Paul 決策）

Phase B 貼完後**停下來**等 Cowork 或 Paul 回覆。不要擅自跑 `optimize.py` 的突變迴圈。

可能的分歧路線：

**路線 1**：JSON-LD 22 分已經達標 → AI Comprehension 層（Q10）微調，目標 +2 分到 25 分
**路線 2**：JSON-LD 還沒 22 分 → 檢查 `b5f604d` 為何沒生效，先修 deploy
**路線 3**：重跑 10 次 calibration 更新 `calibration_report.json`（因為距上次已一個月，stddev 可能已漂移）

Cowork 會根據 Phase B 數字決定走哪一條。

---

## 安全守則（program.md 定的規則，不能破）

- 一次只改一個檔案
- improvement < 2 分 → 回滾
- 任何子分數下降 > 3 分 → 回滾
- 不要加 FAQ frontmatter 期待 JSON-LD 改善（FAQ 不在評分範圍）
- 不要重複已失敗的策略
- 白名單外的檔案**不准動**：`siteSchema.ts` / `public/llms.txt` / `public/llms-full.txt` / `public/.well-known/mcp.json` / `public/.well-known/agent-card.json` / `public/robots.txt`

---

## 跨專案影響

⚠️ **AI Ready 是唯一會自動修改共用檔案的子專案**：

- 動 `siteSchema.ts` → 全站 SEO JSON-LD 受影響
- 動 `llms.txt` → LLM Wiki 的間接參考源受影響
- 動 `mcp.json` / `agent-card.json` → 外部 AI agent 發現能力受影響

跑完任何 optimize 循環後，必須驗：

```bash
# JSON-LD 存在性
curl -s https://paulkuo.tw/ | grep -c "application/ld+json"  # 應 > 0

# eval worker 健康
curl -s -o /dev/null -w "%{http_code}" https://paulkuo-eval.paul-4bf.workers.dev/api/eval/score  # 應為 200
```

任一 fail → 立即回滾。

---

## 完成後請做

1. 填 Phase A 的「Code 回報 Phase A」區塊
2. 停下來等 Cowork 決策，不跑 Phase C
3. Worklog（`worklogs/worklog-2026-04-23.md`）追加一筆三維度紀錄（Phase A 結果）

---

## Code 回報 Phase A

```
驗收時間：
experiments.json 狀態：
python optimize.py --eval-only 結果：
  llms.txt 層：___ / 25
  JSON-LD 層：___ / 25
  MCP + A2A 層：___ / 25
  AI Comprehension 層：___ / 25
  合計：___ / 100
和 2026-03-22 calibration 對比：
  baseline mean 50.63 → 目前 ___
  baseline stddev 5.86 → 目前 ___
Perplexity 13 題：
  正面題命中：___ / 10
  反幻覺題未誤 match：___ / 3
待 Cowork 決策：選路線 1 / 2 / 3
```

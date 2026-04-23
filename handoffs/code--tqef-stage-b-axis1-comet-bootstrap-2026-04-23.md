建議模型: Opus
Task Sizing: L（60-90 分鐘 + COMET 下載時間）
產出來源: PROJECT_AUDIT_2026-04-23.md §3.3、§7（策略建議）
接手方: Code session
前提: Paul 確認要啟動 Stage B 軸線 1（非默認執行，要 Paul 拍板）

---

# Handoff: TQEF Stage B 軸線 1 — COMET 交叉驗證腳本 Bootstrap

## 背景

PROJECT_AUDIT 2026-04-23 確認 TQEF Phase 2 Stage B 三軸自 2026-03-17 宣告以來零進度：

| 軸線 | 目標 | 狀態 |
|------|------|------|
| 軸線 1 | COMET 交叉驗證（Pearson r ≥ 0.6） | ⏳ 未動手 |
| 軸線 2 | 人類專家基線（Cohen's Kappa ≥ 0.5） | 📋 指南 + 模板已出，等專家聯繫 |
| 軸線 3 | 評分穩定性（SD < 0.2） | ⏳ 未動手 |

Stage B 結案是 TQEF 從「內部評估工具」升級為「可發表的品質驗證層次」的關鍵閘門。軸線 1（COMET）是三軸中可純工程化、不依賴外部專家的——適合先做。

**這份 handoff 的範圍**：建立 COMET 評分腳本的最小可運作版本（MVP），跑一次 100 句抽樣，產出第一份 Pearson r 報告。結果不論是否達標（r ≥ 0.6）都算 Stage B 開場完成。

## Step -1：環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull

# Python 環境（COMET 需要 torch + transformers）
python3 --version  # 確認 3.10+
pip install --break-system-packages unbabel-comet  # COMET 官方套件
```

⚠️ COMET 首次執行會下載 wmt22-comet-da 模型（約 2GB），需有網路且留出 5-10 分鐘。

## Step 0：偵察（極重要，避免重複造輪）

```bash
# 1. 確認 tqef_corpus 表目前有多少筆、欄位結構
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "SELECT COUNT(*) as total, source_type, COUNT(*) as cnt FROM tqef_corpus GROUP BY source_type"

# 2. 看 tqef_corpus 欄位
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "PRAGMA table_info(tqef_corpus)"

# 3. 確認是否已有 COMET 相關欄位 / 表
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%comet%' OR name LIKE '%pearson%'"

# 4. 看既有 eval_runner.py（本地評估腳本，226 行）的結構——新腳本要仿照同風格
ls -la scripts/tqef/ 2>/dev/null || find . -name "eval_runner.py" 2>/dev/null
```

**偵察預期**：
- tqef_corpus 總數 ~2,369（Stage A 結案數字）
- 不會有現成 COMET 欄位——這個 handoff 就是要建立
- eval_runner.py 可能在 `scripts/tqef/` 或 repo 根目錄

⚠️ 如果發現已有 COMET 腳本（極低機率），停下來寫 worklog 說明，不要覆蓋。

## Step 1：設計 schema + 新增 D1 欄位

**新增一張表** `tqef_comet_scores`：

```sql
-- worker/migrations/tqef_comet_scores.sql
CREATE TABLE IF NOT EXISTS tqef_comet_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  corpus_id INTEGER NOT NULL,
  round_id INTEGER NOT NULL,              -- 對應哪一輪（R6-R11）
  comet_score REAL NOT NULL,              -- COMET wmt22-comet-da 分數（0-1）
  comet_model TEXT NOT NULL DEFAULT 'wmt22-comet-da',
  tqef_l2_score REAL,                     -- 對應的 TQEF L2 總分（從 tqef_results 抓）
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (corpus_id) REFERENCES tqef_corpus(id),
  FOREIGN KEY (round_id) REFERENCES tqef_rounds(id)
);

CREATE INDEX IF NOT EXISTS idx_comet_round ON tqef_comet_scores(round_id);
CREATE INDEX IF NOT EXISTS idx_comet_corpus ON tqef_comet_scores(corpus_id);
```

執行：
```bash
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --file=worker/migrations/tqef_comet_scores.sql
```

## Step 2：寫 COMET 抽樣 + 評分腳本

**檔案位置**：`scripts/tqef/comet_eval.py`

**功能需求**：
1. 從 `tqef_corpus` 抽 100 句（隨機，seed 固定，可重現）
2. 對每句用 Claude Haiku 4.5 翻譯（走 `/translate-stream` 或直接 API call）
3. 用 GPT-4o 產出 reference translation（用 OpenAI API，當 gold standard）
4. 跑 COMET 評分：`source` + `hypothesis` (Claude 翻譯) + `reference` (GPT-4o)
5. 計算 Pearson r：`comet_score` vs `tqef_l2_score`（從 tqef_results 表 join）
6. 寫入 `tqef_comet_scores`
7. 產出 report 到 `docs/tqef/stage-b-axis1-comet-report-{YYYY-MM-DD}.md`

**CLI 介面**：
```bash
python3 scripts/tqef/comet_eval.py --sample 100 --round 11 --seed 42
# 輸出：
#   Sampled 100 sentences from tqef_corpus (round 11)
#   Translating with Claude Haiku 4.5 ... [████████████] 100/100
#   Generating refs with GPT-4o ... [████████████] 100/100
#   Running COMET wmt22-comet-da ... [████████████] 100/100
#   Writing to D1 ... OK
#   Pearson r (COMET vs TQEF L2): 0.XXX
#   Report: docs/tqef/stage-b-axis1-comet-report-2026-04-23.md
```

**關鍵設計點**：
- **抽樣要可重現**：用固定 seed，寫入 report
- **寫入 D1 要 idempotent**：用 `INSERT OR REPLACE` 避免重複跑時寫入重複列
- **rate limit 保護**：Claude Haiku + GPT-4o 各 100 次 call，要加 retry + backoff（1s 起步，指數退避）
- **成本估算寫進 report**：Claude Haiku ~$0.01、GPT-4o ~$0.30、COMET 本地免費 → 單次跑約 $0.31 USD
- **走本機 API key**：
  - `ANTHROPIC_API_KEY`（已有）
  - `OPENAI_API_KEY`（新增，要 Paul 確認有）

## Step 3：產出報告模板

`docs/tqef/stage-b-axis1-comet-report-2026-04-23.md`：

```markdown
# TQEF Stage B 軸線 1 — COMET 交叉驗證報告（第 1 次）

- 日期：2026-04-23
- Round：R11（最後定稿版本）
- 抽樣：100 句，seed=42，source_type 分布：{manual: X, yt: Y, feedback: Z, meeting: W, stt: V}

## 結果

- **Pearson r**：X.XX
- **達標（≥ 0.6）**：✅/❌
- **95% CI**：[X.XX, X.XX]
- **樣本平均 COMET**：X.XX
- **樣本平均 TQEF L2**：X.XX

## 詳細分布（見 D1）

```sql
SELECT
  c.source_type,
  AVG(cs.comet_score) as avg_comet,
  AVG(cs.tqef_l2_score) as avg_tqef,
  COUNT(*) as n
FROM tqef_comet_scores cs
JOIN tqef_corpus c ON c.id = cs.corpus_id
WHERE cs.round_id = 11
GROUP BY c.source_type;
```

## 解讀

（跑完後由 Paul / Cowork 填）

## 成本

- Claude Haiku 4.5：$X.XX
- GPT-4o：$X.XX
- COMET：免費（本地）
- 合計：$X.XX
```

## Step 4：Commit（分兩個 commit）

```
commit 1: feat(tqef): 新增 tqef_comet_scores 表 + COMET 抽樣腳本 [影響: TQEF]
commit 2: docs(tqef): Stage B 軸線 1 COMET 首次跑出 r={X.XX}
```

⚠️ Commit message 標注 `[影響: TQEF]`（根據影響地圖）。

## Step 5：執行 + 驗證

```bash
# 先 dry-run（只抽樣不寫 D1）
python3 scripts/tqef/comet_eval.py --sample 10 --round 11 --seed 42 --dry-run

# 確認邏輯無誤 → 跑正式版
python3 scripts/tqef/comet_eval.py --sample 100 --round 11 --seed 42
```

**驗證**：
```bash
# D1 有 100 筆新資料
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
  --command "SELECT COUNT(*) FROM tqef_comet_scores WHERE round_id=11"

# Report 檔案已產出
ls -la docs/tqef/stage-b-axis1-comet-report-*.md

# Pearson r 有合理值（不是 NaN / 0）
grep "Pearson r" docs/tqef/stage-b-axis1-comet-report-*.md
```

## 回報格式

worklog + Issue #155 同步 + PENDING.md 更新：

```markdown
## 完成日誌
- {HH:MM} TQEF Stage B 軸線 1 第一次跑完（COMET r={X.XX}，{達標/未達標}）(commit {SHA1} {SHA2} pushed) Code

## 狀態變更
- TQEF Stage B 軸線 1: ⏳ 未動手 → {✅ 達標 / 🟡 首輪完成未達標，需調整 / 🔴 方法論需重設計}
- tqef_comet_scores 表: 不存在 → ✅ migration 已跑，100 筆資料
- COMET 評分腳本: 不存在 → ✅ scripts/tqef/comet_eval.py

## 決策紀錄
- 為何先做軸線 1 而非 2/3：軸線 2 要等專家、軸線 3 可重複執行但結論不如軸線 1 有 external validity；軸線 1 純工程化，適合 bootstrap
- 為何用 GPT-4o 當 reference：業界 evaluation pipeline 常用 pattern，且 Claude + GPT 交叉驗證可抑制同源 bias
- 為何抽 100 句（非全部 2,369 句）：成本與時間權衡，r 的 95% CI 在 n=100 可達 ±0.15 以內

## 阻礙與踩坑
- {遇到什麼 / 無}
```

Issue #155 TQEF 區塊更新：
```markdown
Phase 2 ⏳ Stage B 進行中（軸線 1 已 bootstrap）
  - [x] 軸線 1：COMET 首輪 r={X.XX}（2026-04-23）
  - [ ] 軸線 1：調整/擴大樣本（如果 r < 0.6）
  - [ ] 軸線 2：聯繫翻譯專家
  - [ ] 軸線 3：SD 穩定性測試
```

## 本輪 metrics

- 3 個檔案新增：migration.sql、comet_eval.py、report.md
- 1 張 D1 表新增 + 100 筆資料
- 跑一次約 $0.31 USD（如果 rate limit 順利）
- 估 60-90 分鐘工程 + 5-10 分鐘 COMET 首次下載

## 注意事項

- ⚠️ COMET 首次跑會下載 wmt22-comet-da 模型（約 2GB），要有穩定網路
- ⚠️ GPT-4o 需要 `OPENAI_API_KEY`，要 Paul 先確認有、餘額足夠
- ⚠️ 如果 Pearson r < 0.4（明顯異常低），不要硬寫報告說達標，停下來寫阻礙區塊，讓 Paul 判斷是 TQEF 評分方法有問題、還是 COMET 不適合這個 domain
- ⚠️ 所有外部 API key 寫到 `.env`，不要 commit 到 repo
- ⚠️ 跨專案影響地圖：TQEF 子專案獨立，這次改動不會波及 Wiki / 主站 / Formosa

## Integration Checklist

- [x] API base URL：`https://api.anthropic.com/v1/messages` + `https://api.openai.com/v1/chat/completions`
- [x] 認證模式：Bearer token（env var）
- [x] CORS：N/A（本機執行）
- [x] 現有 pattern：`eval_runner.py` 的 CLI 風格（226 行，偵察時 Read 參考）

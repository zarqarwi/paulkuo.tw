# Wiki Schedule 合併設計稿

> **建立時間**：2026-04-22
> **最後更新**：2026-04-22（採路徑 1：get_筆記 repo 化，scanner 可搬雲端）
> **作者**：Cowork session（LLM Wiki 治理工程）
> **目的**：把目前 5 個 wiki 相關 scheduled tasks 合併成 2-3 個，降低每日訊息干擾，為後續 routine runs 搬遷做準備
> **狀態**：設計稿 → Paul 已確認四個決策點 + 路徑 1 → 待實作

---

## 一、為什麼要合併

目前 wiki 相關 schedule **每天 5 次訊息**散落在 09:37 ~ 10:33 的一小時內：

| 時間 | taskId | 性質 |
|---|---|---|
| 09:37 | `wiki-web-collector` | 寫 raw/clips/ |
| 10:02 | `wiki-ingest-scanner` | 讀 Apple Notes → 產清單 |
| 10:07（週三） | `wiki-knowledge-digest` | 讀 wiki → 產摘要 |
| 10:19 | `wiki-youtube-pull` | 讀 KV → 寫 sources/ |
| 10:33 | `governance-metrics-collector` + `cross-project-impact-scanner` | 讀 git → commit 報告 |

**問題：**

1. **訊息疲勞**：每天早上 1 小時內跳 5 次通知，實際上這些任務彼此有依賴、應該串成一條管線
2. **資源重疊**：scanner 和 web-collector 都在「為 ingest 準備素材」，digest 需要等 ingest 完成才有意義
3. **搬雲端前提**：routine runs 每日只有 15 次配額，先合併再搬才不會浪費
4. **沒有管線視角**：5 個獨立 task 讓人看不出「一天之中 wiki 到底做了什麼」

---

## 二、合併策略：一條管線 + 兩個獨立

把 5 個合併成 3 個，依照「功能定位」而不是「時間」來分：

### 🟢 Task 1：`wiki-daily-pipeline`（每日一條龍，**可搬雲端**）

**時間**：每日 09:30
**替代**：`wiki-web-collector` + `wiki-ingest-scanner` + `wiki-youtube-pull`
**為什麼能合併**：三者都是「為 wiki 準備/補充素材」，彼此無強依賴但都寫入 wiki repo，合併後可以一次產出「今日素材補充報告」

**前置：get_筆記 repo 化（見本文件第七節）**

原本 `wiki-ingest-scanner` 以為要讀 Apple Notes MCP，實際上 get_筆記內容早就在本機 `~/Desktop/01_專案進行中/get_筆記/notes/` 了（每晚 23:00 由 `sync_notes.py` cron 同步）。採路徑 1 後，這個資料夾推 GitHub private repo，scanner 改讀 GitHub API，**整條 pipeline 可搬雲端**。

**管線流程：**

```
Step 1：wiki-web-collector 邏輯
  → 搜 pillar 關鍵字 → 透過 GitHub API commit 到 wiki/raw/clips/YYYY-MM-DD/

Step 2：wiki-youtube-pull 邏輯（改純 API）
  → 從 Cloudflare KV 拉 YouTube pending
  → 直接呼叫 YouTube transcript API / Groq fallback（不再走本機 cjs）
  → 透過 GitHub API commit 到 wiki/sources/

Step 3：wiki-ingest-scanner 邏輯（改讀 get_筆記 GitHub repo）
  → 呼叫 GitHub API 列 get_筆記 repo notes/ 下所有 md
  → 讀每個 md 的 frontmatter（note_id、title、tags、所在資料夾）
  → 比對 wiki/sources/ 已 ingest 的 raw_note_id 清單
  → 依資料夾名 + tags 分類 visibility（public / internal / private）
  → commit worklogs/wiki-ingest-pending.md 到 wiki repo

Step 4：彙整今日報告
  → commit 單一「今日 wiki 素材補充報告」到 worklogs/wiki-daily-YYYY-MM-DD.md
  → 內容：clips 新增 N 則、YouTube 新增 M 支、待 ingest K 則
  → 通知 Paul：是否要開新 session 批次處理 ingest
```

**Prompt 草稿：**

```
你是 Paul 的 LLM Wiki 管線管家。今天執行每日素材補充一條龍。

Wiki repo：zarqarwi/paulkuo.tw
Notes repo（private）：zarqarwi/get-biji-notes（或 Paul 指定的 repo 名）
Wiki 專屬儀表板：zarqarwi/paulkuo.tw Issue #157

依序執行以下四步，每步完成後先彙整結果再往下做，最後合併成單一報告：

Step 1 — Web clips 收集
- 呼叫 GitHub API 讀 paulkuo.tw repo data/wiki-pillar-keywords.json 取得 pillar 關鍵字
- 用 Brave search 搜尋近 24 小時結果
- 去重（對 url 和 title）後呼叫 GitHub API commit 到 wiki/raw/clips/YYYY-MM-DD/ 每則一個 md 檔
- 產 frontmatter: url, title, source_domain, pillar, fetched_at, visibility=internal（待審）

Step 2 — YouTube pending 拉取
- 讀 Cloudflare KV namespace TICKER_KV key youtube-pending
- 對每支影片直接呼叫 YouTube transcript API（沒字幕的標記 no_transcript，不自動 fallback Groq）
- 成功的透過 GitHub API commit wiki/sources/youtube-{videoId}.md
- 從 KV 移除已處理項目（成功的才移除；失敗的留到明日）

Step 3 — get_筆記 scanner（讀 GitHub private repo）
- 呼叫 GitHub API 列 get-biji-notes repo notes/ 下所有 md（用 git trees API 一次取完）
- 讀每個 md 的 frontmatter：note_id, title, tags, 所在資料夾路徑
- 比對 paulkuo.tw repo wiki/sources/ 下所有已 ingest 的 raw_note_id
- 依資料夾名分 visibility：
  - 01_專欄文章 / 03_環保循環經濟 / 04_AI與科技 → public
  - 02_醫療健康 / 05_商務會議 / 06_個人成長 / 08_其他 → internal
  - 07_生活雜記 / 09_會議錄音 → private（不 ingest）
- 特別規則：
  - tags 含「录音卡笔记」的，無論在哪個資料夾都降級為 internal
  - 05_商務會議 下的錄音卡筆記降級為 private
- 透過 GitHub API commit worklogs/wiki-ingest-pending.md 到 paulkuo.tw repo

Step 4 — 彙整今日報告
- 透過 GitHub API commit worklogs/wiki-daily-YYYY-MM-DD.md，格式：
  # Wiki 每日管線報告 YYYY-MM-DD
  ## Web clips: 新增 N 則（列 title + pillar）
  ## YouTube: 新增 M 支（列 title + 狀態）
  ## 待 ingest 筆記: K 則（public X / internal Y）
  ## 建議行動: ...（若 K > 0，建議開 session 批次處理）
- 最後回報給 Paul：數量摘要 + 是否需要介入

Step 5 — Stats refresh（2026-04-23 新增）
- 本機執行：`node scripts/wiki-stats-refresh.cjs`（掃 concepts/sources/entities 目錄 + 讀 graph.json，更新 src/content/wiki/stats.json）
- 雲端（Phase C 後）：直接呼叫 GitHub API 列三個目錄的檔案數，計算 totals，透過 GitHub API commit stats.json
- commit message：`[wiki-daily] stats: refresh to {N} pages`
- 失敗不中斷管線，標記在報告「Stats refresh 失敗」並繼續

回報規則：
- 每步失敗要標記並繼續下一步，不中斷整條管線
- 若某步 API rate limit，記錄到報告末端「明日重試清單」
- 所有 commit message 格式：[wiki-daily] <step>: <summary>
- 不建立 PR，直接 commit 到 main
```

**依賴：**
- GitHub MCP（讀 get-biji-notes private repo + 寫 paulkuo.tw repo）
- Brave search MCP
- Cloudflare KV（MCP 可用）
- YouTube transcript API（直接 HTTP）

**配額消耗**：1 次/日（雲端 routine runs）

---

### 🟡 Task 2：`wiki-weekly-digest`（週三深度回顧）

**時間**：週三 10:00
**替代**：`wiki-knowledge-digest`（維持原邏輯，改時間與描述）
**為什麼獨立**：digest 是**讀取型深度分析**，跟每日素材收集不同調性，週頻率也不同

**Prompt 草稿：**

```
你是 Paul 的 LLM Wiki 知識策展管家。每週三回顧過去 7 天 wiki corpus 變化。

輸入來源：
- wiki/sources/ 近 7 天新增或更新的檔案
- wiki/concepts/ 近 7 天新增或更新的檔案
- worklogs/wiki-daily-*.md 過去 7 天的每日報告

任務：
1. 盤點本週新增 sources（數量、主題分布、pillar 覆蓋）
2. 識別新興主題：哪些 concept 被多篇 source 引用但尚未建立頁面
3. 識別孤島：哪些 source / concept 沒有 wikilinks 連到其他節點
4. 提出本週 3 個「寫作題目候選」：基於 corpus 累積，Paul 可以寫什麼心得文

輸出：
- 寫入 worklogs/wiki-weekly-digest-YYYY-WW.md
- 格式附在文末

最後回報給 Paul：寫作題目候選 + 需要人工介入的 concept 缺口

回報規則：
- 不自動建立 concept 頁面，只建議
- 不 commit，等 Paul 決定
```

**依賴**：本機 wiki repo 讀取、不需 MCP 連外

**配額消耗**：1 次/週

---

### 🔵 Task 3：`cross-project-governance`（每日治理掃描）

**時間**：每日 10:30
**替代**：`governance-metrics-collector` + `cross-project-impact-scanner`
**為什麼能合併**：兩者都是「掃 git 活動產出治理報告」，同樣依賴 GitHub API，同樣產 JSON commit 到 repo

**Prompt 草稿：**

```
你是 Paul 的跨專案治理管家。每天彙整 GitHub 活動 + 共用檔案影響掃描。

專案範圍（監測清單）：
- zarqarwi/paulkuo.tw（主站 + wiki）
- zarqarwi/formosa-esg-2026
- zarqarwi/lasaas
- （其他見 data/governance-projects.json）

Step 1 — Governance metrics 收集
- 對每個專案呼叫 GitHub API 撈近 24 小時：
  - commits 數、作者分布
  - open/closed issues、open/merged PRs
  - CI 狀態（最近一次 workflow run）
- 產出 data/governance-metrics-YYYY-MM-DD.json
- commit + push 到 paulkuo.tw repo（觸發 Actions → KV seed → Dashboard 更新）

Step 2 — Cross-project impact 掃描
- 讀 docs/shared-file-impact-map.md 取得共用檔案清單
- 掃近 24 小時 commits 是否動到共用檔案
- 若有動到但 commit message 未標注影響範圍 → 列入警示
- 若有動到但未跑對應 smoke test → 列入警示
- 寫入 worklogs/cross-project-impact-YYYY-MM-DD.md

Step 3 — 合併回報
- 給 Paul 的摘要：
  - 昨日活動總量（跨專案 commit / PR / issue 數）
  - 紅色警示（若有 cross-project impact 漏標注）
  - Dashboard 更新狀態（是否成功觸發 KV seed）
- 若一切正常，回報可以簡短到「✅ 全綠，無警示」

回報規則：
- Step 1 若失敗（GitHub API rate limit 等），跳過 Step 2 直接回報錯誤
- Step 2 警示必須逐條列出，不能只說「有 N 個警示」
```

**依賴**：GitHub API MCP、本機 git push

**配額消耗**：1 次/日

---

## 三、合併後對比

| 項目 | 合併前 | 合併後 |
|---|---|---|
| Task 總數 | 5 個 | 3 個 |
| 每日觸發 | 4 次（週三 5 次） | 2 次（週三 3 次） |
| 訊息時間集中度 | 09:37~10:33 散亂 | 09:30 + 10:30 兩個節點 |
| 管線可讀性 | 看不出流程 | 每日一份報告說清楚做了什麼 |
| 搬雲端可行性 | 部分能搬 | **三個全可搬雲端**（path 1 後 scanner 改讀 GitHub API）|

---

## 四、實作順序建議

**Phase 0：get_筆記 repo 化（前置，必做）**

0a. 把 `sync_notes.py` 的 `API_KEY` / `CLIENT_ID` 搬到 `.env`（見第七節）
0b. 建立 `.gitignore`，排除 `.env`、`__pycache__/`、`all_notes_raw.json`、`sync.log`、`sync_stdout.log`、`sync_stderr.log`、`.sync_state.json`、`.DS_Store`、`*.pyc`
0c. 在 `~/Desktop/01_專案進行中/get_筆記/` 做 `git init` + 建立 private repo（建議 `zarqarwi/get-biji-notes`）
0d. 首次 commit 並 push 561 篇 md
0e. 改 `sync_notes.py` 在 sync 結束後自動 `git add notes/ && git commit && git push`

**Phase A：合併（本機 scheduled-tasks 內完成，先用本機 Apple Notes MCP 驗證邏輯）**

1. 新建 3 個合併後的 task，enabled=false 先不啟用
2. Task 1 scanner 在本機版本先用 filesystem 讀 `~/Desktop/01_專案進行中/get_筆記/notes/`（不呼叫 Apple Notes MCP）
3. 手動觸發一次測試三份 prompt 各自能跑通
4. 測試通過後，把 5 個舊 task 設 enabled=false（保留 2 週確認穩定再刪）
5. 把 3 個新 task 設 enabled=true

**Phase B：搬雲端（三個全搬）**

6. Phase 0 的 get_筆記 repo 穩定運作一週後
7. Task 2 `wiki-weekly-digest` 搬 routine runs（純讀、最安全，優先）
8. Task 3 `cross-project-governance` 搬 routine runs
9. Task 1 `wiki-daily-pipeline` scanner 改 GitHub API 版後搬 routine runs

**Phase C：配額觀察 + 收尾**

10. 觀察一週，確認 routine runs 配額 + MCP 可用性 + 產出正確
11. 穩定後把原 5 個 scheduled tasks 刪除（含 🔴 已廢棄那 7 個）
12. 更新 Issue #157，最終 task 清單（全雲端）

---

## 五、Paul 已確認的決策（2026-04-22）

1. ✅ **YouTube pull 改純 API**（不再依賴本機 cjs，失去 Groq fallback 可接受）
2. ✅ **Weekly digest 寫作題目候選由 AI 判斷**（不用固定規則）
3. 🔵 **GitHub API commit 能否觸發 Actions**：跟 Code / Chat session 討論後再定（Phase 0 probe 會驗證）
4. ✅ **舊 task 保留期 2 週**
5. ✅ **採路徑 1：get_筆記 推 private repo，scanner 改 GitHub API**

---

## 六、後續銜接

本設計稿完成後，接下來的工作：

- 等 Paul 確認決策點 → 在下個 [WIKI] session 實作 Phase A
- Phase A 穩定後 → 更新 `routine-runs-migration-handoff.md` 的 Phase 1 清單
- Phase B 執行時 → 在新 Cowork session 依 handoff 做 sandbox probe

相關文件：
- `worklogs/2026-04-22-routine-runs-migration/routine-runs-migration-handoff.md`（雲端搬遷 handoff，已更新補進盲點）
- Issue #157（LLM Wiki 儀表板，合併完成後更新 schedule 列表）

---

## 七、get_筆記 repo 化執行清單（路徑 1 前置）

### 現況盤點（2026-04-22 實測）

- **路徑**：`~/Desktop/01_專案進行中/get_筆記/`
- **總容量**：8.1 MB（notes/ 5.0 MB，GitHub 完全可放）
- **同步機制**：本機 cron 每晚 23:00 跑 `sync_notes.py`
- **筆記總數**：561 篇，分 9 個資料夾（visibility 結構已就位）
- **當前 git 狀態**：❌ 還沒 `git init`，沒有 `.gitignore`

### ⚠️ 關鍵安全風險

`sync_notes.py` **第 22-23 行 hardcode 了 API 金鑰**（實際值請在本機 `sync_notes.py` 中查看；本文件不貼出避免散布）：

```python
API_KEY = "gk_live_<REDACTED>"
CLIENT_ID = "cli_<REDACTED>"
```

**在任何 git 動作之前，必須先把金鑰搬走。** 連 private repo 也不該放——私 repo 只是存取控制，金鑰外洩（coworker、未來拿錯 token、repo 意外翻公開）風險仍在。

### Step-by-step 清單

**Step 1 — 搬金鑰到 .env**

```bash
cd ~/Desktop/01_專案進行中/get_筆記

# 從現有 sync_notes.py 第 22-23 行讀出 API_KEY / CLIENT_ID 後寫入 .env
# 範例：
#   BIJI_API_KEY=<從 sync_notes.py 複製>
#   BIJI_CLIENT_ID=<從 sync_notes.py 複製>
# （不要把實際值貼進 handoff / commit message / git log）

chmod 600 .env
```

改 `sync_notes.py`：

```python
import os
from pathlib import Path

# 載入 .env
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text().strip().split("\n"):
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ["BIJI_API_KEY"]
CLIENT_ID = os.environ["BIJI_CLIENT_ID"]
```

**Step 2 — 建立 `.gitignore`**

```
# 金鑰
.env

# Python
__pycache__/
*.pyc

# 同步產物（太大或含 PII）
all_notes_raw.json
sync.log
sync_stdout.log
sync_stderr.log
.sync_state.json

# macOS
.DS_Store

# Claude session 產物
cowork--*.md
code--*.md
chat--*.md

# 過去的 HTML 實驗
lobster-decameron*.html
龍蝦十日談*.html
龍蝦十日談*.pptx
```

**Step 3 — 驗證 `.env` 確實有效**

```bash
python3 sync_notes.py --dry-run 2>&1 | tail -20
```

（若 `sync_notes.py` 沒有 `--dry-run` 參數，就執行一次看有沒有正常同步、沒有用到環境變數讀不到金鑰）

**Step 4 — 旋轉金鑰（強烈建議）**

目前這組金鑰已經寫在 py 檔 一段時間，雖然你電腦上只有你用，但**現在是旋轉金鑰的好時機**：
- 登入得到 App 開發者後台作廢現有 key
- 申請新 key 寫入 `.env`
- 測試一次 sync 正常

（若你判斷風險低、先不旋轉也可以，但 handoff 留這一條備案。）

**Step 5 — git init + 首次 commit**

```bash
cd ~/Desktop/01_專案進行中/get_筆記
git init
git add .gitignore
git commit -m "chore: 初始化 gitignore"
git add sync_notes.py fetch_notes.py organize.py run_sync_now.py
git commit -m "feat: 同步管線改用 .env 讀金鑰"
git add notes/ _course_registry.json
git commit -m "feat: 首次納入 561 篇筆記"
```

**Step 6 — 建立 private repo + push**

```bash
gh repo create zarqarwi/get-biji-notes --private --source=. --remote=origin
git push -u origin main
```

（若不用 gh，就手動在 github.com 建 private repo 再 `git remote add origin ... && git push`）

**Step 7 — 加入自動 push**

改 `sync_notes.py` 的 `main()` 末端，同步完成後追加：

```python
import subprocess

def _git_push_if_changes():
    repo_dir = "/Users/apple/Desktop/01_專案進行中/get_筆記"
    try:
        status = subprocess.check_output(["git", "status", "--porcelain", "notes/"], cwd=repo_dir).decode()
        if not status.strip():
            log("git: 無變更，略過 push")
            return
        subprocess.check_call(["git", "add", "notes/"], cwd=repo_dir)
        subprocess.check_call(
            ["git", "commit", "-m", f"sync: {datetime.now():%Y-%m-%d %H:%M}"],
            cwd=repo_dir,
        )
        subprocess.check_call(["git", "push"], cwd=repo_dir)
        log("git: push 成功")
    except subprocess.CalledProcessError as e:
        log(f"git: push 失敗 - {e}")

# 在 main() 最後呼叫
_git_push_if_changes()
```

**Step 8 — 觀察 3 晚**

- 4/23 / 4/24 / 4/25 晚上 23:00 cron 跑完，隔天檢查 repo 是否有新 commit
- 若有問題（例如 macOS keychain 需要授權 gh token），在這三晚內修掉

**Step 9 — scanner 改讀 GitHub**

repo 穩定後，才開始改 `wiki-ingest-scanner` 的 prompt，改成用 GitHub API 讀 `get-biji-notes/notes/`。

### 風險摘要

| 風險 | 影響 | 對策 |
|---|---|---|
| API 金鑰外洩 | 高 | Step 1 搬 .env，Step 4 旋轉 |
| private repo 意外翻公開 | 中 | repo 建立後檢查 settings 鎖住 |
| 會議錄音含真實姓名/公司 | 中 | private repo 已隔離；若將來要 ingest 到公開 wiki，wiki 管線會做去識別化 |
| cron push 失敗沒通知 | 低 | Step 7 log 有紀錄；Paul 每週 check sync.log 一次 |
| GitHub 單一帳號故障 | 低 | notes/ 本機還有完整備份（5 MB）|

---

**結束。Phase 0 的 get_筆記 repo 化為所有後續動作的前置，優先執行。**

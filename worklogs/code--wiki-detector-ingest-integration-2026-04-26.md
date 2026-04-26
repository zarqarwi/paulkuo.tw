# Code Handoff — Wiki Dialogue Detector 整合 Ingest Pipeline（2026-04-26）

> 對應 Cowork v4 handoff 任務 #2 + #4 連動
> 本 handoff 由 Cowork session 產出，請 Code session 接手執行
> 雙寫：本機（Cowork mount）+ GitHub `worklogs/code--wiki-detector-ingest-integration-2026-04-26.md`

---

## 1. 任務目標

把 Phase 1 完成的 `wiki-dialogue-detect.py`（heuristic detector）正式整合進 ingest pipeline，讓所有 ingest 進來的 source 在進入 `src/content/wiki/sources/` 之前就帶有 `dialogue` / `dialogue_inference` / `speakers` 三個欄位，並啟用 `wiki-quarantine-classify.py` 內 stub 的 `requires_all` 規則，讓「錄音 + 商務會議 + 多人對話」三條件全成立的 source 自動命中 `outcome=delete`。

---

## 2. 背景脈絡

### 為什麼做這件事

- **Phase 1 detector 已完成**（commit `43c5d15` `52a7385`），但目前是「離線 dry-run only」工具，沒有掛到任何寫檔流程上
- **`data/wiki-quarantine-rules.yml` 規則 1** 已經寫好「has_recording_tag + business_meeting + is_dialogue → outcome=delete」，但 `wiki-quarantine-classify.py` 內 `requires_all` 邏輯目前 `return False` 為 stub
- **`docs/wiki-visibility-rules.md` Phase 2 Rule** 明確要求：「dialogue marker 自動偵測 → 待 ingest pipeline 補 marker 後啟用」
- 本任務正是「ingest pipeline 補 marker」這一步，連帶啟用 quarantine 規則 1

### 既有架構（讀過後再動手）

ingest 流程：
```
KV (youtube:pending:*)         get_筆記 notes/
        │                              │
        ▼                              ▼
wiki-youtube-ingest.cjs        sync_notes.py（在 get-biji-notes repo）
        │                              │
        └──────────► sources_pending/ ◄┘
                          │
                  Paul review（pending_status=approved/rejected）
                          │
                          ▼
                wiki-pending-promote.py
                          │
                          ▼
                src/content/wiki/sources/
                          │
                          ▼
                wiki-quarantine-classify.py
                wiki-quarantine-apply.py（blocklist + remove）
                          │
                          ▼
                wiki-kv-seed.cjs（KV reseed）
```

**最佳 hook 點 = `wiki-pending-promote.py`**（所有來源的共同收口），不動 Node.js 端的 youtube-ingest.cjs，也不需要動 get-biji-notes repo 內的 sync_notes.py。

---

## 3. 工作範圍

### In scope（本期做）

- A. 抽 lib：把 detector 邏輯萃取為 `scripts/wiki_dialogue_lib.py`（pure function module）
- B. 重構 CLI：`scripts/wiki-dialogue-detect.py` 改 import lib
- C. promote hook：`scripts/wiki-pending-promote.py` approved 路徑加 dialogue field 注入
- D. 啟用 quarantine：`scripts/wiki-quarantine-classify.py` 實作 `requires_all` 判斷
- E. 測試：lib 單元測試 + promote / classify 整合測試
- F. 跑一次 classify 看分布變化（對比 v3 handoff「0 支重疊」）

### Out of scope（不做，列 follow-up）

- ❌ `wiki-youtube-ingest.cjs` 不動 — Node 呼叫 Python child_process 改動面太大，promote 階段補就夠
- ❌ `get-biji-notes/sync_notes.py` 不動 — 跨 repo，本期範圍只動 paulkuo.tw
- ❌ Phase 2 LLM dialogue detect — Cowork v4 已決策取消（沒收益）
- ❌ 既有 corpus backfill — Cowork v4 拍板策略 A，既有 corpus 已乾淨，不跑 `--apply`

---

## 4. 實作步驟

### A. 新建 `scripts/wiki_dialogue_lib.py`（pure function module）

**風格仿 `scripts/wiki_visibility.py`：純函數、無 I/O、可 import。**

要 export 的內容：
- 常數：`TITLE_KEYWORDS`、`SPEAKER_PATTERNS`、`MIN_UNIQUE_SPEAKERS`、`MIN_TOTAL_MARKERS`、`BUSINESS_MEETING_TITLE_KEYWORDS`、`DIALOGUE_TITLE_KEYWORDS`
- 函數：
  - `detect_dialogue(frontmatter: dict, body: str) -> dict`（從現有 detect script 搬過來）
  - `is_dialogue_signal(frontmatter: dict, body: str) -> bool` —— 給 quarantine classifier 用，判斷「是不是多人對話」
    - return True if `fm.get('dialogue') is True` OR `len(fm.get('speakers', [])) > 1` OR title 含 `DIALOGUE_TITLE_KEYWORDS`（會議記錄/討論會）
  - `is_business_meeting(frontmatter: dict, folder: str | None = None) -> bool`
    - return True if folder == '05_商務會議' OR title 含 `BUSINESS_MEETING_TITLE_KEYWORDS`（會議/討論/洽談/合作探討/項目規劃/合作框架/合作交流/商業拓展）
    - folder 從 frontmatter 推斷或外部傳入（看 quarantine classify 怎麼用）

**測試：** `tests/test_wiki_dialogue_lib.py`（從 `test_wiki_dialogue_detect.py` 搬過來 + 擴充 `is_dialogue_signal` 和 `is_business_meeting`）

### B. 重構 `scripts/wiki-dialogue-detect.py`

- 移除常數和 `detect_dialogue` 函數本體（改 import）
- `from wiki_dialogue_lib import detect_dialogue, TITLE_KEYWORDS`
- CLI 介面（dry-run / apply / spot）邏輯保留
- `load_quarantine_rules()` 函數命名問題不修（v4 handoff 已標 follow-up，本期不動）

### C. 修改 `scripts/wiki-pending-promote.py`

在 `status == "approved"` 分支內，**strip pending fields 之前**插入 dialogue detection：

```python
from wiki_dialogue_lib import detect_dialogue

# ... 既有程式碼 ...

if status == "approved":
    target = SOURCES / path.name
    if target.exists():
        errors.append(...)
        continue

    # NEW: detect dialogue 並注入 frontmatter（idempotent — 已有則跳過）
    if "dialogue" not in fm:
        dialogue_result = detect_dialogue(fm, body)
        # 寫進 fm_text（保留原 YAML 順序，用 append 追加）
        fm_text = inject_dialogue_fields(fm_text, dialogue_result)

    cleaned_fm = strip_pending_fields(fm_text)
    # ... 既有 promote 邏輯
```

**`inject_dialogue_fields` 實作要點：**
- 跟 `strip_pending_fields` 同風格 — 操作 raw YAML text 不重新 serialize（preserve 原有欄位順序和 quoting）
- 在 `pending_status:` 那行的同位置（或檔案末尾，看哪個簡單）插入 3 行：
  ```yaml
  dialogue: true
  dialogue_inference: heuristic
  speakers:
    - 主持人
    - 來賓
  ```
- 沒 speakers 就只寫 dialogue + dialogue_inference

**測試：** `tests/test_wiki_pending_promote.py`
- fixture: 一個 sources_pending/*.md 已 approved，body 含 dialogue patterns
- run promote → 檢查 sources/*.md 出現 dialogue: true + speakers
- idempotent test：fm 已有 dialogue 欄位 → 跳過

### D. 修改 `scripts/wiki-quarantine-classify.py`

把目前 stub 改成實作（line 53-56 區段）：

```python
from wiki_dialogue_lib import is_dialogue_signal, is_business_meeting
from wiki_visibility import has_recording_tag

def matches_rule(rule, fm, body):
    title = fm.get("title", "") or ""
    tags = fm.get("tags", []) or []
    # ...

    # NEW: requires_all 規則實作
    if "requires_all" in rule:
        req = rule["requires_all"]
        checks = []
        if req.get("has_recording_tag"):
            checks.append(has_recording_tag(tags))
        if req.get("business_meeting"):
            # folder 從 fm 推斷（raw_note_id 或其他來源）— 暫時純看 title
            checks.append(is_business_meeting(fm, folder=None))
        if req.get("is_dialogue"):
            checks.append(is_dialogue_signal(fm, body))
        return all(checks)

    # ... 既有 match 邏輯
```

**注意：** `is_business_meeting` 在 ingest 階段拿不到 folder（getnote 來源 metadata 不一定保留），所以本期只看 title keywords。folder 推斷以後再加。

**測試：** `tests/test_wiki_quarantine_classify.py`
- fixture: 一個 source 同時有 recording tag + 商務會議 title + dialogue 欄位 → 命中規則 1
- 缺一個就不命中

### E. 跑 classify + 對比

```bash
python3 scripts/wiki-quarantine-classify.py
```

對比輸出：
- v3 handoff 提到「has_recording_tag + business_meeting + dialogue=true 0 支重疊」→ 預期啟用後 delete bucket 也是 0 支
- 如果不是 0 → 列出新命中清單，加進 commit message 讓 Paul 看到

### F. Commit + push

建議 commit 切：
1. `refactor(wiki-dialogue): extract detect logic to wiki_dialogue_lib.py`
2. `feat(wiki-dialogue-lib): add is_dialogue_signal + is_business_meeting helpers`
3. `feat(wiki-pending-promote): inject dialogue fields before promote`
4. `feat(wiki-quarantine-classify): enable requires_all rule (rule 1)`
5. `test(wiki-dialogue-lib): unit tests`
6. `test(wiki-pending-promote): dialogue field injection`
7. `test(wiki-quarantine-classify): requires_all rule`
8. `chore(worklog): detector-ingest integration session log`

---

## 5. 驗證標準（acceptance criteria）

- [ ] `wiki_dialogue_lib.py` import 成功，CLI dry-run 行為跟 commit 6b0d7db 之前一致（5/298 命中分布不變）
- [ ] `wiki-pending-promote.py` 在 sources_pending 有測試 fixture 時，promote 後的 sources/*.md frontmatter 有 dialogue 欄位
- [ ] `wiki-pending-promote.py` idempotent — 已 promote 的 source 重跑不重複注入
- [ ] `wiki-quarantine-classify.py` 跑完後，distribution 報告有顯示「rule 1 (requires_all)」命中數（即使是 0 也要看得到）
- [ ] 所有測試 pass：`pytest tests/test_wiki_dialogue_lib.py tests/test_wiki_pending_promote.py tests/test_wiki_quarantine_classify.py -v`
- [ ] `python3 scripts/wiki-consistency-check.py` 不報錯（該腳本本來就會檢查 visibility 規則一致性）

---

## 6. 跨專案影響盤點

依 `feedback_cross_project_impact` 紀律列出：

| 變更 | 影響檔案 | 影響範圍 | 破壞風險 |
|------|---------|---------|---------|
| 新增 `wiki_dialogue_lib.py` | promote, classify, detect-cli, tests 共用 | 邏輯共享，純加 module | 0 |
| 修改 `wiki-pending-promote.py` | sources_pending → sources/ 流程 | 新 promote 出來的 source frontmatter 多 3 欄；既有 sources/ 不動 | 低（idempotent guard） |
| 修改 `wiki-quarantine-classify.py` | classify report + overrides yaml | 重跑可能有新命中 → 進 delete bucket（會建議 raw_note_id 進 blocklist） | 中（要 Paul review override yaml 才會 apply） |
| `wiki-quarantine-apply.py` | 不動 | 既有 blocklist 流程，自動處理 classify 出的 raw_note_id | 0 |
| `wiki-kv-seed.cjs` | 不動 | 但 sources/ 數量變化會反映在下次 seed | 0 |
| 前端 wiki/ | 不動 | visibility=public/internal 邏輯不變 | 0 |
| Schema (`content.config.ts`) | 已支援 dialogue 欄位（v4 commit `6b0d7db`） | 不動 | 0 |
| `wiki-youtube-ingest.cjs` | 不動 | 透過 promote 階段補欄位 | 0 |
| `sync_notes.py`（get-biji-notes repo） | 不動 | 透過 promote 階段補欄位；跨 repo 影響為 0 | 0 |

### 共用檔案地圖更新

`docs/shared-file-impact-map.md` 加入 `wiki_dialogue_lib.py` 的共用紀錄：
- 上游：`wiki-dialogue-detect.py`（CLI）
- 下游：`wiki-pending-promote.py`、`wiki-quarantine-classify.py`、`tests/test_wiki_dialogue_lib.py`

---

## 7. 風險 + Rollback

### 風險

1. **`is_dialogue_signal` false positive**：title 含「會議」但實際是獨白（單一錄音逐字稿沒對話標記）→ 命中規則 1 → 自動 delete 誤刪
   - 緩解：classify 結果先寫入 `quarantine-overrides-2026-04-26.yml` 草稿，Paul review 後才 run `wiki-quarantine-apply.py`，所以 classify 階段不會直接 apply
   - 緩解：v3 handoff 已驗證「現有 corpus 0 支重疊」，本期啟用後也應該是 0 支（如果不是要先 spot check）

2. **Frontmatter 順序破壞**：`inject_dialogue_fields` 操作 raw text，可能放錯位置或破壞縮排
   - 緩解：unit test 比對 promote 前後完整 frontmatter；run promote 後手動 spot check 一個檔案

3. **`wiki-consistency-check.py` 對齊失敗**：visibility 規則 SSOT 文件可能要更新「dialogue 欄位寫入位置 = promote」
   - 緩解：實作完跑一次 consistency check，如果報錯依指引補 docs

### Rollback

- Git revert commit 序列（A → F）
- `sources/` 內已注入 dialogue 欄位的檔案可手動移除（grep `^dialogue: ` 找出來）— 但這些是新 promote 出來的，理論上不會破壞既有 corpus

---

## 8. 建議模型 + Effort

| 區段 | 建議模型 | Effort |
|------|---------|------|
| A. 抽 lib + CLI 重構 | Sonnet 4.6 | Low（純搬程式碼，15 min） |
| C. promote hook | Sonnet 4.6 | Low-Medium（YAML 操作要小心，20 min） |
| D. classify 啟用 rule 1 | Sonnet 4.6 | Low（純判斷邏輯，10 min） |
| E. 測試 | Sonnet 4.6 | Low-Medium（fixture 要寫好，20 min） |
| F. classify 跑完 spot check | Haiku 4.5 即可 | Low（5 min） |

**整體建議：** Sonnet 4.6，Medium effort（總計 60-75 min）

---

## 9. 開場 prompt（給 Code session）

```
請閱讀 worklogs/code--wiki-detector-ingest-integration-2026-04-26.md 後執行。

接續 Cowork v4 handoff 任務 #2 + #4，把 wiki-dialogue-detect.py 的偵測邏輯整合進 ingest pipeline，並啟用 wiki-quarantine-classify.py 規則 1（requires_all）。

實作步驟 + 跨專案影響盤點 + 驗證標準在 handoff 內。先讀完整份再動手；範圍要嚴格遵守 in scope / out of scope（不要動 youtube-ingest.cjs 跟 get-biji-notes 端的 sync_notes.py）。

完成後 push commit，把 commit hash 列在 handoff 「commit 索引」段落，並在 GitHub Issue #157 開一個 progress comment 報結果。
```

---

## 附錄：本 handoff 寫作時的關鍵讀檔清單

| 檔案 | 用途 |
|------|------|
| `scripts/wiki-dialogue-detect.py` | 看 detector 現況（要抽 lib） |
| `scripts/wiki_visibility.py` | pure function module 範本 |
| `scripts/wiki-pending-promote.py` | promote 流程，hook 點在這 |
| `scripts/wiki-quarantine-classify.py` | requires_all stub 在 line 53-56 |
| `data/wiki-quarantine-rules.yml` | 規則 1 描述（is_dialogue 自動偵測待 ingest pipeline 補 marker 後啟用）|
| `docs/wiki-visibility-rules.md` | Phase 2 Rule SSOT |
| `scripts/wiki-youtube-ingest.cjs` | 確認不需要動（promote 階段補就夠） |

---

*建立：2026-04-26 由 Cowork session 產出*
*取代：無 — 新建 handoff*

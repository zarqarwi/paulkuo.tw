# Code Handoff — Phase 4 Step A：derived_from 反向索引 build script（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**cleanup chore 已 push 後才起此 handoff**（commits `af0e921` packageManager + `bb795f0` .gitignore 已在 main）
> 來源：Phase 4 規劃文件 `cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（在 workspace，未進 repo）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Medium（30-45 min；新 script + 6+ unit tests + .gitignore 補一行）
> **前置條件**：本機 git pull origin main 後 HEAD 含 `bb795f0`

---

## 1. 上下文

第三步 derived_from acceptance 收尾完，Phase 4 主題 = **反向索引 + 衍生自 section（雙向 UI）**。

按工程角度依序處理，Phase 4 拆 7 步（A-G），**本 handoff 只做 Step A**：產出反向索引 build script + tests + .gitignore，純後端產出，不碰 UI。

### Phase 4 範疇拍板（2026-04-28 Cowork 規劃 session）

- 反向索引語系範圍：**全語系都進**（zh + en + ja + zh-cn）
- UI：Article「衍生自」+ Source「被引用」**雙向同步上**（Step B + C，後續 handoff）
- Backfill：Cowork 提議清單 → Paul 裁決（Step F，後續）
- Index 存法：**gitignore + prebuild 重生**（不 commit JSON）

### 第三步現況（pre-flight）

- `articleSchema.derived_from`: `z.array(z.string()).optional()` 已就位
- `scripts/wiki-derived-from-validate.py` 全語系驗證可用，`--strict` 模式可用
- 目前 0 篇 article 填了 derived_from（Step F backfill 才填）
- Phase 3 SSOT：`docs/article-derived-from.md`（含 Phase 4 規劃段）
- pytest 163 / consistency-check 12 refs / pnpm build 554 pages 0 errors

---

## 2. 護欄（**必讀**）

- **只動 4 件事**：
  1. 新建 `scripts/wiki-build-derived-index.py`
  2. 新建 `tests/test_wiki_build_derived_index.py`（+ 對應 fixtures）
  3. `.gitignore` 補 `data/wiki-derived-index.json` 一行
  4. （產出但 gitignore 不 commit）`data/wiki-derived-index.json`

- **不動**：
  - `src/content.config.ts`（schema 已就位）
  - 任何 article frontmatter（Step F 才寫 derived_from 進 frontmatter）
  - `src/pages/`（UI 是 Step B + C）
  - `package.json` prebuild（整合是 Step D）
  - `scripts/wiki-derived-from-validate.py`（已就位，本 step 沿用 directory pattern 但不改它）
  - `scripts/wiki_corpus_lib.py`（純 import，不擴充；如果發現缺 helper 也先停下來問 Paul）

- **遇到意外狀態先停**：
  - git status 出現 Paul 進行中工作（worklog / ACP / wiki sources / governance docs）
  - `python3 scripts/wiki-derived-from-validate.py` pre-flight check 失敗
  - 任何 derived_from 已被填過（不該發生，但要驗證）

---

## 3. 動作清單

### 動作 1：環境前置確認

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨

# 確認 cleanup chore 已 push
git log --oneline -8
# 期望看到：af0e921 chore(deps) + bb795f0 chore(gitignore) 在最近 commits

# 確認 derived_from validator pre-flight
python3 scripts/wiki-derived-from-validate.py
# 期望：Articles scanned: N / With derived_from: 0 / exit 0
```

如果 cleanup commits 不在 log 上 → 停下來問 Paul。

### 動作 2：建立 `scripts/wiki-build-derived-index.py`

**功能**：掃 4 個 articles 目錄讀 derived_from，輸出反向索引 JSON。

**核心需求**：
- 全語系：`src/content/articles/*.md`（直接子層）+ `articles/{en,ja,zh-cn}/*.md`
- 每個 entry 包：`article_slug`（檔名 stem，不含 `.md`）/ `lang`（zh / en / ja / zh-cn）/ `title` / `date`（ISO 字串）/ `pillar`
- 對每個 derived_from slug 嚴格檢查 source 存在；`--strict` 不存在 → exit 1
- 同 source 多篇引用 → 列表 sort by date 倒序
- 輸出 `data/wiki-derived-index.json`（pretty-print 2 空格縮排，UTF-8，sort_keys 讓 diff 穩定）
- import `wiki_corpus_lib` 的 `iter_source_paths` / `load_source` / `parse_frontmatter`

**lang 偵測規則**：
- `src/content/articles/*.md`（直接子層）→ `lang: zh`
- `articles/en/*.md` → `lang: en`
- `articles/ja/*.md` → `lang: ja`
- `articles/zh-cn/*.md` → `lang: zh-cn`

**Output JSON schema**：
```json
{
  "<source_slug>": [
    {
      "article_slug": "ai-collaboration-pivot",
      "lang": "zh",
      "title": "從碰撞到心得：AI 協作的軸線轉移",
      "date": "2026-04-30",
      "pillar": "ai"
    }
  ]
}
```

**CLI**：
```
python3 scripts/wiki-build-derived-index.py [--strict] [--articles-root PATH] [--sources-dir PATH] [--output PATH]
```
- 無 args：build 寫到 `data/wiki-derived-index.json`，stdout 印統計
- `--strict`：遇到 derived_from 含不存在 slug → exit 1
- `--articles-root`、`--sources-dir`、`--output`：覆寫路徑（給 tests 用）
- 退出碼：0 成功 / 1 strict 模式遇錯 / 2 CLI usage 錯誤

**stdout 統計範例**：
```
=== Build derived_from reverse index ===
Articles scanned:  N
With derived_from: 0
Sources known:     298
Index entries:     0
Output:            data/wiki-derived-index.json
```

### 動作 3：建立 `tests/test_wiki_build_derived_index.py` + fixtures

**fixtures 結構**（建議放 `tests/fixtures/derived_index/`）：

```
tests/fixtures/derived_index/
├── articles/
│   ├── zh-article-1.md           # zh, derived_from: [source-1]
│   ├── zh-article-2.md           # zh, derived_from: [source-1, source-2]，較新日期
│   ├── en/en-article-1.md        # en, derived_from: [source-1]
│   ├── ja/ja-article-1.md        # ja, derived_from: [source-2]
│   └── zh-cn/zhcn-article-1.md   # zh-cn, derived_from: []
└── sources/
    ├── source-1.md
    └── source-2.md
```

每個測試 setup 用 `tmp_path` 複製 fixtures，跑 build script `--output tmp.json --articles-root ... --sources-dir ...`，讀 JSON 比對。

**最少 6 個 test cases**：

1. **`test_basic_zh_only`**：只跑 zh 一篇 → index 一筆，lang=zh，title/date/pillar 正確
2. **`test_multi_lang_same_source`**：zh + en + ja 各 1 篇引用 source-1 → index `source-1` 含三筆，每筆 lang 不同
3. **`test_multi_articles_same_source_sorted_desc`**：兩篇 zh 引用 source-1，date 不同 → 列表新到舊排序
4. **`test_empty_or_missing_derived_from`**：article frontmatter `derived_from: []` 或無此欄位 → 不產生 entry
5. **`test_invalid_slug_strict_exits_1`**：article 引用不存在的 slug，加 `--strict` → exit code = 1，stderr 含 missing slug 名稱
6. **`test_invalid_slug_non_strict_exits_0`**：同上但無 `--strict` → exit 0，但 stderr 印 warning，輸出 JSON 不含該無效 slug 的 entry

**選做（如果時間夠）**：
7. `test_date_missing_falls_to_bottom`：article 無 date → entry 仍輸出，date 為空字串，倒序排列把它沉底

### 動作 4：`.gitignore` 補一行

讀現有 `.gitignore`，找到 cleanup chore 加的 `# Dynamic data files (updated by cron / runtime, not tracked)` 區塊，**在 `data/wiki-ingest-pending.md` 那行下面**加：

```gitignore
data/wiki-derived-index.json
```

不用改其他行，不用調整既有規則順序。

### 動作 5：跑驗收

```bash
# 1. 跑新 unit tests
python3 -m pytest tests/test_wiki_build_derived_index.py -v
# 期望：6+ pass

# 2. 跑全部 pytest 不破既有
python3 -m pytest tests/ -v
# 期望：163 → 169+ pass，無 fail

# 3. 跑 build script 一次（含 strict），確認對真實 corpus 不爆
python3 scripts/wiki-build-derived-index.py --strict
# 期望：exit 0，With derived_from: 0，Index entries: 0，data/wiki-derived-index.json 存在
ls -la data/wiki-derived-index.json

# 4. 確認 .gitignore 有效
git status
# 期望：data/wiki-derived-index.json 不出現在 untracked

# 5. consistency-check 不破
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified

# 6. Astro build 不破
pnpm build
# 期望：554 pages 0 errors
```

如果任何驗收項 fail → 停下來，回 Cowork 報告。

### 動作 6：commit + push

```bash
git add scripts/wiki-build-derived-index.py tests/test_wiki_build_derived_index.py tests/fixtures/derived_index/ .gitignore
git status  # 確認 staged 內容只有以上四項
git diff --staged --stat
# 期望：3 個新 .py + N 個 fixture .md + .gitignore 修改

git commit -m "feat(wiki-derived-index): add reverse index build script — Phase 4 Step A

Phase 4「反向索引 + 衍生自 section」第一步：

- scripts/wiki-build-derived-index.py：
  - 全語系掃 src/content/articles/{,en,ja,zh-cn}/*.md
  - 讀 derived_from frontmatter，反向 build 出 source→articles 索引
  - 輸出 data/wiki-derived-index.json（gitignore，prebuild 重生）
  - --strict 模式下 invalid slug 直接 exit 1
  - 重用 wiki_corpus_lib helper

- tests/test_wiki_build_derived_index.py：6+ unit tests + fixtures

- .gitignore 補 data/wiki-derived-index.json（cleanup chore 個別列舉的延伸）

Step B (Article 衍生自 section) / Step C (Source 被引用 section) /
Step D (prebuild 整合) 留給後續 handoff。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 7：Issue #157 留 Step A 收尾

Phase 4 第一個 commit，留結構化留言：

```markdown
## Phase 4 Step A — derived_from 反向索引 build script ✅

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | scripts/wiki-build-derived-index.py + tests + .gitignore |

**Build script 設計**：
- 全語系掃（zh/en/ja/zh-cn）
- output: `data/wiki-derived-index.json`（gitignore + prebuild 重生）
- `--strict` mode：invalid slug → exit 1
- 重用 wiki_corpus_lib helper

**驗收**：
- pytest 163 → XXX pass（新增 6+ tests）
- consistency-check 12 refs verified
- pnpm build 554 pages 0 errors
- `python3 scripts/wiki-build-derived-index.py --strict` exit 0（articles 0 篇 derived_from）

**待跑**（按工程角度依序處理）：
- Step B: Article「衍生自」section（UI）
- Step C: Source「被引用」section（UI）
- Step D: prebuild 整合
- Step E: 整體驗收
- Step F: Cowork 提議 backfill 清單 → Paul 裁決 → Code 寫入 frontmatter
- Step G: SSOT + Issue #157 收尾
```

### 動作 8：回 Cowork 報告

回 Cowork 5 行內執行摘要，含：
1. cleanup commits 確認 OK（af0e921 + bb795f0）
2. build script + tests pass 數
3. .gitignore 一行補上
4. commit sha + push 結果
5. Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| `scripts/wiki-build-derived-index.py` 建立 | 1 個新檔，CLI 可跑 |
| `tests/test_wiki_build_derived_index.py` 建立 + 6+ tests pass | pytest 163 → 169+ |
| `tests/fixtures/derived_index/` 建立 | 含必要 article + source fixtures |
| `.gitignore` 補 `data/wiki-derived-index.json` | 1 行 |
| `python3 scripts/wiki-build-derived-index.py --strict` | exit 0（real corpus 0 篇 derived_from） |
| `data/wiki-derived-index.json` 存在但 untracked | `git status` 不出現 |
| 全 pytest pass | 163 → 169+ |
| consistency-check | 12 refs verified（不變） |
| pnpm build | 554 pages 0 errors |
| commit + push 上 origin/main | 1 commit fast-forward |
| Issue #157 Step A 留言 | 已留 |

---

## 5. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-build-derived-index.py` | **新增** — Phase 4 後續 step / prebuild / KV seed 會 import |
| `tests/test_wiki_build_derived_index.py` + fixtures | **新增** |
| `.gitignore` | 補一行 — 不影響其他規則 |
| `data/wiki-derived-index.json` | 新產出 untracked — 將來 prebuild 自動重生 |
| `scripts/wiki_corpus_lib.py` | **不動**（純 import） |
| `scripts/wiki-derived-from-validate.py` | **不動**（已就位） |
| `src/content.config.ts` | **不動** |
| `src/content/articles/` | **不動** |
| `src/pages/` | **不動** |
| Phase 4 後續 step | 此 step 完成後解鎖 Step B / C / D handoff |

---

## 6. 護欄重申

- **不寫 Phase 4 Step B-G handoff**（按 `feedback_handoff_flow_discipline`，Cowork 不預先寫）
- **不改 article frontmatter**（Step F 才填 derived_from）
- **不動 src/pages/**（UI 是 Step B + C）
- **不接 prebuild**（Step D）
- **不寫 KV / Worker 相關**（Phase 5）
- **不擴充 derived_from schema**（保持 string[]）
- **不改既有 wiki_corpus_lib.py**（純 import；缺 helper 先停下來問 Paul）

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 | Sonnet 4.6 | 2 min |
| 動作 2 build script | Sonnet 4.6 | 12-15 min |
| 動作 3 unit tests + fixtures | Sonnet 4.6 | 10-12 min |
| 動作 4 .gitignore | Sonnet 4.6 | 1 min |
| 動作 5 驗收 | Sonnet 4.6 | 5 min |
| 動作 6-8 commit + push + 留言 + 報告 | Sonnet 4.6 | 3-5 min |

整體 **Sonnet 4.6 / Medium effort（30-45 min）**。

---

## 8. 不做的事（明確排除）

- 不寫 Article 頁「衍生自」section（Step B）
- 不寫 Source 頁「被引用」section（Step C）
- 不接 prebuild（Step D）
- 不寫 backfill 內容到 article frontmatter（Step F，Cowork 提議後 Paul 裁決）
- 不動 KV seed / Worker（Phase 5）
- 不改 wiki_corpus_lib.py（純 import）
- 不擴充 derived_from schema（保持 string[]）
- 不寫下一個 step 的 handoff（按紀律 Cowork 才寫）

---

## 9. 依賴 / 來源

- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace，未進 repo；本 handoff 是 Step A 落地）
- Phase 3 SSOT：`docs/article-derived-from.md`
- Schema 來源：`src/content.config.ts` `articleSchema.derived_from`
- Validator 範例：`scripts/wiki-derived-from-validate.py`（沿用 directory pattern 思路，但**不 import**）
- Helper：`scripts/wiki_corpus_lib.py`（import `iter_source_paths` / `load_source` / `parse_frontmatter`）
- 相關 commits：
  - `709641e` feat(article-schema): add derived_from field
  - `8141947` handoff(code): derived_from acceptance 收尾
  - `af0e921` chore(deps): pin pnpm + sync lockfile
  - `bb795f0` chore(gitignore): exclude dynamic data files
- 相關記憶：
  - `feedback_handoff_flow_discipline`（停手等回報）
  - `feedback_no_parallel_code_sessions`（一 repo 一次一個 Code session）
  - `feedback_terminal_cd_explicit`（指令絕對路徑）
  - `feedback_model_recommendation`（handoff 附建議模型）
  - `feedback_cross_project_impact`（跨檔影響檢查）

---

*產出：Cowork session 2026-04-28，cleanup chore 跑完後接 Phase 4 Step A 落地*

*下一手：Code 接此 handoff，30-45 min 完成 Step A；完成後回 Cowork，Cowork 才寫 Step B + C handoff*

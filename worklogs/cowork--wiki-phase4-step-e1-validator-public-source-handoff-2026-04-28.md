# Code Handoff — Phase 4 Step E1：derived_from validator 限 public source（2026-04-28）

> 建立：2026-04-28 由 Cowork session 寫，**Step D 已完成（b5d896d）後落地**
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（15-20 min；2 script 改動 + unit tests）
> **前置條件**：本機 git pull origin main 後 HEAD 含 `b5d896d`

---

## 1. 上下文

Phase 4 雙向 UI（A/B/C-prime/D）已完整鋪好。Step E 原規劃是「整體驗收 + i18n + validator」，工作面差太多（validator 是後端 Python / i18n 是前端 Astro），拆兩份：

- **E1（本份）**：`derived_from` schema validator 強制限 public source（後端，純 Python）
- **E2（後續 handoff）**：article 端「衍生自」section 標題 i18n 多語系字串（前端 Astro）

### 為什麼要 E1

Step C-prime 的 SSOT 修正（`docs/article-derived-from.md`）寫了：
> `derived_from` slug 必須對應 visibility=public 的 wiki source

但目前 `scripts/wiki-derived-from-validate.py` + `scripts/wiki-build-derived-index.py` 都只檢查「source 存在」，不檢查 visibility。如果 author 不慎把 derived_from 指向 internal source：
- Step B UI 會 hide 連結（不會 404，至少安全）
- 但 source 頁本身根本沒 build（因為 sources/[slug].astro 過濾 visibility=public）
- 反向索引 JSON 仍會收進該筆 entry —— internal slug 出現在 `data/wiki-derived-index.json` 是異常狀態

E1 把 `derived_from must be public` 從 SSOT 條款升級為 validator 強制檢查，author 一旦不小心填到 internal source，build 階段就 fail（或非 strict 印 warning）。

### 第三步現況（pre-flight）

- `scripts/wiki-derived-from-validate.py` 只檢查存在性
- `scripts/wiki-build-derived-index.py` 同上
- `scripts/wiki_corpus_lib.py` 已有 `iter_source_paths` / `load_source`
- 0 篇 article 真實填了 derived_from（不會撞到既有資料）
- pytest 171 / consistency 12 refs / pnpm build 835 pages 0 errors

---

## 2. 護欄

- **只動以下檔案**：
  1. `scripts/wiki-derived-from-validate.py`（加 visibility 檢查）
  2. `scripts/wiki-build-derived-index.py`（加 visibility 檢查）
  3. `tests/test_wiki_derived_from_validate.py`（如已存在 → 加 cases；如未存在 → 新建）
  4. `tests/test_wiki_build_derived_index.py`（加 visibility 相關 cases）
- **不動**：
  - `src/content.config.ts`（schema 欄位本身不變，純 lint 層級檢查）
  - 任何 article frontmatter
  - `src/components/` UI 元件（i18n 留 E2）
  - `docs/article-derived-from.md`（SSOT 已有 visibility 限制段，不必動）
  - `package.json`（prebuild 已接 build script，自動連帶 visibility 檢查）
- **遇到意外狀態先停**：
  - 跑 build script `--strict` 因 visibility 檢查 fail（不該發生，0 篇 derived_from）
  - test fixtures 與既有測試衝突

---

## 3. 動作清單

### 動作 1：環境前置

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
git fetch origin
git pull origin main
git status  # 應該乾淨
git log --oneline -5
# 期望：最近 b5d896d Step D 在 log

# 確認 build script 跑得過
pnpm wiki:build-derived-index
# 期望：exit 0

# 確認 validator 跑得過
python3 scripts/wiki-derived-from-validate.py
# 期望：exit 0，0 articles with derived_from
```

### 動作 2：修 `scripts/wiki-derived-from-validate.py`

**新增邏輯**：每個 derived_from slug 對應的 source frontmatter 必須 `visibility === 'public'`。

**改動範圍**：
- 加一個 helper：`load_public_source_slugs(sources_dir)` 回傳 set，只含 public visibility 的 slug
- `validate_one()` 邏輯改：對每個 derived_from slug，分三類報錯：
  - `<not-found:>` slug 對應的 source 檔不存在
  - `<not-public:>` slug 對應的 source 存在但 visibility=internal
  - 通過：visibility=public

**使用既有 `wiki_corpus_lib.load_source` 讀 frontmatter** 取 visibility。不要自己 parse YAML。

**stdout 統計加一行**:
```
Articles scanned:   N
With derived_from:  N
Wiki sources known: N (public: M, internal: K)
Missing slugs in:   N article(s)
Non-public slugs in: N article(s)  ← 新增
```

**`--strict` 行為**：
- 既有：missing slug → exit 1
- 新增：non-public slug → exit 1

### 動作 3：修 `scripts/wiki-build-derived-index.py`

**新增邏輯**：build_index() 若遇到 derived_from 指向 internal source：
- 印 warning 到 stderr：`⚠️ warning: derived_from references internal source '{slug}' in '{article_slug}' (skipping)`
- **不寫進** index（避免 internal slug 出現在 JSON）
- `--strict` 模式 → exit 1

**改動位置**：`build_index()` 函式裡，`if slug not in valid_slugs` 那段附近，加一個分支：
```python
elif source_visibility[slug] != "public":
    # internal source — skip but warn
    if strict:
        non_public_refs.append((article_slug, slug))
        continue
    print(f"⚠️ warning: derived_from references internal source '{slug}' in '{article_slug}' (skipping)", file=sys.stderr)
    continue
```

需要先 build `source_visibility` dict（slug → visibility）。在 `known_source_slugs` 旁加一個 `load_source_visibility_map(sources_dir)` helper。

**stdout 統計加一行**:
```
Articles scanned:  N
With derived_from: N
Sources known:     N (public: M, internal: K)
Index entries:     N
Non-public skipped: N  ← 新增
```

### 動作 4：unit tests

#### 4a. `tests/test_wiki_derived_from_validate.py`

如果檔案不存在 → 新建。如果存在 → 加 cases。

新增至少 3 cases：
1. `test_derived_from_public_source_passes`：article 含 derived_from slug，對應 source visibility=public → exit 0
2. `test_derived_from_internal_source_strict_fails`：article 含 derived_from slug，對應 source visibility=internal + `--strict` → exit 1
3. `test_derived_from_internal_source_non_strict_warns`：同上但無 `--strict` → exit 0，stderr 印 non-public warning

fixtures 結構（重用 derived_index 的）：
```
tests/fixtures/derived_index/
├── articles/
│   ├── article-with-public-ref.md
│   └── article-with-internal-ref.md
└── sources/
    ├── public-source.md     # visibility: public
    └── internal-source.md   # visibility: internal
```

如果 Step A 已建類似 fixtures，直接擴充即可。

#### 4b. `tests/test_wiki_build_derived_index.py`

加至少 2 cases：
1. `test_build_index_skips_internal_source`：article 引用 internal source → 該 slug **不出現**在 index
2. `test_build_index_strict_fails_on_internal`：同上但 `--strict` → exit 1

### 動作 5：驗收

```bash
# 1. 跑新測試
python3 -m pytest tests/test_wiki_derived_from_validate.py tests/test_wiki_build_derived_index.py -v
# 期望：原 8 + 5 新 = 13+ pass

# 2. 全 pytest
python3 -m pytest tests/ -v
# 期望：171 → 176+ pass

# 3. 跑 validator + build script 對 real corpus
python3 scripts/wiki-derived-from-validate.py --strict
# 期望：exit 0（0 篇 derived_from）

pnpm wiki:build-derived-index
cat data/wiki-derived-index.json
# 期望：仍是 {} 空物件，stdout 印 Sources known: 322 (public: 281, internal: 41)
# Non-public skipped: 0

# 4. consistency-check
python3 scripts/wiki-consistency-check.py
# 期望：12 refs verified

# 5. pnpm build
pnpm build
# 期望：835 pages 0 errors
```

任何 fail → 停下來。

### 動作 6：commit + push

```bash
git add scripts/wiki-derived-from-validate.py scripts/wiki-build-derived-index.py tests/test_wiki_derived_from_validate.py tests/test_wiki_build_derived_index.py tests/fixtures/derived_index/

git status  # 確認沒有額外檔案
git diff --staged --stat

git commit -m "feat(wiki-derived-validate): enforce derived_from must point to public source — Phase 4 Step E1

Phase 4 Step E1：把 docs/article-derived-from.md SSOT 的「derived_from 必須指 public source」
從文件條款升級為 validator + build script 強制檢查。

scripts/wiki-derived-from-validate.py:
- 加 visibility 檢查（讀 source frontmatter visibility 欄位）
- 報錯分類：missing slug / non-public slug
- --strict 模式下兩者都 exit 1

scripts/wiki-build-derived-index.py:
- build_index() 跳過 internal source 的 slug（不寫進 JSON）
- 非 strict 模式：印 warning 到 stderr
- strict 模式：exit 1

新增 5+ unit tests（含 fixtures 含 internal visibility 的 source）。

i18n 多語系字串拆 Step E2（前端 Astro），本 step 純後端 lint 強化。

Refs: Issue #157 Phase 4 / docs/article-derived-from.md SSOT"

git push
```

### 動作 7：Issue #157 留 Step E1 收尾

```markdown
## Phase 4 Step E1 — derived_from validator 限 public source ✅

| Phase | Commit | 內容 |
|-------|--------|------|
| Code — feat | `<sha>` | wiki-derived-from-validate.py + wiki-build-derived-index.py + 5+ unit tests |

**Validator 強化**：
- visibility 檢查：missing / non-public 分類
- --strict 模式 non-public slug → exit 1
- 非 strict 印 warning 不擋 build

**Build script 強化**：
- build_index() 跳過 internal source（不寫進 JSON）
- non-strict warning，strict exit 1

**驗收**：
- pytest 171 → 176+ pass
- consistency-check 12 refs
- pnpm build 835 pages 0 errors
- real corpus 跑乾淨（0 篇 derived_from）

**待跑**：
- Step E2: i18n 多語系字串（article 端「衍生自」section 標題隨 lang 切換）
- Step F: Cowork 提議 backfill → Paul 裁決 → 寫進 frontmatter
- Step G: 收尾
```

### 動作 8：回 Cowork 報告

5 行內：
1. 環境確認 + Step D commit OK
2. validator 改動內容
3. build script 改動內容
4. 全驗收 pass（pytest 數 / 真實 corpus 跑通）
5. commit sha + push + Issue #157 留言連結

---

## 4. Acceptance criteria

| 檢查項 | 期望 |
|--------|------|
| validator 加 visibility 檢查 | missing / non-public 分類報錯 |
| build script 加 visibility 檢查 | internal source 不寫進 JSON |
| unit tests 新增 5+ cases | pytest 171 → 176+ pass |
| real corpus validator | exit 0 |
| real corpus build script | JSON 仍 `{}` |
| pnpm build | 835 pages 0 errors |
| commit + push | 1 commit fast-forward |
| Issue #157 留言 | 已留 |

---

## 5. 跨專案影響

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-derived-from-validate.py` | lint 強化 — 未來 author 填錯 visibility 會被擋 |
| `scripts/wiki-build-derived-index.py` | build-time 強化 — JSON 永遠不含 internal slug |
| `tests/test_wiki_*.py` | 新增 cases |
| `tests/fixtures/derived_index/` | 補 internal visibility fixture |
| `data/wiki-derived-index.json` | 內容仍 `{}`（0 篇 derived_from） |
| Step F backfill | 將來 Cowork 提議的 derived_from 候選會自動跑 validator，invalid 提早抓出 |

---

## 6. 護欄重申

- 不動 schema（純 lint 層級）
- 不動 article frontmatter
- 不動 UI 元件（i18n 是 Step E2）
- 不動 SSOT 文件（已寫過 visibility 限制段）
- 不動 package.json prebuild（自動連帶生效）

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|--------|------|------|
| 動作 1 環境前置 | Sonnet 4.6 | 1 min |
| 動作 2 修 validator | Sonnet 4.6 | 4-5 min |
| 動作 3 修 build script | Sonnet 4.6 | 4-5 min |
| 動作 4 unit tests + fixtures | Sonnet 4.6 | 5-7 min |
| 動作 5 驗收 | Sonnet 4.6 | 2 min |
| 動作 6-8 commit + push + 留言 + 報告 | Sonnet 4.6 | 3 min |

整體 **Sonnet 4.6 / Low effort（15-20 min）**。

---

## 8. 不做的事

- 不做 i18n 多語系字串（Step E2）
- 不寫 backfill（Step F）
- 不動 schema（lint 層級即可）
- 不寫下個 step handoff

---

## 9. 依賴 / 來源

- Phase 4 規劃文件：`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`（workspace）
- Step C-prime SSOT 修正：`docs/article-derived-from.md`（visibility 限制段）
- Step A handoff / Step B+C handoff / Step C-prime handoff / Step D handoff（worklogs）
- 相關 commits：
  - `fda5a7a` Step A
  - `6df22ab` Step B
  - `dd30e98` Step C-prime
  - `b5d896d` Step D
- 相關記憶：
  - `feedback_handoff_flow_discipline`
  - `feedback_verify_route_exists_before_phase_planning`
  - `feedback_no_parallel_code_sessions`
  - `feedback_terminal_cd_explicit`
  - `feedback_model_recommendation`

---

*產出：Cowork session 2026-04-28，Step D 完成後 Step E 拆 E1+E2，本份 E1 純後端 validator 強化*

*下一手：Code 接此 handoff，15-20 min 完成 E1；完成後回 Cowork，Cowork 接 Step E2 (i18n) 或 Step F (backfill) handoff*

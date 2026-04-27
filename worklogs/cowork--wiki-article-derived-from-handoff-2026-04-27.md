# Code Handoff — Article schema 加 derived_from（2026-04-27）

> 建立：2026-04-27 由 Cowork session 接手「按工程角度依序處理」第三步
> 來源：Issue #157 closeout comment 4328231497（第二步 wiki_corpus_lib 完成後接力）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low-Medium（30-45 min；schema 加一欄 + validation script + docs + sample fill）

---

## 1. 上下文

第一二步把 frontmatter parsing / source-level 判斷邏輯統一收進 `gray-matter` + `wiki_corpus_lib`。第三步開始建 **L3 演化層** 的第一塊地基——把 article 跟 wiki source 的關聯欄位接起來。

**Northstar memory（`project_llmwiki_northstar`）**：
> Wiki 不是知識展示櫃，是碰撞引擎：讓多源素材在 Paul 腦中撞出心得文，並追溯每篇文章的素材脈絡。

第三步要做的是：article frontmatter 加一個 **optional `derived_from: string[]`** 欄位，記錄「這篇文章是從哪些 wiki source 衍生出來的」。這是 **單向 article → source** 的指標；反向索引（source → articles）留 Phase 4。

**Paul 已拍板的設計（Cowork 04-27 session 對齊）**：

| 設計選擇 | 拍板 |
|---------|------|
| 型別 | `string[]` 純 slug list |
| 指向範圍 | 只能指 wiki source（不能指 concept / entity） |
| 既有文章 | 全 optional，舊文章不動 backfill |
| 反向索引 | 第三步**不做**，留 Phase 4 |

最簡形態。frontmatter 範例：

```yaml
---
title: "從碰撞到心得：我怎麼讀 LLM 內部工具鏈"
pillar: ai
date: 2026-04-30
derived_from:
  - youtube-abc12345678-ai
  - getnote-558096-llm-anchor-points
  - getnote-617272-stakeholder-collab
---
```

---

## 2. 動作清單

### 動作 1：`src/content.config.ts` 加 derived_from 欄位

在 `articleSchema` 上加一行（約 line 18 cover 之後）：

```typescript
const articleSchema = z.object({
  title: z.string(),
  // ...既有欄位...
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  // L3 演化層：素材溯源（單向，指向 wiki/sources/）
  // 設計討論見 docs/article-derived-from.md
  derived_from: z.array(z.string()).optional(),
});
```

注意：四個語言 collection（zh-tw / en / ja / zh-cn）都共用 `articleSchema`，加一處全部生效。

### 動作 2：寫 SSOT 文件 `docs/article-derived-from.md`

仿 `docs/wiki-visibility-rules.md` / `docs/wiki-quarantine-sop.md` 的模式。內容包含：

- 為什麼要這個欄位（北極星 quote）
- 拍板的設計（型別 / 範圍 / optional）
- 如何填寫（範例 frontmatter）
- 不做的事（不指 concept、不做反向索引、不強制 backfill）
- 跟 wiki schema `links_to` / `linked_from` 的差異

長度約 60-100 行，足夠當未來 Phase 4 / Phase 5 的設計起點。

範本：

```markdown
# Article ↔ Wiki Source 溯源規則 (SSOT)

> 建立：2026-04-27（Phase 3 — L3 演化層第一步）
> Issue: #157

## 為什麼

paulkuo.tw Wiki 的北極星是「**碰撞引擎**：讓多源素材在 Paul 腦中撞出心得文，並追溯每篇文章的素材脈絡」。文章是輸出層，wiki source 是輸入層。`derived_from` 把這條 article ← source 的線記錄下來。

## 設計

### 型別

```typescript
derived_from: z.array(z.string()).optional()
```

純 slug list。不結構化（不加 role / weight）。理由：
- 跟 wiki schema 的 `links_to` / `linked_from` 一致
- frontmatter 簡潔
- 未來想擴成 `Array<{slug, role}>` 隨時可以平滑升級（先 string[] 後續擴 union 不破舊資料）

### 指向範圍

**只能指 wiki source**（即 `src/content/wiki/sources/*.md` 的 slug）。

不能指 concept / entity 的理由：
- concept 跟 article tags 容易語意重疊（雙標籤系統）
- 「素材→心得」的 mental model 是具體 source，不是抽象概念
- concept 可以透過 source 間接連結（A 文章 → B source → C concept）

### 必填 / 選填

**全 optional**。舊文章不需 backfill。新寫的文章可以選擇性填。

理由：
- L3 的真正價值在未來文章
- 強制 backfill 工作量大、邊際效益低
- optional 不破現有 build

## 如何填

### Frontmatter

```yaml
---
title: "..."
pillar: ai
date: 2026-04-30
derived_from:
  - youtube-abc12345678-ai
  - getnote-558096-llm-anchor-points
---
```

slug 必須對應 `src/content/wiki/sources/{slug}.md` 已存在的檔。可以用 `python3 scripts/wiki-derived-from-validate.py path/to/article.md` 驗證。

### 一次填多篇

如果要批次補（例如把 04-26 wrong_pillar #5 的 enriched source 補進舊文章），手動編輯後跑 validate script 確認 slug 都對。

## 不做的事（明確排除）

- **不指 concept / entity**：避免雙標籤系統
- **不做反向索引**（source → articles）：留 Phase 4，到時候做 KV index 一次處理
- **不強制 backfill 既有文章**：optional + 漸進
- **不做 Frontend UI**：Phase 4 才上「衍生自」section

## 跟 wiki schema links_to / linked_from 的差異

| | derived_from | links_to / linked_from |
|---|---|---|
| 方向 | article → source（單向） | concept ↔ concept（雙向）|
| 用途 | 溯源（這篇從哪來）| Graph view（知識網絡）|
| 必填 | optional | default `[]` |

兩個系統獨立。未來如果要做「文章圖譜」可以同樣機制延伸到 article ↔ article。

## Phase 規劃

- [x] Phase 3：schema 加欄位 + validation script + 1-2 sample article
- [ ] Phase 4：反向索引（source → articles）+ Frontend「衍生自」section
- [ ] Phase 5：KV index + Worker API endpoint
- [ ] Phase 6：碰撞 visualization（article ↔ source ↔ concept 三層 graph）
```

### 動作 3：寫 validation script `scripts/wiki-derived-from-validate.py`

**目標**：給定 article.md（或一批），檢查 frontmatter 的 `derived_from` 每個 slug 都對應 `src/content/wiki/sources/{slug}.md`。

仿 `wiki-consistency-check.py` 的風格（pure-function、明確 exit code）。用 `wiki_corpus_lib`（剛抽完）讀 frontmatter，省自己解析。

```python
#!/usr/bin/env python3
"""
Validate article frontmatter derived_from field — every slug must exist in wiki/sources/.

SSOT: docs/article-derived-from.md
Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Usage:
    python3 scripts/wiki-derived-from-validate.py                       # validate all articles
    python3 scripts/wiki-derived-from-validate.py path/to/article.md    # single file
    python3 scripts/wiki-derived-from-validate.py --strict              # exit 1 on any missing slug

Exit codes:
    0  all derived_from slugs valid (or empty)
    1  --strict mode + at least one missing slug
    2  CLI usage error
"""

from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from wiki_corpus_lib import load_source, iter_source_paths  # noqa: E402

ARTICLES_DIRS = [
    ROOT / "src" / "content" / "articles",
    ROOT / "src" / "content" / "articles" / "en",
    ROOT / "src" / "content" / "articles" / "ja",
    ROOT / "src" / "content" / "articles" / "zh-cn",
]
WIKI_SOURCES_DIR = ROOT / "src" / "content" / "wiki" / "sources"


def known_source_slugs() -> set[str]:
    """Return set of all wiki source slugs (filename stem)."""
    return {p.stem for p in iter_source_paths(WIKI_SOURCES_DIR)}


def collect_articles(arg: str | None) -> list[Path]:
    """Return list of article paths to validate."""
    if arg:
        p = Path(arg)
        if not p.exists():
            print(f"❌ {arg}: file not found", file=sys.stderr)
            sys.exit(2)
        return [p]
    paths = []
    for d in ARTICLES_DIRS:
        if d.is_dir():
            paths.extend(sorted(d.glob("*.md")))
    return paths


def validate_one(article_path: Path, valid_slugs: set[str]) -> list[str]:
    """Return list of missing slugs for this article (empty if all good)."""
    fm, _ = load_source(article_path)
    if fm is None:
        return []  # no frontmatter — not an error for this check
    derived = fm.get("derived_from") or []
    if not isinstance(derived, list):
        return [f"<not-a-list:{type(derived).__name__}>"]
    return [s for s in derived if s not in valid_slugs]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv

    file_arg = args[0] if args else None
    articles = collect_articles(file_arg)
    valid_slugs = known_source_slugs()

    total = 0
    with_derived = 0
    with_missing = 0
    all_missing: list[tuple[Path, list[str]]] = []

    for path in articles:
        total += 1
        missing = validate_one(path, valid_slugs)
        fm, _ = load_source(path)
        if fm and (fm.get("derived_from") or []):
            with_derived += 1
        if missing:
            with_missing += 1
            all_missing.append((path, missing))

    print(f"=== Article derived_from validation ===")
    print(f"Articles scanned:  {total}")
    print(f"With derived_from: {with_derived}")
    print(f"Wiki sources known: {len(valid_slugs)}")
    print(f"Missing slugs:     {with_missing} article(s)")

    if all_missing:
        print()
        print("Missing references:")
        for path, slugs in all_missing:
            rel = path.relative_to(ROOT)
            print(f"  {rel}")
            for s in slugs:
                print(f"    - {s}")

    if strict and all_missing:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
```

### 動作 4：寫白盒測試 `tests/test_wiki_derived_from_validate.py`

至少 6 個測試：

| 測試 | 目的 |
|------|------|
| `test_validate_one_no_derived_from` | article 沒 derived_from 欄位，回 [] |
| `test_validate_one_empty_list` | derived_from: [] 回 [] |
| `test_validate_one_all_valid` | 所有 slug 都在 valid_slugs，回 [] |
| `test_validate_one_some_missing` | 有兩個 valid 一個 invalid，回 [invalid] |
| `test_validate_one_not_a_list` | derived_from 是 string（誤填），回 含 type marker |
| `test_validate_one_no_frontmatter` | article 沒 frontmatter，回 [] (不算 error) |
| `test_known_source_slugs_returns_stems` | iter_source_paths 整合，回 stem set |

fixture 用 `tmp_path`，跟 `test_wiki_corpus_lib.py` 同模式。

### 動作 5：consistency-check 加新 SSOT 文件 + script

`scripts/wiki-consistency-check.py` 的 `EXPECTED_REFS` 加：

```python
"docs/article-derived-from.md",  # Phase 3 SSOT
"scripts/wiki-derived-from-validate.py",
```

並確認上述兩檔的 docstring / 開頭都引用 `wiki-visibility-rules.md`（已在動作 2-3 範本加入）。

### 動作 6：填 1-2 篇 sample article（**選做** — 跟 Code 主要工作分開）

**只在動作 1-5 全綠後才做**，且建議讓 Paul 自己挑文章。Code 不要主動編輯 articles/。

如果 Paul 要 Code 順手填 sample，建議候選：
- 04-27 wiki-enrich gray-matter / corpus_lib refactor 的 worklog 衍生文章（如果 Paul 要寫一篇「按工程角度依序處理」的後記）
- 4 月某篇 AI pillar 文章（Paul 指定）

填寫格式（單篇）：

```yaml
---
# 既有欄位...
derived_from:
  - youtube-j1V_C6qxT20-ai
  - getnote-617272-stakeholder-collab
---
```

填完跑 `python3 scripts/wiki-derived-from-validate.py src/content/articles/<file>.md` 驗證。

**動作 6 不做沒關係** — schema 上線、未來文章可以開始填就達到 Phase 3 目標。

### 動作 7：跑 acceptance suite

```bash
# 1. 新測試
pytest tests/test_wiki_derived_from_validate.py -v
# 期望：6+ tests pass

# 2. 既有測試集 — 確認動 schema 沒打破
pytest tests/ -v
# 期望：136 → 142+（含新測試），全綠

# 3. validation CLI smoke
python3 scripts/wiki-derived-from-validate.py
# 期望：所有 article 跑過，0 missing（因為都還沒填 derived_from）

python3 scripts/wiki-derived-from-validate.py --strict
# 期望：exit 0（沒人填）

# 4. consistency check
python3 scripts/wiki-consistency-check.py
# 期望：pass，含新 SSOT + script

# 5. Astro build smoke
npm run build  # 或 npx astro check
# 期望：所有 articles 全 parse（schema 加 optional 欄位不破舊文章）
```

### 動作 8：commit + push

兩段 commit：

```bash
# Commit 1：schema + SSOT + validation
git add src/content.config.ts docs/article-derived-from.md \
        scripts/wiki-derived-from-validate.py \
        tests/test_wiki_derived_from_validate.py \
        scripts/wiki-consistency-check.py
git commit -m "feat(article-schema): add derived_from field for article→source provenance

L3 演化層第一步：article frontmatter 加 optional derived_from: string[]，
記錄文章從哪些 wiki source 衍生出來。

設計（拍板）：
- 型別：string[] 純 slug list
- 指向範圍：只能指 wiki source（不指 concept/entity，避免雙標籤系統）
- 既有文章：全 optional，不 backfill
- 反向索引（source→articles）：留 Phase 4

新增：
- docs/article-derived-from.md SSOT
- scripts/wiki-derived-from-validate.py 驗證 slug 對應 wiki/sources/
- tests/test_wiki_derived_from_validate.py（6+ tests）

consistency-check EXPECTED_REFS 加兩個新檔。

SSOT: docs/article-derived-from.md
Refs: Issue #157 closeout 4328231497"

# Commit 2（如果動作 6 sample fill 做了）：
git add src/content/articles/<sample>.md
git commit -m "chore(articles): fill derived_from for <slug> as sample reference

Paul 指定的範例填寫，作為 derived_from 用法範本。
驗證：python3 scripts/wiki-derived-from-validate.py src/content/articles/<sample>.md → 0 missing"

git push
```

---

## 3. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| `articleSchema` 加 `derived_from` optional | 4 個語言 collection 全部生效（共用 schema）| 動作 1 |
| `docs/article-derived-from.md` SSOT 存在 | 完整覆蓋設計 / 範例 / 不做的事 / Phase 規劃 | 動作 2 |
| `wiki-derived-from-validate.py` 可用 | dry-run + 單檔 + --strict 三模式都對 | 動作 3 |
| 6+ unit tests pass | tmp_path fixture，邊界都 cover | 動作 4 |
| consistency-check pass | 新 SSOT + script 在 EXPECTED_REFS | 動作 5 |
| 既有 pytest 全綠 | 136 → 142+ tests | 動作 7 |
| Astro build pass | 所有 articles 全 parse（optional 欄位不破舊資料）| 動作 7 |
| validation CLI 無 missing | 沒人填 derived_from，所有 articles 都通過 | 動作 7 |

---

## 4. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `src/content.config.ts` | **加 1 行 optional 欄位**（articleSchema 第 18 行附近）|
| `docs/article-derived-from.md` | **新增** SSOT |
| `scripts/wiki-derived-from-validate.py` | **新增** validation CLI |
| `tests/test_wiki_derived_from_validate.py` | **新增** 6+ tests |
| `scripts/wiki-consistency-check.py` | EXPECTED_REFS +2 |
| `src/content/articles/**/*.md` | **不應該** 受影響(optional 欄位，舊文章不動)|
| `src/content/wiki/**/*.md` | 不動（wiki schema 不變）|
| `src/pages/wiki/*.astro` / `src/pages/article/*.astro` | **不動**（Phase 3 schema-only，UI 留 Phase 4）|
| Worker API / KV seed | 不動（Phase 5 才接 API）|
| `data/wiki-corpus.json` | 不動 |

---

## 5. 護欄

- **不動 wikiSchema** —— Phase 3 只動 articleSchema
- **不加 frontend UI** —— 不寫「衍生自」section、不改 article page template、不動 Worker API。Phase 4 才做
- **不做反向索引** —— source frontmatter 不加 `referenced_by_articles`，不建 KV index。Phase 4 才做
- **不強制 backfill** —— 既有 articles 通通不動。手動填的決策權留給 Paul
- **不指 concept / entity** —— validation script 嚴格只 check `wiki/sources/`，不接受 concept slug
- **不擴張 schema 結構** —— 維持 string[]，不加 role / weight / note 等。未來真有需求再升級成 union type
- **動作 6 sample fill 由 Paul 主動觸發** —— Code 不要自己挑文章編輯 articles/

---

## 6. Commit 計畫（重申）

```
feat(article-schema): add derived_from field for article→source provenance
chore(articles): fill derived_from for <sample> as reference（選做，動作 6）
```

一段或兩段，視動作 6 是否做。

---

## 7. 完成後在 Issue #157 留言回報

模板：

```markdown
## Article schema derived_from 完成（2026-04-27）

「按工程角度依序處理」第三步閉環。L3 演化層地基立起來了。

### Commits
- <sha-1> feat(article-schema): add derived_from field for article→source provenance

### 程式碼變化
- `src/content.config.ts`: articleSchema +1 行（`derived_from: z.array(z.string()).optional()`）
- 新 SSOT: `docs/article-derived-from.md`（X 行）
- 新 script: `scripts/wiki-derived-from-validate.py`（X 行）
- 新 tests: `tests/test_wiki_derived_from_validate.py`（X tests）
- consistency-check EXPECTED_REFS +2

### 等價性驗證
- ✅ pytest 全綠（136 → X tests）
- ✅ wiki-consistency-check pass
- ✅ Astro build pass（所有 articles 重 parse 通過）
- ✅ validation CLI 跑全部 articles → 0 missing

### Phase 規劃進度
- [x] Phase 3：schema + validation + SSOT ✅
- [ ] Phase 4：反向索引（source → articles）+ Frontend「衍生自」section
- [ ] Phase 5：KV index + Worker API endpoint
- [ ] Phase 6：碰撞 visualization

### 下一步
等 Paul 開始填 derived_from（手動編輯文章 frontmatter，不需 Code 介入）。
```

---

## 8. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 1 schema | Sonnet 4.6 | 2 min |
| 動作 2 SSOT 文件 | Sonnet 4.6 | 10-15 min |
| 動作 3 validation script | Sonnet 4.6 | 10-15 min |
| 動作 4 unit tests | Sonnet 4.6 | 8-10 min |
| 動作 5 consistency-check | Sonnet 4.6 | 2 min |
| 動作 6（選做）sample fill | — | 跳過，留 Paul |
| 動作 7-8 acceptance + commit | Sonnet 4.6 | 5-10 min |

整體 **Sonnet 4.6 + Low-Medium effort**（30-45 min）。比第二步輕。

---

## 9. 不做的事（明確排除）

- **不做反向索引**（source → articles）—— Phase 4 ticket
- **不做 Frontend UI** —— Phase 4 ticket
- **不做 KV seed / Worker API** —— Phase 5 ticket
- **不 backfill 既有 articles** —— Paul 手動決定要不要填
- **不擴 derived_from 型別** —— 維持 string[]（未來升級成 `Array<{slug, role}>` 是平滑的，不破舊資料）
- **不接受 concept / entity slug** —— validation 嚴格只 check `wiki/sources/`
- **不動 wikiSchema** —— wiki 端零變化
- **不寫 inference / auto-suggest 工具** —— 「從 tags / medium_url 自動推 derived_from」不在範圍

---

## 10. 依賴 / 來源

- 本任務來源：Issue #157 closeout comment 4328231497（第二步 wiki_corpus_lib 完成後接力）
- Northstar：memory `project_llmwiki_northstar`（碰撞引擎 / 素材脈絡）
- 模板：`scripts/wiki-consistency-check.py`（CLI 風格）、`docs/wiki-visibility-rules.md`（SSOT 結構）
- 用到的 lib：`scripts/wiki_corpus_lib.py`（剛抽完，第二步成果）—— 用 `load_source` / `iter_source_paths`
- 相關記憶：`feedback_handoff_local`（雙寫）、`feedback_handoff_flow_discipline`（停手等回報）、`feedback_session_single_project`（單專案）、`project_llmwiki_northstar`（北極星 vision）

---

*產出：Cowork session 2026-04-27 接手「按工程角度依序處理」第三步*
*下一手：Code session 接此 handoff，30-45 min 完成。Cowork 寫完此 handoff 停在這裡，按 feedback_handoff_flow_discipline 不預先寫 Phase 4 handoff，等 Code 回報 + Paul 拍板後再開*

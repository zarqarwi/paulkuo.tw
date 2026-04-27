# Code Handoff — wiki_corpus_lib 共用 lib 抽出（2026-04-27）

> 建立：2026-04-27 由 Cowork session 接手「按工程角度依序處理」第二步
> 來源：Issue #157 closeout comment 4327741438（第一步 gray-matter 完成後接力）
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Medium（60-90 min；新建 lib + 重構 6 支 caller + 等價性驗證）

---

## 1. 上下文

第一步（commits `3293b4b` / `3fd8d53`）拔掉 `wiki-enrich.cjs` 的手寫 YAML helper，淨減 45 行。第二步把 Python 端散落在多支 script 的 source-level 判斷邏輯抽成共用 lib，仿 `scripts/wiki_visibility.py` / `scripts/wiki_dialogue_lib.py` 的 pure-function 模式。

**為什麼此步要做**：今天 dialogue detector 啟用時 `tags` 形狀差異炸過一次（commit `fb3b10c` — `list[str]` vs `list[dict]`），同型炸法在多支 script 各自手寫的 frontmatter regex / `re.search('raw_note_id...')` 還會再來。先把這層抽乾淨，後面動 enrichment 邏輯改良 / dialogue marker auto-match / repo 化 scanner 才有穩固地基。

**今天 ingest pipeline 的散裂現狀**：

| Script | 現有手寫邏輯 | 行數 |
|--------|-----------|------|
| `build_wiki_ingest_report.py` | regex 抓 raw_note_id / title / tags + 自寫 yaml 解 | 60-90 |
| `wiki-quarantine-classify.py` | `load_source` regex split + yaml.safe_load | 42-49 |
| `wiki-quarantine-apply.py` | `load_source` + `write_source` + `find_source_by_id` | 32-60 |
| `wiki-pending-promote.py` | `split_frontmatter` regex + 手動 yaml.safe_load | 34-42 |
| `wiki-quarantine-recordings.py` | regex 抓 visibility / raw_note_id（沒 yaml） | 84-93 |
| `wiki-dialogue-detect.py` | `parse_md` 自製 split + yaml 解 | 23-37 |
| `wiki_rescan.py` | content 含 `"录音笔记"` 字串比對（**有 bug**：只抓單一 tag 變體，跟 `b0931a4` scanner fix 同病） | 31 |

每支 script 都有自己版本的「parse frontmatter」「找 raw_note_id」「判斷是否錄音」，邏輯偷偷漂移、修一處別處還在錯（例如 `wiki_rescan.py` line 31 至今還用「录音笔记」精確比對）。

---

## 2. 動作清單

### 動作 1：新建 `scripts/wiki_corpus_lib.py`

仿 `wiki_visibility.py` / `wiki_dialogue_lib.py` 的 pure-function module 模式。

**檔案頂部 docstring** 必須引用 SSOT（`docs/wiki-visibility-rules.md`）以通過 `wiki-consistency-check.py`。

**API（pure functions only — no I/O 對外公開的副作用，但 load/write 函式有 disk I/O，這沒辦法純化，至少集中）**：

```python
"""
Wiki Corpus Library — frontmatter I/O + source-level helpers.

Shared by build_wiki_ingest_report / wiki-quarantine-* / wiki-pending-promote
/ wiki-dialogue-detect / wiki_rescan and unit tests.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Conventions:
- parse_frontmatter / load_source 永遠回 (fm_dict, body_str)。fm 必為 dict（解析失敗回 None）。
- 不 re-export wiki_visibility / wiki_dialogue_lib 的函式 — caller 直接 import 那邊
  避免重複 entry point。本 lib 只裝「目前未被抽出」的 helpers。
"""

from __future__ import annotations
import json
import re
import yaml
from pathlib import Path
from typing import Any, Iterator, Optional


# ── Frontmatter I/O ─────────────────────────────────────────────────────────

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[Optional[dict], str]:
    """Return (frontmatter_dict, body_str). (None, text) if no valid frontmatter."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        fm = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        return None, m.group(2)
    return fm if isinstance(fm, dict) else None, m.group(2)


def serialize_frontmatter(fm: dict, body: str) -> str:
    """Inverse of parse_frontmatter. Uses sort_keys=False to preserve insertion order."""
    fm_yaml = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return f"---\n{fm_yaml}---\n{body}"


def load_source(path: Path) -> tuple[Optional[dict], str]:
    """Read file + parse_frontmatter. Body is empty if no frontmatter."""
    text = Path(path).read_text(encoding="utf-8")
    return parse_frontmatter(text)


def write_source(path: Path, fm: dict, body: str) -> None:
    """Serialize and write atomically (read-modify-write — caller owns lock semantics)."""
    Path(path).write_text(serialize_frontmatter(fm, body), encoding="utf-8")


# ── ID extraction ──────────────────────────────────────────────────────────

def extract_raw_note_id(fm_or_path) -> Optional[str]:
    """
    Extract raw_note_id as str. Accepts:
      - dict (parsed frontmatter): reads fm["raw_note_id"]
      - Path / str path: opens file + parses + reads
    Returns None if missing. Always coerces to str (frontmatter sometimes parses as int).
    """
    if isinstance(fm_or_path, dict):
        v = fm_or_path.get("raw_note_id")
    else:
        fm, _ = load_source(Path(fm_or_path))
        v = (fm or {}).get("raw_note_id")
    if v is None or v == "":
        return None
    return str(v).strip()


def extract_youtube_id(fm: dict) -> Optional[str]:
    """
    Extract youtube_id from frontmatter. Falls back to parsing raw_url if youtube_id absent.
    Returns the 11-char video ID or None.
    """
    if v := fm.get("youtube_id"):
        return str(v).strip()
    raw_url = fm.get("raw_url") or ""
    m = re.search(r"(?:youtu\.be/|v=)([A-Za-z0-9_-]{11})", raw_url)
    return m.group(1) if m else None


# ── Status checks ───────────────────────────────────────────────────────────

def is_enriched(fm: dict) -> bool:
    """True if enrichment block present (E1+ enriched, post-04-21)."""
    return "enriched_at" in (fm or {})


def is_quarantined(fm_or_text) -> bool:
    """
    True if quarantine block present.
    Accepts dict (checks fm['quarantine']) or raw text (substring check, used by classify.py).
    """
    if isinstance(fm_or_text, dict):
        q = fm_or_text.get("quarantine")
        return isinstance(q, dict) and bool(q)
    return "quarantine:" in str(fm_or_text)


def needs_review(fm: dict) -> bool:
    """True if quarantine.needs_review is True (i.e. not yet human-reviewed)."""
    q = (fm or {}).get("quarantine") or {}
    return bool(q.get("needs_review"))


def review_outcome(fm: dict) -> Optional[str]:
    """Return quarantine.review_outcome, or None if absent / pending."""
    q = (fm or {}).get("quarantine") or {}
    outcome = q.get("review_outcome")
    if outcome in (None, "", "pending"):
        return None
    return outcome


# ── Source discovery ───────────────────────────────────────────────────────

def iter_source_paths(sources_dir: Path) -> Iterator[Path]:
    """Yield .md files in sources_dir, sorted, skipping dotfiles."""
    for f in sorted(Path(sources_dir).glob("*.md")):
        if f.name.startswith("."):
            continue
        yield f


def find_source_by_raw_note_id(
    sources_dir: Path, raw_note_id: str, filename_hint: Optional[str] = None
) -> Optional[Path]:
    """
    Find source file by raw_note_id. Tries filename_hint first (fast path),
    falls back to scanning sources_dir.
    """
    target = str(raw_note_id).strip()
    if filename_hint:
        candidate = Path(sources_dir) / filename_hint
        if candidate.exists():
            fm, _ = load_source(candidate)
            if fm and extract_raw_note_id(fm) == target:
                return candidate
    for f in iter_source_paths(sources_dir):
        fm, _ = load_source(f)
        if fm and extract_raw_note_id(fm) == target:
            return f
    return None


# ── Blocklist loader ────────────────────────────────────────────────────────

def load_blocklists(blocklist_path: Path) -> tuple[dict, dict]:
    """
    Load wiki-ingest-blocklist.json. Returns (raw_id_blocklist, youtube_id_blocklist).
    Both dicts may be empty. Fail-open: returns ({}, {}) on file missing / parse error.
    """
    p = Path(blocklist_path)
    if not p.exists():
        return {}, {}
    try:
        doc = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}, {}
    return (
        doc.get("blocklist") or {},
        doc.get("youtube_blocklist") or {},
    )
```

⚠️ 上面範本是 **設計提案**，Code 端可依實際 caller 簽章微調，但對外契約（function name + 回傳型別）不可變動，否則重構步驟會炸。

### 動作 2：重構 `wiki-pending-promote.py`

**改動**：

```diff
- def split_frontmatter(text):
-     m = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.DOTALL)
-     if not m:
-         return None, text
-     return m.group(1), m.group(2)

+ from wiki_corpus_lib import parse_frontmatter, serialize_frontmatter
```

注意：原 `split_frontmatter` 回 raw text + body（不解析），現在改用 `parse_frontmatter` 直接拿 dict。`strip_pending_fields` 跟 `inject_dialogue_fields` 原本操作 raw YAML 文字以保留原始 quoting style — **這部分要 Code 判斷**：

- **選項 A（推薦）**：改成操作 dict + serialize_frontmatter，接受 quoting style 可能改變（已被 first-step gray-matter 接受同樣的 style 漂移）
- **選項 B**：保留 raw text 操作，但用 `parse_frontmatter` 拿 dict 來判斷 status（讀寫分離）

走選項 A，理由：第一步 gray-matter refactor 已接受同類無害副作用，現在保持一致比較重要。

### 動作 3：重構 `wiki-quarantine-classify.py`

```diff
- def load_source(path: Path):
-     text = path.read_text(encoding="utf-8")
-     m = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.DOTALL)
-     if not m:
-         return None, ""
-     try:
-         fm = yaml.safe_load(m.group(1))
-     except Exception as e:
-         print(f"⚠️  YAML parse error in {path.name}: {e}")
-         return None, ""
-     return fm, m.group(2)

+ from wiki_corpus_lib import load_source, is_quarantined, extract_raw_note_id
```

`main()` 內 `quarantine_files` filter 改用 `is_quarantined(text)`。`raw_note_id = fm.get("raw_note_id", "") or ""` 改 `extract_raw_note_id(fm) or ""`。

### 動作 4：重構 `wiki-quarantine-apply.py`

```diff
- def load_source(path):
-     ... regex + yaml.safe_load ...
- def write_source(path, fm, body):
-     fm_yaml = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
-     ...
- def find_source_by_id(raw_note_id, expected_filename=None):
-     ... loops + str(fm.get("raw_note_id", "")) == raw_note_id ...

+ from wiki_corpus_lib import (
+     load_source, write_source, find_source_by_raw_note_id, extract_raw_note_id,
+ )
```

注意：原 `load_source` 回三元組 `(fm, body, raw_text)` — `raw_text` 在現有實作從沒被讀過。可安全改成兩元組（`grep -n raw_text scripts/wiki-quarantine-apply.py` 應為空）。

### 動作 5：重構 `wiki-dialogue-detect.py`

```diff
- def parse_md(path: Path):
-     text = path.read_text(encoding='utf-8')
-     if not text.startswith('---'):
-         return {}, text
-     parts = text.split('---', 2)
-     ...
- def write_frontmatter(path: Path, fm: dict, result: dict):
-     ... yaml.dump ...

+ from wiki_corpus_lib import load_source, write_source
```

注意：原 `parse_md` 在解析失敗回 `({}, text)`，新 `load_source` 回 `(None, body)`。caller 處要把 `fm = fm or {}` 加上去。

### 動作 6：重構 `build_wiki_ingest_report.py`

```diff
- # Manual regex extraction
- match = re.search(r'raw_note_id:\s*"([^"]+)"', content)
- if match:
-     ingested_ids.add(match.group(1))
- ...
- note_id_match = re.search(r'note_id:\s*"([^"]+)"', content)
- title_match = re.search(r'title:\s*"([^"]+)"', content)
- tags_match = re.search(r'tags:\s*(\[.*?\])', content, re.DOTALL)

+ from wiki_corpus_lib import load_source, extract_raw_note_id, iter_source_paths, load_blocklists
```

要點：
- `ingested_ids` 改用 `extract_raw_note_id(fm) for path in iter_source_paths(SOURCES_DIR)`
- get_筆記 端的 `note_id` / `title` / `tags` 仍然是 raw regex（**get_筆記 frontmatter schema 跟 wiki source 不同 — get_筆記 用 `note_id`，wiki source 用 `raw_note_id`**）。所以 get_筆記 那段**不動**，只動掃 sources/ 那段。
- `blocklist = json.load(open(...)).get("blocklist", {})` 改成 `blocklist, _ = load_blocklists(BLOCKLIST_PATH)`（注意：scanner 只讀 raw_note_id 黑名單，YouTube 黑名單由 ingest pipeline 處理）

### 動作 7：（**選做** — 跟 Code 主要工作分開）`wiki_rescan.py` bug fix

`wiki_rescan.py` line 31 `is_recording = "录音笔记" in content` 是 b0931a4 同型 bug 的存活實例。Code 可以順手改成：

```python
from wiki_corpus_lib import load_source
from wiki_visibility import has_recording_tag

fm, body = load_source(filepath)
is_recording = has_recording_tag((fm or {}).get("tags", []))
# 注意：get_筆記 raw notes 的 tags 是 list[dict] 含 system tag — has_recording_tag 已處理
```

但 get_筆記 raw notes 跟 wiki source frontmatter schema 不一樣（`note_id` vs `raw_note_id`、`tags` 結構不同），這個改動可能需要實際讀一筆 sample 才知道 has_recording_tag 是否合用。**如果不確定，這個動作 7 可以拆出去做下一個 ticket**。

### 動作 8：白盒單元測試

新增 `tests/test_wiki_corpus_lib.py`，覆蓋：

| 測試 | 目的 |
|------|------|
| `test_parse_frontmatter_valid` | 正常 frontmatter，回 dict + body |
| `test_parse_frontmatter_no_fm` | 沒 `---` 前後綴，回 (None, text) |
| `test_parse_frontmatter_yaml_error` | 故意壞 YAML，回 (None, body) |
| `test_serialize_frontmatter_roundtrip` | parse → serialize 後 dict 等值 |
| `test_extract_raw_note_id_str` | frontmatter 含 string raw_note_id |
| `test_extract_raw_note_id_int` | frontmatter 是 int（YAML 自動推斷），coerce 成 str |
| `test_extract_raw_note_id_missing` | 沒 raw_note_id，回 None |
| `test_extract_raw_note_id_from_path` | 傳 Path，能讀檔 + 解析 |
| `test_extract_youtube_id_explicit` | youtube_id 欄位存在 |
| `test_extract_youtube_id_from_url` | youtube_id 缺，從 raw_url regex |
| `test_is_enriched_true` / `test_is_enriched_false` | enriched_at 存在/不存在 |
| `test_is_quarantined_dict` / `test_is_quarantined_text` | dict / text 兩個輸入路徑 |
| `test_review_outcome_pending` | "pending" 算 None |
| `test_review_outcome_set` | "keep_internal" / "restore_public" 等 |
| `test_load_blocklists_missing` | 檔案不存在回 ({}, {}) |
| `test_load_blocklists_only_one_section` | 只有 blocklist 沒 youtube_blocklist |
| `test_load_blocklists_both` | 兩段都有 |
| `test_load_blocklists_invalid_json` | 壞 JSON，fail-open 回 ({}, {}) |
| `test_find_source_by_raw_note_id_hit` / `_miss` | filename_hint 正確/錯誤都能解 |

至少 18 個 test cases。fixture 用 `tmp_path` + `pathlib.Path.write_text`。

### 動作 9：consistency-check 加入新 lib

`scripts/wiki-consistency-check.py` 的 `EXPECTED_REFS` list 加：

```python
"scripts/wiki_corpus_lib.py",
```

並確保 `wiki_corpus_lib.py` docstring 含 `wiki-visibility-rules.md` 字串（已在動作 1 範本加入）。

### 動作 10：跑 acceptance suite

```bash
# 1. 新 lib 單元測試
pytest tests/test_wiki_corpus_lib.py -v
# 期望：所有 test pass（>= 18 個）

# 2. 既有測試集 — 確認重構沒打破現有行為
pytest tests/ -v
# 期望：原 22 個（quarantine classifier）+ 13 個（sensitivity）+ 20 個（scanner）+ 新 18+ 個全 pass
# 如果某個 tests/test_wiki_scanner.py / test_wiki_quarantine_classifier.py 因 import 路徑炸，先看是不是 caller 改 import 沒清乾淨

# 3. CLI smoke check（dry-run，不打 LLM、不寫檔）
python3 scripts/build_wiki_ingest_report.py
# 期望：worklogs/wiki-ingest-pending.md 重新產出，數字跟換 lib 前一致

python3 scripts/wiki-quarantine-classify.py
# 期望：classify report 寫出（idempotent — 數字跟今早 13→0 一致）

python3 scripts/wiki-quarantine-apply.py --dry-run
# 期望：would_apply / skip:already_applied 等 status 跟原版一致

python3 scripts/wiki-dialogue-detect.py --dry-run
# 期望：dialogue=true / false 數量跟換前一致

python3 scripts/wiki_rescan.py
# 期望：完成度報告數字跟換前一致（除非走動作 7 改 has_recording_tag — 那會修正 bug，數字會稍微不同）

# 4. consistency check
python3 scripts/wiki-consistency-check.py
# 期望：pass，wiki_corpus_lib 在 EXPECTED_REFS 裡

# 5. Astro build smoke
npm run build  # 或 npx astro check
# 期望：wiki content collection 全 parse（重構不應動到 schema 行為）
```

### 動作 11：commit + push

```bash
# Commit 1：新 lib + 測試
git add scripts/wiki_corpus_lib.py tests/test_wiki_corpus_lib.py
git commit -m "feat(wiki-lib): add wiki_corpus_lib for shared frontmatter + source helpers

仿 wiki_visibility.py / wiki_dialogue_lib.py pure-function 模式，集中：
- parse_frontmatter / serialize_frontmatter / load_source / write_source
- extract_raw_note_id / extract_youtube_id
- is_enriched / is_quarantined / needs_review / review_outcome
- iter_source_paths / find_source_by_raw_note_id
- load_blocklists（雙區塊 raw_note_id + youtube_id）

每個 helper 都是 pure function；I/O 限於明確命名的 load/write。
SSOT: docs/wiki-visibility-rules.md
Refs: Issue #157、cowork--wiki-corpus-lib-extraction-handoff-2026-04-27.md"

# Commit 2：6 支 caller 改 import
git add scripts/wiki-pending-promote.py scripts/wiki-quarantine-classify.py \
        scripts/wiki-quarantine-apply.py scripts/wiki-dialogue-detect.py \
        scripts/build_wiki_ingest_report.py scripts/wiki-consistency-check.py
git commit -m "refactor(wiki-scripts): replace hand-written frontmatter helpers with wiki_corpus_lib

6 支 script 拔掉 split_frontmatter / load_source / write_source / parse_md / find_source_by_id
等同位手寫實作（每個略有差異），統一 import 自 wiki_corpus_lib。

行為等價：
- pytest 全綠（既有 + 新 18+ tests）
- build_wiki_ingest_report 產出 wiki-ingest-pending.md 數字不變
- quarantine-classify report 不變
- quarantine-apply --dry-run status 分布不變
- dialogue-detect dry-run 統計不變
- wiki-consistency-check pass

副作用：個別 script 內 quoting style 可能微差（接受，跟 3293b4b 同類）。

Refs: Issue #157
SSOT: docs/wiki-visibility-rules.md"

# Commit 3（如果動作 7 做了）：wiki_rescan recording bug fix
git add scripts/wiki_rescan.py
git commit -m "fix(wiki-rescan): use has_recording_tag for recording detection (b0931a4 同型 bug)

原 line 31 'is_recording = \"录音笔记\" in content' 只抓單一 tag 變體，
跟 b0931a4 scanner fix 同病。改用 wiki_visibility.has_recording_tag
+ wiki_corpus_lib.load_source 解析 frontmatter tags。

對 get_筆記 raw notes 端的 frontmatter schema 已驗證 sample，tags 結構相容。"

git push
```

如果動作 7 沒做，Commit 3 跳過。

---

## 3. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| `wiki_corpus_lib.py` 模組化 | 純 function、no I/O 副作用（除明確命名的 load/write）| 動作 1 |
| API 命名一致 | `parse_frontmatter` / `load_source` / `write_source` / `extract_raw_note_id` 等不動 | code review |
| 18+ unit tests pass | tmp_path fixture，邊界都 cover | 動作 8 |
| 6 支 caller 重構 | 每支 import wiki_corpus_lib，移除手寫 helper | 動作 2-6 |
| 既有 pytest 不破 | 22+13+20+18 = **73 tests pass** 全綠 | 動作 10 |
| CLI smoke output 不變 | wiki-ingest-pending / classify report / dry-run apply 等等 | 動作 10 |
| consistency-check pass | wiki_corpus_lib 加入 EXPECTED_REFS | 動作 9-10 |
| Astro build pass | wiki collection 全 parse | 動作 10 |
| 程式碼行數 | 應該減少 60-100 行（6 支去重）| code review |

---

## 4. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki_corpus_lib.py` | **新增** |
| `tests/test_wiki_corpus_lib.py` | **新增** |
| `scripts/wiki-pending-promote.py` | refactor caller |
| `scripts/wiki-quarantine-classify.py` | refactor caller |
| `scripts/wiki-quarantine-apply.py` | refactor caller |
| `scripts/wiki-dialogue-detect.py` | refactor caller |
| `scripts/build_wiki_ingest_report.py` | refactor caller（只動掃 sources/ 段，get_筆記 段不動）|
| `scripts/wiki-consistency-check.py` | EXPECTED_REFS 加新 lib |
| `scripts/wiki_rescan.py` | **選做**（動作 7） |
| `scripts/wiki-quarantine-recordings.py` | **不動**（一次性 incident response，已執行完畢，不重構）|
| `scripts/wiki-sensitivity-scan.py` | **不動**（只做 stdin/text scan，沒 frontmatter parsing）|
| `scripts/wiki-enrich.cjs` / `wiki-kv-seed.cjs` / `wiki-youtube-ingest.cjs` | **不動**（JS 端 gray-matter 已收斂；JS 端共用 lib 是另一個 ticket）|
| `data/wiki-ingest-blocklist.json` | 不動 schema |
| `src/content.config.ts` | 不動 schema |
| `src/content/wiki/sources/*.md` | 不應該 受影響（pure refactor，無 LLM call、無內容寫回）|
| `worklogs/incidents/quarantine-overrides-*.yml` | 不動 |

---

## 5. 護欄

- **不動 enrichment / dialogue 偵測 / sensitivity scan 邏輯本身** — 純 parser/helper 抽出
- **不 re-export `has_recording_tag` / `is_business_meeting` / `is_dialogue_signal`** — caller 各自從 `wiki_visibility` / `wiki_dialogue_lib` 直接 import，避免重複 entry point；`wiki_corpus_lib` 只裝**目前未被抽出**的 helpers
- **不動 `wiki-quarantine-recordings.py`** — 該 script 是 04-26 incident 一次性執行的，內含 RECORDING_SET_44 hardcode + 一次性 audit 邏輯，不適合重構
- **不動 JS 端 .cjs script** — JS-side 共用 lib（如果需要）是獨立下一輪 ticket
- **不一次改 8 支 script** — 動作 7（wiki_rescan bug fix）可以選擇性切出獨立 commit / 獨立 ticket
- **fixture 比對是必做** — Acceptance criteria 第 6-7 項都要驗
- **如果 Astro build 因 quoting style 改變炸了**（不太可能，第一步 gray-matter 已驗過），停手回報

---

## 6. Commit 計畫（重申）

```
feat(wiki-lib): add wiki_corpus_lib for shared frontmatter + source helpers
refactor(wiki-scripts): replace hand-written frontmatter helpers with wiki_corpus_lib
fix(wiki-rescan): use has_recording_tag for recording detection（選做）
```

二段或三段，視動作 7 是否做。

---

## 7. 完成後在 Issue #157 留言回報

模板：

```markdown
## wiki_corpus_lib 抽出完成（2026-04-27）

「按工程角度依序處理」第二步閉環。

### Commits
- <sha-1> feat(wiki-lib): add wiki_corpus_lib for shared frontmatter + source helpers
- <sha-2> refactor(wiki-scripts): replace hand-written frontmatter helpers with wiki_corpus_lib
- <sha-3>（選做）fix(wiki-rescan): use has_recording_tag

### 程式碼變化
- 新 lib: `scripts/wiki_corpus_lib.py`（約 X 行）
- 新 tests: `tests/test_wiki_corpus_lib.py`（X 個 test）
- 6 支 caller 共拔掉 ~Y 行手寫 helper（split_frontmatter / load_source / write_source / parse_md / find_source_by_id 等）
- 淨變化：+X / -Y（淨減 Z 行）

### 等價性驗證
- ✅ pytest 全綠（73+ tests）
- ✅ build_wiki_ingest_report 產 wiki-ingest-pending.md 數字不變
- ✅ quarantine-classify report 不變（needs_human_review = 0）
- ✅ quarantine-apply --dry-run 不變
- ✅ dialogue-detect dry-run 統計不變
- ✅ wiki-consistency-check pass
- ✅ Astro build pass

### 已知無害副作用
（如有 quoting style 漂移等，列出來）

### 後續
- [x] 第一步：wiki-enrich.cjs parser 換 gray-matter ✅
- [x] 第二步：共用 lib 抽出 ✅
- [ ] 第三步：Article schema 加 `derived_from`（L3 演化層地基）
- [ ] **下一個 ticket**：Enrichment 邏輯改良（區分 wrong_pillar_suspected vs concept_gap_suspected）
```

---

## 8. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 1 設計 + 寫 lib | Sonnet 4.6 | 15-20 min |
| 動作 2-6 重構 6 支 caller | Sonnet 4.6 | 25-35 min |
| 動作 7（選做）wiki_rescan bug fix | Sonnet 4.6 | 5-10 min |
| 動作 8 寫 18+ unit tests | Sonnet 4.6 | 15-20 min |
| 動作 9-10 acceptance + smoke | Sonnet 4.6 | 5-10 min |
| 動作 11 commit + push | Sonnet 4.6 | 5 min |

整體 **Sonnet 4.6 + Medium effort**（60-90 min）。不需要 Opus —— 邏輯抽出，無新行為。

---

## 9. 不做的事（明確排除）

- **不做 JS 端 `wiki_corpus_lib.cjs`** —— 那是獨立下一輪 ticket（如果需要）。本輪只做 Python 端
- **不動 enrichment 邏輯 / wrong_pillar 偵測 / dialogue heuristics** —— 純 parser 抽出
- **不動 wiki-quarantine-recordings.py** —— incident response 一次性 script，不重構
- **不動 wiki-sensitivity-scan.py** —— 它只 scan 純 text，沒 frontmatter parsing 需求
- **不動 wiki-stats-refresh.cjs / wiki-concept-candidates.cjs** —— JS 端
- **不抽 `get_pillar_from_path`** —— 目前 codebase 沒人從 path 推 pillar，pillar 都從 frontmatter 讀；如 Code 真的找到實際被多處使用的 path→pillar 邏輯再加，沒就跳過
- **不擴張 wiki_corpus_lib API 範圍** —— 範本之外的 helper（例如 `parse_concepts`, `extract_summary`）等到下一輪有具體 caller 再加
- **不改 schema** —— `src/content.config.ts` 不動

---

## 10. 依賴 / 來源

- 本任務來源：Issue #157 closeout comment 4327741438（第一步完成後的「後續」清單）
- 模板：`scripts/wiki_visibility.py` / `scripts/wiki_dialogue_lib.py`（既有 pure-function lib 模式）
- 相關記憶：`feedback_handoff_local`（雙寫）、`feedback_handoff_flow_discipline`（停手等回報）、`feedback_session_single_project`（單專案）、`feedback_cross_project_impact`（跨檔案影響地圖）
- 上下游：本 refactor 完成後，第三步「Article schema 加 `derived_from`」可以開始；同時 enrichment 邏輯改良 ticket 也有共用 lib 可用

---

*產出：Cowork session 2026-04-27 接手「按工程角度依序處理」第二步*
*下一手：Code session 接此 handoff，60-90 min 完成。Cowork 寫完此 handoff 停在這裡，按 feedback_handoff_flow_discipline 不預先寫第三步 handoff，等 Code 回報後再決定是否進第三步*

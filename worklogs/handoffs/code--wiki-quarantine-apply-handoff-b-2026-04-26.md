建議模型: Sonnet（執行 + 驗證為主，無高風險邏輯）
Task Size: M（預估 45-60 分鐘）
優先級: P2 — 收尾 04-26 quarantine 流程，承接 Handoff A（commit `435f9b4`）

---

# [WIKI] Handoff B — 套用 65 筆 Quarantine Outcome + 治理規則永久化

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
git status
```

確認 working tree clean、HEAD 在 origin/main、沒有並行 Code session。

---

## Context

承接 Handoff A（commit `435f9b4`/`fa7eceb`/`908a026`/`0d03c63`/`9920fbb`/`4534ace`）的最後一公里。

Cowork + Paul 已完成 65 筆 quarantine source 的人工裁決，最終 outcome：

| Bucket | 筆數 | 動作 |
|--------|------|------|
| restore_public | 34 | flip visibility: public + 移除 quarantine block |
| keep_internal | 19 | 維持 internal + 移除 needs_review、設 review_outcome |
| delete | 12 | 移除檔案 + raw_note_id 加入 deny-list |

完整 outcome 列表在 `worklogs/incidents/quarantine-overrides-2026-04-26-final.yml`（已由 Cowork push）。

額外加碼（Paul 新規則永久化）：把「**錄音 + 商務會議 + 兩人以上討論（非獨白）→ 不公開**」這條規則寫進治理體系的三個層次：
1. SSOT 文件（`docs/wiki-visibility-rules.md`）
2. Classifier 規則（`data/wiki-quarantine-rules.yml`）
3. SOP 文件補充（`docs/wiki-quarantine-sop.md`）

「兩人以上 vs 獨白」的自動偵測未在本 handoff 範圍——Code 只需要文件化規則，未來會由 ingest pipeline 補 dialogue marker 偵測（Paul 另行決定優先級）。

---

## Step 0 偵察（必做）

> 上輪教訓：handoff 的假設可能再次過時。

### 0.1 確認 Handoff A 成果都在

```bash
ls scripts/wiki-quarantine-classify.py scripts/wiki_text_normalize.py
ls data/wiki-quarantine-rules.yml docs/wiki-quarantine-sop.md
ls tests/test_wiki_quarantine_classifier.py
grep "quarantine: z.object" src/content.config.ts
```

### 0.2 確認 final overrides yml 存在

```bash
ls worklogs/incidents/quarantine-overrides-2026-04-26-final.yml
# 預期存在。內含 65 筆 outcome 分為 restore_public/keep_internal/delete 三組
```

### 0.3 確認 65 筆 quarantine source 都還在

```bash
grep -lE "^quarantine:" src/content/wiki/sources/*.md | wc -l
# 預期 65
```

### 0.4 確認當前 build / test / check 都通過

```bash
npm run build 2>&1 | tail -10
npm run test:wiki-scanner
pytest tests/test_wiki_quarantine_classifier.py -v
npm run check:wiki-visibility
```

任一發現偏離預期 → 停下來在 commit message 解釋。

---

## 步驟 1：寫 `scripts/wiki-quarantine-apply.py`

```python
#!/usr/bin/env python3
"""
Apply quarantine outcomes to source files based on overrides yaml.

Outcomes:
- restore_public: flip visibility to public + remove quarantine block
- keep_internal: keep visibility internal + set review_outcome + remove needs_review
- delete: remove file from sources/ + add raw_note_id to wiki-ingest-blocklist.json

Idempotent: re-running on already-applied outcomes is a no-op (with warnings).

Usage:
  python3 scripts/wiki-quarantine-apply.py --dry-run  # preview
  python3 scripts/wiki-quarantine-apply.py            # actual apply
"""

import argparse
import json
import re
import sys
import yaml
from pathlib import Path
from datetime import datetime

SOURCES_DIR = Path("src/content/wiki/sources")
BLOCKLIST_PATH = Path("data/wiki-ingest-blocklist.json")
OVERRIDES_DEFAULT = Path("worklogs/incidents/quarantine-overrides-2026-04-26-final.yml")
TODAY = datetime.now().strftime("%Y-%m-%d")


def load_source(path):
    """Return (frontmatter_dict, body_str, raw_text)."""
    with open(path) as f:
        text = f.read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)', text, re.DOTALL)
    if not m:
        return None, "", text
    fm = yaml.safe_load(m.group(1))
    return fm, m.group(2), text


def write_source(path, fm, body):
    """Serialize frontmatter + body back to file."""
    fm_yaml = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    new_text = "---\n" + fm_yaml + "---\n" + body
    path.write_text(new_text)


def find_source_by_id(raw_note_id, expected_filename=None):
    """Find source file by raw_note_id (preferred) with filename hint."""
    if expected_filename:
        candidate = SOURCES_DIR / expected_filename
        if candidate.exists():
            fm, _, _ = load_source(candidate)
            if fm and str(fm.get("raw_note_id", "")) == raw_note_id:
                return candidate
    # Fallback: scan all
    for f in SOURCES_DIR.glob("*.md"):
        fm, _, _ = load_source(f)
        if fm and str(fm.get("raw_note_id", "")) == raw_note_id:
            return f
    return None


def apply_restore_public(source_path, entry, dry_run):
    """Flip visibility -> public, remove quarantine block."""
    fm, body, _ = load_source(source_path)
    if not fm:
        return "skip:parse_error"

    # Idempotency check
    if fm.get("visibility") == "public" and "quarantine" not in fm:
        return "skip:already_applied"

    if dry_run:
        return "would_apply"

    fm["visibility"] = "public"
    fm.pop("quarantine", None)
    write_source(source_path, fm, body)
    return "applied"


def apply_keep_internal(source_path, entry, dry_run):
    """Set review_outcome, clear needs_review, keep visibility internal."""
    fm, body, _ = load_source(source_path)
    if not fm:
        return "skip:parse_error"

    quarantine = fm.get("quarantine", {})
    if quarantine.get("review_outcome") == "keep_internal" and not quarantine.get("needs_review", True):
        return "skip:already_applied"

    if dry_run:
        return "would_apply"

    if "quarantine" not in fm:
        return "skip:no_quarantine_block"

    fm["quarantine"]["review_outcome"] = "keep_internal"
    fm["quarantine"]["needs_review"] = False
    fm["quarantine"]["reviewer"] = entry.get("source", "paul").split("+")[-1]
    fm["quarantine"]["reviewed_at"] = TODAY
    fm["quarantine"]["reasoning"] = entry.get("reasoning", "")
    write_source(source_path, fm, body)
    return "applied"


def apply_delete(source_path, entry, blocklist, dry_run):
    """Remove file, add raw_note_id to blocklist."""
    raw_id = entry["raw_note_id"]

    if not source_path.exists():
        # Maybe already deleted
        if raw_id in blocklist:
            return "skip:already_applied"
        return "skip:file_missing"

    if dry_run:
        return "would_apply"

    blocklist[raw_id] = {
        "reason": entry.get("reasoning", "delete_outcome"),
        "added_at": TODAY,
        "added_by": entry.get("source", "paul"),
        "title_at_delete": entry.get("title", ""),
    }
    source_path.unlink()
    return "applied"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--overrides", default=str(OVERRIDES_DEFAULT))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    overrides_path = Path(args.overrides)
    if not overrides_path.exists():
        print(f"Overrides file not found: {overrides_path}", file=sys.stderr)
        sys.exit(1)

    overrides = yaml.safe_load(overrides_path.read_text())
    metadata = overrides.get("metadata", {})
    expected_total = metadata.get("total", 0)

    print(f"=== Quarantine Apply ({'DRY RUN' if args.dry_run else 'EXECUTING'}) ===")
    print(f"Overrides: {overrides_path}")
    print(f"Expected total: {expected_total}")
    print(f"Reviewer: {metadata.get('reviewed_by', 'unknown')}")
    print()

    # Load blocklist
    if BLOCKLIST_PATH.exists():
        blocklist_doc = json.loads(BLOCKLIST_PATH.read_text())
    else:
        blocklist_doc = {"_comment": "scanner skips these IDs", "blocklist": {}}
    blocklist = blocklist_doc.setdefault("blocklist", {})

    results = {
        "restore_public": [],
        "keep_internal": [],
        "delete": [],
        "skipped": [],
        "errors": [],
    }

    for bucket in ["restore_public", "keep_internal", "delete"]:
        entries = overrides.get(bucket, [])
        print(f"\n--- {bucket} ({len(entries)}) ---")

        for entry in entries:
            raw_id = entry["raw_note_id"]
            expected_file = entry.get("file")

            if bucket == "delete":
                source_path = SOURCES_DIR / expected_file if expected_file else None
                status = apply_delete(source_path, entry, blocklist, args.dry_run)
            else:
                source_path = find_source_by_id(raw_id, expected_file)
                if not source_path:
                    results["errors"].append((bucket, raw_id, "file_not_found"))
                    print(f"  ERROR {raw_id}: file not found")
                    continue

                if bucket == "restore_public":
                    status = apply_restore_public(source_path, entry, args.dry_run)
                elif bucket == "keep_internal":
                    status = apply_keep_internal(source_path, entry, args.dry_run)

            print(f"  {status}: {raw_id} - {entry.get('title', '')[:40]}")

            if status.startswith("skip:"):
                results["skipped"].append((bucket, raw_id, status))
            elif status in ("applied", "would_apply"):
                results[bucket].append(raw_id)
            else:
                results["errors"].append((bucket, raw_id, status))

    # Persist blocklist
    if not args.dry_run and overrides.get("delete"):
        BLOCKLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
        BLOCKLIST_PATH.write_text(json.dumps(blocklist_doc, ensure_ascii=False, indent=2))

    # Summary
    print("\n=== Summary ===")
    for bucket in ["restore_public", "keep_internal", "delete"]:
        print(f"  {bucket}: {len(results[bucket])}")
    print(f"  skipped: {len(results['skipped'])}")
    print(f"  errors: {len(results['errors'])}")

    # Write apply log
    log_path = Path(f"worklogs/incidents/quarantine-apply-log-{TODAY}.md")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("w") as f:
        f.write(f"# Quarantine Apply Log - {TODAY}\n\n")
        f.write(f"Mode: {'DRY RUN' if args.dry_run else 'EXECUTED'}\n")
        f.write(f"Overrides: {overrides_path}\n\n")
        for bucket in ["restore_public", "keep_internal", "delete"]:
            ids = results[bucket]
            f.write(f"## {bucket} ({len(ids)})\n\n")
            for rid in ids:
                f.write(f"- `{rid}`\n")
            f.write("\n")
        if results["skipped"]:
            f.write(f"## Skipped ({len(results['skipped'])})\n\n")
            for bucket, rid, reason in results["skipped"]:
                f.write(f"- [{bucket}] `{rid}` - {reason}\n")
        if results["errors"]:
            f.write(f"\n## Errors ({len(results['errors'])})\n\n")
            for bucket, rid, reason in results["errors"]:
                f.write(f"- [{bucket}] `{rid}` - {reason}\n")

    print(f"\nLog: {log_path}")
    sys.exit(1 if results["errors"] else 0)


if __name__ == "__main__":
    main()
```

---

## 步驟 2：Dry-run + Apply 65 筆 outcome

### 2.1 Dry-run（預覽）

```bash
python3 scripts/wiki-quarantine-apply.py --dry-run
```

**預期輸出**：
- restore_public: 34 would_apply
- keep_internal: 19 would_apply
- delete: 12 would_apply
- errors: 0

如果有 errors（特別是 file_not_found）→ 停下來檢查 overrides yml 的 file 欄位是否與實際檔名對齊。

### 2.2 實際執行

```bash
python3 scripts/wiki-quarantine-apply.py
```

**預期輸出**：
- 上述都變 `applied`
- blocklist 從空變成含 12 筆 raw_note_id
- 12 個 source 檔被刪除
- 53 個 source 檔被修改（34 restore + 19 keep_internal）

### 2.3 Build 驗證

```bash
npm run build 2>&1 | tail -15
# 預期 page count 從 554 降到 542（554 - 12 deleted）
# build pass
```

### 2.4 二跑檢查 idempotency

```bash
python3 scripts/wiki-quarantine-apply.py
# 預期所有 entries 都 skip:already_applied，errors=0
```

---

## 步驟 3：永久化 Paul 新規則

### 3.1 更新 `docs/wiki-visibility-rules.md`

在「資料夾預設規則」表後新增段落：

```markdown
## Phase 2 Rule（2026-04-26 incident 後新增）

**規則**：錄音內容 + 商務會議 + 兩人以上討論（非獨白）→ visibility=internal + outcome=delete

判斷條件（任一缺失就不適用此規則）：

1. **錄音內容**：system tag 含「录音」（contains 「录音」，涵蓋所有變體）
2. **商務會議**：
   - 資料夾為 `05_商務會議`，OR
   - title 含商務會議字眼：「會議」「討論」「洽談」「合作探討」「項目規劃」「合作框架」「合作交流」「商業拓展」
3. **兩人以上討論**（非獨白）：
   - frontmatter 含 `dialogue: true` 或 `speakers: [...]`，OR
   - transcript 內含明顯多 speaker 標記（例：`Speaker A:`、`說話者 1:`），OR
   - title 含「會議記錄」「討論會」等明確多人字眼

**動作**：
- 移除 source 檔案
- raw_note_id 加進 `data/wiki-ingest-blocklist.json` 防再 ingest

**為什麼是 delete 而非 keep_internal**：
- 商務會議含具名公司 / 合作條件，永久不對外
- delete + blocklist 確保下次 scanner / re-ingest 流程改變後不會再撈
- 仍可從 raw note source 找回原始錄音（不影響備份）

**自動偵測待開發**：
- 「兩人以上 vs 獨白」目前需人工或 dialogue marker 輔助
- 未來 ingest pipeline 可加 transcript speaker 統計（不在本期範圍）
```

### 3.2 更新 `data/wiki-quarantine-rules.yml`

在 rules 列表頂端（最高優先級）新增：

```yaml
  - outcome: delete
    description: "錄音 + 商務會議 + 兩人以上討論 → 永久下架（Paul 規則 2026-04-26）"
    requires_all:
      - has_recording_tag: true
      - business_meeting: true
      - is_dialogue: true
    notes: |
      此規則需要三個條件全部成立才命中。
      - has_recording_tag 由 wiki_visibility.py 提供
      - business_meeting 判斷：資料夾 05_商務會議 OR title 含 [會議,討論,洽談,合作探討,項目規劃,合作框架,合作交流,商業拓展]
      - is_dialogue 判斷：dialogue=true OR speakers.length>1 OR title 含 [會議記錄,討論會]
      
      classifier 暫先用 title 字眼當 proxy（business_meeting check）；
      is_dialogue 自動偵測待 ingest pipeline 補 marker 後啟用。
      在那之前命中前兩條 → 標記 needs_human_review 而非自動 delete。
```

修改 `scripts/wiki-quarantine-classify.py`，加 `requires_all` 處理邏輯：

```python
def matches_rule(rule, fm, body):
    """Existing match logic + new requires_all support."""
    # ... 既有 match dict 邏輯 ...
    
    if "requires_all" in rule:
        # Conservative: 只要有任一 condition 我們無法判斷，就不命中（送 human review）
        # 未來等 dialogue marker 機制成熟，再啟用真正的 auto-match
        return False
    
    return False
```

> 註：requires_all 邏輯先不啟用真實判斷，避免本輪 Code session 還要實作 dialogue 偵測。當前的效果是：規則文件化但不影響現有命中行為。等 ingest pipeline 補 marker 後再開。

### 3.3 更新 `docs/wiki-quarantine-sop.md`

在「觸發條件」段加一條：

```markdown
4. ingest 落檔的 source 命中「錄音 + 商務會議 + 兩人以上」三條件
   → 直接走 delete outcome（不需要 review queue）
```

---

## 步驟 4：同步 Issue #157 stats

不在本 handoff 範圍（Cowork 會做）。Code 只需在回報格式裡列出最終 corpus 計數。

---

## 整合驗證

```bash
# 1. Apply 後 build 通過
npm run build 2>&1 | tail -10
# 預期 page count 降 12（554 → 542）

# 2. 既有測試不受影響
npm run test:wiki-scanner
pytest tests/test_wiki_quarantine_classifier.py -v

# 3. CI consistency check 通過
npm run check:wiki-visibility

# 4. Apply script idempotent（二跑全 skip）
python3 scripts/wiki-quarantine-apply.py
# 預期: 0 applied, 65 skipped, 0 errors

# 5. blocklist 包含 12 筆
python3 -c "import json; bl=json.load(open('data/wiki-ingest-blocklist.json'))['blocklist']; print(f'blocklist size: {len(bl)}'); [print(f'  {k}: {v[\"reason\"]}') for k,v in bl.items()]"

# 6. 計數對帳
echo "sources/ public:"
grep -l "^visibility: public" src/content/wiki/sources/*.md | wc -l
echo "sources/ internal:"
grep -l "^visibility: internal" src/content/wiki/sources/*.md | wc -l
echo "sources/ total:"
ls src/content/wiki/sources/*.md | wc -l
# 預期: public 多 34（247 → 281）, internal 少 34 + 12 = 46（65 → 19）, total 少 12（304 → 292）
```

---

## Commit 計畫（3 commits）

```bash
# Commit 1: apply script
git add scripts/wiki-quarantine-apply.py
git commit -m "feat(wiki): quarantine apply script for executing review outcomes

Reads overrides YAML, applies one of three actions per raw_note_id:
- restore_public: visibility public + remove quarantine block
- keep_internal: set review_outcome + clear needs_review
- delete: remove file + add to blocklist

Idempotent (skips already-applied), supports --dry-run, writes apply log."
git push

# Commit 2: 套用 65 筆 outcome
git add src/content/wiki/sources/ data/wiki-ingest-blocklist.json worklogs/incidents/
git commit -m "fix(wiki): apply 65 quarantine outcomes (Phase 2 review complete)

Applied via scripts/wiki-quarantine-apply.py with overrides yaml:
- restore_public: 34 (visibility flipped to public)
- keep_internal: 19 (kept internal, marked review_outcome)
- delete: 12 (removed + added to deny-list)

Corpus impact:
- public: 247 -> 281 (+34)
- internal: 65 -> 19 (-46, all needs_review cleared)
- total sources: 304 -> 292 (-12 deleted)

Reviewer: Paul (final approval), Cowork (proposals + audit), Auto (classifier rules).
See worklogs/incidents/quarantine-apply-log-2026-04-26.md for per-file detail."
git push

# Commit 3: 治理規則永久化
git add docs/wiki-visibility-rules.md data/wiki-quarantine-rules.yml docs/wiki-quarantine-sop.md scripts/wiki-quarantine-classify.py
git commit -m "feat(wiki): codify Paul's recording-meeting-dialogue rule

New permanent rule in governance docs:
  錄音 + 商務會議 + 兩人以上討論（非獨白）-> visibility=internal + delete + blocklist

Updated:
- docs/wiki-visibility-rules.md: rule definition with detection criteria
- data/wiki-quarantine-rules.yml: rule entry (placeholder, full auto-match
  pending dialogue marker mechanism in ingest pipeline)
- scripts/wiki-quarantine-classify.py: requires_all rule type support
- docs/wiki-quarantine-sop.md: trigger condition added

Auto-detection of '兩人以上 vs 獨白' deferred — needs ingest pipeline
to populate dialogue/speakers metadata first."
git push
```

---

## 注意事項

- ⚠️ **Step 0 偵察任一發現偏離預期 → 停下來在 commit message 解釋**
- ⚠️ **務必先跑 `--dry-run`**，看到 errors 立刻停下來
- ⚠️ **Apply 是破壞性操作**（移檔不可復原），確認 dry-run 全綠才實際跑
- ⚠️ **Idempotent 是 hard requirement**——二跑全 skip 才合格
- ⚠️ **Build 驗證必做**：apply 完一定要跑 `npm run build`，schema 驗證 + 連結檢查
- ⚠️ **不要動 4 筆本日新 ingest**（commit `2fdd571`，196368/149520/366608/711952），它們不在 quarantine 列表
- ⚠️ Quarantine 規則更新（步驟 3）的 `requires_all` 先不啟用真實 auto-match——本期只是文件化規則，未來 ingest 加 dialogue marker 後再啟用
- ⚠️ 遵循「同 repo 不開並行 Code session」原則

---

## 回報格式

```
✅ Step 0.1 Handoff A 成果: 全部存在 ✓
✅ Step 0.2 final overrides yml: 存在，總計 65（restore=34/keep=19/delete=12）
✅ Step 0.3 quarantine sources: 65 ✓
✅ Step 0.4 build/test/check: 全 pass

✅ 步驟 1 wiki-quarantine-apply.py: commit {SHA1} pushed
✅ 步驟 2.1 dry-run: 34/19/12 would_apply, 0 errors
✅ 步驟 2.2 actual apply: commit {SHA2} pushed
   - restore_public: 34 applied
   - keep_internal: 19 applied
   - delete: 12 applied (12 files removed, 12 blocklist entries added)
✅ 步驟 2.3 build 驗證: page count 554 → {N}（預期 542）
✅ 步驟 2.4 idempotency: 二跑全 skip ✓
✅ 步驟 3 治理規則永久化: commit {SHA3} pushed
   - SSOT doc 加 Phase 2 Rule 段落
   - classifier rules 加 requires_all rule（placeholder）
   - SOP doc 加觸發條件 #4

整合驗證:
- npm run build: pass, page count = {N}
- npm run test:wiki-scanner: pass
- pytest tests/test_wiki_quarantine_classifier.py: pass
- npm run check:wiki-visibility: pass

最終計數:
- sources/ public: 247 → {N1}（預期 281）
- sources/ internal: 65 → {N2}（預期 19）
- sources/ total: 304 → {N3}（預期 292）
- blocklist: 0 → 12

如有任何 step 偏離預期，停下來在 commit message 解釋並等 Paul 回應。
```

---

## 後續（不在本 handoff 範圍）

1. **Cowork 同步 Issue #157**：把最終 corpus 計數 + outcome 分布更新進儀表板
2. **Sensitivity 補檔**：對既有 281 筆 public sources 跑 detector 一次性 backfill sensitivity 欄位（不急）
3. **Dialogue marker 機制**：ingest pipeline 加 transcript speaker 統計，啟用 Phase 2 Rule 的真實 auto-match（Paul 決定優先級）
4. **Pre-commit hook**：用 husky 接 consistency check（手動跑也夠用）

---

## 本輪 metrics

3 個 commit：
- 1 個新 script（wiki-quarantine-apply.py，~150 行）
- 65 個 source frontmatter 改寫 + 12 個 source 移除 + blocklist 寫入
- 3 個治理文件更新（SSOT / classifier rules / SOP）

預期影響範圍：~80 個檔案修改（53 修改 frontmatter + 12 移檔 + 1 blocklist + 1 apply log + 4 governance docs + 4 commit content）。所有改動皆有 idempotent 保護 + dry-run 預覽。

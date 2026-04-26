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

    if not source_path or not source_path.exists():
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
        print(f"❌ Overrides file not found: {overrides_path}", file=sys.stderr)
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
                    print(f"  ❌ {raw_id}: file not found")
                    continue

                if bucket == "restore_public":
                    status = apply_restore_public(source_path, entry, args.dry_run)
                elif bucket == "keep_internal":
                    status = apply_keep_internal(source_path, entry, args.dry_run)

            print(f"  {status}: {raw_id} — {entry.get('title', '')[:40]}")

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
        f.write(f"# Quarantine Apply Log — {TODAY}\n\n")
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
                f.write(f"- [{bucket}] `{rid}` — {reason}\n")
        if results["errors"]:
            f.write(f"\n## Errors ({len(results['errors'])})\n\n")
            for bucket, rid, reason in results["errors"]:
                f.write(f"- [{bucket}] `{rid}` — {reason}\n")

    print(f"\nLog: {log_path}")
    sys.exit(1 if results["errors"] else 0)


if __name__ == "__main__":
    main()

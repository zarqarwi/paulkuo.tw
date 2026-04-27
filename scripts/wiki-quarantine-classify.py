#!/usr/bin/env python3
"""
Quarantine Classifier for 65 sources marked needs_review by 4534ace.

Output:
  - worklogs/incidents/quarantine-classification-2026-04-26.md  (human-readable)
  - worklogs/incidents/quarantine-overrides-2026-04-26.yml      (machine-readable draft)

5 buckets:
  - restore_public        (public talks / general knowledge — flip back to public)
  - keep_internal         (Paul's personal reflections — leave internal)
  - delete                (named companies / business deals — purge + blocklist)
  - redact_and_restore    (publishable topic but contains PII/business — redact then public)
  - needs_human_review    (rules did not decide)

Idempotent: re-running on same input produces same output.
Does NOT modify source files. Apply step is a separate handoff.
"""

import sys
import yaml
from pathlib import Path
from datetime import datetime
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCES_DIR = PROJECT_ROOT / "src" / "content" / "wiki" / "sources"
TODAY = datetime.now().strftime("%Y-%m-%d")
RULES_FILE = PROJECT_ROOT / "data" / "wiki-quarantine-rules.yml"

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from wiki_corpus_lib import load_source, is_quarantined, extract_raw_note_id  # noqa: E402
from wiki_text_normalize import contains_normalized  # noqa: E402
from wiki_dialogue_lib import is_dialogue_signal, is_business_meeting  # noqa: E402
from wiki_visibility import has_recording_tag  # noqa: E402

with open(RULES_FILE, encoding="utf-8") as _f:
    _rules_config = yaml.safe_load(_f)
RULES = _rules_config["rules"]


def matches_rule(rule, fm, body):
    title = fm.get("title", "") or ""
    tags = fm.get("tags", []) or []
    tags_str = " ".join(str(t) for t in tags)
    title_and_tags = f"{title} {tags_str}"
    full = f"{title} {tags_str} {body}"

    if "requires_all" in rule:
        # requires_all is a list of single-key dicts in YAML; merge to flat dict.
        req = {k: v for item in rule["requires_all"] for k, v in item.items()}
        checks = []
        if req.get("has_recording_tag"):
            checks.append(has_recording_tag(tags))
        if req.get("business_meeting"):
            checks.append(is_business_meeting(fm, folder=None))
        if req.get("is_dialogue"):
            checks.append(is_dialogue_signal(fm, body))
        return bool(checks) and all(checks)

    m = rule["match"]
    if "title_or_content_any" in m:
        return any(contains_normalized(full, kw) for kw in m["title_or_content_any"])
    if "title_any" in m:
        return any(contains_normalized(title, kw) for kw in m["title_any"])
    if "title_or_tags_any" in m:
        return any(contains_normalized(title_and_tags, kw) for kw in m["title_or_tags_any"])
    return False


def classify(fm, body):
    # Fast-path: honour an existing human review decision instead of re-classifying.
    # Condition: quarantine.review_outcome is set AND quarantine.needs_review is explicitly False.
    quarantine = fm.get("quarantine") or {}
    if quarantine.get("review_outcome") and quarantine.get("needs_review") is False:
        outcome = quarantine["review_outcome"]
        return outcome, f"fast-path: existing review_outcome={outcome}"

    for rule in RULES:
        if matches_rule(rule, fm, body):
            return rule["outcome"], rule["description"]
    return None, None


def main():
    quarantine_files = sorted(
        f for f in SOURCES_DIR.glob("*.md")
        if is_quarantined(f.read_text(encoding="utf-8"))
    )

    print(f"Found {len(quarantine_files)} quarantined sources")

    results = defaultdict(list)
    overrides = {}

    for path in quarantine_files:
        fm, body = load_source(path)
        if not fm:
            results["parse_error"].append(path.name)
            continue

        outcome, reason = classify(fm, body)
        raw_note_id = extract_raw_note_id(fm) or ""
        title = fm.get("title", "") or ""

        if outcome:
            results[outcome].append({
                "file": path.name,
                "raw_note_id": raw_note_id,
                "title": title,
                "matched_rule": reason,
            })
            if raw_note_id:
                overrides[raw_note_id] = {
                    "outcome": outcome,
                    "matched_rule": reason,
                    "auto_classified": True,
                    "classified_at": TODAY,
                    "file": path.name,
                    "title": title,
                }
        else:
            results["needs_human_review"].append({
                "file": path.name,
                "raw_note_id": raw_note_id,
                "title": title,
            })

    out_md = PROJECT_ROOT / "worklogs" / "incidents" / "quarantine-classification-2026-04-26.md"
    out_yaml = PROJECT_ROOT / "worklogs" / "incidents" / "quarantine-overrides-2026-04-26.yml"
    out_md.parent.mkdir(parents=True, exist_ok=True)

    bucket_order = [
        "restore_public", "keep_internal", "delete",
        "redact_and_restore", "needs_human_review", "parse_error",
    ]

    lines = []
    lines.append(f"# Quarantine Classification — {TODAY}")
    lines.append("")
    lines.append(
        "Auto-classified by `scripts/wiki-quarantine-classify.py` over the 65 sources "
        "with `quarantine:` block (added by 4534ace). Rule-based, deterministic, re-runnable."
    )
    lines.append("")
    lines.append("**This script does NOT execute outcomes.** Apply step is a separate handoff "
                 "(human review + `wiki-quarantine-apply.py`, not yet written).")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    total = sum(len(results.get(b, [])) for b in bucket_order)
    for bucket in bucket_order:
        lines.append(f"- **{bucket}**: {len(results.get(bucket, []))}")
    lines.append(f"- **TOTAL**: {total}")
    lines.append("")
    lines.append("## Bucket Details")
    lines.append("")
    for bucket in bucket_order:
        items = results.get(bucket, [])
        if not items:
            continue
        lines.append(f"### {bucket} ({len(items)})")
        lines.append("")
        for item in items:
            if isinstance(item, dict):
                rid = item.get("raw_note_id", "")
                title = item.get("title", "")
                lines.append(f"- `{rid}` — {title}")
                if "matched_rule" in item:
                    lines.append(f"  - Rule: {item['matched_rule']}")
                lines.append(f"  - File: `{item['file']}`")
            else:
                lines.append(f"- `{item}`")
        lines.append("")

    lines.append("## Next Steps (separate small handoff)")
    lines.append("")
    lines.append("1. Paul reviews `needs_human_review` bucket and any auto-classification disagreement")
    lines.append("2. Update `quarantine-overrides-2026-04-26.yml` with final outcomes")
    lines.append("3. Run `scripts/wiki-quarantine-apply.py` (to be written) to execute outcomes")
    lines.append("")

    out_md.write_text("\n".join(lines), encoding="utf-8")

    with open(out_yaml, "w", encoding="utf-8") as f:
        yaml.safe_dump(overrides, f, allow_unicode=True, sort_keys=True)

    print(f"\n✅ Classification report: {out_md.relative_to(PROJECT_ROOT)}")
    print(f"✅ Override draft:        {out_yaml.relative_to(PROJECT_ROOT)}")
    print(f"\n{'Bucket':<25} Count")
    print("-" * 35)
    for bucket in bucket_order:
        print(f"{bucket:<25} {len(results.get(bucket, []))}")
    print("-" * 35)
    print(f"{'TOTAL':<25} {total}")


if __name__ == "__main__":
    main()

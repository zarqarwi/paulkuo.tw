#!/usr/bin/env python3
"""
Promote sources_pending/*.md to sources/ if pending_status=approved.
Reject (delete) if pending_status=rejected.
Skip if pending_status=awaiting_review.

Approved: strip pending_status / pending_since / review_notes from frontmatter,
then move to sources/.

Rejected: delete the staged file (also call wiki-quarantine-apply blocklist
once that exists; for now logs the raw_note_id for manual blocklist add).

Idempotent: safe to re-run.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).
"""

import re
import sys
import yaml
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PENDING = PROJECT_ROOT / "src" / "content" / "wiki" / "sources_pending"
SOURCES = PROJECT_ROOT / "src" / "content" / "wiki" / "sources"

PENDING_FIELDS_TO_STRIP = ("pending_status", "pending_since", "review_notes")

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from wiki_dialogue_lib import detect_dialogue  # noqa: E402


def split_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    if not m:
        return None, text
    return m.group(1), m.group(2)


def strip_pending_fields(fm_text):
    """Remove pending_* lines from raw YAML text without re-serializing
    (preserves existing field order and quoting style)."""
    lines = fm_text.split("\n")
    return "\n".join(
        ln for ln in lines
        if not any(ln.startswith(f"{k}:") for k in PENDING_FIELDS_TO_STRIP)
    )


def inject_dialogue_fields(fm_text: str, result: dict) -> str:
    """Append dialogue / dialogue_inference / speakers to raw YAML frontmatter text.

    Operates on raw text to preserve existing field order and quoting style,
    matching the same convention as strip_pending_fields.
    """
    lines = []
    lines.append(f"dialogue: {str(result['dialogue']).lower()}")
    lines.append(f"dialogue_inference: {result['dialogue_inference']}")
    speakers = result.get('speakers') or []
    if speakers:
        lines.append("speakers:")
        for sp in speakers:
            lines.append(f"  - {sp}")
    return fm_text + "\n" + "\n".join(lines)


def main():
    if not PENDING.exists():
        print(f"⏸  No pending dir: {PENDING}")
        return

    approved, rejected, skipped, errors = [], [], [], []

    for path in sorted(PENDING.glob("*.md")):
        if path.name.startswith("."):
            continue

        text = path.read_text(encoding="utf-8")
        fm_text, body = split_frontmatter(text)
        if fm_text is None:
            errors.append((path.name, "no frontmatter"))
            continue

        try:
            fm = yaml.safe_load(fm_text) or {}
        except Exception as e:
            errors.append((path.name, f"yaml error: {e}"))
            continue

        status = fm.get("pending_status", "awaiting_review")

        if status == "approved":
            target = SOURCES / path.name
            if target.exists():
                errors.append((path.name, f"target already in sources/: {target.name}"))
                continue

            # Inject dialogue fields before stripping pending markers (idempotent guard).
            if "dialogue" not in fm:
                dialogue_result = detect_dialogue(fm, body)
                fm_text = inject_dialogue_fields(fm_text, dialogue_result)

            cleaned_fm = strip_pending_fields(fm_text)
            new_content = f"---\n{cleaned_fm}\n---\n{body}"
            target.write_text(new_content, encoding="utf-8")
            path.unlink()
            approved.append(path.name)

        elif status == "rejected":
            raw_note_id = fm.get("raw_note_id", "?")
            path.unlink()
            rejected.append((path.name, raw_note_id))

        else:
            skipped.append(path.name)

    print(f"✅ Approved (moved to sources/): {len(approved)}")
    for name in approved:
        print(f"     {name}")
    print(f"❌ Rejected (deleted from pending): {len(rejected)}")
    for name, rid in rejected:
        print(f"     {name}  raw_note_id={rid}  ← consider adding to blocklist")
    print(f"⏸  Awaiting review:                {len(skipped)}")
    if errors:
        print(f"⚠️  Errors:                        {len(errors)}")
        for name, err in errors:
            print(f"     {name}: {err}")


if __name__ == "__main__":
    main()

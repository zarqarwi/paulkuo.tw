#!/usr/bin/env python3
"""
CI consistency check — verify visibility logic across scanner / ingest / frontend
references the SSOT doc. Fails if drift detected.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Run:
    python3 scripts/wiki-consistency-check.py
    npm run check:wiki-visibility
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SSOT_NAME = "wiki-visibility-rules.md"
SSOT_PATH = ROOT / "docs" / SSOT_NAME

# Files that own visibility logic and must reference the SSOT.
EXPECTED_REFS = [
    "scripts/build_wiki_ingest_report.py",
    "scripts/wiki_corpus_lib.py",
    "scripts/wiki_visibility.py",
    "scripts/wiki-youtube-ingest.cjs",
    "scripts/wiki-enrich.cjs",
    "scripts/wiki-pending-promote.py",
    "scripts/wiki-sensitivity-scan.py",
    "src/pages/wiki/index.astro",
    "src/pages/wiki/[slug].astro",
    "src/content.config.ts",
]

# Schema invariant — must remain a 2-value enum. No `private`.
SCHEMA_PATH = ROOT / "src" / "content.config.ts"
SCHEMA_VISIBILITY_RE = re.compile(
    r"visibility:\s*z\.enum\(\s*\[\s*['\"]public['\"]\s*,\s*['\"]internal['\"]\s*\]\s*\)"
)


def check_ssot_exists():
    if not SSOT_PATH.exists():
        return [f"SSOT doc missing: {SSOT_PATH.relative_to(ROOT)}"]
    return []


def check_refs():
    errors = []
    for rel in EXPECTED_REFS:
        path = ROOT / rel
        if not path.exists():
            errors.append(f"{rel}: file not found")
            continue
        if SSOT_NAME not in path.read_text(encoding="utf-8"):
            errors.append(f"{rel}: missing reference to docs/{SSOT_NAME}")
    return errors


def check_schema_invariant():
    if not SCHEMA_PATH.exists():
        return [f"{SCHEMA_PATH.relative_to(ROOT)}: not found"]
    text = SCHEMA_PATH.read_text(encoding="utf-8")
    if not SCHEMA_VISIBILITY_RE.search(text):
        return [
            f"{SCHEMA_PATH.relative_to(ROOT)}: visibility enum drifted from "
            "z.enum(['public', 'internal']) — SSOT forbids 'private' (see 04-26 incident)"
        ]
    return []


def main():
    errors = []
    errors += check_ssot_exists()
    errors += check_refs()
    errors += check_schema_invariant()

    if errors:
        print("❌ Wiki visibility consistency check FAILED")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print("✅ Wiki visibility consistency check passed")
    print(f"   SSOT: docs/{SSOT_NAME}")
    print(f"   Verified {len(EXPECTED_REFS)} component references + schema invariant")


if __name__ == "__main__":
    main()

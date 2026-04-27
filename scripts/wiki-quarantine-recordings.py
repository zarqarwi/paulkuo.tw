#!/usr/bin/env python3
"""
Incident response (Paul decision C — extended audit scope):

Adds a `quarantine` block to all 65 wiki sources with visibility=internal,
to flag them for phase-2 manual review (Cowork sets review_outcome).

Important context discovered during reconnaissance:
- Original handoff assumed 44 recording notes were misclassified as `public`
  and exposed publicly. Reality: all 44 (and the additional 21 internal
  sources) have always been `visibility: internal` since their first commit
  (45d3d47, 2026-04-05). The schema only allows `'public' | 'internal'` —
  there is no `private`. Frontend filters with `visibility === 'public'`,
  so internal sources never rendered to HTML.
- Therefore this script does NOT change visibility. It only adds the
  quarantine block as an audit trail and review trigger.

Categories:
- recording_set_44: original handoff list (recording notes flagged by
  scanner-bug post-mortem, commit b0931a4 fixed the scanner)
- extended_audit_21: additional internal sources Paul added to phase-2
  review under decision C.

Idempotent: re-running on already-quarantined files is a no-op.
"""

import re
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wiki_corpus_lib import load_source, iter_source_paths, extract_raw_note_id  # noqa: E402

# 44 raw_note_ids from original handoff (scanner-bug recording set)
RECORDING_SET_44 = """
1899065664472756056
1900378267681216800
1900387995782123160
1900429853459558096
1900430189540859688
1900437610173749536
1900440528602454304
1900443996787498792
1900474137793714464
1900480149674188584
1900800880652066168
1900822048398808040
1900890547758048304
1900945511528107776
1900976653262270152
1901006869430898432
1901270027447435960
1901285092044178104
1901355621849661768
1901366025334174608
1901441776745593912
1901454140883221560
1901454756136780904
1901466154980006336
1901473991147782928
1901627674741896520
1901630702693315912
1901723571698458136
1901841819663161976
1901958434467699320
1902744723794268104
1902744775333850688
1902890675374035296
1903106513586171536
1903118704850406952
1903118811150847528
1903163290907389584
1903301313976504720
1903329278507519528
1903762369050584104
1904033043258630888
1904378657129009912
1905623247384379840
1905623892703216736
""".strip().split()

SOURCES_DIR = Path("src/content/wiki/sources")
TODAY = datetime.now().strftime("%Y-%m-%d")
QUARANTINE_MARKER = "scanner_bug_2026_04_26_audit"


def build_block(reason_tag: str) -> str:
    return (
        "quarantine:\n"
        f"  reason: \"{reason_tag}\"\n"
        "  observed_visibility: internal\n"
        f"  quarantined_at: \"{TODAY}\"\n"
        "  needs_review: true\n"
        "  review_outcome: pending  # set by Cowork during phase-2 audit\n"
    )


def collect_internal_sources():
    """Return list of (path, raw_note_id) for every source with visibility: internal."""
    out = []
    for path in iter_source_paths(SOURCES_DIR):
        fm, _ = load_source(path)
        if not fm or fm.get("visibility") != "internal":
            continue
        rid = extract_raw_note_id(fm)
        out.append((path, rid))
    return out


def main():
    if not SOURCES_DIR.is_dir():
        print(f"ERROR: {SOURCES_DIR} not found (run from repo root)", file=sys.stderr)
        sys.exit(1)

    targets = collect_internal_sources()
    if not targets:
        print("No internal sources found — nothing to do.")
        return

    processed_44 = []
    processed_21 = []
    skipped_already = []
    schema_collisions = []

    for path, rid in targets:
        text = path.read_text(encoding="utf-8")

        if "quarantine:" in text and QUARANTINE_MARKER in text:
            skipped_already.append(path.name)
            continue

        # Don't clobber an unrelated existing quarantine block.
        if re.search(r"^quarantine:\s*$", text, re.MULTILINE):
            schema_collisions.append(path.name)
            continue

        if rid in RECORDING_SET_44:
            reason = f"{QUARANTINE_MARKER}_recording_set_44"
            bucket = processed_44
        else:
            reason = f"{QUARANTINE_MARKER}_extended_audit_21"
            bucket = processed_21

        block = build_block(reason)

        # Insert quarantine block immediately after the visibility line, inside frontmatter.
        new_text, n = re.subn(
            r"(^visibility:\s*internal\s*\n)",
            r"\1" + block,
            text,
            count=1,
            flags=re.MULTILINE,
        )
        if n != 1:
            schema_collisions.append(path.name)
            continue

        path.write_text(new_text, encoding="utf-8")
        bucket.append(path.name)

    print("=== Quarantine Report ===")
    print(f"recording_set_44 quarantined: {len(processed_44)}")
    print(f"extended_audit_21 quarantined: {len(processed_21)}")
    print(f"already quarantined (skipped):  {len(skipped_already)}")
    print(f"schema collisions (skipped):    {len(schema_collisions)}")
    if schema_collisions:
        for n in schema_collisions:
            print(f"  - {n}")

    audit_dir = Path("worklogs/incidents")
    audit_dir.mkdir(parents=True, exist_ok=True)
    audit_path = audit_dir / "recording-quarantine-2026-04-26.md"

    lines = []
    lines.append(f"# Recording / Internal-Sources Quarantine — {TODAY}\n")
    lines.append("## Reconnaissance findings (deviation from original handoff)\n")
    lines.append(
        "Original handoff (`worklogs/handoffs/code--wiki-recording-quarantine-incident-2026-04-26.md`) "
        "assumed 44 recording notes had `visibility: public` and were exposed externally. "
        "Reconnaissance found:\n"
        "- All 44 raw_note_ids have always been `visibility: internal` since their first commit "
        "(45d3d47, 2026-04-05). `git log -p --all` shows zero `+visibility: public` history for the set.\n"
        "- Schema (`src/content.config.ts:64`) only allows `'public' | 'internal'`. No `private` value exists.\n"
        "- Frontend (`src/pages/wiki/[slug].astro:29`) filters source rendering with "
        "`visibility === 'public'`. Internal sources never rendered to HTML.\n"
        "- KV seed (`scripts/wiki-kv-seed.cjs`) only seeds `concepts/`, not `sources/`.\n"
        "Therefore the original `public → private` step was inapplicable and would have broken the build "
        "(`private` fails Zod schema). Paul approved decision **C**: extend audit to all 65 internal "
        "sources without changing visibility.\n"
    )
    lines.append("\n## Action taken\n")
    lines.append(
        "- Added `quarantine` block to all 65 sources with `visibility: internal` (audit trail).\n"
        "- `visibility` field UNCHANGED (already correctly internal).\n"
        f"- recording_set_44: {len(processed_44)} files\n"
        f"- extended_audit_21: {len(processed_21)} files\n"
        f"- already quarantined (idempotent re-run): {len(skipped_already)}\n"
        f"- schema collisions (manual review needed): {len(schema_collisions)}\n"
    )

    lines.append("\n## Scanner bug root cause\n")
    lines.append(
        "`scripts/build_wiki_ingest_report.py` `has_recording_tag()` matched only the literal "
        "`\"录音卡笔记\"`, missing the `\"录音笔记\"` (75 cases) and `\"录音测试\"` (1 case) "
        "variants in the get_筆記 source. Fixed in commit b0931a4 (contains-`\"录音\"`). "
        "The bug caused these notes to appear in the candidate ingest report, but the ingest "
        "pipeline's downstream visibility logic still labelled them `internal`, so there was no "
        "external exposure.\n"
    )

    lines.append("\n## recording_set_44 (handoff list)\n")
    for n in sorted(processed_44):
        lines.append(f"- `{n}`\n")
    lines.append("\n## extended_audit_21 (Paul decision C)\n")
    for n in sorted(processed_21):
        lines.append(f"- `{n}`\n")

    if skipped_already:
        lines.append("\n## Already quarantined (skipped)\n")
        for n in sorted(skipped_already):
            lines.append(f"- `{n}`\n")
    if schema_collisions:
        lines.append("\n## Schema collisions — needs manual inspection\n")
        for n in sorted(schema_collisions):
            lines.append(f"- `{n}`\n")

    lines.append("\n## Phase 2 — manual review (Cowork)\n")
    lines.append(
        "Each quarantined file's `quarantine.review_outcome` must be set to one of:\n"
        "- `restore_public`: public talk transcripts (Musk, Hinton, Munger, etc.) — flip visibility to `public`.\n"
        "- `keep_internal`: personal reflections / business meetings — leave `visibility: internal`, mark review done.\n"
        "- `delete`: highly sensitive (company names, partner financial terms) — remove file, "
        "add raw_note_id to a re-ingest blocklist.\n"
        "- `redact_and_restore`: de-identify and flip to `public`.\n"
        "Until phase-2 completes, `needs_review: true` stays.\n"
    )

    audit_path.write_text("".join(lines), encoding="utf-8")
    print(f"\nAudit log: {audit_path}")


if __name__ == "__main__":
    main()

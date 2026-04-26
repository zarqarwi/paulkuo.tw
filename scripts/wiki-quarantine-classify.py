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

import re
import yaml
from pathlib import Path
from datetime import datetime
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCES_DIR = PROJECT_ROOT / "src" / "content" / "wiki" / "sources"
TODAY = datetime.now().strftime("%Y-%m-%d")

# === RULES ===
# Order matters: first match wins. delete (most restrictive) listed first.

RULES = [
    {
        "outcome": "delete",
        "description": "Named companies / business partner / deal terms — permanent removal",
        "match": {
            "title_or_content_any": [
                "新医美学集团", "日本CET", "佳龙科技", "理事长合作",
                "合作项目", "合作条件", "项目规划", "合作洽谈",
                "海外市场拓展", "商业合作与项目推进",
            ],
        },
    },
    {
        "outcome": "keep_internal",
        "description": "Paul personal reflection / memorial — permanent internal",
        "match": {
            "title_any": ["庞牧师", "对...的怀念", "离世对我的影响", "怀念", "追思"],
        },
    },
    {
        "outcome": "restore_public",
        "description": "Public-figure transcript / general knowledge — safe to publish",
        "match": {
            "title_or_tags_any": [
                # Public figures
                "马斯克", "辛顿", "Hinton", "芒格", "Munger", "Musk",
                # Public research / concepts
                "无免费午餐", "概率分布", "全息宇宙", "神经可塑性",
                "Claude Skills", "决策公式",
                # Circular-economy public knowledge
                "循环经济", "二手回收", "岩棉回收", "材料替代",
                # General methodology
                "人生能量管理", "突破恐惧", "尖毛草定律", "复利",
                "重尾", "结构性财富",
            ],
        },
    },
    {
        "outcome": "redact_and_restore",
        "description": "Publishable topic with embedded PII/business — redact then publish",
        "match": {
            "title_or_content_any": [
                "醫療數據合作", "AI 醫療領域合作", "AI 藥物設計",
                "預防醫學服務設計", "員工健康長照方案",
            ],
        },
    },
]


def load_source(path: Path):
    """Parse frontmatter + body. Returns (frontmatter_dict, body_str)."""
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    if not m:
        return None, ""
    try:
        fm = yaml.safe_load(m.group(1))
    except Exception as e:
        print(f"⚠️  YAML parse error in {path.name}: {e}")
        return None, ""
    return fm, m.group(2)


def matches_rule(rule, fm, body):
    title = fm.get("title", "") or ""
    tags = fm.get("tags", []) or []
    tags_str = " ".join(str(t) for t in tags)
    title_and_tags = f"{title} {tags_str}"
    full = f"{title} {tags_str} {body}"

    m = rule["match"]
    if "title_or_content_any" in m:
        return any(kw in full for kw in m["title_or_content_any"])
    if "title_any" in m:
        return any(kw in title for kw in m["title_any"])
    if "title_or_tags_any" in m:
        return any(kw in title_and_tags for kw in m["title_or_tags_any"])
    return False


def classify(fm, body):
    for rule in RULES:
        if matches_rule(rule, fm, body):
            return rule["outcome"], rule["description"]
    return None, None


def main():
    quarantine_files = sorted(
        f for f in SOURCES_DIR.glob("*.md")
        if "quarantine:" in f.read_text(encoding="utf-8")
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
        raw_note_id = fm.get("raw_note_id", "") or ""
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

#!/usr/bin/env python3
"""
Sensitivity Scanner — detects PII / business-confidential markers
in source content. Used by ingest pipeline as a pre-write check.

Rules: see docs/wiki-visibility-rules.md (SSOT).

Returns suggested sensitivity level + flag list as JSON.
Exit 0 always — caller decides what to do with the suggestion.

Usage:
    python3 scripts/wiki-sensitivity-scan.py <file.md>
    python3 scripts/wiki-sensitivity-scan.py --stdin   # read text from stdin
"""

import re
import json
import sys
from pathlib import Path


COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]+\s*(公司|集團|集团|企業|企业|科技|生技)",
    r"(新医美学|新醫美學|日本CET|佳龙科技|佳龍科技|台积电|台積電)",
]

PII_PATTERNS = [
    r"\d{4}[-\s]?\d{3,4}[-\s]?\d{3,4}",                      # phone (loose)
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",        # email
]

BUSINESS_KEYWORDS = [
    # zh-TW
    "合作條件", "合作條款", "合約金額", "投資金額", "授權金",
    "合作項目", "合作洽談", "業務拓展", "商務會議",
    "合作對象", "合作夥伴", "理事長",
    # zh-CN
    "合作条件", "合作条款", "合约金额", "投资金额", "授权金",
    "合作项目", "合作洽谈", "业务拓展", "商务会议",
    "合作对象", "合作伙伴", "理事长",
]

PERSONAL_REFLECTION_KEYWORDS = [
    "懷念", "怀念", "追思", "離世", "离世",
    "對我的影響", "对我的影响", "私人感觸", "私人感触",
]


FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n", re.DOTALL)


def strip_frontmatter(text):
    """Remove YAML frontmatter so scanner doesn't false-positive on raw_note_id, dates, etc."""
    return FRONTMATTER_RE.sub("", text, count=1)


def scan(text):
    """Return (suggested_sensitivity, flags) where flags is a list of (type, examples).

    Frontmatter is stripped before pattern matching to avoid raw_note_id /
    date / numeric-id false positives on the phone-number regex.
    """
    text = strip_frontmatter(text)
    flags = []

    for pat in COMPANY_NAME_PATTERNS:
        matches = re.findall(pat, text)
        if matches:
            flags.append(("company_name", [str(m) for m in matches[:3]]))

    for pat in PII_PATTERNS:
        matches = re.findall(pat, text)
        if matches:
            flags.append(("pii", [str(m) for m in matches[:3]]))

    business_hits = [kw for kw in BUSINESS_KEYWORDS if kw in text]
    if business_hits:
        flags.append(("business_keyword", business_hits[:5]))

    personal_hits = [kw for kw in PERSONAL_REFLECTION_KEYWORDS if kw in text]
    if personal_hits:
        flags.append(("personal_reflection", personal_hits[:5]))

    flag_types = {f[0] for f in flags}
    if "company_name" in flag_types or "business_keyword" in flag_types:
        suggested = "business_confidential"
    elif "pii" in flag_types:
        suggested = "contains_pii"
    elif "personal_reflection" in flag_types:
        suggested = "personal_reflection"
    else:
        suggested = "safe"

    return suggested, flags


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/wiki-sensitivity-scan.py <file.md|--stdin>", file=sys.stderr)
        sys.exit(2)

    arg = sys.argv[1]
    if arg == "--stdin":
        text = sys.stdin.read()
        source = "<stdin>"
    else:
        path = Path(arg)
        if not path.exists():
            print(json.dumps({"error": f"file not found: {arg}"}))
            sys.exit(2)
        text = path.read_text(encoding="utf-8")
        source = str(path)

    suggested, flags = scan(text)
    print(json.dumps({
        "file": source,
        "suggested_sensitivity": suggested,
        "flags": [[t, list(v)] for t, v in flags],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

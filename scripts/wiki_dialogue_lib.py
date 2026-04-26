"""
Wiki Dialogue Detection — pure function library.

Shared by wiki-dialogue-detect.py (CLI), wiki-pending-promote.py (ingest hook),
wiki-quarantine-classify.py (rule 1), and unit tests.

No I/O, no side effects.
"""

import re
from typing import Optional

# Title keywords that directly signal dialogue (highest precision)
TITLE_KEYWORDS = ['對談', '訪談', '會議記錄', '討論會', '對話', '座談']

# Title keywords that specifically signal meeting/discussion — used by is_dialogue_signal
DIALOGUE_TITLE_KEYWORDS = ['會議記錄', '会议记录', '討論會', '讨论会']

# Title keywords for business meetings — used by is_business_meeting
BUSINESS_MEETING_TITLE_KEYWORDS = [
    '會議', '会议',
    '討論', '讨论',
    '洽談', '洽谈',
    '合作探討', '合作探讨',
    '項目規劃', '项目规划',
    '合作框架',
    '合作交流',
    '商業拓展', '商业拓展',
]

# Speaker label patterns — matched against line start
SPEAKER_PATTERNS = [
    r'^[A-Z]：',
    r'^[Qq]：',
    r'^Speaker\s*\d+[：:]',
    r'^主持人[：:]',
    r'^來賓[：:]',
    r'^老師[：:]',
    r'^學生[：:]',
    r'^記者[：:]',
    r'^回答者[：:]',
    r'^提問者[：:]',
]

MIN_UNIQUE_SPEAKERS = 2
MIN_TOTAL_MARKERS = 4


def detect_dialogue(frontmatter: dict, body: str) -> dict:
    """
    Heuristic dialogue detection.

    Returns:
        {
            'dialogue': bool,
            'dialogue_inference': 'heuristic' | 'none',
            'speakers': [str],   # only present when inferred from body markers
            'reason': str,
        }
    """
    title = frontmatter.get('title', '') or ''
    for kw in TITLE_KEYWORDS:
        if kw in title:
            return {
                'dialogue': True,
                'dialogue_inference': 'heuristic',
                'reason': f'title contains "{kw}"',
            }

    speaker_set = set()
    total_markers = 0
    for line in body.split('\n'):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        for pattern in SPEAKER_PATTERNS:
            m = re.match(pattern, line_stripped)
            if m:
                total_markers += 1
                label = re.split(r'[：:]', line_stripped, 1)[0]
                speaker_set.add(label)
                break

    if len(speaker_set) >= MIN_UNIQUE_SPEAKERS:
        return {
            'dialogue': True,
            'dialogue_inference': 'heuristic',
            'speakers': sorted(speaker_set),
            'reason': f'{len(speaker_set)} unique speakers, {total_markers} markers',
        }

    if total_markers >= MIN_TOTAL_MARKERS and len(speaker_set) >= 1:
        return {
            'dialogue': True,
            'dialogue_inference': 'heuristic',
            'speakers': sorted(speaker_set),
            'reason': f'{total_markers} markers (single speaker dominant)',
        }

    return {
        'dialogue': False,
        'dialogue_inference': 'none',
        'reason': f'{total_markers} markers, {len(speaker_set)} unique speakers',
    }


def is_dialogue_signal(frontmatter: dict, body: str) -> bool:
    """
    Return True if the source is (or likely is) a multi-person dialogue.

    Used by wiki-quarantine-classify.py requires_all rule 1.
    Checks in priority order:
      1. frontmatter dialogue=True (already promoted with marker)
      2. frontmatter speakers with more than one entry
      3. title contains DIALOGUE_TITLE_KEYWORDS
    """
    if frontmatter.get('dialogue') is True:
        return True
    speakers = frontmatter.get('speakers') or []
    if len(speakers) > 1:
        return True
    title = frontmatter.get('title', '') or ''
    return any(kw in title for kw in DIALOGUE_TITLE_KEYWORDS)


def is_business_meeting(frontmatter: dict, folder: Optional[str] = None) -> bool:
    """
    Return True if the source is a business meeting note.

    Used by wiki-quarantine-classify.py requires_all rule 1.
    Checks:
      1. folder == '05_商務會議'
      2. title contains BUSINESS_MEETING_TITLE_KEYWORDS
    """
    if folder == '05_商務會議':
        return True
    title = frontmatter.get('title', '') or ''
    return any(kw in title for kw in BUSINESS_MEETING_TITLE_KEYWORDS)

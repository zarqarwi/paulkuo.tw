"""
Visibility rules — importable module so scanner + tests share the same logic.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Pure functions only — no I/O, no side effects.
"""

# Folder defaults — see docs/wiki-visibility-rules.md (SSOT).
FOLDER_VISIBILITY_RULES = {
    "01_專欄文章": "public",
    "02_醫療健康": "internal",
    "03_環保循環經濟": "public",
    "04_AI與科技": "public",        # may be downgraded to internal by tag
    "05_商務會議": "internal",      # downgrades to private when recording tag present
    "06_個人成長與學習": "internal",
    "07_生活雜記": "private",
    "08_其他": "internal",
    "09_會議錄音": "private",
}

# Substring marker for recording-type system tags.
# All tags containing this keyword (e.g. 录音卡笔记 / 录音笔记 / 录音测试)
# count as recording. b0931a4 fixed the original exact-match bug.
RECORDING_TAG_KEYWORD = "录音"


def has_recording_tag(tags):
    """True if any system-typed tag contains the recording keyword."""
    return any(
        RECORDING_TAG_KEYWORD in (tag.get("name") or "") and tag.get("type") == "system"
        for tag in (tags or [])
    )


def determine_visibility(folder, tags):
    """Return one of 'public' / 'internal' / 'private' for a note in the given folder.

    Rules — see docs/wiki-visibility-rules.md (SSOT):
      - 01 / 03 / 04: default public; 04 downgrades to internal on recording tag
      - 02 / 06 / 08: always internal
      - 05: internal default; downgrades to private on recording tag
      - 07 / 09: always private (not ingested)
    """
    recording = has_recording_tag(tags)

    if folder == "01_專欄文章":
        return "public"
    if folder == "03_環保循環經濟":
        return "public"
    if folder == "04_AI與科技":
        return "internal" if recording else "public"
    if folder == "02_醫療健康":
        return "internal"
    if folder == "05_商務會議":
        return "private" if recording else "internal"
    if folder == "06_個人成長與學習":
        return "internal"
    if folder == "07_生活雜記":
        return "private"
    if folder == "08_其他":
        return "internal"
    if folder == "09_會議錄音":
        return "private"
    return "internal"  # default

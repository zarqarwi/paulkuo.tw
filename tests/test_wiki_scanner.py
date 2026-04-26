"""
White-box tests for scripts/wiki_visibility.py determine_visibility().

Every 录音 tag variant gets a fixture. Adding a new variant without a
fixture should fail CI (forward-compat regression).

Run:
    pytest tests/wiki-scanner.test.py -v

Visibility rules: see docs/wiki-visibility-rules.md (SSOT).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from wiki_visibility import determine_visibility, has_recording_tag, RECORDING_TAG_KEYWORD


# ── Recording tag variants ─────────────────────────────────────────────

def test_recording_variant_with_ka():
    tags = [{"name": "录音卡笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"


def test_recording_variant_without_ka():
    """The bug fixed in b0931a4."""
    tags = [{"name": "录音笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"


def test_recording_variant_test():
    tags = [{"name": "录音测试", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"


def test_future_recording_variant_forward_compat():
    """Any system tag containing 录音 must count as recording."""
    tags = [{"name": "录音转写笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"
    assert has_recording_tag(tags) is True


def test_recording_keyword_invariant():
    """The keyword used must be the substring 录音 — anything else regresses b0931a4."""
    assert RECORDING_TAG_KEYWORD == "录音"


# ── Non-recording tags must not trigger ────────────────────────────────

def test_recording_in_ai_link_note_is_public():
    """AI链接笔记 is not a recording."""
    tags = [{"name": "AI链接笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "public"


def test_user_tag_with_recording_keyword_does_not_trigger():
    """Only system-typed tags count. User tags containing 录音 must not flip visibility."""
    tags = [{"name": "录音设备评测", "type": "user"}]
    assert determine_visibility("04_AI與科技", tags) == "public"


# ── Folder defaults ────────────────────────────────────────────────────

def test_personal_growth_always_internal():
    assert determine_visibility("06_個人成長與學習", []) == "internal"


def test_health_folder_always_internal():
    assert determine_visibility("02_醫療健康", []) == "internal"


def test_other_folder_internal():
    assert determine_visibility("08_其他", []) == "internal"


def test_circular_economy_default_public():
    assert determine_visibility("03_環保循環經濟", []) == "public"


def test_column_articles_default_public():
    assert determine_visibility("01_專欄文章", []) == "public"


# ── Meeting folder behaviour ───────────────────────────────────────────

def test_meeting_recording_is_private():
    tags = [{"name": "录音卡笔记", "type": "system"}]
    assert determine_visibility("05_商務會議", tags) == "private"


def test_meeting_no_recording_is_internal():
    assert determine_visibility("05_商務會議", []) == "internal"


# ── Always-private folders ─────────────────────────────────────────────

def test_life_misc_private():
    assert determine_visibility("07_生活雜記", []) == "private"


def test_meeting_recordings_folder_private():
    assert determine_visibility("09_會議錄音", []) == "private"


# ── Edge cases ─────────────────────────────────────────────────────────

def test_unknown_folder_defaults_internal():
    assert determine_visibility("99_unknown", []) == "internal"


def test_empty_tags():
    assert determine_visibility("04_AI與科技", []) == "public"


def test_none_tags():
    assert determine_visibility("04_AI與科技", None) == "public"


def test_tag_missing_type():
    """Tag without `type` field must not crash; treated as non-system."""
    tags = [{"name": "录音笔记"}]
    assert has_recording_tag(tags) is False

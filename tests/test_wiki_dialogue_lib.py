"""
Unit tests for scripts/wiki_dialogue_lib.py.
Run: python3 -m pytest tests/test_wiki_dialogue_lib.py -v
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from wiki_dialogue_lib import (
    detect_dialogue,
    is_dialogue_signal,
    is_business_meeting,
    TITLE_KEYWORDS,
    SPEAKER_PATTERNS,
    MIN_UNIQUE_SPEAKERS,
    MIN_TOTAL_MARKERS,
)


# === detect_dialogue (carried over from test_wiki_dialogue_detect.py) ===

def test_monologue_youtube():
    fm = {"title": "AI 趨勢分析"}
    body = """
    [0:00] 在開源 AI 的黑暗森林裡 時間正在以極度扭曲的形態流逝
    [0:42] 卻只能在 4.2 萬星的陣地上 以每天 201 星的慘淡速度穩態減速
    [1:25] 是如何定義這場 agent 外部化與記憶智能的
    """
    assert detect_dialogue(fm, body)["dialogue"] is False


def test_title_keyword_對談():
    fm = {"title": "Paul 與 X 的對談：AI 創業的未來"}
    result = detect_dialogue(fm, "純文字流...")
    assert result["dialogue"] is True
    assert result["dialogue_inference"] == "heuristic"
    assert "對談" in result["reason"]


def test_speaker_markers():
    fm = {"title": "AI 節目 EP42"}
    body = """
    Q：你怎麼看 AI 的未來？
    A：我覺得 Agent 會變成主流。
    Q：那 Harness 工程呢？
    A：那是基礎設施，會持續演化。
    """
    result = detect_dialogue(fm, body)
    assert result["dialogue"] is True
    assert "Q" in result.get("speakers", [])
    assert "A" in result.get("speakers", [])


def test_single_marker_no_match():
    fm = {"title": "某 YouTube 影片"}
    body = """
    主持人：歡迎收看本節目。
    今天要講的是 AI 的趨勢...
    後面全是該主持人獨白，沒有其他人說話。
    """
    assert detect_dialogue(fm, body)["dialogue"] is False


def test_4_markers_single_speaker():
    fm = {"title": "某 podcast"}
    body = """
    主持人：歡迎收看。
    今天介紹的主題很有趣。
    主持人：接下來我們聊 X。
    然後繼續說了很多。
    主持人：我來補充一個觀點。
    觀點說完了。
    主持人：最後總結一下。
    """
    result = detect_dialogue(fm, body)
    assert result["dialogue"] is True
    assert "4 markers" in result["reason"] or "dominant" in result["reason"]


# === is_dialogue_signal ===

def test_is_dialogue_signal_via_fm_field():
    fm = {"title": "某錄音", "dialogue": True}
    assert is_dialogue_signal(fm, "") is True


def test_is_dialogue_signal_via_speakers():
    fm = {"title": "某錄音", "speakers": ["主持人", "來賓"]}
    assert is_dialogue_signal(fm, "") is True


def test_is_dialogue_signal_via_title_keyword():
    fm = {"title": "2025 年度會議記錄"}
    assert is_dialogue_signal(fm, "") is True


def test_is_dialogue_signal_simplified():
    fm = {"title": "2025 年度会议记录"}
    assert is_dialogue_signal(fm, "") is True


def test_is_dialogue_signal_false():
    fm = {"title": "AI 趨勢概覽", "dialogue": False}
    assert is_dialogue_signal(fm, "") is False


def test_is_dialogue_signal_single_speaker_not_signal():
    # Single speaker should not trigger is_dialogue_signal via speakers check
    fm = {"title": "普通錄音", "speakers": ["主持人"]}
    assert is_dialogue_signal(fm, "") is False


# === is_business_meeting ===

def test_is_business_meeting_via_folder():
    fm = {"title": "某記錄"}
    assert is_business_meeting(fm, folder="05_商務會議") is True


def test_is_business_meeting_via_title_traditional():
    fm = {"title": "2025 Q1 商業拓展計畫會議"}
    assert is_business_meeting(fm) is True


def test_is_business_meeting_via_title_simplified():
    fm = {"title": "合作探讨会议纪要"}
    assert is_business_meeting(fm) is True


def test_is_business_meeting_false():
    fm = {"title": "AI 神經可塑性研究"}
    assert is_business_meeting(fm) is False


def test_is_business_meeting_no_folder_no_title():
    fm = {"title": "隨手記錄"}
    assert is_business_meeting(fm, folder=None) is False

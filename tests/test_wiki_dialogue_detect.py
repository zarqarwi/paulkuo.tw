"""
Fixture tests for wiki-dialogue-detect.py heuristic detector.
Run: python3 -m pytest tests/test_wiki_dialogue_detect.py -v
"""

import sys
import importlib.util
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / 'scripts'))

_spec = importlib.util.spec_from_file_location(
    'wiki_dialogue_detect',
    PROJECT_ROOT / 'scripts' / 'wiki-dialogue-detect.py',
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
detect_dialogue = _mod.detect_dialogue


def test_monologue_youtube():
    """Pure monologue (Whisper STT) — should NOT match"""
    fm = {'title': 'AI 趨勢分析'}
    body = """
    [0:00] 在開源 AI 的黑暗森林裡 時間正在以極度扭曲的形態流逝
    [0:42] 卻只能在 4.2 萬星的陣地上 以每天 201 星的慘淡速度穩態減速
    [1:25] 是如何定義這場 agent 外部化與記憶智能的
    """
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is False


def test_title_keyword_對談():
    """Title contains 對談 — direct hit"""
    fm = {'title': 'Paul 與 X 的對談：AI 創業的未來'}
    body = '純文字流...'
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is True
    assert result['dialogue_inference'] == 'heuristic'
    assert '對談' in result['reason']


def test_speaker_markers():
    """Multiple unique speaker labels in body (title has no keywords to isolate body detection)"""
    fm = {'title': 'AI 節目 EP42'}
    body = """
    Q：你怎麼看 AI 的未來？
    A：我覺得 Agent 會變成主流。
    Q：那 Harness 工程呢？
    A：那是基礎設施，會持續演化。
    """
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is True
    assert 'Q' in result.get('speakers', [])
    assert 'A' in result.get('speakers', [])


def test_single_marker_no_match():
    """Only 1 marker, 1 unique speaker — should NOT match"""
    fm = {'title': '某 YouTube 影片'}
    body = """
    主持人：歡迎收看本節目。
    今天要講的是 AI 的趨勢...
    後面全是該主持人獨白，沒有其他人說話。
    """
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is False


def test_4_markers_single_speaker():
    """4 markers with single speaker — match (interview-style dominant)"""
    fm = {'title': '某 podcast'}
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
    assert result['dialogue'] is True
    assert '4 markers' in result['reason'] or 'dominant' in result['reason']

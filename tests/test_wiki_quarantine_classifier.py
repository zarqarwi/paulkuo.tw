"""
Tests for wiki-quarantine-classify.py rule matching.
Rule changes → fixture misalignment → CI fail.
"""
import sys
import importlib.util
import pytest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

# Load classifier module (filename has hyphens, use spec_from_file_location)
_spec = importlib.util.spec_from_file_location(
    "wiki_quarantine_classify",
    PROJECT_ROOT / "scripts" / "wiki-quarantine-classify.py",
)
classifier = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(classifier)


def _rule(outcome, include_requires_all=False):
    """Return first rule matching outcome. Skips requires_all rules by default (placeholder, never match)."""
    return next(
        r for r in classifier.RULES
        if r["outcome"] == outcome and (include_requires_all or "requires_all" not in r)
    )


# === delete (requires_all rule — enabled, needs all 3 conditions) ===

_RECORDING_TAG = {"name": "录音笔记", "type": "system"}


def test_requires_all_rule_is_present():
    rule = _rule("delete", include_requires_all=True)
    assert "requires_all" in rule


def test_requires_all_misses_without_recording_tag():
    rule = _rule("delete", include_requires_all=True)
    fm = {"title": "商務會議記錄討論", "dialogue": True, "tags": []}
    assert not classifier.matches_rule(rule, fm, "")


def test_requires_all_misses_without_dialogue():
    # Title must not contain DIALOGUE_TITLE_KEYWORDS to isolate the dialogue=False case
    rule = _rule("delete", include_requires_all=True)
    fm = {"title": "商務洽談", "dialogue": False, "tags": [_RECORDING_TAG]}
    assert not classifier.matches_rule(rule, fm, "")


def test_requires_all_misses_without_business_meeting():
    rule = _rule("delete", include_requires_all=True)
    fm = {"title": "AI 趨勢研究", "dialogue": True, "tags": [_RECORDING_TAG]}
    assert not classifier.matches_rule(rule, fm, "")


def test_requires_all_matches_all_three_conditions():
    rule = _rule("delete", include_requires_all=True)
    fm = {
        "title": "商務洽談討論紀錄",
        "dialogue": True,
        "dialogue_inference": "heuristic",
        "speakers": ["主持人", "來賓"],
        "tags": [_RECORDING_TAG],
    }
    assert classifier.matches_rule(rule, fm, "")


def test_requires_all_matches_via_title_meeting_keyword():
    """is_business_meeting triggers on title keyword even without folder."""
    rule = _rule("delete", include_requires_all=True)
    fm = {
        "title": "合作探討初步方案",
        "dialogue": True,
        "tags": [_RECORDING_TAG],
    }
    assert classifier.matches_rule(rule, fm, "")


# === delete (match rule — company names / business terms) ===

def test_delete_company_name_simplified():
    fm = {"title": "新医美学集团业务介绍", "tags": []}
    assert classifier.matches_rule(_rule("delete"), fm, "")


def test_delete_company_name_traditional():
    fm = {"title": "新醫美學集團業務介紹", "tags": []}
    assert classifier.matches_rule(_rule("delete"), fm, "")


def test_delete_business_term_simplified():
    fm = {"title": "项目规划总结", "tags": []}
    assert classifier.matches_rule(_rule("delete"), fm, "")


def test_delete_business_term_traditional():
    fm = {"title": "項目規劃總結", "tags": []}
    assert classifier.matches_rule(_rule("delete"), fm, "")


# === keep_internal ===

def test_keep_internal_pastor_simplified():
    fm = {"title": "对庞牧师的怀念与追思", "tags": []}
    assert classifier.matches_rule(_rule("keep_internal"), fm, "")


def test_keep_internal_pastor_traditional():
    fm = {"title": "對龐牧師的懷念", "tags": []}
    assert classifier.matches_rule(_rule("keep_internal"), fm, "")


# === restore_public ===

def test_restore_public_musk_simplified():
    fm = {"title": "马斯克最新十大预言", "tags": []}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


def test_restore_public_musk_traditional():
    fm = {"title": "馬斯克最新十大預言", "tags": []}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


def test_restore_public_hinton_english():
    fm = {"title": "Geoffrey Hinton AI警告", "tags": []}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


def test_restore_public_nfl_simplified():
    fm = {"title": "无免费午餐定理", "tags": []}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


def test_restore_public_nfl_traditional():
    fm = {"title": "無免費午餐定理", "tags": []}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


def test_restore_public_via_tag():
    fm = {"title": "某篇文章", "tags": ["複利", "長期主義"]}
    assert classifier.matches_rule(_rule("restore_public"), fm, "")


# === redact_and_restore ===

def test_redact_medical_collab_traditional():
    fm = {"title": "AI 醫療領域合作探討", "tags": []}
    assert classifier.matches_rule(_rule("redact_and_restore"), fm, "")


def test_redact_medical_collab_simplified():
    fm = {"title": "AI医疗领域合作探讨", "tags": []}
    assert classifier.matches_rule(_rule("redact_and_restore"), fm, "")


# === fast-path: existing review_outcome ===

def test_fast_path_honours_keep_internal():
    """Sources with review_outcome + needs_review=False bypass rule evaluation."""
    fm = {
        "title": "毫不相關的標題",
        "tags": [],
        "quarantine": {"review_outcome": "keep_internal", "needs_review": False},
    }
    outcome, reason = classifier.classify(fm, "")
    assert outcome == "keep_internal"
    assert "fast-path" in reason


def test_fast_path_overrides_rule_match():
    """Fast-path takes precedence even when a rule would fire a different outcome."""
    fm = {
        "title": "AI 醫療領域合作探討",  # would match redact_and_restore
        "tags": [],
        "quarantine": {"review_outcome": "keep_internal", "needs_review": False},
    }
    outcome, reason = classifier.classify(fm, "")
    assert outcome == "keep_internal"
    assert "fast-path" in reason


def test_fast_path_skipped_when_needs_review_true():
    """needs_review=True means not yet decided — must fall through to rules."""
    fm = {
        "title": "馬斯克最新十大預言",  # matches restore_public
        "tags": [],
        "quarantine": {"review_outcome": "keep_internal", "needs_review": True},
    }
    outcome, _ = classifier.classify(fm, "")
    assert outcome == "restore_public"


def test_fast_path_skipped_when_no_review_outcome():
    """Missing review_outcome means classify normally."""
    fm = {
        "title": "馬斯克最新十大預言",
        "tags": [],
        "quarantine": {"needs_review": False},
    }
    outcome, _ = classifier.classify(fm, "")
    assert outcome == "restore_public"


# === no match → human review ===

def test_no_rule_matches_unrelated():
    fm = {"title": "毫不相關的標題", "tags": []}
    for rule in classifier.RULES:
        assert not classifier.matches_rule(rule, fm, "")


def test_no_rule_matches_generic_tech():
    fm = {"title": "Python 非同步程式設計", "tags": []}
    for rule in classifier.RULES:
        assert not classifier.matches_rule(rule, fm, "")

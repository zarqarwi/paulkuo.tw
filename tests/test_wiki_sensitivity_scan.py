"""
White-box tests for scripts/wiki-sensitivity-scan.py scan().

Covers:
  - strip_source_trace_section: getnote「## 來源追蹤」段落不觸發 FP
  - PUBLIC_COMPANY_WHITELIST: 知名公開公司/機構/泛型前綴不觸發
  - BUSINESS_KEYWORDS: 真實商業機密 keyword 仍命中
  - PII: 電話/email 仍命中
  - 邊界: 「來源追蹤」後還有其他段落時不誤刪

Run:
    pytest tests/test_wiki_sensitivity_scan.py -v

Rules SSOT: docs/wiki-visibility-rules.md
"""
import sys
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location(
    "wiki_sensitivity_scan", ROOT / "scripts" / "wiki-sensitivity-scan.py"
)
_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_mod)
scan = _mod.scan


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make(body, title="測試"):
    return f"---\ntitle: {title}\n---\n\n{body}"


def _make_getnote(body, raw_note_id="1905762523509171424", source_label="商務會議筆記"):
    return (
        f"---\ntitle: 測試\nraw_note_id: '{raw_note_id}'\n---\n\n"
        f"{body}\n\n"
        f"## 來源追蹤\n\n"
        f"**原始筆記ID：** {raw_note_id}  \n"
        f"**來自：** get_筆記 {source_label}  \n"
        f"**可視性：** 內部（商業戰略思考）\n"
    )


# ---------------------------------------------------------------------------
# Task 1 — strip 來源追蹤段（原始 handoff fixtures）
# ---------------------------------------------------------------------------

def test_getnote_with_source_trace_is_safe():
    """普通 getnote 含「來源追蹤」段但內文乾淨 → safe"""
    text = _make_getnote("這是一篇關於決策方法的筆記。市場有空間時要創造價值。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_real_business_confidential_still_caught():
    """內文真含「合作條件」keyword → business_confidential"""
    text = _make("雙方討論合作條件，包括授權金與合約金額分配。")
    suggested, _ = scan(text)
    assert suggested == "business_confidential"


def test_real_pii_in_body_still_caught():
    """內文真含 phone/email → contains_pii"""
    text = _make("聯絡電話 0912-345-678，email contact@example.com。")
    suggested, _ = scan(text)
    assert suggested == "contains_pii"


def test_source_trace_real_content_before_section_still_caught():
    """真敏感 keyword 在「來源追蹤」段之前（符合實際 getnote 結構）→ 仍命中"""
    # 實際 getnote 文件結構：正文在前，## 來源追蹤 永遠在最後
    text = (
        "---\ntitle: 多段測試\n---\n\n"
        "## 引用金句\n\n"
        "> 雙方討論合作條件，授權金另議。\n\n"
        "## 來源追蹤\n\n"
        "**原始筆記ID：** 1900000000000000000  \n"
        "**來自：** get_筆記 商務會議筆記  \n"
    )
    suggested, _ = scan(text)
    assert suggested == "business_confidential"


# ---------------------------------------------------------------------------
# Task 2 — 公開公司白名單（原始 handoff fixtures）
# ---------------------------------------------------------------------------

def test_tsmc_in_body_is_safe():
    """文章提到台積電（公開上市）→ safe"""
    text = _make("台積電一家吃掉台灣 8% 電力，再生能源成長追不上。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_openai_company_in_body_is_safe():
    """文章提到 OpenAI 公司 → safe（白名單）"""
    text = _make("OpenAI 公司近期推出新模型，引發業界討論。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_truly_sensitive_company_still_caught():
    """文章提到真敏感具名公司（日本CET）→ business_confidential"""
    text = _make("日本CET 公司提出合作意向，討論授權金額。")
    suggested, _ = scan(text)
    assert suggested == "business_confidential"


# ---------------------------------------------------------------------------
# Round 2 — 修補泛型前綴 + 學術出版機構 + 合作夥伴移除
# ---------------------------------------------------------------------------

def test_ai_company_generic_prefix_is_safe():
    """文章提到「AI 公司」泛指 → safe（泛型縮寫，不代表具名企業）"""
    text = _make("許多 AI 公司正在快速擴展，競爭格局變化劇烈。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_o2o_company_generic_prefix_is_safe():
    """文章提到「O2O公司」泛指 → safe"""
    text = _make("O2O公司的商業模式在後疫情時代面臨挑戰。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_ip_company_generic_prefix_is_safe():
    """文章提到「IP公司」泛指 → safe"""
    text = _make("IP公司的授權收益在串流時代反而上升。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_nature_journal_in_body_is_safe():
    """文章提到 Nature 集團（學術出版機構）→ safe"""
    text = _make("Nature 集團 npj Complexity 期刊 2026 年新論文提出重尾分布的區分框架。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_partnership_perspective_is_safe():
    """概念性文章提到「合作夥伴視角」→ safe（合作夥伴已從 BUSINESS_KEYWORDS 移除）"""
    text = _make("從競爭對手轉向合作夥伴視角，從短期勝利轉向長期價值積累。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_real_negotiation_without_partner_keyword_still_caught():
    """商業洽談但不含「合作夥伴」→ 仍因合作條件 keyword 命中"""
    text = _make("本次雙方確認合作條件，授權金為年費制，合約金額待補。")
    suggested, _ = scan(text)
    assert suggested == "business_confidential"

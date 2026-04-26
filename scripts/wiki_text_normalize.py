#!/usr/bin/env python3
"""
Text normalization helpers for wiki scripts.
- s2t: simplified → traditional Chinese
- normalize: s2t + strip whitespace + lowercase ASCII
- contains_normalized: normalized substring check
"""

SIMPLIFIED_TO_TRADITIONAL = {
    "无": "無", "费": "費",
    "决": "決", "电": "電", "脑": "腦", "网": "網", "络": "絡",
    "学": "學", "习": "習", "经": "經", "济": "濟",
    "环": "環", "循": "循", "医": "醫", "疗": "療", "药": "藥", "诊": "診",
    "数": "數", "据": "據", "类": "類", "结": "結", "构": "構",
    "实": "實", "现": "現", "错": "錯", "误": "誤",
    "发": "發", "应": "應",
    "讨": "討", "论": "論", "说": "說", "话": "話",
    "动": "動", "态": "態", "状": "狀",
    "时": "時", "间": "間", "线": "線",
    "标": "標", "题": "題",
    "记": "記", "录": "錄", "笔": "筆",
    "听": "聽", "见": "見", "视": "視", "频": "頻",
    "颖": "穎", "辑": "輯", "导": "導",
    "营": "營", "业": "業", "项": "項",
    "认": "認", "识": "識",
    "证": "證", "号": "號",
    "签": "籤",
    "顿": "頓", "码": "碼", "单": "單", "双": "雙",
    "极": "極", "终": "終",
    "复": "復", "杂": "雜", "续": "續",
    "图": "圖",
    "运": "運",
    "灵": "靈",
    "马": "馬",
    "乔": "喬",
    "达": "達", "欧": "歐",
    "预": "預", "测": "測",
    "趋": "趨", "势": "勢",
    "样": "樣",
    "恐": "恐", "惧": "懼",
    "怀": "懷", "念": "念",
    "离": "離",
    "对": "對", "响": "響",
    "庞": "龐",
}

try:
    import opencc as _opencc
    _cc = _opencc.OpenCC('s2t')
    def s2t(text: str) -> str:
        return _cc.convert(text)
except ImportError:
    def s2t(text: str) -> str:
        return "".join(SIMPLIFIED_TO_TRADITIONAL.get(c, c) for c in text)


def normalize(text: str) -> str:
    if not text:
        return ""
    # Collapse internal whitespace so "AI 醫療" matches "AI醫療"
    import re as _re
    return _re.sub(r'\s+', '', s2t(text).lower())


def contains_normalized(haystack: str, needle: str) -> bool:
    return normalize(needle) in normalize(haystack)

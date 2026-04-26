# Code Handoff — Sensitivity Detector 第二輪修補 + B 任務收束（2026-04-26）

> 建立：2026-04-26
> 來源：Cowork 對 round 1（commit `40a9a10`）剩餘 5 支 FP 做完 spot-check
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（30-40 min，含 tests）

---

## 上下文

第一輪 detector 修補（commit `40a9a10`）後，280 public sources 命中分布：

| 等級 | 命中 |
|------|------|
| safe | 275 |
| contains_pii | 0 ✅ |
| business_confidential | **5** |
| personal_reflection | 0 ✅ |

Cowork 對剩餘 5 支做 spot-check，**全部是 false positive**：

| # | source | 命中 | Spot-check 結論 | 修補 |
|---|--------|------|---------------|------|
| 1 | `clip-nature-competitive-endeavors-heavy-tails.md` | `Nature 集團` | Springer Nature 學術出版集團（「Nature 集團 npj Complexity 期刊」）— 公開知名媒體 | A |
| 2 | `getnote-171424-supply-side-positive-sum.md` | `合作夥伴` | 抽象論述用詞（「從競爭對手轉向合作夥伴視角」）— 不是真敏感 | B |
| 3 | `clip-long-tail-of-ai-contrary.md` | `AI 公司` | 泛詞（「『非 AI 公司』受 AI 影響的總數遠超 AI 原生新創」） | C |
| 4 | `youtube-8pncy425QqQ-ai.md` | `O2O公司` | 泛詞（業界普通名詞 + 公司） | C |
| 5 | `youtube-tzEWYNQmnmc-ai.md` | `IP公司` | 泛詞 | C |

### B 任務形態變化

如果三件修補完成，5 支降至 0 → 意味**全部 280 public sources 都是 safe** → backfill 就只是「補 frontmatter `sensitivity: safe`」這個 noop 動作，沒意義（schema 預設值就是 safe）。

所以 **B 任務的「Sensitivity 補檔」實質結束**，detector 修補本身就是 B 的最終產出。後續 detector 用作 ingest pipeline pre-write check，未來新 source 進來才會抓到真敏感。

---

## 修改範圍

### Task 1A. 白名單加 `Nature` / `Springer`

`scripts/wiki-sensitivity-scan.py` 中 `PUBLIC_COMPANY_WHITELIST` 加：

```python
"Nature", "Springer",
```

放在「其他常見公開公司」分類下。

### Task 1B. `BUSINESS_KEYWORDS` 移除過泛詞

`scripts/wiki-sensitivity-scan.py` 中 `BUSINESS_KEYWORDS` 移除以下 4 個（太泛，誤判太多）：

```python
# 原 BUSINESS_KEYWORDS 的 zh-TW + zh-CN 版本中移除：
# zh-TW: "合作對象", "合作夥伴"
# zh-CN: "合作对象", "合作伙伴"
```

修改後 `BUSINESS_KEYWORDS` 應剩下精確的具名業務詞：「合作條件」「合作條款」「合約金額」「投資金額」「授權金」「合作項目」「合作洽談」「業務拓展」「商務會議」「理事長」+ 簡體版本。

### Task 1C. 寬鬆 regex 加最短長度限制

`scripts/wiki-sensitivity-scan.py` 中 `COMPANY_NAME_PATTERNS` 第一條：

```python
# 原本：
COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]+\s*(公司|集團|集团|企業|企业|科技|生技)",
    r"(新医美学|新醫美學|日本CET|佳龙科技|佳龍科技)",
]

# 改成：要求公司前綴至少 4 字元（消除 AI/IP/O2O 等泛詞）
COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]{3,}\s*(公司|集團|集团|企業|企业|科技|生技)",
    r"(新医美学|新醫美學|日本CET|佳龙科技|佳龍科技)",
]
```

**風險評估（已驗證）**：
- Synopsys (8)、Anthropic (9)、OpenAI (6) — 全在 4+ 字元，仍會命中（但被白名單跳過）
- 真敏感公司「新醫美學」「日本CET」「佳龍科技」— 寫死在第二條 regex，不受長度限制影響
- 唯一漏網：2-3 字元縮寫類公司（IBM / SAP / HP / GE）— 但這類都是公開知名，全部在白名單內，漏網其實是正確結果

### Task 2. 補寫 tests（上輪 Code 跳過 Task 3）

新建 `tests/test_wiki_sensitivity_scan.py`，包含 **9 個 fixtures**（原 7 個 + 新增 2 個驗證 round 2 修補）：

```python
import pytest
import sys
from pathlib import Path

# Import detector — 視 repo 結構調整
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from importlib.machinery import SourceFileLoader
scan_mod = SourceFileLoader(
    "wiki_sensitivity_scan",
    str(Path(__file__).parent.parent / "scripts" / "wiki-sensitivity-scan.py"),
).load_module()


# === Round 1: strip 來源追蹤段 ===

def test_normal_getnote_with_source_trace_is_safe():
    """普通 getnote 含「來源追蹤」段但內文乾淨 → safe"""
    text = '''---
title: 測試
raw_note_id: '1905762523509171424'
---

# 內文
這是一篇關於決策方法的筆記。市場有空間時要創造價值。

## 來源追蹤

**原始筆記ID：** 1905762523509171424  
**來自：** get_筆記 商務會議筆記  
**可視性：** 內部（商業戰略思考）
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_real_business_confidential_still_caught():
    """內文真含「合作條件」keyword → business_confidential"""
    text = '''---
title: 真敏感
---

# 內文
雙方討論合作條件，包括授權金與合約金額分配。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "business_confidential"


def test_real_pii_in_body_still_caught():
    """內文真含 phone/email → contains_pii"""
    text = '''---
title: 真 PII
---

# 內文
聯絡電話 0912-345-678，email contact@example.com。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "contains_pii"


def test_source_trace_with_following_section_strip_correctly():
    """來源追蹤段後還有其他段落，strip 不能誤刪後面段"""
    text = '''---
title: 多段測試
---

## 來源追蹤

**原始筆記ID：** 1900000000000000000  

## 引用金句

> 雙方討論合作條件
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "business_confidential"


# === Round 1: 公開公司白名單 ===

def test_tsmc_in_body_is_safe():
    """文章提到台積電（公開上市）→ safe"""
    text = '''---
title: 半導體論述
---

# 內文
台積電一家吃掉台灣 8% 電力，再生能源成長追不上。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_openai_in_body_is_safe():
    """文章提到 OpenAI 公司 → safe（白名單）"""
    text = '''---
title: AI 論述
---

# 內文
OpenAI 公司近期推出新模型，引發業界討論。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe"


def test_truly_sensitive_company_still_caught():
    """文章提到真敏感公司（日本CET）→ business_confidential"""
    text = '''---
title: 商務洽談紀錄
---

# 內文
日本CET 公司提出合作意向，討論授權金額。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "business_confidential"


# === Round 2: 新增驗證 ===

def test_short_acronym_company_no_match():
    """泛詞「AI 公司」「O2O 公司」「IP 公司」（前綴 < 4 字元）→ safe"""
    text = '''---
title: 泛詞測試
---

# 內文
非 AI 公司導入 AI 工具的趨勢明顯，O2O 公司與 IP 公司也加入轉型。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"


def test_loose_business_keyword_removed():
    """論述用「合作夥伴」/「合作對象」（已從 keyword 清單移除）→ safe"""
    text = '''---
title: 抽象論述
---

# 內文
從競爭對手轉向合作夥伴視角，建立互補的合作對象網絡。
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe", f"expected safe but got {suggested} with flags {flags}"
```

### Task 3. dry-run 驗證 5 → 0

```bash
# 跑 dry-run on 280 public sources
python3 <<'PY'
import re, glob, sys
sys.path.insert(0, 'scripts')
import wiki_sensitivity_scan as m

results = {"safe": 0, "contains_pii": [], "business_confidential": [], "personal_reflection": []}
for fp in sorted(glob.glob("src/content/wiki/sources/*.md")):
    text = open(fp).read()
    fm_m = re.search(r'^visibility:\s*(\w+)', text, re.MULTILINE)
    if not fm_m or fm_m.group(1) != "public":
        continue
    suggested, flags = m.scan(text)
    if suggested == "safe":
        results["safe"] += 1
    else:
        results[suggested].append((fp.split("/")[-1], flags))

print(f"=== Public sources dry-run after round 2 ===")
print(f"safe: {results['safe']}")
print(f"contains_pii: {len(results['contains_pii'])}")
print(f"business_confidential: {len(results['business_confidential'])}")
print(f"personal_reflection: {len(results['personal_reflection'])}")
print("")
for level in ["business_confidential", "contains_pii", "personal_reflection"]:
    if not results[level]:
        continue
    print(f"--- {level} ---")
    for fname, flags in results[level]:
        print(f"  {fname}")
        print(f"     {flags}")
PY
```

**預期**：safe 280 / 其他全 0

如果有任何剩餘命中，**不要強行歸 safe**，貼進 Issue #157 comment 讓 Cowork 接手再 spot-check。

### Task 4. Issue #157 收束 B 任務

完成後在 Issue #157 留 comment + update body 把 B 任務收束。Body 變動建議：

**中期區塊**：
- 移除：「**Sensitivity 補檔**：對既有 280 筆 public sources 跑 detector 一次性 backfill sensitivity 欄位」這條

**已完成區塊新增**：
- 「**Sensitivity 補檔（B 任務）✅** Cowork 04-26 進 B 第一步發現 detector 設計盲點，分兩輪修補（Round 1 commit `40a9a10`、Round 2 commit `XXXXXX`）。280 public sources 全 safe，無需 backfill。detector 用作 ingest pre-write check。」

---

## 完成後回報

請在 Issue #157 留 comment 報告：

1. **Commit hashes**（預期 4 個 commits — Task 1A/1B/1C 可視情況合併到 1-2 commits + Task 2 tests + Task 4 issue update）
2. **Round 2 dry-run 結果**：280 public sources 各等級命中數
3. **如果 5 → 0 沒達到**：剩餘命中清單（檔名 + flags），貼上來讓 Cowork 接手
4. **Tests 通過數**：`pytest tests/test_wiki_sensitivity_scan.py -v` 應 9 passed
5. **Issue #157 body 更新狀態**：B 任務從 ToDo 移到「已完成」

---

## 拆 commits（建議）

```bash
# Commit 1：detector 三件修補一起
git add scripts/wiki-sensitivity-scan.py
git commit -m "fix(wiki): sensitivity detector round 2 — 三件 FP 修補

- 白名單加 Nature/Springer（學術出版集團）
- BUSINESS_KEYWORDS 移除「合作夥伴/合作對象」（過泛，論述用詞誤判）
- COMPANY_NAME_PATTERNS 第一條加 {3,} 最短長度限制（消除 AI/O2O/IP 公司泛詞）

Cowork spot-check 5 支剩餘 FP 後決議。
詳見 worklogs/cowork--wiki-sensitivity-detector-fix-round2-handoff-2026-04-26.md"

# Commit 2：補寫 tests（上輪未完成的 Task 3）
git add tests/test_wiki_sensitivity_scan.py
git commit -m "test(wiki): sensitivity scanner 白盒測試（9 fixtures）

Round 1 + Round 2 完整覆蓋：
- strip 來源追蹤段
- 真敏感 keyword 仍命中
- 公開公司白名單跳過（台積電/OpenAI/Nature）
- 真敏感具名公司仍命中（日本CET）
- Round 2 新增：泛詞短前綴不命中、論述用詞已移除

補上一輪 handoff Task 3 未交付部分。"

git push
```

---

## 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-sensitivity-scan.py` | 主要改動（白名單 +2 / keywords -4 / regex 加 {3,}）|
| `tests/test_wiki_sensitivity_scan.py` | 新建（9 fixtures）|
| `src/content/wiki/sources/*.md` | **不動** — 不做 backfill |
| Issue #157 | comment + body 更新（Task 4）|

---

## 護欄

- **白名單清單以本 handoff 為準**，不要主動再擴張（上輪 Code 把白名單從 28 → 38，這次只加 Nature/Springer 兩個，不要再加其他）。如果 dry-run 又發現新 FP，貼進 Issue #157 comment 讓 Cowork 評估，**不要 in-place 補**
- **Tests 必須完成**（Task 2），不能再跳過。上輪 Task 3 沒寫，這次補上原 7 + 新增 2 = 9 fixtures
- 不要動 source 檔案的 frontmatter
- 不要做 backfill — B 任務的最終形態是「detector 修完即結束」，不補 frontmatter
- 跨專案影響：`docs/wiki-visibility-rules.md` Sensitivity 段不必改（規則沒變）

---

## 參考

- 上輪 handoff：[`worklogs/cowork--wiki-sensitivity-detector-fix-handoff-2026-04-26.md`](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--wiki-sensitivity-detector-fix-handoff-2026-04-26.md)
- 上輪 commit：`40a9a10`
- B 任務原始描述：上輪 next-session-handoff 第 4 項

---

*產出：Cowork session 2026-04-26 round 1 後 spot-check 5 支 FP*

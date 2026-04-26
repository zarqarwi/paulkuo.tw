# Code Handoff — Sensitivity Detector 設計盲點修補（2026-04-26）

> 建立：2026-04-26
> 來源：Cowork B「Sensitivity 補檔」第一步 dry-run 發現 detector false positive
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（15-25 min）

---

## 上下文

Cowork 進入 B 階段後，先對 280 public sources 跑了一次 detector dry-run。結果命中分布：

| 等級 | Public 命中 |
|------|-----------|
| safe | 262 |
| contains_pii | 7 |
| business_confidential | 11 |
| personal_reflection | 0 |

但**全部 18 支非 safe 命中經 spot-check 後都是 false positive**。如果照原 handoff 直接 backfill 套用，會把 18 支正常 source 誤標為 contains_pii / business_confidential，污染 corpus。

### Spot-check 結果

| FP 類別 | 估算筆數 | 根因 |
|---------|------|------|
| raw_note_id 被 phone regex 命中 | 7 PII + ~4 business（與 keyword 共現）| getnote 文末「## 來源追蹤」段含「**原始筆記ID：** 1905762523509171424」，前 12 位被 `\d{4}[-\s]?\d{3,4}[-\s]?\d{3,4}` 命中 |
| 「商務會議」keyword 誤判 | ~4 支 | 同段落「**來自：** get_筆記 商務會議筆記」字面命中 business_keyword |
| 公司名 regex 抓到泛詞或公開公司 | ~4-5 支 | `[A-Z][A-Za-z0-9]+\s*(公司\|集團...)` 抓到「AI 公司」「O2O 公司」「Synopsys 公司」「台積電」這類泛詞或公開上市公司 |

### 決議：先修 detector，再跑 backfill

修一件事：**加 `strip_source_trace_section()` 處理「## 來源追蹤」段落**。

不做（暫時）：公開公司白名單。原因：strip 完之後 corpus 內 company_name 命中前綴僅剩 5 個（AI/RI/O2O/Synopsys 各 1-2 次），可逐筆 spot-check，不必建白名單機制。如果未來 corpus 變大或仍有 FP，再開獨立 ToDo。

---

## 修改範圍

### 1. `scripts/wiki-sensitivity-scan.py` — 加 `strip_source_trace_section()`

在 `strip_frontmatter` 後串接一個新的 strip 函式：

```python
SOURCE_TRACE_RE = re.compile(r"^##\s*來源追蹤\b.*?(?=\n##\s|\Z)", re.DOTALL | re.MULTILINE)

def strip_source_trace_section(text):
    """Remove '## 來源追蹤' metadata block (only present in getnote-* sources).
    
    This block is mechanically generated during ingest and contains:
      - 原始筆記ID (raw_note_id, 19-digit snowflake) — false-positives phone regex
      - 來自: get_筆記 X筆記 — false-positives '商務會議' business_keyword
      - 可視性: 內部 (X) — neutral
    
    Stripping removes both classes of FP at once.
    """
    return SOURCE_TRACE_RE.sub("", text, count=1)
```

並在 `scan()` 開頭串接：

```python
def scan(text):
    text = strip_frontmatter(text)
    text = strip_source_trace_section(text)  # ← 新增此行
    flags = []
    # ... 原本邏輯不變
```

### 2. `tests/test_wiki_sensitivity_scan.py` — 新增 / 補充測試

如果檔案不存在就新建。fixture 設計：

```python
import pytest
from scripts import wiki_sensitivity_scan as scan_mod  # 視 import path 調整

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

def test_source_trace_alone_no_body_match_is_safe():
    """只有來源追蹤段、內文無敏感 → safe（驗證 strip 邊界）"""
    text = '''---
title: 邊界測試
---

## 來源追蹤

**原始筆記ID：** 1900000000000000000  
**來自：** get_筆記 商務會議筆記  
'''
    suggested, flags = scan_mod.scan(text)
    assert suggested == "safe"

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
    # 「## 引用金句」段含「合作條件」應該還是會被命中
    assert suggested == "business_confidential"
```

### 3. 完成後跑 dry-run + 寫驗收回報

```bash
# 跑 dry-run on 280 public sources（不寫 frontmatter）
python3 <<'PY'
import re, glob
import sys
sys.path.insert(0, 'scripts')
import wiki_sensitivity_scan as m

results = {"safe": [], "contains_pii": [], "business_confidential": [], "personal_reflection": []}
for fp in sorted(glob.glob("src/content/wiki/sources/*.md")):
    text = open(fp).read()
    fm_m = re.search(r'^visibility:\s*(\w+)', text, re.MULTILINE)
    if not fm_m or fm_m.group(1) != "public":
        continue
    suggested, flags = m.scan(text)
    results[suggested].append((fp.split("/")[-1], flags))

print("=== Public sources 命中分布（detector 修補後）===")
for k, v in results.items():
    print(f"  {k}: {len(v)}")

print("\n=== 非 safe 命中清單 ===")
for level in ["business_confidential", "contains_pii", "personal_reflection"]:
    if not results[level]:
        continue
    print(f"\n--- {level} ({len(results[level])} 支) ---")
    for fname, flags in results[level]:
        flag_str = "; ".join([f"{t}:{','.join(str(x) for x in v[:2])}" for t, v in flags])
        print(f"  {fname}")
        print(f"     {flag_str[:200]}")
PY
```

把輸出貼到回報中。

---

## 拆 commits

```bash
# Commit 1：detector 修補
git add scripts/wiki-sensitivity-scan.py
git commit -m "fix(wiki): sensitivity detector strip 來源追蹤 metadata 段落

避免 getnote 文末「## 來源追蹤」段落導致 false positive：
- raw_note_id (19 位雪花 ID) 被 phone regex 命中
- 「來自：商務會議筆記」字串被 business_keyword 命中

Refs: cowork--wiki-sensitivity-detector-fix-handoff-2026-04-26.md"

# Commit 2：tests
git add tests/test_wiki_sensitivity_scan.py
git commit -m "test(wiki): sensitivity scanner 白盒測試（5 fixtures）

涵蓋：來源追蹤段 strip、真敏感 keyword 仍命中、邊界測試"

git push
```

---

## 完成後回報

請在 Issue #157 留 comment 報告：

1. 兩個 commit hash
2. detector 修補後 280 public sources 的命中分布（預期 contains_pii ≈ 0、business_confidential ≈ 4-5）
3. 列出剩餘非 safe 命中清單（檔名 + flags）
4. tests 通過數（預期新增 5 個）

之後 Cowork 接手對剩餘命中做 spot-check，再決定是否進 backfill。

---

## 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-sensitivity-scan.py` | 主要改動（加 1 個 helper + 1 行 call）|
| `tests/test_wiki_sensitivity_scan.py` | 新建（如不存在）或補充 |
| `data/wiki-corpus.json` | 不動 |
| `src/content/wiki/sources/*.md` | **不動** — 不要在這個 handoff 階段 backfill frontmatter |

---

## 護欄

- **這個 handoff 範圍只修 detector**，**不**做 backfill。Backfill 等 Cowork 看修補後 dry-run 結果再決定下一步
- 不要動 source 檔案的 frontmatter
- tests 命名：如果 `tests/` 已有類似 fixture（如 `test_wiki_sensitivity_*.py`），就 append；如沒有就新建
- 確認既有 `pytest` config（`pytest.ini` / `pyproject.toml`）對新測試檔有 collect

---

*產出：Cowork session 2026-04-26 進 B 第一步 dry-run 後*
*依賴 handoff：worklogs/cowork--next-session-handoff-2026-04-26.md 第 4 項*

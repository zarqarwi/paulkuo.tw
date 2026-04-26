# Code Handoff — Sensitivity Detector 設計盲點修補（2026-04-26）

> 建立：2026-04-26
> 來源：Cowork B「Sensitivity 補檔」第一步 dry-run 發現 detector false positive
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low-Medium（25-40 min）

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

### 決議：兩個修補一起做

1. **strip 來源追蹤段**（解決 raw_note_id + 商務會議 metadata 誤判）
2. **加公開公司白名單**（解決公開上市/知名公司被誤判 business_confidential）

兩個修補放同一個 handoff，因為都是 detector 的設計盲點，一次修完省得後續再開。

---

## 修改範圍

### Task 1. `scripts/wiki-sensitivity-scan.py` — 加 `strip_source_trace_section()`

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

### Task 2. `scripts/wiki-sensitivity-scan.py` — 加公開公司白名單

#### 2a. 整理 `COMPANY_NAME_PATTERNS`

現有：

```python
COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]+\s*(公司|集團|集团|企業|企业|科技|生技)",
    r"(新医美学|新醫美學|日本CET|佳龙科技|佳龍科技|台积电|台積電)",
]
```

**問題**：第二條把台積電當「真敏感公司」，但它是台灣最大上市公司，文章內提到不該升 sensitivity。

**修改**：
- 第一條保留（寬鬆 regex 作為警示網）
- 第二條移除「台积电」「台積電」（公開上市，移到白名單）

```python
COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]+\s*(公司|集團|集团|企業|企业|科技|生技)",
    r"(新医美学|新醫美學|日本CET|佳龙科技|佳龍科技)",
    # 已移除 台积电/台積電 → 移至 PUBLIC_COMPANY_WHITELIST
]
```

#### 2b. 加 `PUBLIC_COMPANY_WHITELIST`

```python
# 公開上市/廣為人知的科技與知名企業 — 文章內提到不視為敏感
# 這份清單應該收錄「在公開論述中被廣泛討論的公司」，
# 而非「Paul 業務上接觸的具名公司」（後者應放 COMPANY_NAME_PATTERNS）
PUBLIC_COMPANY_WHITELIST = {
    # 國際科技巨頭
    "OpenAI", "Anthropic", "Google", "Apple", "Microsoft", "Meta",
    "Amazon", "Tesla", "Nvidia", "AMD", "Intel", "IBM", "Oracle",
    "Salesforce", "Adobe", "Netflix", "Twitter", "Spotify",
    # 中國科技巨頭
    "Tencent", "Alibaba", "Baidu", "ByteDance", "Huawei", "Xiaomi",
    # 半導體 / EDA
    "Synopsys", "Cadence", "Qualcomm", "ARM", "TSMC",
    # 台灣公開上市公司
    "台積電", "台积电", "聯發科", "联发科", "鴻海", "鸿海", "緯創", "纬创",
    "廣達", "广达", "華碩", "华硕", "宏碁", "宏达电", "宏達電",
    # 其他常見公開公司
    "Disney", "Nike", "Coca", "Pepsi",
    # 泛詞前綴（regex 第一條會抓到，但這些都是泛指不該觸發）
    "AI", "RI", "O2O", "B2B", "B2C", "C2C", "SaaS", "API", "ERP", "CRM",
}
```

#### 2c. 在 `scan()` 邏輯內加白名單跳過

修改 `scan()` 中 company_name 命中後的處理：

```python
def scan(text):
    text = strip_frontmatter(text)
    text = strip_source_trace_section(text)
    flags = []

    for pat in COMPANY_NAME_PATTERNS:
        matches = re.findall(pat, text)
        if not matches:
            continue
        # 過濾白名單：拿原始 match string 抽英文/中文 prefix 比對
        # 寬鬆 regex 的 match group 是 ('公司',) 這種，要從原始位置抓 prefix
        full_matches = re.finditer(pat, text)
        actual_hits = []
        for m in full_matches:
            full_str = m.group(0).strip()
            # 抓出公司名前綴（去除「公司」「集團」等後綴）
            prefix_m = re.match(r"^([A-Z][A-Za-z0-9]+|新醫美學|新医美学|日本CET|佳龍科技|佳龙科技)", full_str)
            if prefix_m and prefix_m.group(1) in PUBLIC_COMPANY_WHITELIST:
                continue  # 白名單跳過
            actual_hits.append(full_str)
        if actual_hits:
            flags.append(("company_name", actual_hits[:3]))

    # ... PII / business_keyword / personal_reflection 邏輯不變
```

**注意**：實作細節 Code 自行調整。重點是「命中後過濾白名單」，而不是改 regex 本身（保持 regex 簡單）。

### Task 3. `tests/test_wiki_sensitivity_scan.py` — 新增 / 補充測試

如果檔案不存在就新建。fixture 設計（7 個）：

```python
import pytest
from scripts import wiki_sensitivity_scan as scan_mod  # 視 import path 調整

# === Task 1 strip 來源追蹤段 ===

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

# === Task 2 公開公司白名單 ===

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
```

### Task 4. 完成後跑 dry-run + 寫驗收回報

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
# Commit 1：strip 來源追蹤段
git add scripts/wiki-sensitivity-scan.py
git commit -m "fix(wiki): sensitivity detector strip 來源追蹤 metadata 段落

避免 getnote 文末「## 來源追蹤」段落導致 false positive：
- raw_note_id (19 位雪花 ID) 被 phone regex 命中
- 「來自：商務會議筆記」字串被 business_keyword 命中

Refs: cowork--wiki-sensitivity-detector-fix-handoff-2026-04-26.md"

# Commit 2：公開公司白名單
git add scripts/wiki-sensitivity-scan.py
git commit -m "fix(wiki): sensitivity detector 加 PUBLIC_COMPANY_WHITELIST

避免公開上市/知名公司被 company_name regex 誤判：
- 移除 COMPANY_NAME_PATTERNS 中的台積電/台积电（移到白名單）
- 新增 PUBLIC_COMPANY_WHITELIST（OpenAI、Google、Apple、台積電等）
- scan() 邏輯加白名單跳過

寬鬆 regex 保留作警示網，白名單在命中後過濾。"

# Commit 3：tests
git add tests/test_wiki_sensitivity_scan.py
git commit -m "test(wiki): sensitivity scanner 白盒測試（7 fixtures）

涵蓋：
- 來源追蹤段 strip
- 真敏感 keyword 仍命中
- 公開公司白名單跳過（台積電、OpenAI）
- 真敏感具名公司仍命中（日本CET）
- 邊界測試（多段落 strip）"

git push
```

---

## 完成後回報

請在 Issue #157 留 comment 報告：

1. 三個 commit hash
2. detector 修補後 280 public sources 的命中分布（預期 contains_pii ≈ 0、business_confidential ≈ 0-2）
3. 列出剩餘非 safe 命中清單（檔名 + flags）
4. tests 通過數（預期新增 7 個）

之後 Cowork 接手對剩餘命中做 spot-check，再決定是否進 backfill。

---

## 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-sensitivity-scan.py` | 主要改動（加 1 個 helper + 1 個 whitelist + 修改 scan 邏輯）|
| `tests/test_wiki_sensitivity_scan.py` | 新建（如不存在）或補充 |
| `data/wiki-corpus.json` | 不動 |
| `src/content/wiki/sources/*.md` | **不動** — 不要在這個 handoff 階段 backfill frontmatter |
| `docs/wiki-visibility-rules.md` | 可選：在 Sensitivity 段落補一句「公開公司白名單在 scripts/wiki-sensitivity-scan.py」 |

---

## 護欄

- **這個 handoff 範圍只修 detector**，**不**做 backfill。Backfill 等 Cowork 看修補後 dry-run 結果再決定下一步
- 不要動 source 檔案的 frontmatter
- 白名單用 set 結構，比對 case-sensitive（公開公司常用名都有固定寫法）
- 寬鬆 regex 第一條保留（不要為了減少 FP 而刪掉，它是警示網）
- tests 命名：如果 `tests/` 已有類似 fixture（如 `test_wiki_sensitivity_*.py`），就 append；如沒有就新建
- 確認既有 `pytest` config（`pytest.ini` / `pyproject.toml`）對新測試檔有 collect

---

*產出：Cowork session 2026-04-26 進 B 第一步 dry-run 後*
*依賴 handoff：worklogs/cowork--next-session-handoff-2026-04-26.md 第 4 項*

# Code Handoff — Wiki Dialogue Marker Phase 1（Heuristic Detector）

> 從 Cowork 2026-04-26 v3 session 接手。
> 承接 prep doc：`design--wiki-dialogue-marker-prep-2026-04-26.md`（commit `2e358b7c`）。
> Paul 已拍板 4 個 Q：A only / `dialogue` 命名 / 先 dry-run 不 backfill / 整合 wiki-enrich.cjs（後續 Phase 2 才做）。

---

## 1. 上下文

### 為什麼做
Phase 2 Rule（`data/wiki-quarantine-rules.yml` v2 第一條）：
> 錄音 + 商務會議 + **兩人以上討論（is_dialogue）** → visibility=internal + outcome=delete

`is_dialogue` 還沒 enable，命中前兩條 fallback 標 `needs_human_review`。

要解：**自動產生 `dialogue: true/false` 寫進 source frontmatter，啟用 quarantine rule 第三條 condition。**

### 為什麼這個 Phase 不含 LLM
Prep doc 列了 4 個方案。Paul 拍板 **A only（純 heuristic）試水**：
- 純 regex + title keyword，成本低、可控
- 不跑 Haiku（避免每筆 ~$0.001 × 300 + 未來新 ingest 成本）
- 跑完 dry-run 看命中分布，**1 週後**再決定是否加 Phase 2（LLM）

### Goal
1. Schema 加 3 個欄位
2. 寫一個 Python heuristic detector（純 regex + title keyword）
3. 跑 dry-run 在現有 ~300 sources 上，**只印分布、不寫 frontmatter**
4. 寫 fixture tests

---

## 2. 修改範圍

### Task 2.1 — Schema（`src/content.config.ts`）

在 `wikiSchema` 內加 3 個 optional 欄位（放在 `enrichment_notes` 後 / `paul_perspective` 前）：

```typescript
dialogue: z.boolean().optional().default(false),
dialogue_inference: z.enum(['heuristic', 'llm', 'manual', 'none']).optional().default('none'),
speakers: z.array(z.string()).optional(),
```

⚠️ 用 optional + default，避免既有 ~300 sources 都要先補欄位才 build pass。

### Task 2.2 — 寫 detector：`scripts/wiki-dialogue-detect.py`

Python（跟 `wiki-consistency-check.py` / `build_wiki_ingest_report.py` 同 family）。

#### 用法
```bash
python3 scripts/wiki-dialogue-detect.py --dry-run    # 掃全部 sources，印分布，不寫
python3 scripts/wiki-dialogue-detect.py --apply      # 寫進 frontmatter（本 handoff 不啟用，留 Phase 2 用）
python3 scripts/wiki-dialogue-detect.py <slug>       # 單一檔案 spot check（debug 用）
```

#### 偵測邏輯

```python
import re
from pathlib import Path
import yaml

# Title keyword（命中即 dialogue=true，最高 precision）
TITLE_KEYWORDS = ['對談', '訪談', '會議記錄', '討論會', '對話', '座談']

# Speaker label patterns（行首匹配）
SPEAKER_PATTERNS = [
    r'^[A-Z]：',              # 「A：」「B：」
    r'^[Qq]：',               # 「Q：」
    r'^Speaker\s*\d+[：:]',   # 「Speaker 1：」
    r'^主持人[：:]',
    r'^來賓[：:]',
    r'^老師[：:]',
    r'^學生[：:]',
    r'^記者[：:]',
    r'^回答者[：:]',
    r'^提問者[：:]',
]

# 命中閾值
MIN_UNIQUE_SPEAKERS = 2  # 至少 2 個不同 speaker label
MIN_TOTAL_MARKERS = 4    # 或至少 4 個 marker（避免單一 speaker 重複出現）


def detect_dialogue(frontmatter: dict, body: str) -> dict:
    """
    Return: {
        'dialogue': bool,
        'dialogue_inference': 'heuristic' | 'none',
        'speakers': [str] (optional, only when can be inferred),
        'reason': str (debug)
    }
    """
    # Layer 1: Title keyword
    title = frontmatter.get('title', '')
    for kw in TITLE_KEYWORDS:
        if kw in title:
            return {
                'dialogue': True,
                'dialogue_inference': 'heuristic',
                'reason': f'title contains "{kw}"',
            }

    # Layer 2: Speaker markers in body
    speaker_set = set()
    total_markers = 0
    for line in body.split('\n'):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        for pattern in SPEAKER_PATTERNS:
            m = re.match(pattern, line_stripped)
            if m:
                total_markers += 1
                # Extract speaker label（: 之前的部分）
                label = re.split(r'[：:]', line_stripped, 1)[0]
                speaker_set.add(label)
                break

    if len(speaker_set) >= MIN_UNIQUE_SPEAKERS:
        return {
            'dialogue': True,
            'dialogue_inference': 'heuristic',
            'speakers': sorted(speaker_set),
            'reason': f'{len(speaker_set)} unique speakers, {total_markers} markers',
        }

    if total_markers >= MIN_TOTAL_MARKERS and len(speaker_set) >= 1:
        # 4+ markers but only 1 unique speaker — 可能是訪談一邊主導
        return {
            'dialogue': True,
            'dialogue_inference': 'heuristic',
            'speakers': sorted(speaker_set),
            'reason': f'{total_markers} markers (single speaker dominant)',
        }

    return {
        'dialogue': False,
        'dialogue_inference': 'none',
        'reason': f'{total_markers} markers, {len(speaker_set)} unique speakers',
    }
```

#### Dry-run output 格式

```
=== Wiki Dialogue Marker Detector — DRY-RUN ===

Scanning src/content/wiki/sources/ ... 298 files

Distribution:
  dialogue=true:   N (X.X%)
    └ by reason:
        - title contains "對談": A
        - title contains "訪談": B
        - 2+ unique speakers: C
        - 4+ markers (single dominant): D
  dialogue=false:  M (X.X%)

Top 10 dialogue=true samples:
  - <slug> (reason: ...)
  - ...

Top 5 false positives candidates (manual review):
  - <slug> (reason: ..., body excerpt: "...")

Cross-check with quarantine rules.yml:
  - 命中 has_recording_tag + business_meeting + dialogue=true: K 支
  - 這 K 支會在 is_dialogue enable 後自動 outcome=delete

(use --apply to write frontmatter)
```

### Task 2.3 — Tests：`tests/test_wiki_dialogue_detect.py`

pytest fixture，至少 4 個 case：

```python
import pytest
from scripts.wiki_dialogue_detect import detect_dialogue


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
    body = "純文字流..."
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is True
    assert result['dialogue_inference'] == 'heuristic'
    assert '對談' in result['reason']


def test_speaker_markers():
    """Multiple unique speaker labels in body"""
    fm = {'title': 'AI 訪談'}  # 注意 title 也命中，但讓 body 也測一下
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
    （後面全是該主持人獨白）
    """
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is False  # 1 個 marker 不夠


def test_4_markers_single_speaker():
    """4 markers but single speaker — match (interview-style dominant)"""
    fm = {'title': '某 podcast'}
    body = """
    主持人：歡迎收看。
    [監督人主持的內容]
    主持人：接下來我們聊 X。
    [更多內容]
    主持人：我來補充一個觀點。
    [內容]
    主持人：最後總結。
    """
    result = detect_dialogue(fm, body)
    assert result['dialogue'] is True
    assert '4 markers' in result['reason'] or 'dominant' in result['reason']
```

---

## 3. Dry-run 驗收腳本

```bash
# 1. Schema 通過 astro check
npm run astro check 2>&1 | grep -i "dialogue\|error" | head -20
# 預期：無 schema error（既有 sources 因 default 值不需更新）

# 2. Detector tests
python3 -m pytest tests/test_wiki_dialogue_detect.py -v
# 預期：5 個 test 全 pass

# 3. Dry-run 全 corpus
python3 scripts/wiki-dialogue-detect.py --dry-run > /tmp/dialogue-dryrun.log 2>&1
echo "--- 命中分布 ---"
grep -A20 "Distribution:" /tmp/dialogue-dryrun.log
echo "--- Top samples ---"
grep -A12 "Top 10" /tmp/dialogue-dryrun.log

# 4. Spot check 已知 monologue（YouTube 評論影片）
python3 scripts/wiki-dialogue-detect.py youtube-fuz8Y40Ormg-403ai
# 預期：dialogue=false（純 Whisper monologue）

# 5. Spot check 已知商務筆記類（getnote）
python3 scripts/wiki-dialogue-detect.py getnote-703240-ai-coding-harness-engineering
# 預期：dialogue=false（Paul 整理的 AI 鏈接筆記，非對話）
```

---

## 4. 拆 commits 建議

```
1. feat(wiki-schema): add dialogue / dialogue_inference / speakers fields
2. feat(wiki-dialogue-detect): heuristic detector with title + speaker markers
3. test(wiki-dialogue-detect): 5 fixture tests
```

每個 commit 獨立可 revert。

---

## 5. ★ 完成後回報

回報以下指標（直接貼回 Cowork session）：

```
1. Commits:
   - <hash1> feat(wiki-schema): add 3 dialogue fields
   - <hash2> feat(wiki-dialogue-detect): heuristic detector
   - <hash3> test(wiki-dialogue-detect): fixtures

2. Schema 驗證：
   - astro check: pass / fail
   - 既有 ~300 sources 是否需手動補欄位：no（default 值生效）

3. Test 結果：
   - 5/5 pass / 失敗清單

4. Dry-run 命中分布：
   - 總 sources: N
   - dialogue=true: M (X.X%)
     - title 命中: A
     - 2+ speakers: B
     - 4+ markers single: C
   - dialogue=false: K

5. Top samples（dialogue=true 的 5-10 個）+ false positive 候選

6. Cross-check：
   - 命中 has_recording_tag + business_meeting + dialogue=true 的 source 數
   - 這群是未來 enable is_dialogue 後 auto-delete 的對象

7. 意外發現（如有）
```

---

## 6. 跨專案影響檢查

| 系統 | 影響 | 動作 |
|------|------|------|
| `src/content.config.ts` | 加 3 欄位（optional + default）| 不影響既有 sources |
| 既有 ~300 source files | 不需動 | 走 default 值 |
| `data/wiki-quarantine-rules.yml` 第一條 | 仍是 placeholder | 等本 handoff 完成 + 後續 Phase 跑 `--apply` 後再 enable mapping（**不在本 scope**）|
| `scripts/wiki-kv-seed.cjs` | 已用 gray-matter，能正確 round-trip | KV reseed 後新欄位會自動帶進 KV |
| 前端 `[slug].astro` | 不 render dialogue 欄位 | 無 user-facing 變化 |

---

## 7. 護欄

- ❌ **不要跑 `--apply`**，本 handoff 只做 `--dry-run`
- ❌ **不要動 `wiki-quarantine-rules.yml`** — rule engine mapping 另案
- ❌ **不要在 detector 加 LLM call** — 那是 Phase 2 範圍
- ❌ **不要修改既有 source frontmatter** — 等命中分布看完 Paul 拍板才寫
- ✅ commit message 用 conventional commits（feat / test）
- ✅ Pattern regex 用 raw string + `re.match`（行首匹配，避免 in-line 誤命中）
- ✅ 中文 colon `：` 跟英文 `:` 都要支援（`[：:]`）
- ✅ `dialogue_inference` enum 用 `heuristic|llm|manual|none`，不用其他字眼（schema 對齊）

---

## 8. 建議模型 / Effort

- **Sonnet 4.6 / Effort Low-Medium**（45-60 分鐘）
- Python regex + pytest，工作量類似 wiki-consistency-check.py
- 不需架構決策（prep doc 已決定）
- 如有意外（命中分布跟預期差很大、regex 行為怪），停下來回報 Cowork

---

## 9. 後續（不在本 handoff scope，僅供脈絡）

完成本 Phase 1 後，Cowork 會：
1. 看 dry-run 命中分布決定是否跑 `--apply`（寫進 frontmatter）
2. 視數據決定是否進 Phase 2（加 LLM 提升 recall）
3. 最後在 `wiki-quarantine-rules.yml` 加 `is_dialogue` mapping 啟用 auto-delete

---

## 啟動 prompt（Code session 開場貼）

```
請先 git pull origin main，然後讀 code--wiki-dialogue-marker-phase1-handoff-2026-04-26.md 後執行。
```

---

*建立：2026-04-26 由 Cowork 寫給下個 Code session。承接 prep doc + Paul 拍板 4 Q + wiki-kv-seed parser 升級（commits 104d8f8 / 4f69394 / 10327c4 / 0d4f67d）。*

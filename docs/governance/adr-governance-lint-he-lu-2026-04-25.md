---
adr_id: adr-governance-lint-he-lu-2026-04-25
title: governance-lint.sh 他律防線
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-chat-factual-query-limit-2026-04-25
  - adr-length-budget-enforcement-2026-04-25
  - adr-worklog-abandoned-dimension-2026-04-25
related_issues: []
ratified_by: Chat-Opus-4.7
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# governance-lint.sh 他律防線

## Context

### 立法動機

paulkuo.tw 治理體系目前的違憲救濟**只有自律**——速記卡 `constitution-v0.2-quick-reference.md` 的「違憲自檢清單」8 項，靠 session 開場 / 結案時主動跑一次。沒有**他律**（commit-time / push-time 的機器檢查）。

這個結構在 N=1 時已經失靈。

### 歷史脈絡：SB 253 build failure 教訓

Formosa ESG 2026 子專案的 SB 253（California SB-253 法規追蹤）模組，某次 commit 時 pillar 枚舉欄位寫錯（應為 `circular` 誤打為 `circlar`），skill frontmatter 格式無問題但語義錯誤。沒有他律檢查，commit 通過，CI 建置階段才炸——build 倒，整個 worker deploy 失敗。

這是純自律失效的最強教訓：
- 自檢清單第 X 項（pillar 白名單）存在，但提交者當下沒跑
- 速記卡條文是「寫完之後走檢查」，機制依賴人的注意力
- 注意力在趕 commit 的壓力下會失守

### 配套的結構盲區

auto-memory `project_guardrail_structural_hole.md` 記載「對話瞬時判斷無書面痕跡」的盲點——Chat / Cowork 在對話中做的瞬時判斷（例：隨口說「這個 skill 的 pillar 應該是 circular」），不會留下 commit-time 可檢查的檔案痕跡。純自律只能抓「書面規範違反」，抓不到「對話中的結構性錯誤被具體化成 commit」。

N=1 時這個盲點已成既成事實（SB 253 事件）。繼續等 N=2、N=3 才加他律，成本比早做高得多。

### 為什麼需要跟 H2 錯開

有個誘惑是把「所有治理規則的他律」都丟進本 ADR 一次解決，但這會跟 H2 ADR 重工：

- H2 ADR：管 **prompt-time**（Chat 對話中的行為）——例：Chat 被問行數該不該答
- 本 ADR：管 **commit-time**（檔案進 git 時的結構）——例：commit 的 skill frontmatter 有沒有 pillar 白名單違反

兩者屬不同階段，檢查工具鏈也不同（H2 靠 Chat 自律 + Paul 糾錯回饋 / 本 ADR 靠 bash 腳本 + git hook）。本 ADR 明文劃清邊界，避免未來某輪實作時有人把 H2 的 Chat 行為規則塞進 governance-lint.sh。

### 上位法依據

- **憲法 v0.2 第一條 SSoT**：repo git HEAD 是唯一事實來源。本 ADR 的 lint 檢查確保「進 git HEAD 的檔案符合治理規範」，是第一條的 commit-time 實施細則。
- **憲法 v0.2 第三條 權責分工**：核查義務剛性——Cowork / Code 產出進 git 前，有機器檢查作他律，不依賴任一視窗自述「我檢查過了」。
- **auto-memory `feedback_passive_vs_active_defense.md`**：被動文件不等於主動防線——治理規範寫在 speed reference 但沒人執行等於沒寫。本 ADR 把「主動防線」從口號變成 hook 腳本。

---

## Decision

### 第一條 · 檢查 5 項（明確範圍）

本 ADR 規定 `scripts/governance-lint.sh` 必須實作以下 **5 項**檢查。每項附可執行規則：

#### 1. Handoff ADR 欄位完整性

**範圍**：`handoffs/*.md` 新增或修改的檔案
**規則**：檔案 frontmatter 必須包含 `status` 欄位（值 ∈ `Draft | Accepted | Superseded | Deprecated`），文末必須有 `## Consequences` 章節
**判斷邏輯**：

```bash
# 第一步：檢查 frontmatter status
head -20 "$file" | grep -qE '^status:\s*(Draft|Accepted|Superseded|Deprecated)\s*$'

# 第二步：檢查文末 Consequences 章節
grep -qE '^## Consequences\s*$' "$file"
```

**失敗動作**：Strict 擋 commit（見第二條）
**來源依據**：WE §3「Handoff ADR 欄位升級」rev2 已規範

#### 2. F-ID 格式

**範圍**：所有 `docs/governance/**`、`worklogs/**`、`handoffs/**` 的 F-ID 引用
**規則**：F-ID 必須符合 `F-{kebab-name}-{YYYY-MM-DD}` 格式
**正規表達式**：

```regex
F-[a-z0-9][a-z0-9-]*-\d{4}-\d{2}-\d{2}
```

**判斷邏輯**：

```bash
# 掃描新 commit 中所有 F-{...} token，逐一驗格式
git diff --cached --unified=0 | grep -oE 'F-[A-Za-z0-9-]+' | while read fid; do
  if ! echo "$fid" | grep -qE '^F-[a-z0-9][a-z0-9-]*-[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
    echo "❌ 不合規 F-ID: $fid"
    exit 1
  fi
done
```

**失敗動作**：Warning 允許（見第二條）——F-ID 格式錯不像 pillar 錯會直接炸 build，但會影響未來搜尋
**來源依據**：WE §2.2「清單格式」規範

#### 3. skill pillar 白名單

**範圍**：`.claude/skills/**/SKILL.md` 的 frontmatter
**規則**：若 frontmatter 含 `pillar` 欄位，值必須 ∈ 白名單：`{ai, circular, faith, startup, life, governance}`
**判斷邏輯**：

```bash
# 用 python + yaml 讀取 frontmatter，檢查 pillar 欄位
python3 -c "
import sys, yaml
with open('$file') as f:
    content = f.read()
if not content.startswith('---'):
    sys.exit(0)  # 無 frontmatter，跳過（由現有 skill-schema-lint.sh 處理）
fm_end = content[3:].find('\n---')
fm = yaml.safe_load(content[3:3+fm_end])
pillar = fm.get('pillar')
if pillar and pillar not in ['ai', 'circular', 'faith', 'startup', 'life', 'governance']:
    print(f'❌ pillar 不在白名單: {pillar}')
    sys.exit(1)
"
```

**失敗動作**：Strict 擋 commit
**來源依據**：實務運作中 pillar 白名單 = `{ai, circular, faith, startup, life}` + 本治理脈絡下的 `governance`（本 ADR 與其他 governance 系列 ADR 都用 `pillar: governance`）。注意：**現有的 `scripts/skill-schema-lint.sh` 不包含 pillar 白名單檢查**（只驗 name / description / kebab-case / 長度）。本 ADR 要求 governance-lint.sh **擴充此能力**，而非複用現有 lint 腳本。

#### 4. PENDING.md 五符號系統

**範圍**：`worklogs/PENDING.md`
**規則**：每項 bullet 的 checkbox 必須使用五符號之一：`[ ] [~] [>] [x] [-]`
**正規表達式**：

```regex
^- \[([ ~>x-])\]
```

**判斷邏輯**：

```bash
# 掃描 PENDING.md 的 bullet 開頭，驗 checkbox 符號
grep -nE '^-\s+\[' worklogs/PENDING.md | while IFS= read -r line; do
  if ! echo "$line" | grep -qE '^[^:]+:-\s+\[[ ~>x-]\]'; then
    echo "❌ PENDING.md 使用非五符號 checkbox: $line"
    exit 1
  fi
done
```

**失敗動作**：Strict 擋 commit
**來源依據**：PENDING.md 2026-04-24 五符號 schema 立憲（auto-memory `reference_five_symbol_schema.md`）

#### 5. length-budget-status.md 時效檢查

**範圍**：`docs/governance/length-budget-status.md`
**規則**：檔案 `last-updated` 欄位距今不得超過 7 天
**判斷邏輯**：

```bash
# 讀取 last-updated 時間戳，比對當前時間
last=$(grep -oE 'Last-updated:\s*\d{4}-\d{2}-\d{2}' docs/governance/length-budget-status.md | head -1 | awk '{print $2}')
if [ -z "$last" ]; then
  echo "❌ length-budget-status.md 缺 Last-updated 欄位"
  exit 1
fi
diff_days=$(( ($(date +%s) - $(date -j -f '%Y-%m-%d' "$last" +%s)) / 86400 ))
if [ "$diff_days" -gt 7 ]; then
  echo "⚠️  length-budget-status.md 過期 $diff_days 天（上限 7 天）"
  exit 2  # Warning 級
fi
```

**失敗動作**：Warning 允許
**實作前提**：**此項檢查實作前提是 H5 ADR 的 `length-budget-status.md` 已存在**。H5 ADR 第三條規定建立此追蹤檔，本 ADR 第五條 Phase 3 才實作對應 lint（順序：H5 落地 → `length-budget-status.md` 初版 commit → H7 Phase 3 實作 lint）。
**來源依據**：H5 ADR 第三條時效規則

### 第二條 · 攔截策略（兩級制）

5 項檢查依**結構性錯誤** vs **時效性問題**分為兩級：

| 級別 | 檢查項 | 失敗行為 | 理由 |
|---|---|---|---|
| **Strict（擋 commit）** | 1. Handoff 欄位完整性<br>3. skill pillar 白名單<br>4. PENDING.md 五符號 | pre-commit 返回 non-zero exit code，`git commit` 失敗 | 結構性錯誤會讓下游工具/session 直接誤判（例：pillar 錯直接讓 CI 倒；五符號違反讓五符號 schema 失效） |
| **Warning（允許但警告）** | 2. F-ID 格式<br>5. length-budget-status.md 時效 | pre-commit 輸出警告訊息但返回 0，commit 通過 | 時效性問題不會立刻造成 build failure，但需累積提醒；F-ID 格式錯只影響搜尋便利性 |

**Strict 等級可由 `--no-verify` 跳過**（見第四條），但會留紀錄。

### 第三條 · 掛載點

| 位置 | 是否啟用 | 理由 |
|---|---|---|
| **pre-commit hook**（本機 .git/hooks/pre-commit） | ✅ **主要** | 最早攔截點，Strict 失敗直接擋 commit，Paul 不用等 push 才知道 |
| **CI（GitHub Actions）** | ✅ **次要** | 防止 `--no-verify` 繞過後推上 GitHub；若 CI 檢查失敗，PR 無法 merge |
| **commit-msg hook** | ❌ **不掛** | 現有 `commit-msg` hook（`scripts/commit-msg-hook.sh`）負責「跨子專案影響標注偵測」，不摻雜 governance lint，避免職責混淆 |
| **post-commit / post-merge** | ❌ **不掛** | commit 已完成再提醒無法阻止錯誤進 git，只會製造混亂 |

**安裝流程**：

1. `scripts/governance-lint.sh`：核心 lint 腳本（主要邏輯）
2. `scripts/governance-lint-pre-commit.sh`：pre-commit wrapper（調用主腳本 + 處理 staged files 過濾）
3. 擴充現有 `scripts/install-hooks.sh`：增加一行 `cp "$REPO_ROOT/scripts/governance-lint-pre-commit.sh" "$HOOKS_DIR/pre-commit"` + chmod +x
4. CI 側：`.github/workflows/governance-lint.yml`（若未存在）調用 `scripts/governance-lint.sh --ci-mode`

### 第四條 · 跳過機制

Paul 可以用 `git commit --no-verify` 跳過 pre-commit hook（pre-commit hook 本身無法繞過此選項，這是 git 內建行為）。為了留審計軌跡，**跳過時必須**：

1. **commit message 強制標**：`[skip-lint-recovery]` 後綴（例：`fix(x): typo [skip-lint-recovery]`）
2. **worklog 寫明跳過原因 + 補救**：在當日 worklog 的 `pitfalls` 維度（H8 ADR 通過後改為四維度的 `pitfalls`）寫：
   - 為什麼跳過 lint
   - 跳過後預計何時補救（例：下次 commit 一併修正 F-ID 格式）
3. **CI 強制**：若 commit message 未標 `[skip-lint-recovery]`，CI 的 governance-lint 會再攔截一次，強制 Paul 回頭補 flag 或修問題

**為什麼留跳過機制**：實戰會有「當下沒時間修 + 緊急修 bug」的情境，硬擋反而讓 Paul 用更糟的變通（例：偽造 F-ID 或改 checkbox 繞過）。留彈性閘門 + 強制留痕，比零彈性堵塞風險低。

### 第五條 · 實作 Phase 規劃

不一次實作全部 5 項，分 Phase 漸進落地：

#### Phase 0（本 ADR 立法後）

- 本 ADR commit 到 `docs/governance/`
- 無 lint 腳本產出；下個 Code session 負責起草 Phase 1 腳本

#### Phase 1（P0 Strict 基礎）

**範圍**：檢查 1（Handoff 欄位完整性）+ 檢查 3（skill pillar 白名單）
**交付**：
- `scripts/governance-lint.sh` 初版（含檢查 1 + 3）
- `scripts/governance-lint-pre-commit.sh` wrapper
- 更新 `scripts/install-hooks.sh`
**驗證**：
- 本機跑 `bash scripts/governance-lint.sh` 對現有 repo 應 0 fail（若有 fail 代表現存檔案有違規，需先修復）
- 跑 `bash scripts/install-hooks.sh` 後，故意 commit 一個缺 `status` 欄位的 handoff 測試 Strict 擋 commit
**期限**：H7 ADR 通過後 2 週內

#### Phase 2（P1 結構 + 時效擴充）

**範圍**：檢查 2（F-ID 格式 Warning）+ 檢查 4（PENDING.md 五符號 Strict）+ **worklog 四維度檢查**（H8 新增）
**交付**：
- `scripts/governance-lint.sh` 增補上述三項
- 跟 H8 ADR 第五條「Warning 級，不擋 commit」綁定：worklog 若缺 `abandoned` 維度，Warning 而非 Strict
**前提**：H8 ADR 通過（四維度正式立法）
**期限**：H8 ADR 通過後 2 週內

#### Phase 3（P2 時效 + length-budget）

**範圍**：檢查 5（length-budget-status.md 時效 Warning）
**交付**：
- `scripts/governance-lint.sh` 增補第 5 項
**前提**：H5 ADR 執行層完成（`docs/governance/length-budget-status.md` 已存在且初版 commit）
**期限**：`length-budget-status.md` 初版 commit 後 1 週內

#### Phase 4+（未規劃）

未規劃但預留空間的擴充方向：

- **c-layer-snapshot 時效檢查**：H1 ADR 的 cloud 層同步協議可擴充對應 lint
- **auto-memory index 一致性**：`.auto-memory/MEMORY.md` 索引與檔案實際存在性比對
- **憲法 / WE / 速記卡 交叉引用檢查**：ADR 引用的 `§N` 章節編號實際存在性

**Phase 4+ 要新增任何檢查前，必須開新 ADR（不能擴充本 ADR 覆蓋）**——避免規則蔓延到本 ADR 範圍不明。

### 第六條 · 與 H2 邊界明文

本 ADR（H7）與 H2 ADR（`adr-chat-factual-query-limit-2026-04-25.md`）的檢查範圍**嚴格互斥**，不重疊：

| 向度 | H2 ADR | 本 ADR（H7） |
|---|---|---|
| **作用階段** | prompt-time（對話中） | commit-time（檔案進 git 時） |
| **執行者** | Chat session（自律） | `git hooks` + CI（他律） |
| **違反代價** | Chat 給出錯誤裁決（可事後修） | 錯誤結構進 git / build failure（可能難回頭） |
| **檢查對象** | Chat 當下的回答內容 | 檔案的 frontmatter / 格式 / 欄位 |
| **典型案例** | 「SKILL.md 幾行？」→ Chat 拒答 | 「skill frontmatter pillar = circlar」→ commit 被擋 |
| **機器可檢查** | ❌（需語義理解） | ✅（規則化 bash 可實作） |

**邊界原則**：

1. 若規則需要**語義理解**才能判定違反 → 放 H2，靠 Chat 自律；**不**放 H7，bash 做不到
2. 若規則能用**正規表達式 / 結構化 parse** 判定 → 放 H7，lint 腳本化；H2 不處理
3. 若規則涉及**prompt-time 的行為**（Chat / Cowork 對話中）→ 放 H2；H7 不管
4. 若規則涉及**commit-time 的檔案狀態** → 放 H7；H2 不管

**明確排除項目（Chat 曾提議但 Reject 的項目）**：

- ❌ **源頭事實跨載體一致性**：例如「worklog 寫『SKILL.md 639 行』但同日 F-ID 表寫 641」——**不**納入 H7
  - **Reject 理由**：需要語義理解「639 vs 641 是同一事實」+ 需要跨多檔 parse；bash 技術上做不到，硬實作會產大量 false positive（兩個數字可能根本是不同檔案 / 不同時點）
  - 這類一致性檢查若未來真要做，需走 MCP memory / Mem0 等語義記憶層（憲法第五條流程），不走 H7

### 第七條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條：

1. 連續 3 次 false positive（lint 把合法 commit 誤擋），代表規則設計過嚴
2. 連續 2 次 false negative（有違規但 lint 沒抓到），代表規則覆蓋不足
3. `--no-verify` 在 2 週內使用 > 3 次，代表攔截設計不合實務節奏
4. 新增 Phase 4+ 檢查需求時，重啟 ADR 以確認不破壞既有邊界

---

## Consequences

### 正面影響

- **SB 253 類教訓不再重複**：pillar 白名單 lint 把 N=1 事件的原因（純自律失效）從結構上鎖死。
- **Handoff ADR 欄位規範能執行**：WE §3 「Status / Consequences 必填」從規範層落實到 git hook 層，不再靠 reviewer 自己看。
- **PENDING.md 五符號系統穩定**：新符號混進來的風險被 Strict 攔截，五符號 schema 能長期維持一致。
- **治理規則從「希望遵守」升級為「必須遵守」**：本 ADR 是「他律結構化」的第一份 ADR，未來如憲法第五條新載體引入時，可參考本 ADR 的 Phase 規劃 + 兩級制 + 跳過機制 + 邊界原則骨架。

### 負面影響

- **首次實作成本高**：Phase 1-3 的 bash 腳本需要仔細測試，跨 macOS / Linux 的 `date` 指令相容性、`python3 yaml` 依賴、`grep -E` vs BSD grep 差異都是坑。H7 落地時 Code 要預留時間。
- **合法的 edge case 可能被誤擋**：例如 handoff 新增時 `status: Proposed`（非白名單值）會被 Strict 擋——這其實是我們想要的攔截（Proposed 應歸到 Draft），但若有未預期的 status 值可能產生阻力。緩解：初期 Phase 1 先用 Warning 觀察 2 週，沒 false positive 再升 Strict。
- **Paul 與 Cowork 的快速編修流會被打斷**：Cowork 在 `docs/governance/` 直接 commit 的情境，若檔案結構不完全，會被 lint 擋；實務上可能讓 Cowork 得多跑一輪修復後再 commit。

### 中性觀察

- **`skill-schema-lint.sh` 現行只驗 name/description/kebab-case/長度**，不驗 pillar 白名單。本 ADR 明文 governance-lint.sh **擴充**此能力（第一條第 3 項），不改動現有 `skill-schema-lint.sh`——兩個 lint 腳本分工：`skill-schema-lint.sh` 管 skill 本身格式，`governance-lint.sh` 管治理規範遵守。未來可考慮合併但屬 Phase 4+ 範圍。
- **本 ADR 不解決「規則本身錯了怎麼辦」**：lint 只能檢查「是否符合規則」，不能檢查「規則設計是否合理」。規則合理性屬立法層級（Chat 主責），本 ADR 只落實執行層。
- **CI 等級是次要防線**：主要攔截在 pre-commit。若 Paul 工作流某時完全搬到 CI（例：常態用 GitHub web 編輯），pre-commit 失效，屆時 CI 晉升主要防線——這屬工作流變動，不在本 ADR 範圍。

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2 第三條權責分工：核查義務剛性——本 ADR 是第三條的 commit-time 實施方式。
- `adr-chat-factual-query-limit-2026-04-25.md` §Decision + §Appendix：本 ADR 第六條「與 H2 邊界明文」直接引用 H2 做邊界劃分，沒有 H2 本 ADR 範圍會模糊。
- `adr-length-budget-enforcement-2026-04-25.md` §三 length-budget-status.md + §一觸發線：本 ADR 第一條檢查 5（length-budget 時效）直接承接 H5 第三條的 7 天規則；Phase 3 實作前提是 H5 執行層完成。
- `adr-worklog-abandoned-dimension-2026-04-25.md`（H8）§Decision 四維度：Phase 2 增量檢查項「worklog 四維度」直接承接 H8 的規範；沒有 H8 就沒有第四維度可檢查。

### 被依賴的 ADR（這些 ADR 需要我存在）

- 無（本 ADR 是執行層規範，不被其他立法層 ADR 直接引用）。未來治理規範若需要 commit-time lint，會依賴本 ADR 的 Phase 規劃 + 兩級制框架。

### 相關但不依賴的檔案

- `scripts/skill-schema-lint.sh`：現行 skill frontmatter schema lint（name / description / kebab-case / 長度）。本 ADR 第一條第 3 項**擴充**此能力（加 pillar 白名單），但不改動現有腳本。Phase 1 實作時 `governance-lint.sh` 新建而非修改 `skill-schema-lint.sh`，兩腳本分工共存。
- `scripts/commit-msg-hook.sh`：現行 commit-msg hook（跨子專案影響標注偵測）。本 ADR 第三條明文「不掛 commit-msg」，避免職責混淆。
- `scripts/install-hooks.sh`：現行 git hooks 安裝腳本。本 ADR Phase 1 要求擴充此腳本以安裝 pre-commit。
- `docs/governance/working-environment.md` §2.3 硬編碼規則 + §3 Handoff ADR 欄位：本 ADR 第一條檢查 1 (Handoff 欄位) + 檢查 2 (F-ID 格式) 直接承接 WE 規範。
- `docs/governance/constitution-v0.2-quick-reference.md` 違憲自檢清單：本 ADR 是自檢清單從「自律」升級為「他律」的延伸——自檢清單 **不廢除**，繼續作為 session 內的自我檢查，本 ADR 提供的是 commit-time 第二道防線。
- `auto-memory/project_guardrail_structural_hole.md`：本 ADR Context 的結構盲區依據。
- `auto-memory/feedback_passive_vs_active_defense.md`：本 ADR Context 的「被動文件 vs 主動防線」立論。

---

## Appendix

### 附錄 A · `scripts/governance-lint.sh` skeleton 偽代碼

以下為 Code Phase 1 實作時的起點（非最終腳本，僅結構示意）：

```bash
#!/usr/bin/env bash
# governance-lint.sh — paulkuo.tw governance regulations enforcement
# Spec: docs/governance/adr-governance-lint-he-lu-2026-04-25.md

set -uo pipefail  # 不設 -e：要逐項檢查，單項失敗不中斷後續

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$REPO_ROOT" ]]; then
  echo "❌ 不在 git repo 內"
  exit 1
fi
cd "$REPO_ROOT"

# 解析 mode
MODE="${1:---pre-commit}"  # --pre-commit | --ci-mode | --manual

# 結果計數
STRICT_FAIL=0
WARNING=0

echo "🔍 governance-lint.sh — paulkuo.tw 治理規範檢查"
echo "Mode: $MODE"
echo ""

# ─────────────────────────────
# Check 1: Handoff ADR 欄位完整性（Strict）
# ─────────────────────────────
check_handoff_fields() {
  local files
  if [[ "$MODE" == "--pre-commit" ]]; then
    files=$(git diff --cached --name-only --diff-filter=AM | grep '^handoffs/.*\.md$' || true)
  else
    files=$(find handoffs -name '*.md' -type f 2>/dev/null || true)
  fi
  [[ -z "$files" ]] && return

  for f in $files; do
    # frontmatter status 欄位
    if ! head -20 "$f" | grep -qE '^status:\s*(Draft|Accepted|Superseded|Deprecated)\s*$'; then
      echo "❌ FAIL  $f"
      echo "         → frontmatter 缺 status 欄位（應為 Draft|Accepted|Superseded|Deprecated）"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
    # Consequences 章節
    if ! grep -qE '^## Consequences\s*$' "$f"; then
      echo "❌ FAIL  $f"
      echo "         → 缺 ## Consequences 章節"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
  done
}

# ─────────────────────────────
# Check 2: F-ID 格式（Warning）
# ─────────────────────────────
check_fid_format() {
  local fids
  fids=$(git diff --cached --unified=0 2>/dev/null | grep -oE 'F-[A-Za-z0-9-]+' | sort -u || true)
  [[ -z "$fids" ]] && return

  for fid in $fids; do
    if ! echo "$fid" | grep -qE '^F-[a-z0-9][a-z0-9-]*-[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
      echo "⚠️  WARN  F-ID 格式不合規：$fid"
      echo "         → 應為 F-{kebab-name}-{YYYY-MM-DD}"
      WARNING=$((WARNING + 1))
    fi
  done
}

# ─────────────────────────────
# Check 3: skill pillar 白名單（Strict）
# ─────────────────────────────
check_skill_pillar() {
  local files
  files=$(find .claude/skills -name 'SKILL.md' -type f 2>/dev/null || true)
  [[ -z "$files" ]] && return

  local valid_pillars="ai|circular|faith|startup|life|governance"

  for f in $files; do
    local pillar
    pillar=$(python3 -c "
import yaml, sys
with open('$f') as fp:
    c = fp.read()
if not c.startswith('---'):
    sys.exit(0)
end = c[3:].find('\n---')
if end == -1:
    sys.exit(0)
fm = yaml.safe_load(c[3:3+end])
p = fm.get('pillar') if fm else None
print(p if p else '')
" 2>/dev/null || echo "")

    if [[ -n "$pillar" ]] && ! echo "$pillar" | grep -qE "^(${valid_pillars})$"; then
      echo "❌ FAIL  $f"
      echo "         → pillar '$pillar' 不在白名單（${valid_pillars//|/, }）"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
  done
}

# ─────────────────────────────
# Check 4: PENDING.md 五符號（Strict）
# ─────────────────────────────
check_pending_symbols() {
  local f="worklogs/PENDING.md"
  [[ ! -f "$f" ]] && return

  local bad
  bad=$(grep -nE '^-\s+\[' "$f" | grep -vE '^[0-9]+:-\s+\[[ ~>x-]\]' || true)
  if [[ -n "$bad" ]]; then
    echo "❌ FAIL  PENDING.md 有非五符號 checkbox:"
    echo "$bad" | while read line; do echo "         → $line"; done
    STRICT_FAIL=$((STRICT_FAIL + 1))
  fi
}

# ─────────────────────────────
# Check 5: length-budget-status.md 時效（Warning）
# ─────────────────────────────
check_length_budget_staleness() {
  local f="docs/governance/length-budget-status.md"
  [[ ! -f "$f" ]] && return  # 檔案不存在跳過（H5 執行層尚未完成時）

  local last
  last=$(grep -oE 'Last-updated:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" | head -1 | awk '{print $2}' || echo "")
  if [[ -z "$last" ]]; then
    echo "⚠️  WARN  $f 缺 Last-updated 欄位"
    WARNING=$((WARNING + 1))
    return
  fi

  local now_ts last_ts diff_days
  now_ts=$(date +%s)
  last_ts=$(date -j -f '%Y-%m-%d' "$last" +%s 2>/dev/null || date -d "$last" +%s 2>/dev/null)
  if [[ -z "$last_ts" ]]; then
    echo "⚠️  WARN  $f Last-updated 欄位格式錯誤：$last"
    WARNING=$((WARNING + 1))
    return
  fi
  diff_days=$(( (now_ts - last_ts) / 86400 ))
  if [[ "$diff_days" -gt 7 ]]; then
    echo "⚠️  WARN  $f 過期 $diff_days 天（上限 7 天）"
    WARNING=$((WARNING + 1))
  fi
}

# ─────────────────────────────
# 執行
# ─────────────────────────────
check_handoff_fields
check_fid_format
check_skill_pillar
check_pending_symbols
check_length_budget_staleness

echo ""
echo "──────────────────────────────"
echo "Strict fails: $STRICT_FAIL"
echo "Warnings: $WARNING"
echo ""

if [[ "$STRICT_FAIL" -gt 0 ]]; then
  echo "❌ 有 Strict 級錯誤，commit 被擋"
  echo "   如需強制 commit，使用 git commit --no-verify 並在 message 加 [skip-lint-recovery]"
  exit 1
fi

if [[ "$WARNING" -gt 0 ]]; then
  echo "⚠️  有 Warning 級問題，commit 通過但請後續修復"
fi

exit 0
```

### 附錄 B · 與既有 `commit-msg-hook.sh` 的差異

`scripts/commit-msg-hook.sh` 現行功能：

- 檢查 commit message 是否包含 `[影響: xxx]` 標注（跨子專案影響）
- 依 `docs/shared-files.json` 判定是否需要標注

`scripts/governance-lint.sh`（本 ADR 規範）功能：

- 檢查 staged files 的治理規範遵守（與 commit message 無關）

兩者**完全正交**，掛不同 hook 點（commit-msg vs pre-commit），不應合併。未來 Phase 4+ 若有跨 hook 的檢查需求，需開新 ADR 評估。

### 附錄 C · 跳過機制實戰範例

**情境**：半夜修 production bug，修改 skill SKILL.md 但因為時間壓力沒補 pillar 欄位，想快速 commit。

**錯誤做法**：隨便亂加 `pillar: circular`（pillar 錯的後果是 build failure，比原 bug 嚴重）。

**正確做法**：

```bash
git commit -m "fix(skill): patch critical bug in SKILL.md [skip-lint-recovery]" --no-verify
```

然後當日 worklog `pitfalls` 段（H8 通過後改為 `abandoned` 之外的 `pitfalls` 維度）寫：

```markdown
### pitfalls
- 半夜修 prod bug 跳過 governance-lint（missing pillar），明日第一件事補 pillar 欄位並通過 lint
```

下次 commit 時補 pillar：

```bash
git commit -m "chore(skill): complete pillar field (deferred from [commit-hash])"
```

CI 會檢查本次 commit 的 lint 狀態，若通過則關閉未完補救。

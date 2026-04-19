# ADR: 協作憲法 v0.3 實施方案

**Status**: Accepted
**Date**: 2026-04-20
**Deciders**: Paul（拍板）、Cowork session claude-opus-4-6（草擬）
**Implements**: `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md` §3.3 遷移步驟 #5-#8
**Related**:
- `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`（上位法）
- `docs/governance/working-environment.md`（實施細則 rev2.1）
- `docs/skill-storage-inventory-2026-04-19.md`（四層盤點報告）
- `.claude/skills/session-handoff/SKILL.md`（v5.3，553 行）

---

## 1. Context

v0.2 憲法落地後（commit `a6550f9`），§3.3 遷移步驟 #5-#8 留了四個未決議題。Paul 在 2026-04-20 Cowork session 決定四軌全做。本 ADR 為四軌的統一規劃文件。

### 四軌概覽

| 軌道 | 對應遷移步驟 | 核心問題 | 交付物 |
|------|-------------|---------|--------|
| Track 1 — 雙樹合併 | #6 | A/B 層 session-handoff 如何不再分岔 | 同步機制 + CLAUDE.md 條款 |
| Track 2 — C 層 export | #5 | 4 個 C 層獨點 skill 如何合憲 | export schema + 遷移 checklist |
| Track 3 — worklog 原子化 | #7 | 第四條補款的工具層支點 | commit-msg hook 擴充 spec |
| Track 4 — WE 統整 | #8 | working-environment.md 與憲法的關係定位 | 互引機制 + frontmatter 升級 |

---

## 2. Decisions

### Track 4 — working-environment.md 統整（最優先）

#### 2.4.1 關係定位：上位法 + 實施細則

**Decision**: working-environment.md 維持獨立文件，定位為「憲法的實施細則」（Implementing Regulations）。不合併、不拆分。

**理由**：
- 憲法（299 行）管原則，WE（408 行）管操作規範——合併會超 700 行，接近 800 行拆分觸發點
- WE 的 §2 F-ID/cite 規範、§3 Handoff ADR 欄位、§4 長度管制都是純操作性規則，放在憲法會稀釋原則層的清晰度
- 已有先例：法律體系中「憲法 → 法律 → 施行細則」的三層結構，我們取兩層足夠

#### 2.4.2 互引機制

**A. working-environment.md 加 frontmatter 欄位**：

```yaml
implements: adr-collaboration-constitution-v0.2
constitutional_mapping:
  §1: "第三條（權責分工原則）"
  §2: "第一條（SSoT 原則）實施細則"
  §3: "第三條實施細則（Handoff ADR 欄位）"
  §4: "獨立（長度管制，無直接對應條文）"
```

**B. 憲法 v0.2 加 §3.3 步驟 #8 的結案註記**：
在 §7.2 第 3 項旁加「→ 見 `adr-constitution-v0.3-implementation-2026-04-20.md` Track 4」。

**C. CLAUDE.md 加引用段（已規劃在 v0.2 遷移步驟 #3）**：

```markdown
## 協作憲法

憲法全文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
實施細則：`docs/governance/working-environment.md`
```

#### 2.4.3 去重原則

不主動刪除 WE 中與憲法重疊的內容。原因：
- WE 是 Paul 已拍板 Q-WE-1~Q-WE-9 的成果，改動大需要重新審閱
- 重疊內容在 WE 中帶有操作細節（表格、F-ID、具體指令），不純是原則重述
- 未來如果重疊造成矛盾，依第一條 SSoT 原則——以 git HEAD 的**憲法**為準

---

### Track 1 — session-handoff 雙樹合併

#### 2.1.1 現狀

| 層 | 路徑 | 版本 | 狀態 |
|---|---|---|---|
| A（專案級）| `.claude/skills/session-handoff/SKILL.md` | v5.3 | SSoT（git HEAD） |
| B（使用者級）| `~/.claude/skills/session-handoff/SKILL.md` | v5.3 | 2026-04-19 Code cp 同步（d5b0877） |
| C（Personal Cloud）| Claude.ai Web UI | v4.13 | 下游 mirror，接受非即時 |

A 和 B 在 d5b0877 後完全一致（`diff -r` 無輸出）。問題是**如何防止再次分岔**。

#### 2.1.2 Decision: A 正本 → B 單向同步，寫入 CLAUDE.md 工程慣例

**機制**：

1. **觸發點**：每次 A 層 `SKILL.md` 有 commit 時
2. **動作**：commit 完成後立即執行 `cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/`
3. **責任**：Code session 自行執行（已寫入 CLAUDE.md 工程慣例，v0.2 遷移步驟 #3 配套）
4. **驗證**：`diff -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/` 無輸出

**為什麼不用 symlink**：
- B 層 `~/.claude/skills/` 是 Claude Code CLI 自動掃描的路徑，symlink 指向 repo 內路徑可能在 repo 不在 cwd 時失效
- Paul 可能在非 paulkuo.tw 目錄使用 Claude Code，此時 symlink target 不存在 = skill 失效
- `cp` 是最穩定的方案，代價是手動（但寫進 CLAUDE.md 後 Code session 會自動遵守）

**為什麼不用 git hook**：
- `post-commit` hook 可以自動 cp，但只在 paulkuo.tw repo 的 commit 觸發
- 如果 Paul 在別的 repo 改了 skill（不太可能但理論上可能），hook 不會觸發
- 先走最簡方案（CLAUDE.md 條款），如果 3 次以上忘記同步再升級為 hook

**CLAUDE.md 新增條款草稿**：

```markdown
### Skill 同步（v0.3 新增）

每次 `.claude/skills/` 下任何 SKILL.md 有 commit，立即同步到使用者級：

\```bash
cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/
\```

這是憲法第二條的實施配套——A 層是正本，B 層是下游 mirror。
```

#### 2.1.3 C 層處理

C 層（Claude.ai Personal Cloud v4.13）按憲法第二條「接受非即時」，不納入同步機制。Paul 可在有空時手動更新，或等 Anthropic 開 API 再自動化。

---

### Track 2 — C 層 4 個 skill export schema

#### 2.2.1 盤點（2026-04-20 Cowork 實測）

**A 層（repo `.claude/skills/`）現有 5 個 skill**：
`cross-project-impact`、`formosa-feedback-triage`、`session-handoff`、`wiki-ingest`、`wiki-lint`

**4 個目標 skill 不在 A 層，驗證結果**：

| Skill | 行數 | 所在位置 | A 層狀態 |
|---|---|---|---|
| paulkuo-writing | 593 行 | Cowork 專案層 `.claude/skills/` | ❌ 不存在 |
| paulkuo-social | 276 行 | Cowork 專案層 `.claude/skills/` | ❌ 不存在 |
| formosa-feedback | 263 行 | Cowork 專案層 `.claude/skills/` | ❌ 不存在 |
| organize-downloads | 93 行 | Cowork 專案層 `.claude/skills/` | ❌ 不存在 |

⚠️ **注意**：`paulkuo-writing` 593 行，超過 WE §4.1 三層長度規則的官方軟上限（200 行）176%，但未達內部觸發點（800 行）。

#### 2.2.2 Discovery: Cowork 專案層 vs Claude.ai Personal Cloud

盤點報告稱「C 層」，但實際上這 4 個 skill 住在 **Cowork 專案的 `.claude/skills/`**（Paul 電腦上 Cowork 專案綁定的資料夾）。是否同時也存在於 Claude.ai Personal Cloud 待 Paul 確認，但不影響 export 策略——無論來源是 Cowork 專案層還是 Personal Cloud，都需要複製到 A 層（repo）才合憲。

#### 2.2.3 Decision: 直接複製到 A 層

**方案**：Code 從 Cowork 專案層複製到 repo `.claude/skills/`，一次性 commit。

```bash
# Code 在 paulkuo.tw repo 根目錄執行
for skill in paulkuo-writing paulkuo-social formosa-feedback organize-downloads; do
  mkdir -p .claude/skills/$skill
  cp ~/.claude/skills/$skill/SKILL.md .claude/skills/$skill/SKILL.md 2>/dev/null || \
    echo "⚠️ $skill 不在 ~/.claude/skills/，需要 Paul 手動提供"
done
git add .claude/skills/paulkuo-writing .claude/skills/paulkuo-social .claude/skills/formosa-feedback .claude/skills/organize-downloads
git commit -m "feat(governance): export 4 C-layer skills to A-layer [影響: 僅治理]"
```

⚠️ **路徑注意**：Cowork 專案層的 `.claude/skills/` 在 Paul 電腦上的確切路徑可能不是 `~/.claude/skills/`。Code session 需要先 `ls ~/.claude/skills/` 確認是否有這些 skill，沒有的話 Paul 需要提供 Cowork 專案綁定的資料夾路徑。

**複製後的 A 層狀態**：A 是正本，Cowork 專案層和 Personal Cloud 都是下游 mirror（同 Track 1 邏輯）。

#### 2.2.4 C 層更新 SOP（長期）

Cowork 專案層和 Claude.ai Personal Cloud 的 skill 更新流程：
1. 在 A 層（repo）修改 → commit → push
2. Cowork 專案層：下次 Cowork session 開啟時自動讀取 repo mount 的 `.claude/skills/`（如果 Cowork 專案綁定 paulkuo.tw 資料夾，可能自動同步）
3. Personal Cloud：Paul 手動更新（Anthropic 不開 API，見憲法 §1.2）

不需要每次都同步下游——只在要用 Claude.ai Web UI 或 Cowork 做相關工作前確認即可。

---

### Track 3 — worklog 原子化 commit-msg hook

#### 2.3.1 問題定義

憲法第四條補款：

> 同一記憶層文件內，如有多區塊表達同一事實的不同視角（例：worklog 的「狀態變更」vs「待辦快照」），寫入時必須原子化傳遞，禁止單區塊更新。

具體場景：worklog 的「狀態變更」區塊說某項完成了，但「待辦快照」裡同一項還掛著 `- [ ]`。

#### 2.3.2 Decision: 擴充現有 commit-msg hook

**不另建 hook**。現有 `scripts/commit-msg-hook.sh` 已處理跨子專案影響偵測，worklog 原子化檢查加在同一支 hook 的後半段。

**檢查邏輯（pseudo-code）**：

```bash
# ── worklog 原子化檢查 ──
# 只在 staged files 包含 worklogs/worklog-*.md 時觸發

for each staged worklog file:
  if file has "## 狀態變更" section:
    extract items marked "→ 已完成" or "→ ✅"
    completed_items = set of normalized item names
  
  if file has "## 待辦快照" section:
    extract items still marked "- [ ]"
    pending_items = set of normalized item names
  
  # 核心檢查：已完成的項目不應該還在待辦清單裡
  contradictions = completed_items ∩ pending_items
  
  if contradictions is not empty:
    warn "⚠️ worklog 原子化違反：以下項目在「狀態變更」標完成但「待辦快照」仍掛著"
    for each item in contradictions:
      print "  - {item}"
    print "請同步更新兩個區塊，或確認標記一致"
    exit 1  # 阻擋 commit
```

**實作考量**：

- 項目名稱的「正規化」是難點——worklog 裡的措辭不一定完全一致（「使用者級 skill 同步」vs「~/.claude/skills/ 同步」）
- **v1 先做精確比對**：只抓完全一致的字串矛盾
- **v2 再加模糊比對**：用 python 做 token overlap 檢查
- **不做**：LLM 自檢（違反 working-environment §2.4 的 A5 共識「Mechanical verification > LLM self-check」）

**嚴重度**：warning 阻擋 commit（exit 1），但可以用 `--no-verify` 跳過（跟現有跨專案 hook 一致）。

#### 2.3.3 交付方式

Cowork 出 spec（本 ADR），Code 實作。

**Code handoff 要點**：
- 擴充 `scripts/commit-msg-hook.sh`，在現有跨專案檢查之後加 worklog 原子化檢查
- 用 python3 做 section parsing（macOS 原生有 python3，跟現有 hook 一致）
- 測試案例：準備一份故意矛盾的 worklog，commit 應被阻擋

---

## 3. Consequences

### 3.1 益處

- **Track 4**：憲法和 WE 的關係從「兩份文件不知道誰大」變成「上位法 + 實施細則」，新 session 開場可以只讀憲法（原則），需要操作細節時再看 WE
- **Track 1**：A→B 單向同步寫入 CLAUDE.md 後，Code session 有明確義務，分岔風險降低
- **Track 2**：4 個 C 層 skill 合憲化，消除盤點報告指出的「違憲」狀態
- **Track 3**：worklog 內部矛盾從「人工發現」升級到「機械檢查」，符合 WE §5 的 A5 共識

### 3.2 代價

- **Track 1 的手動成本**：每次 SKILL.md commit 後要多跑一行 cp。如果 3 次以上忘記 → 升級為 post-commit hook
- **Track 2 的一次性人工**：Paul 需要手動比對 C 層和 A 層。約 15-30 分鐘
- **Track 3 的 false positive 風險**：精確比對可能漏抓（措辭不同的矛盾）或誤擋（項目名稱恰好子字串匹配但語義不同）

### 3.3 可逆性

- Track 4：完全可逆（刪 frontmatter 欄位即可）
- Track 1：完全可逆（刪 CLAUDE.md 條款即可）
- Track 2：可逆但有資料風險（如果刪了 A 層副本，C 層變成唯一版本）
- Track 3：完全可逆（hook 裡的 worklog 檢查段可刪除或註解）

### 3.4 驗證收斂條件

兩週內觀察：
1. Track 1 — 下一次 SKILL.md commit 後，Code 是否自動 cp 到 B 層
2. Track 2 — 4 個 skill 的 A 層副本是否存在且與 C 層一致
3. Track 3 — 第一次有 worklog 矛盾的 commit 是否被 hook 擋住
4. Track 4 — 新 session 是否自然引用「憲法 → WE」的層級關係

---

## 4. Migration Steps

| # | 動作 | 責任 | 前置條件 | 預估時間 |
|---|------|------|---------|---------|
| 1 | 本 ADR commit 進 `docs/governance/` | Paul（oneliner） | 無 | 2 min |
| 2 | working-environment.md 加 `implements` frontmatter | Code | Step 1 | 5 min |
| 3 | CLAUDE.md 加「協作憲法」引用段 + 「Skill 同步」條款 | Code | Step 1 | 10 min |
| 4 | 驗證 4 個 skill A 層是否存在 | Code | 無 | 5 min |
| 5 | 若 A 層缺失 → Paul 從 C 層 export | Paul | Step 4 結果 | 15-30 min |
| 6 | 擴充 commit-msg-hook.sh 加 worklog 原子化 | Code | Step 1 | 30-45 min |
| 7 | 測試 hook（故意矛盾 worklog → commit 被擋） | Code | Step 6 | 10 min |
| 8 | 更新 Issue #155 完成日誌 | Cowork | Step 1 | 5 min |

---

## 5. Out of Scope

- 憲法 v0.2 文本本身不動（v0.2 已 Accepted，修改需要走 v0.4 流程）
- C 層 v4.13 的 session-handoff 不主動更新（低優先，接受非即時）
- Plugin marketplace 打包（規模未到，見憲法 §5 Alt-B）
- CLAUDE.md 瘦身（留給下一輪，目前 233 行在預警範圍但未到觸發點）

---

## Revision History

- v0.3-draft (2026-04-20)：Cowork 草擬四軌統一 ADR

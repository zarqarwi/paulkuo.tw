---
status: Accepted
date: 2026-04-20
from: Cowork / Opus 4.6
to: Code / Opus 4.6
superseded_by: null
---

> **建議模型**：Opus 4.6 + Medium
> **Task Size**：M（60-90 min，6 步 + 驗證）

# Handoff: v0.3 協作憲法實施方案 — 四軌落地

---

## 1. 背景

v0.2 憲法（commit `a6550f9`）的 §3.3 遷移步驟 #5-#8 留了四個未決議題。2026-04-20 Cowork session 完成四軌統一 ADR（commit `36aedd7`），現在需要 Code 執行具體落地：

- **Track 1**：session-handoff A→B 單向同步機制，寫入 CLAUDE.md
- **Track 2**：4 個 C 層 skill 複製到 repo A 層
- **Track 3**：commit-msg hook 擴充 worklog 原子化檢查
- **Track 4**：working-environment.md 加 `implements` frontmatter

完整 ADR：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`

---

## 2. Step 0 偵察

開工前先跑這些，確認上游假設仍成立：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認 36aedd7 在 HEAD
git log --oneline -3

# 確認 A 層 skill 現狀（預期只有 5 個）
ls .claude/skills/

# 確認 4 個 C 層 skill 不在 A 層
ls .claude/skills/paulkuo-writing/SKILL.md 2>&1
ls .claude/skills/paulkuo-social/SKILL.md 2>&1
ls .claude/skills/formosa-feedback/SKILL.md 2>&1
ls .claude/skills/organize-downloads/SKILL.md 2>&1

# 確認現有 hook 行數
wc -l scripts/commit-msg-hook.sh

# 確認 CLAUDE.md 行數
wc -l CLAUDE.md

# 確認 working-environment.md frontmatter 尚無 implements 欄位
head -30 docs/governance/working-environment.md
```

**預期結果**：
- `36aedd7` 在 HEAD
- A 層只有 `cross-project-impact`、`formosa-feedback-triage`、`session-handoff`、`wiki-ingest`、`wiki-lint`
- 4 個 skill 全部 `No such file or directory`
- hook 約 154 行
- CLAUDE.md 約 233 行
- WE frontmatter 無 `implements` 欄位

任何不符 → 先回報 Cowork / Paul，不要直接往下做。

---

## 3. 具體步驟

### Step 1 — working-environment.md 加 implements frontmatter（Track 4）

**檔案**：`docs/governance/working-environment.md`

在 frontmatter 的 `purpose:` 行之後、閉合 `---` 之前，新增：

```yaml
implements: adr-collaboration-constitution-v0.2
constitutional_mapping:
  §1: "第三條（權責分工原則）"
  §2: "第一條（SSoT 原則）實施細則"
  §3: "第三條實施細則（Handoff ADR 欄位）"
  §4: "獨立（長度管制，無直接對應條文）"
```

驗證：`head -30 docs/governance/working-environment.md` — YAML 結構正確。

---

### Step 2 — CLAUDE.md 加兩個新區塊（Track 1 + Track 4）

**檔案**：`CLAUDE.md`（repo 根目錄）

#### 2a. 加「協作憲法」引用段

在 `## 工作環境定義（2026-04-18 rev2）` 區塊**之後**，新增一個同層 `##` 區塊：

```markdown
## 協作憲法（v0.2，2026-04-19）

憲法全文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
實施細則：`docs/governance/working-environment.md`
v0.3 實施 ADR：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`

憲法五條：SSoT 原則 / 載體對等原則 / 權責分工原則（含剛性核查）/ 記憶層次原則（含同層原子化）/ 記憶擴充原則。
治理 ADR 有疑義時，以憲法為上位法。
```

#### 2b. 加「Skill 同步」條款

在 `## 工程慣例` 區塊內，`### Git` 小節**之前**，新增：

```markdown
### Skill 同步（v0.3 新增）

每次 `.claude/skills/` 下任何 SKILL.md 有 commit，立即同步到使用者級：

```bash
cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/
```

這是憲法第二條的實施配套——A 層（repo）是正本，B 層（使用者級）是下游 mirror。
忘記 3 次以上 → 升級為 post-commit hook。
```

驗證：`wc -l CLAUDE.md` — 預期約 250 行（增約 17 行），仍在 800 行觸發點以下。

---

### Step 3 — 複製 4 個 C 層 skill 到 A 層（Track 2）

#### 3a. 找出來源路徑

4 個 skill 目前住在 Cowork 專案層的 `.claude/skills/`。在 Paul 本機的實際路徑需要偵察：

```bash
# 嘗試使用者級
ls ~/.claude/skills/paulkuo-writing/SKILL.md 2>/dev/null && echo "✅ 在使用者級"

# 如果沒有，搜 Claude Desktop App 的儲存路徑
find ~/Library/Application\ Support/Claude -name "paulkuo-writing" -type d 2>/dev/null
find ~/Library/Application\ Support -path "*/skills/paulkuo-writing" 2>/dev/null
```

⚠️ **找不到時**：請 Paul 打開 Claude Desktop App → Customize → 找到 Cowork 專案設定的 skills 路徑，或直接從 UI 複製 skill 內容。

#### 3b. 複製到 A 層

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
for skill in paulkuo-writing paulkuo-social formosa-feedback organize-downloads; do
  mkdir -p .claude/skills/$skill
  cp {來源路徑}/$skill/SKILL.md .claude/skills/$skill/SKILL.md
  echo "✅ $skill: $(wc -l < .claude/skills/$skill/SKILL.md) lines"
done
```

**預期行數**（Cowork 2026-04-20 實測）：

| Skill | 預期行數 |
|---|---|
| paulkuo-writing | 593 |
| paulkuo-social | 276 |
| formosa-feedback | 263 |
| organize-downloads | 93 |

差距 ≥ 10% = 版本不一致，以來源最新版為準，在 worklog 記錄差異。

---

### Step 4 — 擴充 commit-msg hook（Track 3）

**檔案**：`scripts/commit-msg-hook.sh`

在現有 hook 的最後一個 `exit 0` **之前**，插入 worklog 原子化檢查區塊：

```bash
# ── worklog 同層原子化檢查（憲法第四條補款）──
# staged 的 worklog：「狀態變更」說完成的項目不應在「待辦快照」仍掛 [ ]

STAGED_WORKLOGS=$(echo "$STAGED_FILES" | grep '^worklogs/worklog-.*\.md$')

if [[ -n "$STAGED_WORKLOGS" ]]; then
  for wlog in $STAGED_WORKLOGS; do
    CONTRADICTIONS=$(python3 -c "
import re, sys

try:
    with open('$wlog') as f:
        content = f.read()
except:
    sys.exit(0)

# 找「狀態變更」區塊中標記完成的項目
status_section = re.search(r'## 狀態變更\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
if not status_section:
    sys.exit(0)

completed = set()
for line in status_section.group(1).split('\n'):
    m = re.match(r'^- (.+?)：.*(?:→\s*(?:已完成|✅|\[x\]|已解決|fixed))', line, re.IGNORECASE)
    if m:
        completed.add(m.group(1).strip())

if not completed:
    sys.exit(0)

# 找「待辦快照」區塊中仍掛 [ ] 的項目
todo_section = re.search(r'## 待辦快照\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
if not todo_section:
    sys.exit(0)

contradictions = []
for line in todo_section.group(1).split('\n'):
    m = re.match(r'^- \[ \] (.+)', line)
    if m:
        item = m.group(1).strip()
        for c in completed:
            if c in item or item in c:
                contradictions.append(f'{c} (狀態變更) vs {item} (待辦快照)')

for c in contradictions:
    print(c)
" 2>/dev/null)

    if [[ -n "$CONTRADICTIONS" ]]; then
      echo ""
      echo "╔══════════════════════════════════════════════════════════╗"
      echo "║  ⚠️  worklog 原子化違反（憲法第四條補款）                   ║"
      echo "╚══════════════════════════════════════════════════════════╝"
      echo ""
      echo "檔案：$wlog"
      echo "以下項目在「狀態變更」標完成，但「待辦快照」仍掛著 [ ]："
      echo "$CONTRADICTIONS" | while read -r line; do
        echo "  - $line"
      done
      echo ""
      echo "請同步更新兩個區塊，確保同一事實的表達一致。"
      echo "（--no-verify 可跳過此檢查）"
      echo ""
      exit 1
    fi
  done
fi
```

**重新安裝 hook**：

```bash
bash scripts/install-hooks.sh
```

---

### Step 5 — 測試 hook

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 建測試用矛盾 worklog
cat > worklogs/worklog-test-atomicity.md << 'TESTEOF'
# Worklog 2026-04-20

## 完成日誌
- 測試

## 狀態變更
- Whisper STT 重試：待辦 → 已完成

## 待辦快照
### 高優先 🔴
- [ ] Whisper STT 重試 11 支
TESTEOF

# commit 應被 hook 擋住
git add worklogs/worklog-test-atomicity.md
git commit -m "test: worklog atomicity hook"
# 預期輸出：⚠️ worklog 原子化違反

# 清理測試檔
git restore --staged worklogs/worklog-test-atomicity.md
rm worklogs/worklog-test-atomicity.md
```

預期：commit 被擋，顯示 `Whisper STT 重試 (狀態變更) vs Whisper STT 重試 11 支 (待辦快照)`。

---

### Step 6 — Commit + Push

分兩個 commit，各做一件事：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Commit 1: 治理文件更新（Track 1 + Track 4）
git add docs/governance/working-environment.md CLAUDE.md
git commit -m "docs(governance): v0.3 WE 加 implements frontmatter + CLAUDE.md 加憲法引用與 Skill 同步條款"

# Commit 2: 4 個 skill export（Track 2）
git add .claude/skills/paulkuo-writing .claude/skills/paulkuo-social .claude/skills/formosa-feedback .claude/skills/organize-downloads
git commit -m "feat(governance): export 4 Cowork skills to A-layer repo [影響: 僅治理]"

# Commit 3: hook 擴充（Track 3）
git add scripts/commit-msg-hook.sh
git commit -m "feat(governance): commit-msg hook 加 worklog 原子化檢查 [影響: 僅治理]"

# 一次 push
git push origin main
```

---

### Step 7 — 收尾

#### 7a. v0.3 ADR Status 升級

把 `docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md` 第一行的 `**Status**: Draft` 改成 `**Status**: Accepted`。

#### 7b. PENDING.md 標完成

把 `worklogs/PENDING.md` 中「v0.3 憲法實施方案落地（四軌）」標 `[x]`。

#### 7c. Worklog 三維度

按 CLAUDE.md 規範寫入 `worklogs/worklog-{date}.md`。

#### 7d. 收尾 commit + push

```bash
git add docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md worklogs/PENDING.md worklogs/worklog-*.md
git commit -m "chore: v0.3 四軌結案（ADR Accepted + PENDING + worklog）"
git push origin main
```

---

## 4. 上游假設

| # | 假設 | 驗證方式 | 失敗時怎麼辦 |
|---|------|---------|------------|
| A1 | commit `36aedd7` 在 HEAD | `git log --oneline -1` | `git pull` |
| A2 | A 層只有 5 個 skill | `ls .claude/skills/` | 如有新增，確認不衝突再繼續 |
| A3 | 4 個 C 層 skill 可在 Paul 本機找到 | Step 3a 偵察 | 找不到 → 請 Paul 從 Claude Desktop 手動匯出 |
| A4 | 現有 hook 最後一行是 `exit 0` | `tail -5 scripts/commit-msg-hook.sh` | 調整插入位置 |
| A5 | CLAUDE.md 有 `## 工程慣例` 和 `### Git` 區塊 | `grep -n '## 工程慣例\|### Git' CLAUDE.md` | 調整插入位置 |

---

## 5. 驗證方式

| # | 驗證項目 | 指令 | 預期結果 | 來源 |
|---|---------|------|---------|------|
| V1 | WE frontmatter 有 implements | `grep 'implements:' docs/governance/working-environment.md` | 有 match | 本機 grep |
| V2 | CLAUDE.md 有憲法引用 | `grep '協作憲法' CLAUDE.md` | 有 match | 本機 grep |
| V3 | CLAUDE.md 有 Skill 同步 | `grep 'Skill 同步' CLAUDE.md` | 有 match | 本機 grep |
| V4 | 4 個 skill 在 A 層 | `ls .claude/skills/{paulkuo-writing,paulkuo-social,formosa-feedback,organize-downloads}/SKILL.md` | 4 個都存在 | 本機 ls |
| V5 | hook 有 worklog 原子化 | `grep '原子化' scripts/commit-msg-hook.sh` | 有 match | 本機 grep |
| V6 | hook 測試通過 | Step 5 測試流程 | commit 被擋 + 顯示矛盾 | 本機 git commit |
| V7 | CLAUDE.md 行數合理 | `wc -l CLAUDE.md` | < 260 行 | 本機 wc |
| V8 | push 成功 | `git push origin main` | 無 error | Git remote |

---

## 6. 注意事項

- ⚠️ **Step 3 來源路徑不確定**：Cowork 專案層的 `.claude/skills/` 在 Paul 本機的路徑可能在 `~/Library/Application Support/Claude/` 底下，也可能在其他位置。需要偵察或問 Paul。這是整個 handoff 最可能卡住的地方。
- ⚠️ **hook 的 python parser 用精確子字串比對（v1）**：會漏抓措辭不同的矛盾（例如「使用者級 skill 同步」vs「~/.claude/skills/ 同步」）。這是已知取捨，v2 再加模糊比對。
- ⚠️ **CLAUDE.md 已超 200 行官方軟上限**：加完新區塊約 250 行。在 WE §4.1 預警範圍內但未到 800 行觸發點。不需要當下處理，但 worklog 記錄一筆「CLAUDE.md 250 行，追蹤趨勢」。
- Step 4 插入位置是**最後一個 `exit 0` 之前**，不是隨便一個 `exit 0`。hook 中間有多個 `exit 0`（跨專案檢查通過的 early return），不要插錯。
- `install-hooks.sh` 跑完後確認 `.git/hooks/commit-msg` 指向最新版 hook。
- 所有 commit message 帶 `[影響: 僅治理]`——這些改動不影響前端、Worker、D1、KV，不需要跑 smoke test。

---

## 7. 信心等級

**整體：高**

- Step 1-2（文件編輯）：高 — 純文字追加，無邏輯風險
- Step 3（skill 複製）：**中** — 來源路徑需偵察，可能卡住
- Step 4-5（hook 擴充）：高 — python parser 邏輯簡單，有測試步驟
- Step 6-7（commit + 收尾）：高 — 標準流程

如果 Step 3 卡住（找不到 skill 來源路徑），可以**先跳過 Step 3，做完其他步驟先 push**，skill export 單獨開一輪處理。

---

## 8. Integration Checklist

- [ ] 無新增 API endpoint（本次全是治理文件 + hook，不影響 Worker / Pages）
- [ ] 無 D1 / KV 變更
- [ ] 無共用模組變更（`worker/src/index.js`、`translator.js` 等未動）
- [ ] commit-msg hook 擴充不影響既有跨子專案偵測邏輯（加在最後 `exit 0` 之前，既有檢查流程不變）
- [ ] CLAUDE.md 新增區塊不與既有區塊衝突（加在 `## 工作環境定義` 之後、`### Git` 之前）
- [ ] 4 個 skill 複製到 A 層不影響既有 5 個 skill（新增目錄，不改既有目錄）

---

## §N. Consequences

- **若決策正確**：v0.2 §3.3 遷移步驟 #5-#8 全部結案。worklog 內部矛盾有機械檢查。4 個 skill 合憲化。CLAUDE.md 成為新 session 的治理入口。Code session 有明確的 Skill 同步義務，A/B 分岔風險降低。
- **若決策錯誤的連鎖影響**：hook python parser false positive 過多會干擾日常 commit（可 `--no-verify` 跳過）。4 個 skill 複製到 A 層後如果 Cowork 專案層各自演化會再次分岔——但憲法第一條已定 A 層為 SSoT。
- **可逆性**：完全可逆。每個 step 都是加法（新欄位、新條款、新檔案、hook 新段落），revert commit 即可回退。
- **驗證收斂條件**：一週內觀察——(1) 下次 SKILL.md commit 後 Code 是否自動 cp 到 B 層；(2) hook 是否在真實 worklog 矛盾時擋住 commit；(3) 新 Cowork session 開場是否引用「憲法 → WE」層級。

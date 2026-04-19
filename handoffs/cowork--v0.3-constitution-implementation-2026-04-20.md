---
status: Accepted
date: 2026-04-20
from: Cowork / Opus 4.6
to: Code / Opus 4.6（建議）或 Sonnet 4.6
task_size: M（60-90 min）
upstream:
  - docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md（四軌 ADR，已 commit 36aedd7）
  - docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md（上位法，commit a6550f9）
  - docs/governance/working-environment.md（實施細則 rev2.1）
---

# Handoff: v0.3 協作憲法實施方案 — Code 執行

> 本 handoff 對應 PENDING.md「v0.3 憲法實施方案落地（四軌）」條目。
> ADR 全文：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`

---

## 0. 前置確認（Step 0 偵察）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git log --oneline -3  # 確認 36aedd7 在 HEAD
```

預期輸出含 `36aedd7 docs(governance): v0.3 四軌實施 ADR 初稿`。不在 HEAD → `git pull` 先。

---

## 1. Step 2 — working-environment.md 加 implements frontmatter

**檔案**：`docs/governance/working-environment.md`

在現有 frontmatter 的 `purpose:` 行之後、`---` 結尾之前，加入：

```yaml
implements: adr-collaboration-constitution-v0.2
constitutional_mapping:
  §1: "第三條（權責分工原則）"
  §2: "第一條（SSoT 原則）實施細則"
  §3: "第三條實施細則（Handoff ADR 欄位）"
  §4: "獨立（長度管制，無直接對應條文）"
```

**驗證**：`head -30 docs/governance/working-environment.md` 確認 frontmatter 結構正確、YAML 無語法錯。

---

## 2. Step 3 — CLAUDE.md 加兩個新區塊

**檔案**：`CLAUDE.md`（repo 根目錄，目前 233 行）

### 2a. 加「協作憲法」引用段

在 `## 工作環境定義（2026-04-18 rev2）` 區塊之後，加：

```markdown
## 協作憲法（v0.2，2026-04-19）

憲法全文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
實施細則：`docs/governance/working-environment.md`
v0.3 實施 ADR：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`

憲法五條：SSoT 原則 / 載體對等原則 / 權責分工原則（含剛性核查）/ 記憶層次原則（含同層原子化）/ 記憶擴充原則。
治理 ADR 有疑義時，以憲法為上位法。
```

### 2b. 加「Skill 同步」條款

在 `## 工程慣例` 區塊內（例如 `### Git` 之前），加：

```markdown
### Skill 同步（v0.3 新增）

每次 `.claude/skills/` 下任何 SKILL.md 有 commit，立即同步到使用者級：

\`\`\`bash
cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/
\`\`\`

這是憲法第二條的實施配套——A 層（repo）是正本，B 層（使用者級）是下游 mirror。
忘記 3 次以上 → 升級為 post-commit hook。
```

**驗證**：`wc -l CLAUDE.md` — 預期約 250 行（加了約 17 行），仍在 WE §4.1 預警範圍內（< 800）。

---

## 3. Step 4-5 — 複製 4 個 C 層 skill 到 A 層

### 3a. 先驗證 A 層現狀

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
ls .claude/skills/
```

預期只有 5 個：`cross-project-impact`、`formosa-feedback-triage`、`session-handoff`、`wiki-ingest`、`wiki-lint`。

### 3b. 找出 4 個 skill 的來源路徑

Cowork 專案層的 `.claude/skills/` 在 Paul 電腦上的路徑不確定。嘗試以下幾個位置：

```bash
# 位置 1：使用者級
ls ~/.claude/skills/paulkuo-writing/SKILL.md 2>/dev/null && echo "在使用者級"

# 位置 2：Cowork 專案設定（可能在 Claude Desktop App 的專案資料夾內）
# 這個路徑需要 Paul 確認，通常在 ~/Library/Application Support/Claude/ 底下
find ~/Library/Application\ Support/Claude -name "paulkuo-writing" -type d 2>/dev/null

# 位置 3：如果都找不到，Paul 需要從 Claude Desktop App → Customize → Skills 手動匯出
```

⚠️ **如果找不到本機路徑**：請 Paul 打開 Claude Desktop App，在 Customize → Skills 裡把 4 個 skill 的內容複製出來，存到對應路徑。

### 3c. 複製到 A 層

找到來源路徑後：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
for skill in paulkuo-writing paulkuo-social formosa-feedback organize-downloads; do
  mkdir -p .claude/skills/$skill
  cp {來源路徑}/$skill/SKILL.md .claude/skills/$skill/SKILL.md
  echo "✅ $skill copied, $(wc -l < .claude/skills/$skill/SKILL.md) lines"
done
```

**預期行數**（Cowork 2026-04-20 實測）：
- paulkuo-writing：593 行
- paulkuo-social：276 行
- formosa-feedback：263 行
- organize-downloads：93 行

行數有差距（≥10%）= 版本不一致，以來源最新版為準。

### 3d. Commit

```bash
git add .claude/skills/paulkuo-writing .claude/skills/paulkuo-social .claude/skills/formosa-feedback .claude/skills/organize-downloads
git commit -m "feat(governance): export 4 Cowork skills to A-layer repo [影響: 僅治理]"
```

---

## 4. Step 6-7 — 擴充 commit-msg hook 加 worklog 原子化檢查

### 4a. 現有 hook 結構

`scripts/commit-msg-hook.sh` 目前 154 行，用 python3 解析 `docs/shared-files.json` 做跨子專案影響偵測。

### 4b. 在 hook 尾部加 worklog 原子化檢查

在現有 hook 的 `exit 0`（最後一行）之前，插入以下區塊：

```bash
# ── worklog 同層原子化檢查（憲法第四條補款）──
# 檢查 staged 的 worklog 檔案：「狀態變更」說完成的項目不應該在「待辦快照」裡還掛著 [ ]

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
    # 匹配 '→ 已完成' 或 '→ ✅' 或 '→ [x]' 的行
    m = re.match(r'^- (.+?)：.*(?:→\s*(?:已完成|✅|\[x\]|已解決|fixed))', line, re.IGNORECASE)
    if m:
        completed.add(m.group(1).strip())

if not completed:
    sys.exit(0)

# 找「待辦快照」區塊中仍掛著 [ ] 的項目
todo_section = re.search(r'## 待辦快照\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
if not todo_section:
    sys.exit(0)

contradictions = []
for line in todo_section.group(1).split('\n'):
    m = re.match(r'^- \[ \] (.+)', line)
    if m:
        item = m.group(1).strip()
        for c in completed:
            # 精確子字串比對（v1）
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

### 4c. 測試

準備一份故意矛盾的 worklog 測試：

```bash
# 建測試檔
cat > /tmp/test-worklog.md << 'EOF'
# Worklog 2026-04-20

## 完成日誌
- 測試

## 狀態變更
- Whisper STT 重試：待辦 → 已完成

## 待辦快照
### 高優先 🔴
- [ ] Whisper STT 重試 11 支
EOF

# 模擬 staged file 做 python 檢查（不需要真的 commit）
python3 -c "
import re
with open('/tmp/test-worklog.md') as f:
    content = f.read()
# ... (跑上面的 python 邏輯，預期輸出矛盾)
"
```

預期輸出：`Whisper STT 重試 (狀態變更) vs Whisper STT 重試 11 支 (待辦快照)`

通過後用真正的 commit 測一次：
```bash
cp /tmp/test-worklog.md worklogs/worklog-test-atomicity.md
git add worklogs/worklog-test-atomicity.md
git commit -m "test: worklog atomicity hook"  # 預期被擋
git checkout -- worklogs/worklog-test-atomicity.md  # 清理
```

### 4d. 重新安裝 hook

```bash
bash scripts/install-hooks.sh
```

### 4e. Commit hook 本身

```bash
git add scripts/commit-msg-hook.sh
git commit -m "feat(governance): commit-msg hook 加 worklog 原子化檢查 [影響: 僅治理]"
```

---

## 5. 收尾

### 5a. 一次性 push

```bash
git push origin main
```

### 5b. 驗證 checklist

| # | 驗證項目 | 指令 | 預期 |
|---|---------|------|------|
| V1 | WE frontmatter 有 implements | `head -30 docs/governance/working-environment.md` | 含 `implements: adr-collaboration-constitution-v0.2` |
| V2 | CLAUDE.md 有憲法引用 | `grep '協作憲法' CLAUDE.md` | 有 match |
| V3 | CLAUDE.md 有 Skill 同步 | `grep 'Skill 同步' CLAUDE.md` | 有 match |
| V4 | 4 個 skill 在 A 層 | `ls .claude/skills/paulkuo-writing/SKILL.md` | 存在 |
| V5 | hook 有 worklog 檢查 | `grep '原子化' scripts/commit-msg-hook.sh` | 有 match |
| V6 | CLAUDE.md 行數 | `wc -l CLAUDE.md` | < 260 行 |

### 5c. Worklog 三維度

Code session 完工後按 CLAUDE.md 規範寫 `worklogs/worklog-{date}.md` 三維度。

### 5d. PENDING.md 標完成

把 PENDING.md 中「v0.3 憲法實施方案落地（四軌）」標 `[x]`。

### 5e. v0.3 ADR Status 升級

```bash
# 在 ADR 檔案的 frontmatter 把 Draft 改成 Accepted
sed -i '' 's/^**Status**: Draft/\*\*Status\*\*: Accepted/' docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md
```

---

## §N. Consequences

- **若決策正確**：四軌全落地後，憲法 v0.2 的 §3.3 遷移步驟 #5-#8 全部結案。worklog 內部矛盾有機械檢查。4 個 skill 合憲化。CLAUDE.md 成為新 session 的治理入口。
- **若決策錯誤的連鎖影響**：hook 的 python parser 如果 false positive 太多，會干擾日常 commit 節奏（可 `--no-verify` 臨時跳過）。4 個 skill 複製到 A 層後，如果 Cowork 專案層和 A 層各自演化，會再次分岔——但憲法第一條已明定 A 層為 SSoT。
- **可逆性**：完全可逆。每個 step 都是加法（新欄位、新條款、新檔案、hook 新段落），revert commit 即可回退。
- **驗證收斂條件**：一週內觀察——(1) 下次 SKILL.md commit 後 Code 是否自動 cp 到 B 層；(2) 故意寫一份矛盾 worklog 看 hook 有沒有擋住；(3) 新 Cowork session 開場是否引用「憲法 → WE」層級。

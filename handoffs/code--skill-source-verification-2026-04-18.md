---
target: code
project: session-handoff skill v5.0 — 主線 A 前置第三方驗證
purpose: 核實 session-handoff/SKILL.md 的 ground truth 行數 + Mac 上所有副本位置 + git 歷史峰值
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md
  - handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18.md
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md
blocks: handoffs/code--session-handoff-v5-upgrade-2026-04-18.md（待本任務完成後才寫）
confidence: 高（純資料收集，無判斷）
estimated_effort: 15-20 分鐘
model_suggestion: Sonnet 4.6 + Low（機械任務，無架構決策）
---

# Code Handoff：skill 源檔第三方驗證（主線 A 前置）

## 0. 任務來源

v5.0 規劃 rev3 §5 基於「`session-handoff/SKILL.md` 有 1086 行」的假設，主張拆成三份 skill。

2026-04-18 Cowork 視窗核對 Cowork sandbox 的 repo 副本時發現只有 **522 行**，與 baseline handoff §1.3 寫的「實測 1085 行」差 2 倍。git log --stat 驗證 repo 從未有過 1000+ 行版本。

但 Cowork 的驗證只涵蓋 sandbox 副本，未驗 Mac 本機 / 桌面 App / user-level `~/.claude/skills/`。**拆 skill 決策建立在源檔有多長的事實上——事實沒核實，後面所有評估都是建在流沙上。**

本任務的唯一目的：**收集客觀資料，不做判斷**。資料回來後 Cowork 再決定路線 C' / C'' / C'''。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 交付物

### 2.1 調查報告：`worklogs/investigations/2026-04-18-skill-source-verification.md`

純資料，不寫結論。格式：

```markdown
# Skill 源檔第三方驗證 — 2026-04-18

## 驗證緣起
（一句話：Cowork 驗 sandbox 得 522，baseline handoff 寫 1085，需第三方確認）

## A. Repo 本機副本
- 路徑：~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md
- wc -l：<數字>
- md5：<hash>
- stat（size + mtime）：<輸出>
- git 追蹤狀態：tracked / untracked / modified
- 未 commit 差異行數：git diff | wc -l = <數字>

（wiki-ingest、wiki-lint 同樣三欄位）

## B. Mac 上其他 SKILL.md 副本
（find 結果，排除 Library/Caches 和 .Trash）
- /path/to/copy1/SKILL.md — wc -l <N>, md5 <hash>
- /path/to/copy2/SKILL.md — wc -l <N>, md5 <hash>
- ...

## C. 跨副本一致性
- Repo vs 副本1：byte-identical / 差異 <N> 行
- Repo vs 副本2：byte-identical / 差異 <N> 行

## D. Git 歷史峰值
- git log --all 涵蓋的最大行數：<數字>（來自 commit <hash>，日期 <date>）
- 歷史上最長的 10 個版本（commit hash + 行數 + 日期）：
  1. <hash> — <lines> lines — <date>
  2. ...

## E. Stash / Branch / 未推送
- git stash list：<有/無>，若有列出
- 本機 branches 清單：<輸出>
- 各 branch 的 SKILL.md 行數：<逐一列>
- 未推送到 origin 的 commits：git log origin/main..HEAD -- .claude/skills/session-handoff/SKILL.md

## F. 原始指令與 raw output
（把每個指令的完整輸出貼進來，不要濃縮——方便 Cowork 後續查證）
```

### 2.2 Commit + push

```
chore(verify): third-party verification of skill source before v5.0 split decision [影響: skill governance only]

- worklogs/investigations/2026-04-18-skill-source-verification.md: raw data only
- covers session-handoff / wiki-ingest / wiki-lint
- no judgment, no decision — data handed back to Cowork for C'/C''/C''' evaluation

Upstream: handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md
```

### 2.3 Worklog 追加

`worklogs/worklog-2026-04-18.md` 加一行：

```
- HH:MM 完成 skill 源檔第三方驗證 → worklogs/investigations/2026-04-18-skill-source-verification.md (<commit hash>) Code
```

---

## 3. 執行步驟

### 3.1 Repo 本機副本

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

for skill in session-handoff wiki-ingest wiki-lint; do
  file=".claude/skills/$skill/SKILL.md"
  echo "=== $file ==="
  wc -l "$file"
  md5 "$file" 2>/dev/null || md5sum "$file"
  stat -f "%z bytes, modified %Sm" "$file" 2>/dev/null || stat -c "%s bytes, modified %y" "$file"
  echo "--- git status ---"
  git status --short "$file"
  echo "--- uncommitted diff lines ---"
  git diff "$file" | wc -l
  echo
done
```

### 3.2 Mac 上其他副本

```bash
# 找所有 session-handoff 相關的 SKILL.md（排除 Library cache / Trash）
find ~ -name "SKILL.md" 2>/dev/null \
  | xargs -I {} grep -l "session-handoff\|多 Session 協作" {} 2>/dev/null \
  | grep -v "Library/Caches" \
  | grep -v ".Trash" \
  | grep -v "node_modules"

# 對每個找到的副本：
# wc -l + md5 + 路徑
```

⚠️ 若 find 跑太慢，限縮範圍：

```bash
find ~/Desktop ~/Documents ~/.claude ~/Library/Application\ Support -name "SKILL.md" 2>/dev/null | ...
```

### 3.3 跨副本 byte-level 比對

```bash
# 對每個找到的副本，跟 repo 本機比：
REPO_FILE=~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md
for copy in <找到的副本路徑>; do
  echo "=== $copy vs repo ==="
  diff -q "$REPO_FILE" "$copy"
  if ! diff -q "$REPO_FILE" "$copy" > /dev/null; then
    diff "$REPO_FILE" "$copy" | wc -l
  fi
done
```

### 3.4 Git 歷史峰值

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 列出所有動過 SKILL.md 的 commit，每個都 checkout 暫時看行數
# （用 git show 取該 commit 的檔案內容，不用真的 checkout）

git log --all --format="%H %ad %s" --date=short -- .claude/skills/session-handoff/SKILL.md \
  | while read hash date rest; do
      lines=$(git show "$hash:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
      echo "$hash  $date  $lines lines  $rest"
    done \
  | sort -k4 -n -r \
  | head -10
```

### 3.5 Stash / Branch

```bash
git stash list
git branch -a
# 對每個 local branch 查 SKILL.md 行數
for br in $(git branch --format='%(refname:short)'); do
  lines=$(git show "$br:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
  echo "$br  $lines lines"
done

# 未推送 commit
git log origin/main..HEAD --oneline -- .claude/skills/session-handoff/SKILL.md
```

---

## 4. 非目標（不要做）

- ❌ **不要**改任何 SKILL.md 的內容
- ❌ **不要**改 frontmatter（那是主線 A 的事，等驗證完再決定）
- ❌ **不要**下結論「522 是對的」或「1085 是對的」——你只收資料
- ❌ **不要**跑 skill-schema-lint.sh（已有 baseline，不需重跑）
- ❌ **不要**動 wiki-ingest / wiki-lint 的內容——純收集行數/md5

---

## 5. 完成檢查清單

- [ ] `worklogs/investigations/2026-04-18-skill-source-verification.md` 建立，A-F 六段齊全
- [ ] F 段含完整 raw output（不濃縮）
- [ ] commit 訊息含 `[影響: skill governance only]` 標注
- [ ] push 到 origin/main
- [ ] `worklogs/worklog-2026-04-18.md` 追加完成紀錄

---

## 6. 風險與阻礙預告

- **find 可能很慢**：`~/Library` 下有大量檔案。若 3 分鐘跑不完，用 §3.2 限縮路徑版。
- **md5 vs md5sum**：Mac 用 `md5`，Linux 用 `md5sum`。§3.1 已寫 fallback。
- **git show 對 untracked commit 會失敗**：正常，跳過即可，但要在報告裡註明哪些 commit 取不到內容。
- **桌面 App Skills 位置不明**：若找不到桌面 App 專用的副本路徑，在報告 B 段寫「桌面 App 副本路徑未找到，可能由 App 動態管理不落地」——不要猜。

---

## 7. Handoff 回 Cowork

調查報告回到 Cowork 後，我會拿 §1.2 的 A-F 六段資料重評 §2.1 的「522 vs 1085」矛盾：

- **情境 1**：本機 + repo + 所有副本都是 522 行 → Cowork 確認 C''（不拆）合理，主線 A 縮成 0.5 天
- **情境 2**：某個副本（桌面 App / user-level）有 1000+ 行 → Cowork 要追為什麼兩邊不同步，拆分策略重新設計
- **情境 3**：git 歷史有 1000+ 行但目前是 522 → 可能被刪過，要查哪次 commit 刪的、為什麼，決策依此校正
- **情境 4**：本機有未 commit 的 1000+ 行版本 → Paul 本機有未推送的大改動，要先對齊

資料一進來 Cowork 就能定奪。**Code 不用操心下一步。**

---

**上游文件**：
- `handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md`（Cowork 為什麼卡住）
- `handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18.md`（baseline 完成現況）
- `handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md`（v5.0 整體規劃）

**後續**：本任務完成後 Cowork 會依資料撰寫主線 A handoff（`code--session-handoff-v5-upgrade-2026-04-18.md`）。

# Skill 源檔第三方驗證 — 2026-04-18

## 驗證緣起
Cowork 在 sandbox 副本測得 session-handoff/SKILL.md 為 522 行；baseline handoff §1.3 聲稱「實測 1085 行」，差距 2 倍，需第三方 Code 視窗獨立核實 Mac 本機所有副本與 git 歷史。

---

## A. Repo 本機副本

### session-handoff/SKILL.md
- **路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md`
- **wc -l**：522
- **md5**：d60670927884cd1ade0b09ad1cd4b802
- **stat**：24542 bytes, modified Apr 14 12:27:35 2026
- **git 追蹤狀態**：tracked，working tree clean（git status --short 無輸出）
- **未 commit 差異行數**：`git diff | wc -l` = 0

### wiki-ingest/SKILL.md
- **路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/wiki-ingest/SKILL.md`
- **wc -l**：148
- **md5**：6f4c93bec643b80c61446bcf3c5362cf
- **stat**：4629 bytes, modified Apr 5 16:08:45 2026
- **git 追蹤狀態**：tracked，working tree clean
- **未 commit 差異行數**：0

### wiki-lint/SKILL.md
- **路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/wiki-lint/SKILL.md`
- **wc -l**：99
- **md5**：60f27194e0df89d4fb8f36fd316acd97
- **stat**：3199 bytes, modified Apr 8 20:42:50 2026
- **git 追蹤狀態**：tracked，working tree clean
- **未 commit 差異行數**：0

---

## B. Mac 上其他 SKILL.md 副本

搜尋指令：
```
find ~/Desktop ~/Documents ~/.claude ~/Library/Application\ Support -name "SKILL.md" 2>/dev/null \
  | xargs -I {} grep -l "session-handoff\|多 Session 協作" {} 2>/dev/null \
  | grep -v "Library/Caches" | grep -v ".Trash" | grep -v "node_modules"
```

找到含 session-handoff / 多Session協作 關鍵字的 SKILL.md：

| 路徑 | wc -l | md5 | 說明 |
|------|-------|-----|------|
| `~/Desktop/.claude/skills/beyond-man-days/SKILL.md` | 142 | d1ec308a5fe011e6cc3f01f9aa96c561 | 不同 skill，僅 grep 命中 |
| `~/Desktop/02_參考資料/SKILL.md` | 148 | f47e1176ef8ccd5f59f60b98551f96b3 | 參考資料目錄，wiki-ingest 版本 |
| `~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/cross-project-impact/SKILL.md` | 121 | 03466c4adc86cb4c0ae2a70795a71808 | 不同 skill |
| `~/Desktop/01_專案進行中/白沙屯ESG繞境/.claude/skills/session-handoff/SKILL.md` | **740** | 9160202ff08ee272d124ec7c6f2c0e2c | **白沙屯 repo 的 session-handoff 副本** |
| `~/Desktop/01_專案進行中/白沙屯ESG繞境/.claude/skills/formosa-feedback/SKILL.md` | 357 | 5e4d17e86183d5ed2d8e3960480ff1b7 | 不同 skill |
| `~/Desktop/01_專案進行中/白沙屯ESG繞境/formosa-feedback/SKILL.md` | 263 | fdbc8343301492a1d77acd491b4454dd | 不同 skill |

**user-level `~/.claude/skills/`**：目錄不存在（`ls ~/.claude/skills/` → no such dir）。桌面 App 無獨立 skills 目錄落地。

---

## C. 跨副本一致性

REPO 基準：`paulkuo.tw/.claude/skills/session-handoff/SKILL.md`（522 行）

| 比對對象 | 結果 |
|----------|------|
| vs `beyond-man-days/SKILL.md`（142 行）| 不同，diff 663 行 |
| vs `02_參考資料/SKILL.md`（148 行）| 不同，diff 612 行 |
| vs `cross-project-impact/SKILL.md`（121 行）| 不同，diff 641 行 |
| vs `白沙屯ESG繞境/session-handoff/SKILL.md`（740 行）| **不同，diff 1091 行**（白沙屯版本比 repo 多 218 行） |

結論：所有副本均非同一檔案。白沙屯 session-handoff 是獨立專案的獨立副本，內容不同步，行數 740。

---

## D. Git 歷史峰值

搜尋範圍：`git log --all` 全分支，`-- .claude/skills/session-handoff/SKILL.md`

**歷史最大行數：522 行**（commit `4487e89`，2026-04-14）

Top 10 commits by line count（降序）：

| Rank | Commit Hash | 日期 | 行數 | 訊息摘要 |
|------|-------------|------|------|---------|
| 1 | 4487e8998ea09fb52e955a2be88543802dbf6153 | 2026-04-14 | 522 | docs: 更新 CLAUDE.md + session-handoff SKILL + launch.json |
| 2 | 25813e03b850b944c96f9f37444eaaa374e586a8 | 2026-04-10 | 484 | fix: session-handoff v4.8 — 移除殘留 Apple Notes 引用 |
| 3 | 6f0927ea9b3362ce4757782d11513f7307cb4a9c | 2026-04-10 | 477 | chore: session-handoff v4.7 worklog 三維度必填 |
| 4 | 7f65dd7b5219f257a3980f811cbc48e865fd92f2 | 2026-04-09 | 460 | chore: governance automation + session-handoff v4.6 |
| 5 | ab39d2c31c38154a49d2a1f1f3fe24a466a4a81f | 2026-04-09 | 452 | feat: metrics 收集腳本 + session-handoff v4.5 |
| 6 | 4b44bf53935e271e1ba838945626c4e45e0ad069 | 2026-04-09 | 403 | skill: session-handoff v4.4 — add Code reporting rules |
| 7 | b643cc0c836fdea85577811b7a51ce9c9e419c3c | 2026-04-09 | 390 | skill: session-handoff v4.4 — sync-dashboard |
| 8 | 7df827a0bb0769c3d9b3106c78078524a9d13ce6 | 2026-04-07 | 343 | chore: session-handoff skill v4.2 |
| 9 | 58e4783edd59963ed11eb1c05faf2c2c84eba3cc | 2026-04-05 | 326 | chore: session-handoff v4.1 — 精確化步驟 3.5 |
| 10 | e5b9aa071e7e66346e1787d6b4106fb694a3e42e | 2026-04-05 | 323 | chore: session-handoff v4.1 — 加入 worklog 抽查步驟 |

**重要**：git history 從未出現超過 522 行的版本。1085 行版本不存在於任何 commit。

---

## E. Stash / Branch / 未推送

### Stash
```
git stash list → （無輸出，stash 清空）
```

### Local Branches 與 SKILL.md 行數

| Branch | session-handoff/SKILL.md 行數 |
|--------|-------------------------------|
| feat/sedan-gps-tracking | 343 |
| fix/checkin-cors-and-cleanup | 214 |
| fix/formosa-post-event | 522 |
| fix/issue-90-redirect | 303 |
| fix/issue-92-checkin-count-jump | 214 |
| fix/post-incident-regression | 214 |
| fix/youtube-transcript-pipeline | 522 |
| **main** | **522** |

最大值仍為 **522 行**（main 及兩個 fix branch）。

### 未推送 commits（origin/main..HEAD）
```
git log origin/main..HEAD --oneline -- .claude/skills/session-handoff/SKILL.md → （無輸出）
```
無未推送 commits。

---

## F. 原始指令與 raw output

### F.1 Repo 本機副本指令

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

for skill in session-handoff wiki-ingest wiki-lint; do
  file=".claude/skills/$skill/SKILL.md"
  echo "=== $file ==="
  wc -l "$file"
  md5 "$file"
  stat -f "%z bytes, modified %Sm" "$file"
  git status --short "$file"
  git diff "$file" | wc -l
done
```

Raw output：
```
=== .claude/skills/session-handoff/SKILL.md ===
     522 .claude/skills/session-handoff/SKILL.md
MD5 (.claude/skills/session-handoff/SKILL.md) = d60670927884cd1ade0b09ad1cd4b802
24542 bytes, modified Apr 14 12:27:35 2026
       0

=== .claude/skills/wiki-ingest/SKILL.md ===
     148 .claude/skills/wiki-ingest/SKILL.md
MD5 (.claude/skills/wiki-ingest/SKILL.md) = 6f4c93bec643b80c61446bcf3c5362cf
4629 bytes, modified Apr  5 16:08:45 2026
       0

=== .claude/skills/wiki-lint/SKILL.md ===
      99 .claude/skills/wiki-lint/SKILL.md
MD5 (.claude/skills/wiki-lint/SKILL.md) = 60f27194e0df89d4fb8f36fd316acd97
3199 bytes, modified Apr  8 20:42:50 2026
       0
```

### F.2 Mac 副本搜尋指令

```bash
find ~/Desktop ~/Documents ~/.claude ~/Library/Application\ Support -name "SKILL.md" 2>/dev/null \
  | xargs -I {} grep -l "session-handoff\|多 Session 協作" {} 2>/dev/null \
  | grep -v "Library/Caches" | grep -v ".Trash" | grep -v "node_modules"
```

Raw output：
```
/Users/apple/Desktop/.claude/skills/beyond-man-days/SKILL.md
/Users/apple/Desktop/02_參考資料/SKILL.md
/Users/apple/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/cross-project-impact/SKILL.md
/Users/apple/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/wiki-ingest/SKILL.md
/Users/apple/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md
/Users/apple/Desktop/01_專案進行中/白沙屯ESG繞境/.claude/skills/session-handoff/SKILL.md
/Users/apple/Desktop/01_專案進行中/白沙屯ESG繞境/.claude/skills/formosa-feedback/SKILL.md
/Users/apple/Desktop/01_專案進行中/白沙屯ESG繞境/formosa-feedback/SKILL.md
```

### F.3 白沙屯 session-handoff 副本

```
wc -l   → 740
MD5     → 9160202ff08ee272d124ec7c6f2c0e2c
stat    → 34984 bytes, modified Apr 12 13:08:53 2026
```

### F.4 Git 歷史峰值指令

```bash
git log --all --format="%H %ad %s" --date=short \
  -- .claude/skills/session-handoff/SKILL.md \
  | while read hash date rest; do
      lines=$(git show "$hash:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
      echo "$hash  $date  $lines lines  $rest"
    done \
  | sort -t' ' -k4 -n -r | head -10
```

Raw output（已貼於 §D，不重複）

### F.5 Branch 行數指令

```bash
for br in $(git branch --format='%(refname:short)'); do
  lines=$(git show "$br:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
  echo "$br: $lines lines"
done
```

Raw output（已貼於 §E，不重複）

### F.6 user-level ~/.claude/skills/ 確認

```
ls ~/.claude/skills/ → zsh: no such file or directory
```

---

*本文件純資料，無結論判斷。交由 Cowork 依情境 1/2/3/4 決定主線 A 後續方向。*

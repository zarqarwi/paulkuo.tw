---
target: code
project: session-handoff skill v5.1 — 規劃 rev1 前置源頭事實驗證
purpose: 為 v5.1 規劃（B 護欄重分類 + D 撞車 retro + E 抽 changelog）收集源頭事實數字，避免重蹈「1086 行無 ground truth」覆轍
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md（rev3 §3 七項 scope 源頭）
  - docs/governance/retrospective-2026-04-18-v5-split-reversal.md（v5.0 教訓）
  - docs/governance/working-environment.md（§2 源頭事實清單規範、§1.3 Cowork verifier + planner 分離原則）
blocks: handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18.md（待本任務完成後才寫）
confidence: 高（純資料收集，無判斷）
estimated_effort: 10-15 分鐘
model_suggestion: Sonnet 4.6 + Low（機械任務，無架構決策）
status: Proposed
consequences: |
  若本任務數字與 Cowork sandbox 預估差 ≥ 20%（任何一項），Cowork v5.1 rev1 規劃需重新收斂 scope。若全部差 < 20%，rev1 直接引用本報告數字，進入 Paul 拍板流程。
---

# Code Handoff：v5.1 規劃源頭事實驗證

## 0. 任務來源

v5.0 規劃曾基於「SKILL.md 1086 行」未驗證假設，rev3 拍板拆 skill；動工前 Cowork 核對才發現實際 522 行，全盤推翻決策，浪費約 1.2 天。教訓寫進 docs/governance/working-environment.md §2.6「源頭事實清單」規範：

> 任何「因為 X 所以要做 Y」的論點，X 必須有具體指令驗證（wc / grep / git log --stat）且指令輸出直接貼進規劃文件。

v5.1 rev1 規劃啟動前，依規範先驗證五項源頭數字。本任務的唯一目的：**收集客觀資料，不做判斷**。資料回來後 Cowork 依數字撰寫 rev1 規劃。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 驗證清單

### 2.1 Skill 檔案現況（支援 E：抽 changelog 的槓桿評估）

```bash
# a. session-handoff/SKILL.md 總行數
wc -l .claude/skills/session-handoff/SKILL.md

# b. 頂部 "> vX 更新" changelog 區塊實際佔幾行
# 具體定位：從第一個 "> **v" 開始，到第一個 "---" 分隔線為止
awk '/^> \*\*v/{start=NR} start && /^---$/{print NR-start+1; exit}' .claude/skills/session-handoff/SKILL.md

# c. 本 repo 所有 skill 數量（排除已廢棄）
ls -1 .claude/skills/ | grep -v "^\." | wc -l

# d. 各 skill 行數排序
wc -l .claude/skills/*/SKILL.md 2>/dev/null | sort -rn
```

### 2.2 護欄引用散佈（支援 B：護欄重分類的 rename 成本評估）

```bash
# a. 既有 worklog + handoff + retro 引用「護欄 #N」的次數（舊流水號）
# 範圍：worklogs/ + handoffs/ + docs/governance/
grep -rnE "護欄\s*#[0-9]+|鐵律\s*#[0-9]+" worklogs/ handoffs/ docs/governance/ 2>/dev/null | wc -l

# b. 唯一引用的編號清單（哪幾號被引用）
grep -rhoE "#[0-9]+" <(grep -rE "護欄\s*#[0-9]+|鐵律\s*#[0-9]+" worklogs/ handoffs/ docs/governance/ 2>/dev/null) | sort -u

# c. skill 內現有護欄總數（對照 rev3 §7 主張 15 條 + 新增 2 條 = 17 條）
grep -cE "^#### #[0-9]+|^### #[0-9]+|^## #[0-9]+" .claude/skills/session-handoff/SKILL.md
```

### 2.3 Retro / Investigations 既有檔案（支援 D：撞車 retro 歸檔位置確認）

```bash
# a. worklogs/investigations/ 現有檔案
ls -la worklogs/investigations/ 2>/dev/null

# b. docs/governance/ 現有檔案（retro 散在這裡）
ls -la docs/governance/ 2>/dev/null

# c. 已存在的跨 Cowork / 撞車相關紀錄（避免重複建立）
grep -rlE "跨.?Cowork|撞車|cross.cowork|collision" worklogs/ docs/governance/ handoffs/ 2>/dev/null
```

### 2.4 治理上界現況（支援 v5.1 rev1 §0 沿用判斷）

```bash
# a. CLAUDE.md 行數（目前已知越界 200 行軟上限）
wc -l CLAUDE.md

# b. working-environment.md 行數
wc -l docs/governance/working-environment.md

# c. 所有 skill 是否已補 frontmatter（v5.0 route C'' Exit Gate 結論）
for f in .claude/skills/*/SKILL.md; do
  if head -1 "$f" | grep -q "^---$"; then
    echo "OK: $f"
  else
    echo "MISSING: $f"
  fi
done
```

### 2.5 Git 歷史參照（支援 rev1 §2 「為什麼不做 A/C」的佐證）

```bash
# a. handoffs/ 目錄總檔案數（若之後做 v5.2 的 A 四層架構，搬遷成本參考）
ls -1 handoffs/*.md 2>/dev/null | wc -l

# b. handoffs/ 最舊檔案日期（判斷是否有夠舊的需要 archive）
ls -1t handoffs/*.md 2>/dev/null | tail -1

# c. SKILL.md 歷史行數峰值（驗證「從未 1000+ 行」結論仍成立）
git log --all --format='%H %s' -- .claude/skills/session-handoff/SKILL.md | head -5
git log --all --format='%H' -- .claude/skills/session-handoff/SKILL.md | while read h; do
  size=$(git show "$h:.claude/skills/session-handoff/SKILL.md" 2>/dev/null | wc -l)
  echo "$h $size"
done | sort -k2 -rn | head -3
```

---

## 3. 交付物

### 3.1 調查報告：`worklogs/investigations/2026-04-18-v5-1-source-verification.md`

純資料，不寫結論。格式：

```markdown
# v5.1 規劃源頭事實驗證 — 2026-04-18

## 驗證緣起

依 docs/governance/working-environment.md §2.6「源頭事實清單」規範，v5.1 規劃 rev1 前置驗證。

## §2.1 Skill 檔案現況

\`\`\`
$ wc -l .claude/skills/session-handoff/SKILL.md
<實際輸出>

$ awk ... (changelog 行數)
<實際輸出>

$ ls -1 .claude/skills/ | grep -v "^\." | wc -l
<實際輸出>

$ wc -l .claude/skills/*/SKILL.md | sort -rn
<實際輸出>
\`\`\`

## §2.2 護欄引用散佈

（同上格式，貼每個指令 + 輸出）

## §2.3 Retro / Investigations 既有檔案

（同上）

## §2.4 治理上界現況

（同上）

## §2.5 Git 歷史參照

（同上）

## 執行者備註

<Code 若發現任何指令執行不順、或輸出異常，在這裡記。不寫結論。>
```

### 3.2 Worklog 追加

在 `worklogs/worklog-2026-04-18.md` 完成日誌追加一行：

```markdown
- {HH:MM} v5.1 規劃源頭事實驗證完成 ({commit hash}) Code
```

### 3.3 Commit + push

```bash
git add worklogs/investigations/2026-04-18-v5-1-source-verification.md worklogs/worklog-2026-04-18.md
git commit -m "chore(governance): v5.1 planning source verification [影響: session-handoff skill only]"
git push origin main
```

---

## 4. Integration Checklist

（依 v4.6 規範，即使純資料任務也要確認）

- [x] 工作目錄：`~/Desktop/01_專案進行中/paulkuo.tw`（Mac 本機 repo 根）
- [x] 無 API 呼叫、無 CORS 影響、無 deploy
- [x] 無 wrangler.toml / wrangler.jsonc 影響
- [x] 無跨子專案影響（僅動 worklogs/investigations/ + worklog）
- [x] commit message 帶影響範圍標注 `[影響: session-handoff skill only]`

---

## 5. Exit Gate

- [ ] `worklogs/investigations/2026-04-18-v5-1-source-verification.md` 建立，五個 §2.x 區塊都有實際輸出貼上
- [ ] Worklog 追加一行
- [ ] commit + push 成功
- [ ] Exit Gate 結果回報 Cowork（Paul 轉述或 Cowork 自行讀檔）

---

## 6. 明確不要做的

- **不做結論判斷**。例如「這個數字代表該做 B 不做 A」——這是 Cowork 的工作。
- **不動 skill 內容**。純讀取。
- **不動 CLAUDE.md**。即使看到 233 行越界。
- **不改 rev3 規劃文件**。
- **不新增護欄 / 分類 / retro 內容**。
- 如果任何指令報錯或輸出令你困惑，照實記到「執行者備註」，不要自己腦補。

---

## 7. 模型建議

**Sonnet 4.6 + Low**

理由：
- 純機械任務（跑指令、貼輸出）
- 無架構判斷、無決策
- token 成本最低者勝

---

## 8. 預期後續

本任務完成後，Cowork 基於五項數字撰寫 `handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18.md`，Paul 拍板後 Cowork 寫 rev2 定稿，再由 Code 執行 B → D → E 三項 scope。

---

## 附錄：源頭事實清單（Sources of Truth Manifest）

依 working-environment.md §2 規範，本 handoff 所有「X → 需要做 Y」論點的 X 來源如下：

| 論點 | X 的源頭 | 驗證指令 |
|------|---------|---------|
| E 抽 changelog 的槓桿 | SKILL.md 頂部 "> vX 更新" 區塊行數 | §2.1 b |
| B 重分類的 rename 成本 | 既有檔案引用「護欄 #N」次數 | §2.2 a/b |
| D 撞車 retro 歸檔位置 | worklogs/investigations/ 現況 | §2.3 a |
| rev1 §0 沿用 v5.0 治理上界 | 所有 skill frontmatter 合規 | §2.4 c |
| 「從未 1000+ 行」結論仍成立 | SKILL.md git 歷史行數峰值 | §2.5 c |

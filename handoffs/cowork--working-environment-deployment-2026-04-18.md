---
target: code
project: 工作環境定義 rev2 落地
purpose: commit Cowork 寫的 rev2 + 更新根目錄 CLAUDE.md 加連結 + 更新 MEMORY.md
date: 2026-04-18
author: Cowork
status: Accepted
confidence: 高（純落地動作，無決策）
estimated_effort: 15-20 分鐘
model_suggestion: Sonnet 4.6 + Low（機械任務）
upstream:
  - docs/governance/working-environment.md（本次要 commit 的文件）
  - docs/governance/retrospective-2026-04-18-v5-split-reversal.md
---

# Code Handoff：working-environment rev2 落地

## 0. 任務來源

Cowork 剛完成 `docs/governance/working-environment.md` rev2（254 行），Paul 已拍板 Q-WE-1 ~ Q-WE-9 全 9 題。sandbox 的 `.git/index.lock` 有 permission 問題無法直接 commit，交 Code 本機處理。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

---

## 2. 交付物

### 2.1 Commit rev2

```bash
git add docs/governance/working-environment.md
git commit -m "$(cat <<'EOF'
docs(governance): establish working environment (Chat/Cowork/Code) + sources of truth manifest [影響: governance only]

rev2, accepted 2026-04-18 after Paul's ruling on Q-WE-1 ~ Q-WE-9.

Scope:
- §1 三方職責邊界 + 禁止事項 + Cowork commit 白名單
- §2 源頭事實清單 + 硬編碼事實數字規則 + 兩層驗證防線
- §3 Handoff ADR 欄位升級（新增 Status + Consequences）
- §4 Skill/CLAUDE.md 200 行官方軟上限 + 三層長度規則
- §5 外部共識對照表（Anthropic 官方 + 業界 + 傳統工程）

Drivers:
- 2026-04-18「1085 vs 522」踩坑（見 docs/governance/retrospective-2026-04-18-v5-split-reversal.md）
- Anthropic 官方 multi-agent / skill / memory 規範
- 業界 LangGraph / CrewAI / Devin + 學術論文
- 傳統工程 ADR / RFC / SSOT / Blameless Postmortem

Consequences: CLAUDE.md 233 行已超官方 200 行軟上限（F4），本 commit 僅記錄不動 CLAUDE.md 本體，留給 §6.2 中期動作處理。
EOF
)"
```

### 2.2 更新根目錄 CLAUDE.md，加一段「工作環境定義」連結

在 `CLAUDE.md` 最後一節「跨 Session 協作」之後、檔案結尾之前，插入以下新 section：

```markdown
---

## 工作環境定義（2026-04-18 rev2）

三視窗職責邊界、源頭事實清單規範、Handoff ADR 欄位升級，全部收斂在：

`docs/governance/working-environment.md`

任何 major version 規劃 / 跨 session 踩坑處理 / handoff 模板升級，以那份文件為準。

⚠️ 本檔（CLAUDE.md）目前 233 行，已超官方 200 行軟上限（見 working-environment.md §4.2 F4）。v5.1 視窗會檢視是否抽部分內容到 `docs/governance/` 獨立文件。
```

注意：插入後**不要**動 CLAUDE.md 其他內容——這輪目的是加連結，不是重構。

### 2.3 更新 `.auto-memory/MEMORY.md`

在現有 MEMORY.md 的清單末加一條（照現有格式，單行 < 150 字元）：

```
- [工作環境定義 rev2](project_working_environment.md) — Chat/Cowork/Code 職責邊界 + 源頭事實清單 + Handoff ADR 升級
```

然後建立 `.auto-memory/project_working_environment.md`：

```markdown
---
name: 工作環境定義 rev2
description: paulkuo.tw 專案的 Chat/Cowork/Code 三視窗職責邊界 + 源頭事實清單驗證規範 + Handoff ADR 欄位
type: project
---

2026-04-18 rev2 accepted。定義三視窗職責邊界、源頭事實清單、Handoff ADR 升級。止 1085 vs 522 踩坑類型的血。

**Why:**
2026-04-18 session-handoff skill v5.0 規劃基於「SKILL.md 1085 行」假設，實際 522 行。三視窗接力傳遞錯誤數字無人驗，差點基於假數據拆 skill。

**How to apply:**
- 規劃文件引用量化指標 → 必附 F-ID + 驗證指令 + 指令輸出（見 working-environment.md §2）
- Cowork 不得同時 act as planner 改規劃文件內容（見 §1.3）
- 新 handoff 必有 Status + Consequences 欄位（見 §3）
- Skill/CLAUDE.md 超 200 行預警 / 800 行觸發拆分討論 / 900 行強制拆（見 §4.1）
- 完整文件：`docs/governance/working-environment.md`
```

### 2.4 Commit + push

```bash
git add CLAUDE.md .auto-memory/MEMORY.md .auto-memory/project_working_environment.md
git commit -m "$(cat <<'EOF'
docs(governance): link working-environment.md from CLAUDE.md + update MEMORY [影響: governance only]

- CLAUDE.md: 新增「工作環境定義（2026-04-18 rev2）」section，指向 docs/governance/working-environment.md
- MEMORY.md: 加一條指向新文件
- 新 memory file: project_working_environment.md

CLAUDE.md 目前 233 行，已標注「已達官方 200 行軟上限預警」。本 commit 不處理越界，留給 v5.1。
EOF
)"

git push origin main
```

### 2.5 Worklog 追加

`worklogs/worklog-2026-04-18.md` 加兩行：

```markdown
- HH:MM 工作環境定義 rev2 完工 + push（{rev2_commit_hash}, {link_commit_hash}）Code
- HH:MM 更新 MEMORY.md 加 project_working_environment.md（{link_commit_hash}）Code
```

---

## 3. Exit Gate

- [ ] rev2 commit 成功（hash 回報 Cowork）
- [ ] CLAUDE.md + MEMORY.md 連結 commit 成功
- [ ] push 到 origin/main 成功
- [ ] CLAUDE.md 新增後行數驗證：`wc -l CLAUDE.md` → 預期 < 250 行（加約 10 行新 section）
- [ ] worklog 追加完成

---

## 4. 非目標（不要做）

- ❌ **不要**改 CLAUDE.md 其他內容（只加連結 section，不要趁機重構）
- ❌ **不要**動 working-environment.md rev2 的內容（Paul 已拍板）
- ❌ **不要**把 CLAUDE.md 拆出去（那是 §6.2 中期動作的事）
- ❌ **不要**跳過 `[影響: governance only]` 標注

---

## 5. 風險與阻礙預告

- **git index.lock**：Cowork sandbox 有 lock permission 問題，Code 本機應該正常。若 Code 也遇到，跑 `rm .git/index.lock` 後重試。
- **CLAUDE.md 合併衝突**：不太可能，但若有，以 main 最新版為主，手動插入新 section。
- **MEMORY.md 格式**：Cowork 的 MEMORY.md 是 auto-memory 系統，不要改既有條目，只加新條目在末尾。

---

## 6. Handoff 回 Cowork

Code 完工後回報：
- rev2 commit hash
- link commit hash
- push 成功時間
- CLAUDE.md 新行數（驗 Exit Gate）

Cowork 收到後會 reconcile worklog + 更新 Issue #155（若需要）。

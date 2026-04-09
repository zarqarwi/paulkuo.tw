# Handoff → Code

> 建議模型: Sonnet
> 預估量級: S（< 3 分鐘，2 個 git add + commit + push）
> 日期：2026-04-09
> 任務：commit + push session-handoff skill 最後兩筆修改 + handoff 檔案們
> ⚠️ 所有檔案都已修改/建立完成，不需要再改內容，只需 git 操作

---

## Step 0 偵察

```bash
git status
```

預期看到修改：
- `.claude/skills/session-handoff/SKILL.md`（新增 Code 回報原則 + 預估量級表格）
- `worklogs/cowork--next-session-handoff-2026-04-09.md`（新檔案）
- `worklogs/code--skill-v44-final-2026-04-09.md`（本檔案）

---

## 具體步驟

### Commit 1：skill 最終修改

```bash
git add .claude/skills/session-handoff/SKILL.md
git commit -m "skill: session-handoff v4.4 — add Code reporting rules + task sizing S/M/L"
```

### Commit 2：handoff 檔案

```bash
git add worklogs/cowork--next-session-handoff-2026-04-09.md worklogs/code--skill-v44-final-2026-04-09.md
git commit -m "worklogs: add cowork handoff + final skill commit handoff"
```

### Push

```bash
git push
```

---

## 驗證方式

1. `git log --oneline -2` 確認兩筆 commit
2. `git diff HEAD~2..HEAD --stat` 確認 3 個檔案
3. 不需驗證 Action（這次沒改 issue-155-body.md，sync-dashboard 不會觸發）

---

## 回報格式

```
2 commits pushed:
- {hash1} skill v4.4 final（Code 回報原則 + 量級）
- {hash2} handoff 檔案
驗證：sync-dashboard 未觸發（預期行為，未改 issue-155-body.md）
```

# Handoff → Code（Sonnet 即可）

> 日期：2026-04-09
> 任務：commit + push 三個已修改/新建的檔案
> ⚠️ 所有檔案都已經改好了，不需要再修改任何內容，只需要 git 操作

---

## 要 commit 的檔案（3 個）

### 檔案 1：`CLAUDE.md`（已修改，tracked）

改了什麼：
- 新增「跨子專案影響守則」段落（在「跨 Session 協作」之前）
- 「狀態管理」從 Apple Notes 改為 GitHub Issue #155
- Session 開場 checklist 加入 `worklogs/PENDING.md`

驗證改動存在：
```bash
grep "跨子專案影響守則" CLAUDE.md
```

Commit：
```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE): add cross-subproject impact rules + update status source to Issue #155 [影響: 全部子專案]"
```

---

### 檔案 2：`docs/shared-file-impact-map.md`（已修改，tracked）

改了什麼：
- 新增「最低驗證指令」section，每個共用模組都有對應的 curl 驗證指令

驗證改動存在：
```bash
grep "最低驗證指令" docs/shared-file-impact-map.md
```

Commit：
```bash
git add docs/shared-file-impact-map.md
git commit -m "docs: add minimum verification curl commands to impact map [影響: 全部子專案]"
```

---

### 檔案 3：`worklogs/PENDING.md`（新檔案，untracked）

是什麼：Code ↔ Cowork 跨 session 直接溝通佇列，取代 Paul 手動傳話

驗證檔案存在：
```bash
ls -la worklogs/PENDING.md
```

Commit：
```bash
git add worklogs/PENDING.md
git commit -m "worklogs: create PENDING.md cross-session queue for Code↔Cowork"
```

---

## 最後 push

```bash
git push
```

---

## 完成後追加 worklog

追加到 `worklogs/worklog-2026-04-09.md`：
```
- {HH:MM} CLAUDE.md 新增跨子專案影響守則 + 狀態來源更新 ({hash1}) Code
- {HH:MM} shared-file-impact-map.md 新增最低驗證指令 ({hash2}) Code
- {HH:MM} PENDING.md 跨 session 佇列建立 ({hash3}) Code
```

---

## 注意

- ❌ 不需要 deploy
- ❌ 不需要修改檔案內容（已經改好了）
- ❌ 不需要跑驗證 curl（這次只是文件改動）
- ✅ 只需要 git add + commit + push

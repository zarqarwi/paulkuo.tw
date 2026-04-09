# Handoff → Code

> 建議模型: Sonnet
> 預估量級: S（< 5 分鐘，純 git 操作）
> 日期：2026-04-09
> 任務：commit + push 本輪 Cowork 管理強化產出（5 個檔案）
> ⚠️ 所有檔案都已修改/建立完成，不需要再改內容，只需 git 操作

---

## 背景

Cowork 完成了一輪多 session 協作管理的結構性強化，核心改善：
1. Issue #155 同步迴路自動化（GitHub Action）
2. PENDING.md 跨專案備忘格式
3. session-handoff skill v4.4（含模型標注規則）
4. issue-155-body.md 初始版（含 Code commit hash 補入）

---

## Step 0 偵察

```bash
# 確認四個檔案都存在且有變動
git status
git diff --stat
```

預期看到：
- 新檔案：`.github/workflows/sync-dashboard.yml`、`worklogs/issue-155-body.md`
- 修改：`worklogs/PENDING.md`、`.claude/skills/session-handoff/SKILL.md`

---

## 具體步驟

### Commit 1：sync-dashboard GitHub Action

```bash
git add .github/workflows/sync-dashboard.yml
git commit -m "ci: add sync-dashboard Action to auto-sync issue-155-body.md → Issue #155"
```

### Commit 2：issue-155-body.md

```bash
git add worklogs/issue-155-body.md
git commit -m "worklogs: add issue-155-body.md as repo-side Issue #155 source"
```

### Commit 3：PENDING.md 跨專案備忘格式

```bash
git add worklogs/PENDING.md
git commit -m "worklogs: add cross-project memo section to PENDING.md"
```

### Commit 4：session-handoff skill v4.4

```bash
git add .claude/skills/session-handoff/SKILL.md
git commit -m "skill: session-handoff v4.4 — sync-dashboard + model annotation + sizing + PENDING.md"
```

### Commit 5：本 handoff 檔案自身

```bash
git add worklogs/code--session-management-v44-2026-04-09.md
git commit -m "worklogs: add handoff for session-management v4.4"
```

### Push

```bash
git push
```

---

## 驗證方式

1. `git log --oneline -5` 確認五筆 commit 都在
2. 到 GitHub Actions 頁面確認 `sync-dashboard` workflow 被觸發（因為 push 包含 `worklogs/issue-155-body.md`）
3. 確認 Issue #155 body 被自動更新（等 Action 跑完後 `curl -s https://api.github.com/repos/zarqarwi/paulkuo.tw/issues/155 | head -5`）

---

## 注意事項

- sync-dashboard Action 用 `jq -Rs` 讀檔再 `gh api PATCH`，不需要額外的 secret（用 `GITHUB_TOKEN` 即可）
- 如果 Action 失敗，檢查 repo 的 Actions permissions（Settings → Actions → General → Workflow permissions 需要 Read and write）
- issue-155-body.md 的內容就是 Issue body 的完整 markdown，不要加 frontmatter

---

## 回報格式

```
5 commits pushed:
- {hash1} sync-dashboard Action
- {hash2} issue-155-body.md
- {hash3} PENDING.md 跨專案備忘
- {hash4} session-handoff v4.4
- {hash5} handoff 檔案
GitHub Action sync-dashboard: {triggered/not triggered}
Issue #155 auto-sync: {成功/失敗/pending}
```

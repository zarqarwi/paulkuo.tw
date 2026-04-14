# Handoff → Code：分批 commit 累積變更（~100 個檔案）

- **建議模型**：Sonnet 4.6（逐步操作、無邏輯判斷）
- **Size**：S（15–20 分鐘）
- **前置**：`8363e60` 已 push 上 main（design system 文件）。本次處理的是 push 後仍累積在 working tree 的所有 modified / untracked。

---

## 起手路徑

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status -sb
```

預期看到 10 個 modified + 80+ untracked。Cowork 掃過後判斷分成 5 批 commit，**按順序執行**。

**全程不 push**，最後 Paul 統一 push。

---

## 批次 1：gitignore 排除本地設定

### 1.1 更新 `.gitignore`

在 `.gitignore` 結尾追加：

```
# Claude Code 本機權限設定（每台機器不同）
.claude/settings.local.json

# 自動產生的 push timestamp
scripts/.last_push_ts
```

### 1.2 `git rm --cached scripts/.last_push_ts`

這個檔案已經 tracked，加 gitignore 還不夠，要先從 index 移除：

```bash
git rm --cached scripts/.last_push_ts
```

### 1.3 Commit

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: gitignore 排除本地設定與自動產生的 timestamp

- .claude/settings.local.json（每台機器權限不同，不進版控）
- scripts/.last_push_ts（cron/script 自動產生的 timestamp）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 批次 2：CLAUDE.md + session-handoff SKILL + launch.json

都是 config/文件類小幅優化，一起走。

### 檢查 diff（非必要，可跳過確認）

```bash
git diff CLAUDE.md .claude/launch.json .claude/skills/session-handoff/SKILL.md
```

### Commit

```bash
git add CLAUDE.md .claude/launch.json .claude/skills/session-handoff/SKILL.md
git commit -m "$(cat <<'EOF'
docs: 更新 CLAUDE.md + session-handoff SKILL + launch.json

- CLAUDE.md：追加「commit 後立刻追加 worklog」提醒；修正 git 原子操作描述
- session-handoff SKILL：新增「Cowork 交付訊息模板」+ 模型建議判斷原則
- .claude/launch.json：astro dev 改用 npm run dev（跟 package.json 對齊）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 批次 3：Worklog 累積 4/9–4/13 + 狀態同步

處理 macOS 複製檔 + 新舊 worklog 一次 commit。

### 3.1 處理 `worklogs/worklog-2026-04-11 2.md`（檔名有空格）

內容是 Issue #163 GPS drift 修復的獨立紀錄（跟正本 `worklog-2026-04-11.md` 主題不同）。改名而非合併：

```bash
git mv "worklogs/worklog-2026-04-11 2.md" worklogs/worklog-2026-04-11-issue-163.md
```

### 3.2 Add + Commit

```bash
git add worklogs/PENDING.md \
        worklogs/issue-155-update-2026-04-09.md \
        worklogs/wiki-ingest-pending.md \
        worklogs/worklog-2026-04-09.md \
        worklogs/worklog-2026-04-10.md \
        worklogs/worklog-2026-04-11.md \
        worklogs/worklog-2026-04-12.md \
        worklogs/worklog-2026-04-10-audit.md \
        worklogs/worklog-2026-04-11-r5-fix.md \
        worklogs/worklog-2026-04-13.md \
        worklogs/worklog-2026-04-11-issue-163.md

git commit -m "$(cat <<'EOF'
docs(worklog): 追加 4/9–4/13 worklog + Issue #155 / wiki-ingest 狀態同步

- 追加 worklog-2026-04-{09,10,11,12,13}.md 當日紀錄
- 新增 worklog-2026-04-10-audit.md、worklog-2026-04-11-r5-fix.md
- 新增 worklog-2026-04-11-issue-163.md（原檔名含空格「 2」已改名）
- PENDING.md 更新：Stitch 比對擱置、新增 design system commit 待辦
- issue-155-update-2026-04-09.md、wiki-ingest-pending.md 狀態同步

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 批次 4：歸檔 Code / Cowork session handoffs

13 個 `code--*.md` + 1 個 `cowork--*.md` + 1 個 commit improvements 紀錄。

```bash
git add worklogs/code--commit-impact-map-and-script-2026-04-09.md \
        worklogs/code--commit-impact-map-tqef-fix-2026-04-09.md \
        worklogs/code--commit-management-improvements-2026-04-09.md \
        worklogs/code--cross-project-governance-2026-04-11.md \
        worklogs/code--formosa-pre-launch-audit-r2-result-2026-04-10.md \
        worklogs/code--formosa-pre-launch-audit-r4-result-2026-04-10.md \
        worklogs/code--governance-automation-2026-04-10.md \
        worklogs/code--governance-framework-phase1-2026-04-09.md \
        worklogs/code--governance-phase2-dashboard-2026-04-10.md \
        worklogs/code--governance-phase3-2026-04-11.md \
        worklogs/code--harness-docs-upload-2026-04-14.md \
        worklogs/code--paulkuo-seo-fix-2026-04-11.md \
        worklogs/code--scanner-automation-2026-04-14.md \
        worklogs/code--wiki-ingest-batch-2026-04-10.md \
        worklogs/cowork--session-handoff-2026-04-10c.md

git commit -m "$(cat <<'EOF'
docs(handoffs): 歸檔 Code/Cowork session handoff 紀錄（4/9–4/14）

涵蓋範圍：
- 治理框架 Phase 1-3（governance-framework / governance-automation / phase2-dashboard / phase3）
- 跨專案治理（commit-impact-map + cross-project-governance + commit-management-improvements）
- Formosa pre-launch audit R2 / R4 結果
- paulkuo SEO fix、wiki ingest batch、harness docs upload、scanner automation
- Cowork session handoff 2026-04-10c

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 批次 5：Wiki ingest 累積 + ghost-mileage dryrun

最大一批：40+ web clips + 17 YouTube sources + 5 wiki-web-pending + worker 端 dryrun 腳本。

```bash
git add src/content/wiki/raw/clips/ \
        src/content/wiki/sources/ \
        worklogs/wiki-web-pending-2026-04-09.md \
        worklogs/wiki-web-pending-2026-04-10.md \
        worklogs/wiki-web-pending-2026-04-11.md \
        worklogs/wiki-web-pending-2026-04-12.md \
        worklogs/wiki-web-pending-2026-04-13.md \
        worklogs/dryrun-ghost-mileage-2026-04-14.md \
        worker/scripts/dryrun-ghost-mileage.mjs

git commit -m "$(cat <<'EOF'
content(wiki): ingest 60+ web clips + YouTube sources + ghost-mileage dryrun

Wiki 內容：
- 40+ src/content/wiki/raw/clips/2026-04-{09-13}-*.md
  涵蓋 AI / 循環經濟 / 文明反思 / 台灣半導體 / solopreneur / pillar 相關主題
- 17 src/content/wiki/sources/youtube-*.md（YouTube ingest 結果）
- 5 worklogs/wiki-web-pending-*.md（每日 pending 報告）

Worker：
- worker/scripts/dryrun-ghost-mileage.mjs（ghost mileage dryrun 腳本）
- worklogs/dryrun-ghost-mileage-2026-04-14.md（dryrun 結果紀錄）

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 完成檢查

每批 commit 後跑 `git status` 確認 working tree 有沒有預期之外的殘留。5 批跑完後：

```bash
git status
# 預期：nothing to commit, working tree clean

git log --oneline -6
# 預期看到 5 個新 commit + design-system commit (8363e60)
```

---

## 不要做的事

- ❌ **不要 push**（Paul 統一 push）
- ❌ 不要動批次 5 以外的 `worker/scripts/` 檔案（目前只有 `dryrun-ghost-mileage.mjs` 要進來）
- ❌ 不要合併任一批（刻意分開讓 git log 乾淨）
- ❌ 不要跑 `npm run build` 或 deploy（純文件 + config 變更，build 不受影響）
- ❌ 不要加 `[影響:]` 標注（5 批都不碰 `worker/src/` 或 `BaseLayout.astro` 等共用核心；影響地圖檢查過）

---

## 完成後回報

1. 貼 5 個 commit hash：
   ```
   ✅ chore gitignore: abc1234
   ✅ docs config: def5678
   ✅ docs worklog: ghi9abc
   ✅ docs handoffs: jkl0def
   ✅ content wiki: mno1234
   ```
2. 追加 worklog-2026-04-14 完成日誌 5 行
3. 更新 `worklogs/PENDING.md` 把本 handoff 標 `[x]`
4. 回報「5 批 commit 完成，working tree clean，待 push」

# Code Handoff — governance-kv-seed 修復 + session-handoff v4.7 + worklogs commit

> 來源：Cowork session 2026-04-10
> 建議模型：Sonnet（改動明確，不需 Opus）
> 預計時間：5 分鐘內可完成

---

## 背景

Cowork 盤查 GitHub Actions 發現 Build & Deploy #3494~#3498 連續失敗。
根因是 `governance-kv-seed.cjs` 第 20 行的 `--remote` 參數在 CI 環境不被 wrangler 認識。
同時，CLAUDE.md 已升級 worklog 格式為三維度必填，session-handoff SKILL.md 需要同步更新。

---

## Step 0 偵察（先查再改）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認最新 commit 是 Cowork 剛 push 的
git log --oneline -3

# 確認 governance-kv-seed.cjs 第 20 行還有 --remote
sed -n '20p' scripts/governance-kv-seed.cjs

# 確認 SKILL.md 版本號
head -15 .claude/skills/session-handoff/SKILL.md
```

---

## Step 1：修 governance-kv-seed.cjs（1 行改動）

**檔案**：`scripts/governance-kv-seed.cjs`
**第 20 行**，把：

```javascript
const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`;
```

改成：

```javascript
const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}'`;
```

**原因**：GitHub Actions CI 環境有 `CLOUDFLARE_API_TOKEN` 環境變數，wrangler 自動以 remote 模式操作 KV。加 `--remote` 反而報 "Unknown argument: remote"。本機開發如果需要也是靠 `CLOUDFLARE_API_TOKEN` 認證，不需要這個 flag。

---

## Step 2：升級 session-handoff SKILL.md 到 v4.7

**檔案**：`.claude/skills/session-handoff/SKILL.md`

### 2a. 版本號（第 13 行附近）

把：
```
# 多 Session 協作狀態管理 SOP v3.2
```

改成：
```
# 多 Session 協作狀態管理 SOP v4.7
```

### 2b. 新增 v4.7 changelog（在 v3.2 變更後面加）

在 `> **v3.2 變更**：...` 那段之後，加一行：

```
>
> **v4.7 變更**：Worklog 格式升級為三維度必填（做了什麼/決策紀錄/阻礙與踩坑）。
> 與 CLAUDE.md 同步。原「技術備忘」區塊拆分為「決策紀錄」和「阻礙與踩坑」兩個獨立區塊。
```

### 2c. Worklog 格式區塊（第 156~177 行附近）

把整個 worklog template 從：

```markdown
## Worklog 格式（Code 端產出）

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`：

\```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code

## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...

## 待 Paul 執行
- [ ] {操作描述} → 驗證: {驗證方法或「問 Paul」}

## 技術備忘
- {踩坑紀錄、關鍵發現}
\```
```

改成：

```markdown
## Worklog 格式（Code 端產出）——三維度必填

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`。

Worklog 必須涵蓋三個維度，缺一不可：
- **做了什麼**（完成日誌 + 狀態變更）
- **為什麼這樣決定**（決策紀錄）
- **遇到什麼阻礙**（阻礙與踩坑）

\```markdown
# Worklog {YYYY-MM-DD}

## 完成日誌（最新在上）
- {HH:MM} {做了什麼} ({commit hash}) Code

## 狀態變更
- {Issue/待辦名稱}：{之前狀態} → {現在狀態}（{原因}）

## 決策紀錄
- {決策}：{為什麼選 A 不選 B}（影響範圍：{哪些模組/專案}）

## 阻礙與踩坑
- {問題描述} → {怎麼解決的 / 還沒解決}

## 待辦快照
### 高優先 🔴
- [ ] ...
### 中優先 🟡
- [ ] ...

## 待 Paul 執行
- [ ] {操作描述} → 驗證: {驗證方法或「問 Paul」}
\```

**決策紀錄**：只記「有其他選項但我們選了這個」的情況。沒有特殊決策就寫「無特殊決策」，但不能省略。
**阻礙與踩坑**：記已解決的（給未來參考）和未解決的（給下個 session 接手）。沒有阻礙就寫「無阻礙」，但不能省略。
```

---

## Step 3：commit 未 commit 的 worklogs

以下檔案是 Cowork 產出但 Cowork 沒有 git 權限，需要 Code 順便 commit：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先確認這些檔案存在
ls -la worklogs/worklog-2026-04-10.md
ls -la worklogs/cowork--next-session-2026-04-10b.md
ls -la worklogs/metrics/paulkuo-main/2026-04-10-cowork.json
```

如果這些檔案存在就 commit，不存在就跳過（可能已被前面的 Cowork push 處理）。

---

## Step 4：一次 commit + push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Commit 1: governance-kv-seed 修復
git add scripts/governance-kv-seed.cjs
git commit -m "fix: 移除 governance-kv-seed.cjs --remote 參數修復 CI 失敗

CI 環境有 CLOUDFLARE_API_TOKEN，wrangler 預設就會操作 remote KV。
--remote flag 在 GitHub Actions 的 wrangler 版本不被認識，
導致 Build & Deploy #3494~#3498 連續 5 次 KV seed 失敗。"

# Commit 2: session-handoff v4.7
git add .claude/skills/session-handoff/SKILL.md
git commit -m "chore: session-handoff v4.7 worklog 三維度必填

與 CLAUDE.md 同步。原「技術備忘」拆分為「決策紀錄」+「阻礙與踩坑」。
每次 session 結束時三個區塊都必須出現，沒有內容就寫「無」。"

# Commit 3: Cowork worklogs（如果有未 commit 的檔案）
git add worklogs/worklog-2026-04-10.md worklogs/cowork--next-session-2026-04-10b.md worklogs/metrics/ 2>/dev/null
git diff --cached --quiet || git commit -m "docs: Cowork worklogs 2026-04-10"

# Push
git push origin main
```

---

## Step 5：驗證 CI

push 後 GitHub Actions 會自動 trigger Build & Deploy。重點看：

1. **Seed Governance KV** step → 應該不再報 "Unknown argument: remote"
2. **Check Governance API** smoke test → `/api/governance/summary` 應返回 200
3. 整個 workflow 應該綠燈 ✅

```bash
# 等 2-3 分鐘後用 GitHub CLI 確認
gh run list --workflow deploy.yml --limit 3
```

---

## 驗證方式

- [ ] `governance-kv-seed.cjs` 第 20 行不再有 `--remote` → `grep '\-\-remote' scripts/governance-kv-seed.cjs` 應無結果
- [ ] SKILL.md 版本號顯示 v4.7 → `head -15 .claude/skills/session-handoff/SKILL.md`
- [ ] GitHub Actions 最新 run 全綠 → `gh run list --workflow deploy.yml --limit 1`

---

## 回報格式

完成後在 worklog 記錄：

```markdown
- {HH:MM} 修 governance-kv-seed.cjs --remote bug + session-handoff v4.7 ({commit hash}) Code

## 狀態變更
- governance-kv-seed CI 失敗：⚠️ 失敗 → ✅ 已修復
- session-handoff SKILL.md：v3.2 → v4.7（三維度 worklog）
- PENDING.md --remote 修復項目：[ ] → [x]

## 決策紀錄
- {如有}

## 阻礙與踩坑
- {如有}
```

---

## 注意事項

- `governance-kv-seed.cjs` 只改第 20 行，不要動其他邏輯
- SKILL.md 的「待 Paul 執行」欄位說明那段（第 179~193 行）保持不動
- 本機跑 `node scripts/governance-kv-seed.cjs` 需要 `CLOUDFLARE_API_TOKEN` 環境變數才能成功。沒有的話會報 auth error，這是正常的
- push 到 main 後 `sync-dashboard` Action 也會跑，會自動 PATCH Issue #155

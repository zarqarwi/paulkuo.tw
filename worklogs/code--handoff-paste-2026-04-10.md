# Code 一次執行 Handoff（直接貼進 Code session）

請依序完成以下兩件事，全部在 `~/Desktop/01_專案進行中/paulkuo.tw` 執行。

---

## 任務 1：修 governance-kv-seed.cjs（1 行改動）

**絕對路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/scripts/governance-kv-seed.cjs`

找到第 20 行，長這樣：

```javascript
const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`;
```

把最後的 ` --remote` 刪掉，改成：

```javascript
const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}'`;
```

原因：CI 環境有 CLOUDFLARE_API_TOKEN，wrangler 自動走 remote。`--remote` 在 GitHub Actions 的 wrangler 版本報 "Unknown argument: remote"，導致 #3494~#3498 連續 5 次 KV seed 失敗。

---

## 任務 2：升級 session-handoff SKILL.md 到 v4.7

**絕對路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md`

### 改動 A：版本號（第 13 行）

```
舊：# 多 Session 協作狀態管理 SOP v3.2
新：# 多 Session 協作狀態管理 SOP v4.7
```

### 改動 B：加 changelog（第 26 行 `v3.2 變更` 那段之後）

加入：

```
>
> **v4.7 變更**：Worklog 格式升級為三維度必填（做了什麼/決策紀錄/阻礙與踩坑）。
> 與 CLAUDE.md 同步。原「技術備忘」區塊拆分為「決策紀錄」和「阻礙與踩坑」兩個獨立區塊。
```

### 改動 C：替換 Worklog 格式區塊（第 156~177 行）

把這整段：

```markdown
## Worklog 格式（Code 端產出）

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`：

` ` `markdown
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
` ` `
```

整段替換成：

```markdown
## Worklog 格式（Code 端產出）——三維度必填

CLAUDE.md 已指示 Code 自動寫入 `worklogs/worklog-{YYYY-MM-DD}.md`。

Worklog 必須涵蓋三個維度，缺一不可：
- **做了什麼**（完成日誌 + 狀態變更）
- **為什麼這樣決定**（決策紀錄）
- **遇到什麼阻礙**（阻礙與踩坑）

` ` `markdown
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
` ` `

**決策紀錄**：只記「有其他選項但我們選了這個」的情況。沒有特殊決策就寫「無特殊決策」，但不能省略。
**阻礙與踩坑**：記已解決的（給未來參考）和未解決的（給下個 session 接手）。沒有阻礙就寫「無阻礙」，但不能省略。
```

注意：「待 Paul 執行」欄位說明那段（第 179~193 行附近）保持不動。

---

## 任務 3：commit + push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先 pull 確保跟 remote 同步（Cowork 剛 push 過 8198a7c 和 f8adaf0）
git pull origin main

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

# Commit 3: 如果有未 commit 的 worklogs
git add worklogs/worklog-2026-04-10.md worklogs/cowork--next-session-2026-04-10b.md worklogs/code--governance-fix-and-skill-upgrade-2026-04-10.md worklogs/code--handoff-paste-2026-04-10.md worklogs/metrics/ 2>/dev/null
git diff --cached --quiet || git commit -m "docs: Cowork worklogs + handoff 2026-04-10"

# Push
git push origin main
```

---

## 任務 4：驗證 CI

push 後等 2-3 分鐘，確認 GitHub Actions Build & Deploy 全綠：

```bash
gh run list --workflow deploy.yml --limit 3
```

重點看：
1. **Seed Governance KV** step 不再報 "Unknown argument: remote"
2. **Check Governance API** smoke test 返回 200
3. 整個 workflow 綠燈 ✅

---

## 完成後更新 PENDING.md

**路徑**：`~/Desktop/01_專案進行中/paulkuo.tw/worklogs/PENDING.md`

把這行：
```
- [ ] 🔴 修 governance-kv-seed.cjs `--remote` 參數 → Code / Sonnet (2026-04-10)
```

改成：
```
- [x] 🔴 修 governance-kv-seed.cjs `--remote` 參數 → ✅ 已完成 ({commit hash})
```

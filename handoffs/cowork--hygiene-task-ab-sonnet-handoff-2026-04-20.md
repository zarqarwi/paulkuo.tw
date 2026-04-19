# Cowork Handoff — PENDING.md 瘦身 + Handoff 索引建立（Task A+B）

> 建議模型：**Sonnet 4.6 + Medium**（純機械性清理，禁用 Opus 浪費 token）
> Task Size：S（40-50 min 兩件一起做）
> 來源 session：Cowork 2026-04-20（Opus 4.7，決策分派）
> 上游 handoff：`handoffs/cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md`

**Status**: Accepted
**Consequences**:
- **若決策正確**：PENDING.md 恢復可讀（<80 行）、handoff 可查找（INDEX.md）、每次 session 開場秒掃
- **若決策錯誤的連鎖影響**：Task A 刪太多活的待辦 → grep 檢核防護；Task B INDEX 摘要失真 → 從檔名+第一行 heading 產出，不讀全文
- **可逆性**：全部可逆（`git revert`）
- **驗證收斂條件**：V1-V4 全通過

---

## 1. 背景

上游 handoff 把 hygiene 拆成 Task A/B/C 三件事。Paul 在 Opus 4.7 視窗拍板：
- **Task C（CLAUDE.md 瘦身）延到 v5.2 視窗再處理**（理由：269 行離 800 硬觸發還遠，F4 的 200 是軟上限；v5.2 會做四層檔案架構改版，一併搬檔避免多次動）
- **Task A+B 交給下一個 Sonnet session 做**（理由：純機械性清理，Opus 做是錢坑）

本份 handoff = 把原 handoff 的 Task A+B 抽出來獨立交付，Task C 不在本輪 scope。

---

## 2. Step 0 偵察（開場做）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git log --oneline -3 && echo "---" && wc -l worklogs/PENDING.md && ls handoffs/ | wc -l && ls handoffs/INDEX.md 2>&1 | head -1
```

預期：
- HEAD 含 Opus 4.7 視窗可能已 push 的 worklog commit
- PENDING.md **144 行**
- handoffs/ **59-60 份**
- INDEX.md 不存在（待建）

---

## 3. Task A：PENDING.md 瘦身（15 min）

### 目標
把已完成的 `[x]` 項目歸檔到 `worklogs/archive/pending-completed-2026-04.md`，只留活的待辦。

### 步驟

1. `mkdir -p worklogs/archive`（archive/ 目前不存在）
2. 讀 `worklogs/PENDING.md` 完整內容
3. 建 `worklogs/archive/pending-completed-2026-04.md`：
   - Header：`# PENDING.md 已完成歸檔 — 2026-04 月`
   - 說明行：「從 PENDING.md 移過來的 `[x]` 已結案項目，保留供日後追溯。」
   - 把所有 `[x]` 項目連同原本的分組標題一起搬過來（保留上下文）
4. 重寫 `worklogs/PENDING.md`：
   - 保留「跨專案備忘」區塊（永久性參考資訊，**不歸檔**）
   - 保留「格式說明」區塊（如有）
   - 保留所有 `[ ]` 未完成項
   - **Scanner 重複產出的 `5c58ee02` 三條**（04-17/04-18/04-19）合併為一條，標注：
     ```
     - [ ] 5c58ee02 smoke test 缺漏（scanner 連續 3 天重複偵測，2026-04-17/18/19）
           → 待 Code 補驗或標記 skip；根治要靠 scanner 去重機制（延 v5.2 候選）
     ```

### 驗證
```bash
wc -l worklogs/PENDING.md  # 預期 < 80
grep -c '^- \[ \]' worklogs/PENDING.md  # 所有未完成項數量（搬前 vs 搬後應相等）
ls worklogs/archive/pending-completed-2026-04.md  # 歸檔檔案存在
```

### 注意
- ⚠️ **不要刪「跨專案備忘」區塊** — 那段是永久性的參考資訊（Cowork 每次開場要讀）
- 搬前先 `grep '^- \[ \]' worklogs/PENDING.md > /tmp/pending-before.txt` 備份活項目列表，搬後 diff 確認一致

### Commit
```bash
git add worklogs/PENDING.md worklogs/archive/pending-completed-2026-04.md && git commit -m "chore: archive completed PENDING.md items [影響: 僅治理文件]"
```

---

## 4. Task B：Handoff 索引建立（20 min）

### 目標
建 `handoffs/INDEX.md`，讓未來查舊 handoff 不用 grep。

### 步驟

1. `ls handoffs/*.md | sort -r` 取得依檔名倒序的清單（檔名含日期，倒序 = 最新在上）
2. 對每份 handoff：
   - 從檔名解析日期（檔名格式 `{方向}--{主題}-{YYYY-MM-DD}.md`）
   - 讀第一行（`# Title`）取標題作為「摘要」
   - 方向：從檔名前綴推斷（`code--` / `cowork--` / `chat--`）
     - `code--` → Code→Code（若內文指 Cowork→Code 則改）
     - `cowork--` → Cowork→Cowork 或 Cowork→Code（看檔名語意）
     - 不確定時標「—」
   - Status：若檔名在 `handoffs/done/` 或主體含明確結案字眼則標 `Accepted/Done`，否則「—」（不為此做深度讀檔）
3. 產出 `handoffs/INDEX.md`：

```markdown
# Handoff 索引

> 自動產出於 2026-04-20（Sonnet session），後續由 session-handoff skill 維護。
> **新寫 handoff 時，在索引頂部加一行。**
> 檔名格式：`{方向}--{主題}-{YYYY-MM-DD}.md`

| 日期 | 檔案 | 方向 | 主題 | Status |
|------|------|------|------|--------|
| 2026-04-20 | [cowork--hygiene-task-ab-sonnet-handoff-...](./cowork--hygiene-task-ab-sonnet-handoff-2026-04-20.md) | Cowork→Cowork | Task A+B 執行（本檔） | Accepted |
| 2026-04-20 | [cowork--governance-hygiene-and-v0.4-planning-...](./cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md) | Cowork→Cowork | 治理衛生清理 + v0.4 規劃（Task C 延 v5.2） | Partial |
| 2026-04-20 | [cowork--v0.3-closeout-session-handoff-...](./cowork--v0.3-closeout-session-handoff-2026-04-20.md) | Cowork→Cowork | v0.3 憲法收尾驗證 | Accepted |
| ... | ... | ... | ... | ... |
```

### 驗證
```bash
ls handoffs/INDEX.md && wc -l handoffs/INDEX.md  # 預期 >= 60（header + 59 份 handoff）
```

### 注意
- **不需讀每份 handoff 全文**，從檔名 + 第一行 heading 產出即可（handoff 第一行都是 `# Cowork Handoff — ...` 或 `# Code Handoff — ...`）
- 如果有 `handoffs/done/` 子目錄的 handoff，也要納入索引，Status 欄標 `Done (archived)`
- 現階段 Status 欄**不求精確**，先有索引可查就夠；精確化延到後續維護

### Commit
```bash
git add handoffs/INDEX.md && git commit -m "docs: create handoff INDEX.md [影響: 僅治理文件]"
```

---

## 5. 上游假設

1. HEAD 含 Opus 4.7 視窗的 worklog commit（如果有）— Sonnet 開場先 `git pull --rebase origin main` 防衝突
2. Cowork 可直接 commit 到白名單路徑（`worklogs/`、`handoffs/`），WE §1 確認過
3. 原上游 handoff（governance-hygiene-and-v0.4-planning）沒有 deprecated，只是 Task C 部分延期
4. archive/ 目錄是新建，不會與其他流程衝突

---

## 6. 驗證方式

| # | 驗證項 | 方法 |
|---|--------|------|
| V1 | PENDING.md 瘦身 | `wc -l worklogs/PENDING.md` < 80 |
| V2 | 沒丟失活的待辦 | `grep -c '^- \[ \]' worklogs/PENDING.md` = 搬前數字 |
| V3 | handoff INDEX 存在且涵蓋全部 | `wc -l handoffs/INDEX.md` >= 60 |
| V4 | 兩個 commit push 成功 | `git log --oneline -3` 看到兩個 chore/docs commit |

---

## 7. 注意事項

- ⚠️ Task C（CLAUDE.md 瘦身）**不做**，延 v5.2 視窗
- PENDING.md 歸檔時**保留「跨專案備忘」** — 永久參考資訊
- INDEX.md 不追求 Status 精確度，先求有；後續由 session-handoff skill 寫 handoff 時同步維護
- 兩個 commit 分開做，不混（便於日後 revert 單軌）
- **Paul 本機跑 push** 的話一律用 oneliner 格式（auto-memory 規則）

---

## 8. 信心等級

**高** — 純機械性操作，沒有決策風險。Task A 已有 grep 防護確保不丟活待辦，Task B 只讀檔名+heading 不易出錯。

---

## 9. Integration Checklist

- [ ] archive/ 目錄建立
- [ ] PENDING.md 瘦身完成（V1+V2 通過）
- [ ] handoff INDEX.md 建立（V3 通過）
- [ ] 兩個 commit 分開 push（V4 通過）
- [ ] Issue #155 §「其他待辦」或 governance 區塊提一下 hygiene 已執行（可選，Cowork 手動補）
- [ ] session-handoff skill SKILL.md 加「寫 handoff 時同步在 INDEX.md 頂部加一行」指引（延 v5.2，不在本輪 scope）

---

## 附錄：延到 v5.2 視窗的候選

| 候選 | 理由 | 預估 |
|------|------|------|
| CLAUDE.md 抽離 Rollback / Wrangler / Worklog SOP | v5.2 會做四層檔案架構改版，一併搬 | M |
| Scanner 去重機制（5c58ee02 連續 3 天重複） | 根治 PENDING.md 汙染源 | S（Code） |
| session-handoff skill：新 handoff 自動加 INDEX.md | INDEX.md 維護責任歸屬制度化 | S |
| v0.4 憲法第四條補款：跨 session 佇列衛生規則 | 本輪清理出實施經驗，累積 2-3 次後可修憲 | M |

建議模型: Sonnet 4.6 + Medium
預估量級: S（20–30 分鐘，純偵察 + 理解對焦，不做 retro 分析）

# Cowork Handoff — v5.1 護欄 Retro 對焦調查（Pre-flight）

**日期**：2026-04-19
**來源 session**：Cowork
**目標 session**：Code
**任務大小**：S
**信心等級**：高（偵察命令明確，對焦題目結構化）
**後續依賴**：本對焦通過後，Code 再跑完整 retro（`handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`）。對焦未通過 = 暫停完整 retro，等 Paul/Cowork 澄清。

---

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull origin main
```

預期新抓到的檔案（本次 push 後）：
- `.claude/skills/session-handoff/SKILL.md`（v5.2 升版）
- `.claude/skills/session-handoff/CHANGELOG.md`（v5.2 條目）
- `CLAUDE.md`（Rollback Protocol 加一行）
- `worklogs/PENDING.md`（新增 wiki-youtube-ingest 清理 todo）
- `worklogs/issue-155-body.md`（完成日誌條目）
- `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md`
- `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md`
- `handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`（完整 retro handoff）
- `handoffs/cowork--v5-1-guardrail-retro-alignment-2026-04-19.md`（本檔）

若 `git pull` 後任一檔案缺失，回報 Cowork + Paul，停止後續動作。

---

## 1. 背景

Cowork 已寫好完整 retro handoff（`handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`，10 區塊），但在交給 Code 實際執行前，Paul 要求先做一輪「對焦調查」確保雙方理解一致。

動機：
- 完整 retro 約 60–90 分鐘，若理解偏差，重跑成本高
- C4（陰性結果結論節制）/ C5（SSoT 變更後下游重驗）判斷有主觀成分，事前對齊及格線比事後重判便宜
- Cowork 本次自身就是 v5.1 護欄脫節的受害者，有必要由 Code 獨立複述一次理解，避免 Cowork 片面假設

本對焦調查不做實際 retro 分析，只做兩件事：
1. 把事實（時間戳、檔案清單、SSoT 版本）擺到桌面
2. Code 用自己的話複述對 retro 目標與判斷邊界的理解，讓 Paul/Cowork 比對是否對齊

---

## 2. Step 0 偵察

> 本路線已考慮接手方 Code 可用的能力：git log / Read / Grep。未動用 Cowork 專屬的 scheduled-tasks MCP，因為本調查目標是 repo 內的書面產出，git/filesystem 就是最低 token 路徑（v5.2 規範）。

### 2.1 確認 v5.1 落地時間戳

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git log --format="%H %ai %s" -- .claude/skills/session-handoff/ | head -10
```

預期命中：`e17d6f4 2026-04-18 12:48:16 +0800 chore(skills): v5.1-E ...`。

記錄確切的 commit hash 和 timestamp，後續所有「窗口內」判斷以此為起點。

### 2.2 列出窗口內 Cowork + Chat 產出

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git log --since="2026-04-18 12:48:16" --format="%H %ai %s" -- \
  "handoffs/cowork--*" "handoffs/chat--*" \
  "worklogs/cowork--*" "worklogs/chat--*" | head -30
```

交叉驗證：也用 filesystem mtime 掃一次，看 git 沒追到但檔案存在的情況：

```bash
find handoffs worklogs \
  \( -name "cowork--*2026-04-1[89]*.md" -o -name "chat--*2026-04-1[89]*.md" \) \
  -newer .claude/skills/session-handoff/CHANGELOG.md 2>/dev/null | sort
```

若兩者清單不一致，以 git log 為準，在對焦回報中標注差異。

### 2.3 查使用者級 SKILL.md 是否有 C4/C5

```bash
ls -la ~/.claude/skills/session-handoff/SKILL.md 2>/dev/null || echo "使用者級 skill 不存在"
grep -cE "(C4|C5|護欄編號|陰性結果|SSoT 變更後)" ~/.claude/skills/session-handoff/SKILL.md 2>/dev/null || echo 0
head -5 ~/.claude/skills/session-handoff/SKILL.md 2>/dev/null
```

**預期**：grep count = 0（使用者級是 v4.13 或更早），head 顯示不含「護欄編號」字樣的舊版 frontmatter。

若 grep > 0 或 head 顯示 v5.1+：本 retro 前提不成立（使用者級其實已同步過），**立即停止對焦**，回 Paul 確認脫節時間點。

### 2.4 專案級 SKILL.md v5.2 確認

```bash
grep -cE "(C4|C5|陰性結果|SSoT 變更後|本路線已考慮接手方)" \
  ~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md
wc -l ~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/session-handoff/SKILL.md
```

預期：grep > 0（v5.2 已含新條款），行數 543 附近。

---

## 3. 具體步驟（對焦題目）

請 Code 用**自己的話**回答以下 7 題。每題一段話即可（1–3 句），不要貼原文摘錄。回報檔放 `worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md`。

### 題 1：Retro 的窗口範圍

問：本次 retro 要檢核哪個時間區間的 Cowork/Chat 產出？起點是誰、終點是誰、為什麼這樣選？

### 題 2：要檢核的兩條護欄

問：用你自己的話解釋 C4（陰性結果結論節制）和 C5（SSoT 變更後下游重驗）各自在講什麼，以及各自想防止什麼具體的錯誤。

### 題 3：「違反」的判斷及格線

問：Retro handoff §4.4 說 C4 交叉驗證及格線是「至少 2 種來源或 2 種方式」，你怎麼理解「2 種來源」在實戰中的邊界？舉兩個案例：一個你會標 🟡（邊界模糊），一個你會標 🔴（明確違反）。

### 題 4：為什麼不讓 Cowork 自己做

問：為什麼 Paul 指定由 Code 做這次 retro 而不是 Cowork 自查？你在報告中如何避免自己也踩到 C4？

### 題 5：Step 3 特別檢核

問：完整 retro handoff §3 Step 3 要你特別檢核「本 session 的 Cowork 判斷」。你理解這個「本 session」指的是哪一個（今天 2026-04-19 Cowork 的哪段對話）？如果書面檔案裡找不到相關痕跡，你會怎麼處理？

### 題 6：Retro 產出的修改權限

問：Retro 過程中若發現 🔴 案例，你會直接修改原始文件嗎？如果不會，你的建議會怎麼寫？

### 題 7：自我指涉風險

問：本次 retro 的規範（v5.2 + C4/C5）是「評審本 retro 自己」的標準嗎？你在寫 retro 報告時如何標注這一點？

---

## 4. 上游假設

Code 接手前驗證：

1. **§2.1 e17d6f4 時間戳存在且為 v5.1 落地 commit**
   若 git log 顯示 v5.1 落地時間不是 2026-04-18 12:48:16（例如被 rebase/amend 過），以 git log 為準修正 retro 窗口。

2. **§2.3 使用者級 SKILL.md 未同步**
   若已同步，本 retro 前提不成立，立即停止。

3. **Retro handoff 本身可讀且格式正確**
   `cat handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md | head -5` 能看到「建議模型: Sonnet 4.6 + Medium」開頭。否則回報檔案損毀。

---

## 5. 驗證方式

Code 完成對焦調查後必須 PASS：

- [ ] §2.1–2.4 四組偵察命令實際執行，結果寫進對焦回報
- [ ] 題 1–7 每題都有答案（不可跳題）
- [ ] 有至少一題標注「我的理解與 handoff 可能有落差」或「此處需要 Cowork/Paul 澄清」。若 7 題全部「完全對焦」，自省一次：是不是太快點頭了？
- [ ] 回報檔案加「本輪 metrics」一行

**交叉驗證**：Code 回報後，Cowork 會逐題比對理解。若任一題回答偏離 retro handoff 原意超過一個段落，視為對焦失敗，由 Paul 裁決如何補強。

---

## 6. 注意事項

- ⚠️ **對焦不動手**：本階段**不跑 retro 分析**，不讀那 3 份被檢核的 Cowork 產出。Code 的工作只有「偵察事實」+「複述理解」。
- ⚠️ **不修改任何檔案**：本調查純讀取，不動 worklog / handoff / skill 任何檔案
- ⚠️ **坦承歧義優於假裝對齊**：如果某一題你真的不確定，寫「handoff §N 讓我有歧義，理解可能是 A 也可能是 B，請 Cowork/Paul 指定」。這比硬猜更省 token
- ⚠️ **§2.3 若觸發停止條件**：立刻回報 Paul + Cowork，不要自行判斷要不要繼續。等裁決
- ⚠️ **對焦檔不是 retro 報告**：對焦檔名是 `code--v5-1-guardrail-retro-alignment-2026-04-19.md`，**不要**寫成 `code--v5-1-guardrail-retro-report-2026-04-19.md`（後者是完整 retro 的產出檔名）

---

## 7. 回報格式

Code 完成後回一份 markdown，檔名：`worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md`。

內容骨架：

```markdown
# v5.1 護欄 Retro 對焦調查回報

## Step 0 偵察事實

### 2.1 v5.1 落地時間戳
（git log 結果）

### 2.2 窗口內產出清單
（git log + find 交叉結果；若差異標注）

### 2.3 使用者級 SKILL.md 狀態
（路徑存在？grep count？head 前 5 行？）→ 結論：{前提成立 / 前提不成立}

### 2.4 專案級 SKILL.md v5.2 狀態
（grep count / 行數）

## 對焦答題

### 題 1：Retro 窗口
（Code 自述）

### 題 2：C4 / C5 定義
（Code 自述）

### 題 3：違反判斷及格線 + 兩個案例
（Code 自述 + 🟡/🔴 案例各一）

### 題 4：為什麼 Code 做 + 自己不踩 C4 的機制
（Code 自述）

### 題 5：Step 3 特別檢核的「本 session」理解
（Code 自述）

### 題 6：Retro 修改權限
（Code 自述）

### 題 7：自我指涉風險標注方式
（Code 自述）

## 自覺歧義 / 需澄清事項
（至少一條；若真的沒歧義，說明自省結論）

## 本輪 metrics
{files_read} files read, {kb} KB processed, {time} min, 0 commits
```

**回報必須包含偵察結果 + 答題 + 自覺歧義**，缺一不可（護欄 #6 格式）。

---

## 8. 本輪 metrics 預估

- Files to read: 2 份 SKILL.md（專案級 v5.2 + 使用者級 v4.13 驗證）+ 1 份完整 retro handoff
- 讀取量：~30 KB
- 預估時間：20–30 min
- Commits / files changed：0
- Deploys：0

---

## 9. Integration Checklist

本階段純讀取，不跨任何系統：

- [ ] 不改 API endpoint
- [ ] 不改共用函式 / KV / D1
- [ ] 不動 deploy / CI
- [ ] 不改任何現有檔案
- [ ] 不推送 git

**涉及檔案**：
- [ ] 新建 `worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md`（對焦回報）

---

## 10. 對齊後流程

Code 回報對焦結果 → Cowork 逐題比對：

| 對焦結果 | 後續動作 |
|----------|---------|
| 全部對齊 | Cowork 通知 Paul，放行 Code 跑完整 retro（`handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`） |
| 部分歧義 | Cowork 寫補丁 handoff 澄清歧義題，Code 重看後再放行 |
| 嚴重偏差（多題偏離） | Cowork 重寫完整 retro handoff，本對焦 handoff 作廢 |
| §2.3 觸發停止（使用者級已同步） | Paul 重新裁決 retro 是否還要做 |

---

**產出者**：Cowork（讀 v4.13 狀態下產出，但本 handoff 內容結構遵循 v5.2 規範）
**產出時間**：2026-04-19 14:52
**目標完成時間**：當日 session 內（S 級，不需過夜）
**後續 Cowork 需做**：收 Code 對焦回報 → 逐題比對 → 依 §10 分流

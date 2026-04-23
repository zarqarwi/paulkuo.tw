# Handoff: governance/ 考試檔案收斂

> **給 Code session 的交辦文件**
> 來源：Cowork session 2026-04-20（Opus 4.6）
> 建議模型：Sonnet 4.6
> Task size：S（15-20 分鐘，單一 commit）
> 前置：無
> 觸發來源：worklog-2026-04-20.md 待辦快照「governance/ 三份考試答案檔收斂」

---

## 0. 進入目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

⚠️ 開工前確認：

```bash
pwd  # 必須是 /Users/paulkuo/Desktop/01_專案進行中/paulkuo.tw
git status  # 應該是 clean（或只有其他 untracked 檔案）
git log --oneline -3  # 最新 commit 應該是 8f2c2d2（scanner 去重）
```

---

## 1. 問題背景

2026-04-20 三視窗治理考試產出四份檔案，命名規則不一致：

| 目前檔名 | 內容 | 內文標示的來源 |
|---------|------|----------------|
| `governance-exam-2026-04-20.md` | 題目 | N/A |
| `chat--governance-exam-answers-2026-04-20.md` | 答卷 | Chat |
| `governance-exam-2026-04-20-answers.md` | 答卷 | Code (Opus 4.7) |
| `governance-exam-answers-2026-04-20.md` | 答卷 | Cowork (Opus) |

**問題**：
1. 三份答卷只有 `chat--` 那份有前綴，另外兩份只能靠打開檔案才知道是哪個視窗
2. 未來（第二次考試）要對照進步時，檔名排序會亂
3. 題目和答卷在 `ls` 時不會相鄰，找檔案費力

所有四份檔案目前都在 **untracked 狀態**（git status 確認過），尚未 commit。

---

## 2. 要做的事

### 動作 1：統一檔名格式 `exam-{date}-{role}-{type}.md`

**四個 `git mv`**（cd 到 repo 根後執行）：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

git mv docs/governance/governance-exam-2026-04-20.md \
       docs/governance/exam-2026-04-20-questions.md

git mv docs/governance/chat--governance-exam-answers-2026-04-20.md \
       docs/governance/exam-2026-04-20-chat-answers.md

git mv docs/governance/governance-exam-2026-04-20-answers.md \
       docs/governance/exam-2026-04-20-code-answers.md

git mv docs/governance/governance-exam-answers-2026-04-20.md \
       docs/governance/exam-2026-04-20-cowork-answers.md
```

⚠️ **git mv 細節**：目前這四份是 untracked，`git mv` 對 untracked 檔會報錯。可以改用兩步驟：

```bash
# 方案 A：直接用 mv（因為還沒 add），然後一次 add 新名字
cd ~/Desktop/01_專案進行中/paulkuo.tw

mv docs/governance/governance-exam-2026-04-20.md \
   docs/governance/exam-2026-04-20-questions.md

mv docs/governance/chat--governance-exam-answers-2026-04-20.md \
   docs/governance/exam-2026-04-20-chat-answers.md

mv docs/governance/governance-exam-2026-04-20-answers.md \
   docs/governance/exam-2026-04-20-code-answers.md

mv docs/governance/governance-exam-answers-2026-04-20.md \
   docs/governance/exam-2026-04-20-cowork-answers.md
```

先跑 `git status | grep governance` 確認四份都是 untracked，再選方案 A（純 mv）。

### 動作 2：新增 `exam-2026-04-20-INDEX.md`

**路徑**：`docs/governance/exam-2026-04-20-INDEX.md`

**內容**（約 80 行）：

```markdown
# 跨視窗治理考試 2026-04-20 — 索引

> 目的：測試三視窗（Chat / Code / Cowork）對 paulkuo.tw 治理框架的記憶與檢索能力
> 出題日期：2026-04-20
> 出題者：Paul

---

## 檔案清單

| 角色 | 檔案 | 說明 |
|------|------|------|
| 題目 | [exam-2026-04-20-questions.md](./exam-2026-04-20-questions.md) | 五層考題（事實 / 推理 / 情境 / 應用 / 治理哲學） |
| Chat 答卷 | [exam-2026-04-20-chat-answers.md](./exam-2026-04-20-chat-answers.md) | Chat 視窗作答（無 filesystem，只有 userMemories + conversation_search） |
| Code 答卷 | [exam-2026-04-20-code-answers.md](./exam-2026-04-20-code-answers.md) | Claude Code（Opus 4.7）作答，現場驗證 git HEAD |
| Cowork 答卷 | [exam-2026-04-20-cowork-answers.md](./exam-2026-04-20-cowork-answers.md) | Cowork 視窗作答（未連 paulkuo.tw 資料夾，模擬極限場景） |

---

## 結果概覽

| 視窗 | 分數 | 主要失分 |
|------|------|---------|
| Code | 97% | — |
| Chat | 77% | CLAUDE.md 行數 / 護欄編號 / 憲法第四條同層原子化細節 |
| Cowork | 70% | 司法對行政驗證場景 / 行政對立法前提 / 同層原子化實作 |

**結論**：
- Code 視窗因能現場驗證 git HEAD，幾乎滿分——**源頭事實規範（憲法第一條 SSoT）的威力**
- Chat 視窗 userMemories 有時間滯後，但推理能力足以補足細節缺口
- Cowork 視窗受限於「未掛載 repo」的極限場景，暴露 memory lag + 憲法五條知識死角

---

## 後續行動

| 行動 | 狀態 | 來源 |
|------|------|------|
| 憲法 v0.2 速記卡（含情境舉例） | ✅ 已完成 | commit 467e968，見 `constitution-v0.2-quick-reference.md` |
| auto-memory 補跨視窗考試發現 | ✅ 已完成 | `project_cross_window_exam_findings.md` |
| auto-memory 補憲法五條核心事實 | ✅ 已完成 | `project_constitution_v02_facts.md` |
| 檔案命名收斂 | ✅ 本次完成 | 本 INDEX + 四個檔案 rename |

---

## 相關文件

- 憲法 v0.2 速記卡：[constitution-v0.2-quick-reference.md](./constitution-v0.2-quick-reference.md)
- 協作憲法全文：[adr-collaboration-constitution-v0.2-2026-04-19.md](./adr-collaboration-constitution-v0.2-2026-04-19.md)
- 工作環境定義：[working-environment.md](./working-environment.md)

---

## 下次考試 Checklist（2026-Q3 或憲法 v0.3 後）

- [ ] 題目檔名沿用 `exam-{date}-questions.md` 格式
- [ ] 答卷檔名沿用 `exam-{date}-{role}-answers.md`（role = chat / code / cowork / [future window]）
- [ ] 寫入本 INDEX 對應欄位
- [ ] 對照本次分數，記錄進步與退步（哪些條文變強、哪些仍弱）
```

---

## 3. 驗收

```bash
# 1. 確認四份檔案都已改名
ls docs/governance/exam-2026-04-20-*.md

# 預期輸出（5 行）：
# docs/governance/exam-2026-04-20-INDEX.md
# docs/governance/exam-2026-04-20-chat-answers.md
# docs/governance/exam-2026-04-20-code-answers.md
# docs/governance/exam-2026-04-20-cowork-answers.md
# docs/governance/exam-2026-04-20-questions.md

# 2. 確認舊檔名已不存在
ls docs/governance/ | grep -E "^(governance-exam|chat--governance)" || echo "✓ 舊檔名已清除"

# 3. 確認 INDEX 內連結指向正確檔案
grep -E "\[exam-2026-04-20" docs/governance/exam-2026-04-20-INDEX.md
```

---

## 4. Commit

**Commit message**：

```
docs(governance): 考試檔案命名收斂 + 新增 INDEX [影響: governance 文件]

- 四份 2026-04-20 考試檔統一格式為 exam-{date}-{role}-{type}.md
  - governance-exam-2026-04-20.md → exam-2026-04-20-questions.md
  - chat--governance-exam-answers-2026-04-20.md → exam-2026-04-20-chat-answers.md
  - governance-exam-2026-04-20-answers.md → exam-2026-04-20-code-answers.md
  - governance-exam-answers-2026-04-20.md → exam-2026-04-20-cowork-answers.md
- 新增 exam-2026-04-20-INDEX.md 作為收斂入口（檔案清單 + 三視窗分數 + 後續行動）
- 訂立下次考試命名規則，避免日後再發生混亂
```

---

## 5. Worklog 記錄

`worklogs/worklog-2026-04-20.md` 追加：

**做了什麼**
- 四份考試檔案統一命名為 `exam-{date}-{role}-{type}.md` 格式
- 新增 `exam-2026-04-20-INDEX.md` 作為收斂入口
- 訂立下次考試命名規則

**決策紀錄**
- 不刪除任何答卷：三份答卷是治理考試的實證紀錄，未來第二次考試要對照進步必須保留
- 不合併成單一檔：三份答卷各代表一個視窗的獨立作答，合併會失去對照價值
- 用 INDEX 檔收斂入口而非 rename 合併：最小改動、最大組織效益

**阻礙與踩坑**
- （Code 自行填寫實際遇到的）

---

## 6. Push（Paul 執行）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git add docs/governance/exam-2026-04-20-*.md worklogs/worklog-2026-04-20.md && git commit -m "docs(governance): 考試檔案命名收斂 + 新增 INDEX [影響: governance 文件]" && git push
```

（完整 commit message 見第 4 節，Paul 可以改用 HEREDOC 帶完整版，或簡化成上面單行版。）

---

## 7. 完成後更新

- [ ] 本 handoff 檔頂部加 `> ✅ 完成於 2026-04-20 by Code / Sonnet 4.6`
- [ ] worklog-2026-04-20.md 待辦快照「governance/ 三份考試答案檔收斂」標 `[x]`

---

## 附註

**為什麼用 Sonnet + S**
- 純檔案重命名 + 寫一份 80 行索引，無邏輯風險
- 四個 `mv` + 一個 `Write` + 一個 commit，沒有跨模組推論
- Opus overkill

**為什麼不用 git mv**
- 四份檔案目前都是 untracked（尚未 `git add`），`git mv` 對 untracked 檔會報錯
- 直接用 shell `mv` 改名，然後一次 `git add` 新檔名即可
- 若 Code 執行時發現已被 add（例如有人先 add 了），改用 `git mv` 也行

**為什麼用 `{role}` 而非 `{window}`**
- 未來可能會有新的「角色」出現（例如 Claude in Chrome 的獨立測試、Code worktree 分身），用 `role` 比 `window` 更泛用
- 對應 session-handoff skill 的命名慣例（chat-- / code-- / cowork--）

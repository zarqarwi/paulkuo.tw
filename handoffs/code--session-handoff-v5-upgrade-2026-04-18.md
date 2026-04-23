---
target: code
project: session-handoff skill v5.0 — 主線 A（路線 C'' 定稿版）
purpose: 補齊三個 FAIL skill 的 frontmatter + 在 session-handoff 加入行數退休觸發條件 + lint 全 PASS Exit Gate
date: 2026-04-18
author: Cowork（本視窗，承接 Code 第三方驗證後的路線重定）
upstream:
  - handoffs/code--skill-source-verification-2026-04-18.md（驗證結果：522 為 ground truth）
  - handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md（路線重評）
  - handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18.md（baseline 完成）
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md（v5.0 整體規劃）
confidence: 高（有第三方驗證背書）
estimated_effort: 0.5 天
model_suggestion: Sonnet 4.6 + Medium（補 frontmatter 需細心但無架構決策）
route: C''（不拆只整理，推翻 rev3 §5 拆三份決策）
paul_decisions:
  - §2.1 scope：wiki-ingest + wiki-lint 補 frontmatter 納入主線 A
  - Q11：舊 session-handoff/SKILL.md 永久保留（C'' 下自然相容，不需搬 archive）
  - Q12：（C'' 下無三份新 skill，Q12 的命名決策暫存 v5.x 真的要拆時再用）
  - Q13：skill-schema-lint 納入 v5.0 exit gate 強制項（拆或不拆都適用）
---

# Code Handoff：session-handoff v5.0 主線 A（路線 C'' 定稿版）

## 0. 任務來源與路線改變的交代

### 0.1 原規劃（rev3 §5 + §10.2）

Chat #2 基於「SKILL.md 1086 行」論點，rev3 §5 決定拆成三份 skill（core / guardrails / ops），主線 A 工程量 2-3 天。

### 0.2 路線 C' → C'' 的轉折

2026-04-18 主線 B（skill-schema-lint POC）完成 baseline 後，Cowork 發現 `session-handoff/SKILL.md` 實際只有 522 行，非 1085/1086。Code 做第三方驗證（`handoffs/code--skill-source-verification-2026-04-18.md`）確認：

- Cowork sandbox 副本：522 行
- Mac 本機 repo：522 行
- 所有 local branches：522 行
- git 歷史峰值（4487e89, 2026-04-14）：522 行
- 白沙屯 repo 的 740 行版本是**不同專案**的獨立 skill，與 paulkuo.tw 無關
- **paulkuo.tw 的任何 commit、任何分支、任何副本都沒有 1000+ 行的歷史**

**結論**：1085 行是錯誤前提，rev3 §5 「拆 skill」的核心論證被拆台。

### 0.3 為什麼改走 C''（不拆只整理）

1. **§0「治理複雜度上界」剛立就要帶頭遵守**：skill 上限 900 行，522 行只達 58%，未達拆分觸發條件
2. **522 行拆三份會讓治理資產帳面膨脹或帳面持平但 skill 數量 +2**，都違反 §0 精神
3. **v5.0 的主要矛盾重新定義為**：建立 skill schema 機械擋 + 為治理複雜度立硬界 + 補齊現有 skill 合規缺口——這比「拆一份其實沒超限的 skill」更符合 Chat #3 §0.6「每個 major 只解一個主要矛盾」

### 0.4 這次轉折本身要寫進 v5.0 exit retro

見本 handoff §6。治理決策前沒驗 ground truth 就往下推論，是這輪規劃的教訓。退回是對的，但成本不小——寫進 retro 讓未來 major 版本規劃時第一步就是「驗源頭數字」。

---

## 1. 工作目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

所有產出路徑都以此為根。

**先確認分支**：

```bash
git status
git branch --show-current
```

如果在 `fix/formosa-post-event` 分支（主線 B 最後停在這），先切回 main 並 pull：

```bash
git checkout main
git pull origin main
```

---

## 2. 交付物

### 2.1 補 frontmatter（三個 skill）

#### 2.1.1 `session-handoff/SKILL.md`

目前第一行是 `# 多 Session 協作狀態管理 SOP v4.8`，缺 frontmatter。在檔首插入：

```yaml
---
name: session-handoff
description: Paul 的多 session（Chat / Cowork / Code）協作狀態管理 SOP。當 Claude 在任何 session 完成工作、開場盤點、撰寫 handoff / worklog、處理 Cowork 交接時必須載入。也在 session 開場檢查儀表板避免重複執行時觸發。關鍵觸發詞：handoff、交接、結案、部署完成、驗證通過、開始新一輪、繼續上次、接手、狀態確認。
---

# 多 Session 協作狀態管理 SOP v4.8
...
```

**參考範本**：`.claude/skills/formosa-feedback-triage/SKILL.md` 和 `.claude/skills/cross-project-impact/SKILL.md`（baseline PASS 的兩份，description 長度 213/305，都落在合規範圍）。

**description 長度檢查**：上面的 description 約 200 字元，落在建議範圍內。

#### 2.1.2 `wiki-ingest/SKILL.md`

第一行目前是標題，缺 frontmatter。插入：

```yaml
---
name: wiki-ingest
description: paulkuo.tw LLM Wiki 知識管線的 ingest 工作流程。當 Paul 要求處理 get_筆記、ingest 新內容到 wiki/sources/、提取 concepts / entities、更新 KV seed、或掃描 wiki-ingest-pending.md 時觸發。關鍵觸發詞：ingest、wiki 批次、concept 提取、wiki 來源、visibility 分類。
---
```

先 `cat .claude/skills/wiki-ingest/SKILL.md` 看內容再校準 description 用詞——上面是**草稿**，你要依實際內容微調。

#### 2.1.3 `wiki-lint/SKILL.md`

同上，插入：

```yaml
---
name: wiki-lint
description: paulkuo.tw LLM Wiki 的檔案品質檢查工具。當 Paul 要求檢查 wiki 頁面的 frontmatter、wikilinks 有效性、去識別化殘留、或跑 wiki_rescan.py 時觸發。關鍵觸發詞：wiki 檢查、wiki lint、wikilinks 驗證、wiki 品質。
---
```

同樣 `cat` 後校準。

### 2.2 加入「行數退休觸發條件」一節

在 `session-handoff/SKILL.md` 合適位置（建議放在檔尾附錄之前、或新增一個 `## 0. 治理上界與退休觸發` 章節）加入：

```markdown
## 0. 治理複雜度上界（v5.0 新增）

### 0.1 本 skill 的硬上限

- 本文字數：≤ 900 行（附錄不計）
- 達到 800 行時觸發拆分評估（core / guardrails / ops 三份架構已有雛形，見 handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md §5）
- 目前行數：522 行（2026-04-18 驗證，達上限 58%）

### 0.2 退休觸發條件

每次 major version 升級前，跑一次檢查：
- 本 skill wc -l ≥ 800 → 啟動 v5.x 拆分 procedure
- 連續 3 個月無觸發的護欄 → 評估退休
- 6 個月累積 < 5 份檔案的分層 → 評估併入上層

### 0.3 為什麼訂 800 行為觸發點而非 900 行上限

留 100 行緩衝期。達到觸發點時不立刻拆，先在 Issue #155 宣告「下一個 major 要拆」，規劃週期約一個 major 版本。避免觸發即動刀造成倉促決策。

### 0.4 本次拆分決策被推翻的教訓（2026-04-18）

v5.0 原規劃拆三份，基於「1086 行」假設。實際驗證後源檔 522 行，拆分不必要。治理決策前必須驗源頭數字。見 docs/governance/retrospective-2026-04-18-v5-split-reversal.md。
```

⚠️ **位置與行數衝突**：加這一節會讓 skill 從 522 行成長到約 555 行。仍遠低於 800 觸發點，安全。

### 2.3 v5.0 exit retrospective

`docs/governance/retrospective-2026-04-18-v5-split-reversal.md`：

```markdown
# v5.0 拆 skill 決策推翻 Retrospective — 2026-04-18

## 事實時序

- 4/17：Chat #2 提出「SKILL.md 1086 行太長」論點，rev3 §5 採納拆三份
- 4/17：主線 B（skill-schema-lint POC）handoff 發出
- 4/18 AM：主線 B 完成，baseline 揭露 3/5 skill 缺 frontmatter
- 4/18 PM：Cowork 準備寫主線 A handoff 前核對源檔，發現實際 522 行
- 4/18 PM：發 Code 第三方驗證 handoff，確認 paulkuo.tw 從無 1000+ 行歷史
- 4/18 PM：路線改 C''（不拆只整理），v5.0 主要矛盾重新定義

## 根因

治理決策（拆 skill）建立在未驗證的行數假設上。Chat #2 / 前一 Cowork 視窗的「1086 / 1085」數字來源不明，rev3 採納時未要求 ground truth 驗證。

## 代價

- 主線 B 工程量 1 天（仍有收穫：lint 工具 + baseline 揪出 3 個 frontmatter 缺口）
- 主線 A 規劃時間約 0.5 天（本視窗 + 前 Cowork 視窗）
- Code 第三方驗證 15-20 分鐘
- 總額外成本：≈ 1.2 天

## 學到什麼

1. **治理決策前必驗源頭數字**：任何基於「X 有多大」的論點，必須先 wc / ls / count 驗證
2. **跨視窗資料傳遞要 cite 原始指令**：前 Cowork 視窗 baseline handoff §1.3 寫「實測 1085 行」但沒貼 wc 輸出，成為數字傳遞的黑箱
3. **退回是對的，但要記帳**：為了維持 rev3 決策連續性而硬推，會造成治理資產膨脹——退回的成本（1.2 天）遠低於推下去的維運成本（三份 skill 永久多出的認知負荷）
4. **§0 治理複雜度上界的價值**：沒有 §0 做論據，退回會更困難（「拍板了就得做」vs「§0 說 522 沒超限、不用拆」）

## 對未來 major 規劃的流程改動

在任何 major version 規劃的 rev1 就加一步「源頭事實清單」：
- 每個「因為 X 所以要做 Y」的論點，X 必須有具體指令驗證（wc / grep / git log --stat）
- 指令輸出直接貼進規劃文件
- 後續 rev 若引用別的視窗的數字，必須重跑一次確認

此流程改動寫進 skill §0.5（資料依據）的更新版。

## 信心等級

**高**——教訓清楚，流程改動具體可執行。
```

### 2.4 重跑 skill-schema-lint

```bash
SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh
echo "exit code: $?"
```

**必須全 PASS**（5/5）。若有任何 FAIL 或 WARN，當場修、再跑、直到全 PASS。這是 v5.0 exit gate（Paul Q13 強制項）。

### 2.5 Commit 結構（三個原子 commit）

**commit 1**：frontmatter 補齊
```
chore(skills): add frontmatter to 3 skills [影響: skill governance only]

- .claude/skills/session-handoff/SKILL.md: add name + description frontmatter
- .claude/skills/wiki-ingest/SKILL.md: add name + description frontmatter
- .claude/skills/wiki-lint/SKILL.md: add name + description frontmatter
- post-lint baseline remediation (closes 3/3 FAIL from 2026-04-17 scan)

Part of session-handoff v5.0 主線 A（route C'' 不拆只整理）.
Upstream: handoffs/code--session-handoff-v5-upgrade-2026-04-18.md
```

**commit 2**：治理上界章節
```
feat(session-handoff): add §0 governance complexity upper bound [影響: skill governance only]

- 800 lines as split trigger, 900 lines as hard cap
- current: 522 lines (58% of cap)
- explicit retirement triggers for guardrails + layers
- record v5.0 split reversal lesson (link to retro)

Part of session-handoff v5.0 主線 A（route C''）.
```

**commit 3**：exit retro
```
docs(governance): v5.0 split reversal retrospective [影響: 治理框架]

- docs/governance/retrospective-2026-04-18-v5-split-reversal.md
- 522 vs 1085 數字矛盾根因分析
- 對未來 major 規劃的流程改動（源頭事實清單）

Part of session-handoff v5.0 主線 A（route C'').
```

三個 commit 最後一起 push。

### 2.6 Worklog 追加

`worklogs/worklog-2026-04-18.md` 追加：

```markdown
- HH:MM v5.0 主線 A 完工（route C''）：補 3 skill frontmatter + 加 §0 治理上界 + 寫 exit retro (<commit3 hash>) Code
- HH:MM Exit Gate：skill-schema-lint 全 PASS 5/5 Code
```

Session 結束時補三維度區塊（狀態變更 / 決策紀錄 / 阻礙與踩坑）。

---

## 3. 非目標（不要做）

- ❌ **不要**拆 skill。C'' 決策已由 Paul 拍板，不要自作主張拆成三份
- ❌ **不要**搬舊 SKILL.md 去 archive。Q11 永久保留，留在原位即可
- ❌ **不要**改 skill 內容語意。本任務只補 frontmatter + 加 §0 章節，其餘一字不動
- ❌ **不要**動 `formosa-feedback-triage` 和 `cross-project-impact`。它們已 PASS
- ❌ **不要**加 pre-commit hook。hook 延到 v5.1 評估
- ❌ **不要**動桌面 App Skills 設定。user-level `~/.claude/skills/` 目前不存在（見驗證報告 B 段），不需同步

---

## 4. 完成檢查清單

- [ ] `session-handoff/SKILL.md` 補 frontmatter（在檔首插入 `---` block）
- [ ] `wiki-ingest/SKILL.md` 補 frontmatter
- [ ] `wiki-lint/SKILL.md` 補 frontmatter
- [ ] `session-handoff/SKILL.md` 新增 `## 0. 治理複雜度上界` 章節
- [ ] `docs/governance/retrospective-2026-04-18-v5-split-reversal.md` 建立
- [ ] 三個原子 commit，commit message 含影響標注
- [ ] push 到 origin/main
- [ ] Exit Gate：`SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh` 全 PASS 5/5
- [ ] `worklogs/worklog-2026-04-18.md` 追加完成紀錄

---

## 5. 風險與阻礙預告

- **frontmatter description 長度校準**：兩個 wiki skill 的 description 草稿是 Cowork 猜的，你 cat 內容後要依實際功能微調。description 超過 1024 會 WARN，太短（<20 字元）也會 WARN。
- **YAML 特殊字元**：description 若含 `:`、`"`、`'`、`#` 要注意 YAML escape。保險做法用 block scalar `description: |` 或 `description: >`。參考 formosa-feedback-triage 的寫法。
- **session-handoff 加 §0 章節的位置**：目前第 1 行是 H1 標題，第 2-44 行是導言。建議把 §0 章節插在 `## 狀態同步三原則（v4 新增）` 之前（第 45 行前），這樣 §0 是第一個 H2。
- **lint 可能還有其他潛在 WARN**：baseline 只顯示 FAIL 3 WARN 0，補完 frontmatter 後若有某個 description 過長 WARN 要當場修。
- **分支衝突**：若 main 與 `fix/formosa-post-event` 分支有衝突，先 rebase 再動工。
- **Exit Gate 失敗的處置**：lint 沒全 PASS 就 **不算完工**。不要留「下次再修」，當場解決。

---

## 6. Handoff 給下一關

本任務完成後：
- v5.0 exit retro 已寫完 → 下一個 Cowork 視窗讀 retro 即可接手 v5.1 規劃
- skill-schema-lint 進 exit gate 強制 → 未來任何新 skill 或 skill 改動都要過 lint
- 行數退休觸發條件寫進 skill §0 → 未來 skill 達 800 行會自動提醒拆分評估

**Code 不用寫下一步 handoff**。本任務即 v5.0 主線 A 終點。

---

## 7. 背景檔案清單

### v5.0 規劃主線
- `handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md`（原規劃，§5 拆 skill 部分已被推翻）
- `handoffs/code--skill-schema-lint-poc-2026-04-17.md`（主線 B 已完成）
- `handoffs/code--skill-source-verification-2026-04-18.md`（第三方驗證已完成）
- `handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18.md`（baseline 完成）
- `handoffs/cowork--session-handoff-v5-split-reassessment-2026-04-18.md`（路線重評）

### Baseline 與驗證
- `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md`
- `worklogs/investigations/2026-04-18-skill-source-verification.md`

### 現有 frontmatter 合規範本
- `.claude/skills/formosa-feedback-triage/SKILL.md`（213 字元 description）
- `.claude/skills/cross-project-impact/SKILL.md`（305 字元 description）

---

## 8. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| 路線 C'' 正確性 | **高** | 第三方驗證確認 522 為 ground truth |
| frontmatter 補齊工程 | **高** | 純機械任務 |
| §0 章節行數預測（522→555） | **高** | 新增內容可精算 |
| Exit Gate 可通過 | **高** | 已知三個 FAIL，補完就 PASS |
| wiki 兩 skill 的 description 草稿合用度 | **中** | Code 要 cat 內容後校準 |
| 作為 v5.0 主線 A 終點夠不夠 | **中高** | Exit retro 已寫，但「v5.0 是否算完成」仍由 Paul 判定 |

**整體信心：高**。工程量清楚、Exit Gate 明確、路線決策有資料依據。

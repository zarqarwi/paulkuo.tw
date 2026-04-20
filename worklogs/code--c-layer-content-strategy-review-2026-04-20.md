# Code Briefing：C 層內容策略架構決策 — 請審查

建議模型: Sonnet 4.6（純審查，不寫程式碼）
預估量級: S（讀完給意見，10 分鐘內）
本輪 metrics: 0 commits, 0 files, +0/-0 lines, 0 deploy

---

## 背景（一段話版）

C 層（Claude.ai Personal Skill）冷凍在 v4.13（51KB，1086 行），A 層（repo `.claude/skills/session-handoff/SKILL.md`）已到 v5.6（31KB，639 行）。v5.x 重構把內容拆到 `CHANGELOG.md`、`docs/governance/working-environment.md` 等子檔案，A 層整體更完整但 SKILL.md 本體不再自足。Chat 讀不到子檔案，所以需要一份針對 Chat 能力邊界裁切的 C 層版本。Cowork 負責產出，動手前先讓 Chat 和 Code 各自審查方案。

---

## Cowork 提案一句話

C 層不是 A 層的 verbatim mirror，是 **adaptation**——保留 Chat 需要的規則，刪掉 Chat 用不到的執行細節，把 v5.x 拆到子檔案的核心內容 inline 回去。用獨立版本線（C 層 v1.0 對齊 A 層 v5.6）。

---

## Code 需要審查的 4 個問題

Code 是行政角色（改 code、deploy、實際落地），以下問題從工程實作角度出發。

### Q1：B 層同步的工程影響

CLAUDE.md 規定「每次 `.claude/skills/` 下任何 SKILL.md 有 commit，立即同步到使用者級 `~/.claude/skills/session-handoff/`」。

現在 C 層要變成「不等於 A 層」的獨立文件。這對 B 層（`~/.claude/skills/`）有沒有影響？目前 B 層是 A 層的 verbatim copy。如果未來 C 層有自己的版本，B 層應該繼續 mirror A 層還是 mirror C 層？

**Cowork 預設立場**：B 層繼續 mirror A 層（因為 B 層的讀者是 Code，Code 有 filesystem + terminal，跟 A 層相同能力邊界）。但需要 Code 確認這個假設。

### Q2：A 層 SKILL.md 是否需要配套修改

Cowork 產出 C 層 v1.0 後，A 層 SKILL.md 需不需要加一段說明？例如在標頭加：

```markdown
> **C 層說明**：Chat 使用的 C 層版本（Claude.ai Personal Skill）與本檔不同。
> C 層是針對 Chat 能力邊界裁切的 adaptation，版本線獨立。
> 詳見 `docs/governance/adr-c-layer-content-strategy.md`（待 Chat 立法）。
```

Code 覺得有需要嗎？如果有，什麼時候加比較好（Cowork 產 C 層前 / 同時 / 之後）？

### Q3：CHANGELOG.md 的 C 層版本記錄

C 層 v1.0 是一個新東西。它應該記在哪裡？選項：

- A）記在 A 層的 `CHANGELOG.md`（v5.6.1 或 v5.7，備註「C 層 v1.0 產出」）
- B）C 層自帶簡表（不進 A 層 CHANGELOG）
- C）兩邊都記

Code 的建議？

### Q4：未來 A 層改動時的 C 層同步提醒

CLAUDE.md 已有「Skill 同步」規則（改 `.claude/skills/` 後 cp 到 `~/.claude/skills/`）。C 層是 Paul 手動貼到 Claude.ai 的，沒有 cp 指令能搞定。

Code 端有沒有辦法在 commit message 或 post-commit hook 加一個提醒？例如：

```
feat: session-handoff v5.7 新增 xxx

⚠️ C 層影響：本次改動涉及 Chat 需知道的規則，Paul 需更新 Claude.ai Personal Skill
```

或者 Code 覺得這不是工程問題，應該交給 Cowork 在 PENDING.md / exit gate 追蹤就好？

---

## 不需要 Code 做的事

- 不需要寫任何程式碼
- 不需要 commit 或 deploy
- 不需要讀完整的 v4.13（1086 行）

只需要從工程實作角度回答 Q1-Q4，加上任何 Cowork 可能忽略的工程面洞察。

---

## 回報方式

Code 針對 Q1-Q4 各給判斷，加上任何補充。Paul 把 Code 回覆貼回 Cowork，Cowork 綜合 Chat + Code 意見後定案再動手。

---

## 參考路徑（如果 Code 想看原文）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# A 層現行版
cat .claude/skills/session-handoff/SKILL.md | head -20  # v5.6，639 行

# CHANGELOG
cat .claude/skills/session-handoff/CHANGELOG.md | head -30

# 憲法速記
cat docs/governance/constitution-v0.2-quick-reference.md | head -50

# CLAUDE.md Skill 同步規則
grep -A5 "Skill 同步" CLAUDE.md
```

本輪 metrics: 0 commits, 0 files, +0/-0 lines, 0 deploy（純決策文件）

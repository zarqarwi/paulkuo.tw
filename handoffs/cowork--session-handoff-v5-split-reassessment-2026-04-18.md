---
target: Paul（本視窗決策用）
project: session-handoff skill v5.0 — 主線 A 前置重評
purpose: 發現 skill 實際行數 522（非 baseline handoff 寫的 1085），重新評估「拆 vs 不拆」
date: 2026-04-18
author: Cowork（本視窗）
upstream:
  - handoffs/cowork--session-handoff-v5-baseline-complete-2026-04-18.md
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md
confidence: 中（僅驗 Cowork sandbox 側 repo 副本，Mac 本機 / 桌面 App / user-level ~/.claude/skills 未驗）
blocks: handoffs/code--session-handoff-v5-upgrade-2026-04-18.md（待 Code 第三方驗證 + 路線決策後才寫）
pending_verification: 需發 Code handoff 驗證 Mac 本機實體行數 / md5 / 其他副本位置，證實 522 是 ground truth 再做路線選擇
---

# v5.0 主線 A 拆 skill 決策重評

## 0. TL;DR

- 實際行數 **522 行**（非 1085），基於此行數的三份拆分會**讓治理複雜度膨脹**
- 522 行以「可接受單體」標準看**沒超過 §0 治理上限**（900 行）
- 建議改 **路線 C''：不拆、只整理 + 前置補 frontmatter**，把「拆成三份」延到未來真的超限時再做
- 此決策若通過，主線 A handoff 的工程量從 2-3 天縮到 0.5 天，但要寫進 v5.0 exit retro 說明「為什麼沒照 rev3 拆」

---

## 1. 事實基礎

### 1.1 當前 skill 實測

```
.claude/skills/session-handoff/SKILL.md     522 行
.claude/skills/wiki-ingest/SKILL.md         148 行（缺 frontmatter）
.claude/skills/wiki-lint/SKILL.md            99 行（缺 frontmatter）
```

```
H2（##）大節數：22
H1（#）標題數：60（含 H1-H6 全部）
平均每 H2 大節：24 行
```

### 1.2 git log 驗證

從 cfcb9ac（v4.0 初建）到 4487e89（最新 v4.13），SKILL.md 的累積變動遠低於 1000 行。單次最大變動 54 行（4487e89），更早的 v4.5 也只增 52 行。

**結論：這檔從頭到尾就沒到過 1085 行。** Chat #2 的估算 / 前一 Cowork 視窗 baseline handoff §1.3 的「實測 1085」兩個數字都不符合 git 史實，來源不明。

### 1.3 源頭推測（非關鍵，不追）

可能是：
- Chat #2 把 `/sessions/.../SKILL.md` 的某個 patched 版本誤計（含桌面 App 還沒同步的增量）
- 或是把多個相關檔案行數誤加總（含 CLAUDE.md、附錄、retro）
- 或是估算時單位認知錯誤

不追——目前 repo 的 ground truth 就是 522 行。

---

## 2. 對 v5.0 拆 skill 論證的衝擊

### 2.1 Chat #2 原始論點（rev3 §5.1 採納）

> SKILL.md 1086 行造成每次載入高 token 成本→拆 core/guardrails/ops 三份，日常只載 core，平均 token 支出砍 2/3。

**前提**：源檔 1086 行。

### 2.2 實際狀態對論點的影響

| 假設行數 | 1086 | 522 |
|---------|------|-----|
| 日常載入 token 成本 | 高 | 已可接受 |
| 拆後 core 目標 300 行 | token 砍 72% | token 砍 43% |
| 三份總和 ≤ 900 目標 | 比原始 17% | **比原始多 73%** |
| §0 治理上限（≤900）遵守情況 | 拆後剛好 | 拆後**超限**（三份總和超過未拆前） |

**關鍵矛盾**：若按 rev3 §5.1 的 300/350/250 目標拆，總和 900 > 當前 522。這違反 §0「治理資產總量不該膨脹」的精神——雖然 §0 沒明文禁止單項分層膨脹，但 Chat #3 挑戰治理膨脹的核心論點就是「以退休或合併為主，不以新增為主」。

### 2.3 若硬要拆——拆分目標必須重設

| Skill | rev3 原目標 | 合 522 行的新目標 | 佔比 |
|-------|------------|-----------------|------|
| core | ≤ 300 | ≤ 180 | 35% |
| guardrails | ≤ 350 | ≤ 200 | 38% |
| ops | ≤ 250 | ≤ 140 | 27% |
| **總和** | **≤ 900** | **≤ 520** | 100%（持平） |

按新比例拆，總量不膨脹，但 core 只剩 180 行——回到「這本來就不是 monster skill」的事實，拆的必要性存疑。

---

## 3. 三條備選路線

### 3.1 路線 C'（rev3 原訂，拆三份）

**做什麼**：照 rev3 §10.2 十步走，拆成 session-handoff-core / session-guardrails / session-ops 三份，按 §2.3 的新比例（≤180/200/140）重設目標。

**優點**：
- 維持 rev3 規劃連續性
- Chat #2 論點（分載入時機）仍成立——core 日常載、guardrails 出事才載、ops 結案才載
- 建立「未來 skill 達到 800+ 時怎麼拆」的範例

**缺點**：
- 522 行拆三份工程量與收益不成正比（token 省的不多）
- 違反 Chat #3 §0「不增加治理複雜度」精神——分層數 +2、檔案數 +2
- 實際節省的 token（約 40%）在 Claude 4.x 的脈絡裡不算關鍵
- 維運成本：三份 skill 要各自維護 frontmatter、changelog、退休機制

### 3.2 路線 C''（新提案，不拆只整理 + 補 frontmatter）

**做什麼**：
1. 補 `session-handoff/SKILL.md` 自己的 frontmatter（安全網）
2. 補 `wiki-ingest/SKILL.md` + `wiki-lint/SKILL.md` 的 frontmatter
3. **不做**內容拆分
4. skill 內加「當此檔超過 800 行時，觸發 v5.x 拆分 procedure」的退休觸發條件
5. 跑 lint 確認全 PASS
6. v5.0 exit retro 記錄「為什麼沒照 rev3 拆」

**優點**：
- 遵守 §0 治理複雜度上界——skill 數量不增
- 工程量 0.5 天 vs 路線 C' 的 2-3 天
- 保留未來真正需要時再拆的彈性
- lint 已證明有機械擋能力，skill 真的膨脹時會被偵測

**缺點**：
- 違背 rev3 已拍板「拆 skill 進 v5.0」（六題之二）——要走回頭路
- Chat #2 的核心工程目標落空
- v5.0 變成「只補 frontmatter + 整理」，major version 尺寸縮太小，不符「major 解一個主要矛盾」原則

### 3.3 路線 C'''（折衷，只拆兩份）

**做什麼**：拆 session-handoff-core（日常必載，含三原則 + Checklist + Worklog + Handoff）+ session-ops（Metrics + 工程慣例速查 + 退休機制 + 事故索引），**不**分出 guardrails——因為 522 行版本還沒有 17 條完整護欄，guardrails 內容量不足。

**優點**：
- 折衷方案，降治理資產 +1（比 C' 少）
- 仍實踐「按載入時機拆」原則
- core 保持 ≤ 300 行達到 Chat #2 目標（token 砍 40-50%）
- guardrails 待 v5.1 護欄補齊後再抽

**缺點**：
- 部分違背 rev3 決策（拆 2 非 3）
- 17 條護欄在 rev3 §7 已設計好，延後抽走會造成 ops 檔偏大
- 決策複雜度上升（下次要記得回來抽 guardrails）

---

## 4. 我的建議

**路線 C''（不拆只整理）**，原因：

1. **事實變了，決策要跟著變**。rev3 「拆 skill」拍板時基於 1086 行假設，現在發現源頭是 522 行，前提動搖。尊重原決策 ≠ 明知數字錯了還硬推。Chat #3 §0.6「每個 major version 只解一個主要矛盾」的精神是：不該為了不改決策而堆治理複雜度。

2. **§0「治理複雜度上界」剛立就要帶頭遵守**。skill 上限 900 行是上界不是下界。522 行的 skill 拆到 520 行總和是帳面持平、分層數卻 +2，這跟 §0 精神相反。

3. **Chat #2 論點在 522 行的尺度下弱化**。日常載入 522 行 vs 180 行的 token 差異，在 Claude 4.x 的前提下用戶體感不明顯，但三份 skill 的維運認知負荷是實打實的。

4. **v5.0 仍有「解一個主要矛盾」**：這個矛盾改成「**建立 skill schema 機械擋 + 為治理複雜度立硬界**」——第 0 章 + lint 自動化 + 補 frontmatter 三件事合起來本身就是一個主要矛盾。「拆 skill」退化為未來選項。

5. **Paul 的 Q11 選「永久保留」本就暗示你不想大動**。永久保留舊檔跟「拆成三份全新 skill」是張力選擇——選了前者代表你對大改動有保留。C'' 跟這個傾向一致。

---

## 5. 若採 C''，主線 A 的 10 步變 5 步

1. 補 `session-handoff/SKILL.md` frontmatter（name + description）
2. 補 `wiki-ingest/SKILL.md` frontmatter
3. 補 `wiki-lint/SKILL.md` frontmatter
4. skill 內新增「行數退休觸發條件」一節（800 行 → 觸發拆分 procedure）
5. 重跑 lint 確認全 PASS → commit + push + worklog

**工程量**：0.5 天（Sonnet 4.6 + Medium 即可，不需 Opus）
**commit 訊息**：`chore(skills): add frontmatter to 3 skills (post-lint baseline remediation) [影響: skill governance only]`
**v5.0 exit retro 必寫**：為什麼從「拆三份」改成「不拆」

---

## 6. 若採 C'（仍拆），主線 A handoff 要改什麼

- §5.1 三份 skill 目標行數改成 ≤180 / ≤200 / ≤140（總和 ≤520）
- 第 0 章加一句：「本次拆分發生在源檔 522 行時，非為 token 節省，而是為未來膨脹預置載入策略」
- 風險章要誠實寫：拆分成本 > 即時效益，理由是預置
- Q11「永久保留」跟 Q13「強制 lint PASS」的張力——舊檔保留位置要定：建議搬 `.claude/skills/archive/session-handoff-v4/` 脫離 lint 掃描路徑

---

## 7. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| 522 行是 ground truth | **高** | wc + git log --stat 雙重驗證 |
| 1085 行來源錯誤 | **高** | git 從未有過 |
| C'' 比 C' 合理 | **中高** | 論證站得住但要推翻 rev3 共識 |
| Paul 會選 C'' | **未知** | 需你拍板 |

---

## 8. 要你拍板的三個問題

1. **路線選 C' / C'' / C''' 哪個**？
2. 若選 C''，v5.0 exit retro 要不要我在 handoff 一併安排 Code 寫？
3. 若選 C'，拆分目標行數按 §2.3 新比例（180/200/140）可以嗎？

---
target: cowork（下一視窗接手）
project: session-handoff skill v5.0
purpose: 主線 B（skill-schema-lint POC）已完成，交接 baseline 結果 + 建議主線 A 調整 + 下一步行動
date: 2026-04-18
author: Cowork（本視窗，revision 3 規劃 + 主線 B 執行監督）
upstream:
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md
  - handoffs/code--skill-schema-lint-poc-2026-04-17.md
  - worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md
confidence: 高
estimated_next_step_effort: 主線 A handoff 撰寫 0.5 天 + Code 執行 2-3 天
---

# 下一個 Cowork 視窗接手包

## 0. 一句話交接

v5.0 主線 B（skill-schema-lint POC）已完成並 push。baseline 揭露 **3/5 skill 缺 frontmatter 的系統性問題**，其中包含 `session-handoff/SKILL.md` 本身（1085 行）。這個 finding 直接影響主線 A 的拆分策略——**拆 skill 的同時順便補 frontmatter**，一併處理。主線 A handoff 可以開始撰寫了。

---

## 1. 主線 B 完成現況（Paul 已驗收）

### 1.1 交付物

| 項目 | 路徑 | 狀態 |
|------|------|------|
| lint 腳本 | `scripts/skill-schema-lint.sh` | ✅ 可執行，支援 `SKILLS_DIR` 環境變數 |
| baseline 報告 | `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md` | ✅ 三段落齊全 |
| commit + push | 已上 origin/main，標 `[影響: skill governance only]` | ✅ |
| worklog 追加 | `worklogs/worklog-2026-04-17.md` | ✅ |

### 1.2 關鍵數字

```
掃描：5 files
PASS：2（formosa-feedback-triage、cross-project-impact）
WARN：0
FAIL：3（session-handoff、wiki-ingest、wiki-lint — 全部缺 frontmatter）
```

失敗率 60%。三個 FAIL 都是同一種錯誤——缺 frontmatter——且都是較早期建立的治理/內務型 skill。

### 1.3 `session-handoff/SKILL.md` 實測行數

**1085 行**（rev3 規劃寫的 1086 是 Chat #2 估算，幾乎一致，±0.1%）。
拆分依據的行數假設（core ≤300 / guardrails ≤350 / ops ≤250）總和 900 行，與 1085 的差是 **185 行**——合理的壓縮量（刪冗餘、合併重複說明），不用大幅調整拆分點。

**結論：rev3 §0 的 skill ≤900 行複雜度上限數字站得住腳。**

---

## 2. baseline 對主線 A 的影響（必讀）

### 2.1 Scope 需要微調

rev3 §10.2 原定主線 A 的九步，**新增一步**：

> **步驟 3.5（新增）：補 `wiki-ingest/SKILL.md` 和 `wiki-lint/SKILL.md` 的 frontmatter**

理由：
- 這兩個 skill 不是主線 A 原本要動的（主線 A 只拆 session-handoff），但 baseline 把它們揪出來了
- 工程量極低（每個 ~5 分鐘，共 10 分鐘）
- 若不一起處理，主線 A 完成後 lint 依然 FAIL 率 40%（2/5），治理體感沒改善
- 一起處理的 commit 訊息很清楚：`chore(skills): add frontmatter to wiki-ingest + wiki-lint (post-lint baseline remediation)`

**但這要徵求 Paul 同意**——嚴格來說超出主線 A 的原始 scope（session-handoff 拆分）。交接時記得問一句。

### 2.2 拆分後的 frontmatter 規範有範本了

baseline 顯示 `formosa-feedback-triage` 和 `cross-project-impact` 這兩個 PASS 的 skill 都有 **完整 frontmatter + description 長度 213/305 字元**，是現成的合規範本。

主線 A 拆分出的三份新 skill（core / guardrails / ops）的 frontmatter 可以直接參考這兩個。不用重新發明。

### 2.3 Exit Gate 新增一項

rev3 §10.2 主線 A 步驟 9「Exit Gate 驗證全套閉環」要擴充：

> **再跑一次 `SKILLS_DIR=.claude/skills bash scripts/skill-schema-lint.sh`，確認：**
> - 新拆的三份 skill 全部 PASS（不能引入新 FAIL）
> - 舊 `session-handoff/SKILL.md` 若標 deprecated，要嘛補 frontmatter、要嘛搬去 archive（不留在 `.claude/skills/` 下繼續 FAIL）

### 2.4 拆分順序建議

baseline 讓我們知道 `session-handoff/SKILL.md` 的第一個問題是缺 frontmatter。拆分步驟建議：

1. **先補 frontmatter** 到舊 SKILL.md（讓它暫時 PASS，作為安全網）
2. **再做內容拆分** 成三份新 skill
3. **最後標 deprecated** 舊檔

這樣每一步都是可驗證的：步驟 1 後跑 lint → PASS 4/5；步驟 2 後 → PASS 7/5（三新 skill 加入）；步驟 3 後 → 舊檔移出掃描範圍，PASS 6/5（新三份 + 原本兩份）。

---

## 3. 建議的主線 A handoff 撰寫重點

下一個 Cowork 視窗要寫 `code--session-handoff-v5-upgrade-2026-04-18.md`（日期改 4/18 因為跨日了）。關鍵段落：

### 3.1 必要調整 vs rev3 §10.2

| 項目 | rev3 原訂 | baseline 後調整 |
|------|----------|---------------|
| 步驟總數 | 9 步 | **10 步**（新增步驟 3.5 補 wiki 兩 skill frontmatter）|
| 拆分前置動作 | 未提 | **先補 session-handoff 自己的 frontmatter**（安全網）|
| Exit Gate lint | 未強制 | **強制重跑 lint，新三 skill 必須全 PASS** |
| frontmatter 範本 | 自訂 | **參考 formosa-feedback-triage / cross-project-impact** |

### 3.2 風險提示給 Code

- `.claude/skills/` 實體位於 **Mac 本機** `~/.claude/skills/`，不是 repo 內——Code 動這些檔案要特別注意是 user-level 不是 project-level
- 桌面 App Skills 設定同步要 Paul 手動做（拆完後 Paul 要在 Claude Code 桌面 app 裡重掃 skills）
- `session-handoff/SKILL.md` 1085 行 + 內容耦合強，拆分時極可能發現邏輯跨段——預留迭代空間

### 3.3 模型建議維持

**Opus 4.6 + High**——rev3 §13 的判斷仍成立，baseline 沒改變這點。需要讀 1085 行 + 理解三份拆分的語意邊界 + 寫三份新 skill 的 frontmatter，是重認知任務。

---

## 4. 主線 B 的副作用（未在 rev3 規劃中）

這些是 baseline 報告第 35-37 行的建議，**不屬於 v5.0 scope，但值得下個 Cowork 視窗記一下**：

1. **排程定期 lint**：短期靠 Cowork session 開場 checklist（每週一次），長期考慮進 scheduled-tasks。
2. **pre-commit hook（v5.1 評估）**：60% 失敗率證明機械擋有必要。v5.1 再評估是否加 hook。
3. **lint 腳本自身的演進**：目前只檢基本 schema，未來可擴充——檢 `allowed-tools` 欄位、檢 `model` 欄位、檢內部 wikilink 是否有效等。

這些不進主線 A，但要在主線 A handoff 或 v5.0 exit retro 裡記錄為「v5.1 候選」。

---

## 5. 其他未動議題（延續 rev3）

revision 3 的 Q11-Q13 還沒解，下個 Cowork 視窗可以一併問 Paul：

- **Q11**：拆分後舊 `session-handoff/SKILL.md` 處置——刪 / deprecated 一個月 / 永久保留？（我傾向 deprecated 一個月）
- **Q12**：三份新 skill 命名——`session-handoff-core` / `session-guardrails` / `session-ops`？還是拿掉 `handoff` 字樣？（我傾向保留 `handoff` 在 core）
- **Q13**：lint 是否納入 v5.0 exit gate 強制項？（我強烈建議是，§2.3 已寫進）

---

## 6. Paul 本輪已拍板決策（不必重問）

- ✅ 路線 C' 序列（B→A），不平行
- ✅ 拆 skill 進 v5.0（core/guardrails/ops）
- ✅ 治理複雜度上限 §0（護欄 ≤20 / skill ≤900 行 / 分層 ≤5 / session 類型 ≤4）
- ✅ 撤回 Cockpit/Ground Station/L1.5 到 v5.1+
- ✅ 17 條護欄 A/B/C/D 主題碼
- ✅ Metrics 三階段（Month 1 非強制 + scheduled task）
- ✅ 外部專案登記全部待定，不做
- ✅ 今日 session 結束節奏——「一步一步來，治理規範要有治理執行節奏配合」

最後這條是 Paul 今天的核心指示，下個 Cowork 視窗接手時請繼續這個節奏——**不預排下一步，等 Paul 觸發再動**。

---

## 7. 下個視窗開場 checklist

1. 讀本 handoff 頂到尾
2. 讀 `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md`（3 分鐘）
3. 讀 `handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md` §10 + §14（重點 5 分鐘）
4. 跟 Paul 確認：
   - §2.1 是否同意把 wiki-ingest / wiki-lint 補 frontmatter 納入主線 A（超 scope 小動作）
   - Q11-Q13 三題
5. 開始撰寫 `handoffs/code--session-handoff-v5-upgrade-2026-04-18.md`
6. 交給 Paul 開新 Code session 執行（Opus 4.6 + High，估 2-3 天）

---

## 8. 背景檔案清單（若需回查）

### v5.0 規劃主線
- `handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md`（定稿規劃）
- `handoffs/chat--session-handoff-v5-planning-2026-04-17.md`（rev2 已被取代）
- `handoffs/code--skill-schema-lint-poc-2026-04-17.md`（主線 B 已完成）

### 三份 Chat 審查意見
- `chat--session-handoff-v5-review-2026-04-17.md`（Chat #1）
- `chat--session-handoff-v5-second-opinion-2026-04-17.md`（Chat #2，提出拆 skill）
- `chat--session-handoff-v5-meta-review-2026-04-17.md`（Chat #3，提出治理複雜度上界）

### baseline 與 worklog
- `worklogs/investigations/2026-04-17-skill-schema-lint-baseline.md`
- `worklogs/worklog-2026-04-17.md`（三維度齊全，含路線 C → C' 調整紀錄）

### auto-memory 新條目
- `feedback_serialize_dependent_tracks.md`（evidence 依賴強制序列化原則）

---

## 9. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| 主線 B 交付品質 | **高** | Paul 已按 §5 逐項驗收 |
| baseline 對主線 A 的影響分析 | **高** | 數字清楚、調整範圍小、不改 rev3 核心設計 |
| 拆分行數假設仍可用 | **高** | 1085 → 900 差 185 行是合理壓縮量 |
| 10 步主線 A 流程 | **中高** | 步驟清晰，但實際動刀時會遇到邏輯跨段問題（預留迭代空間） |
| wiki 兩 skill 補 frontmatter 納入 scope | **中** | 超原 scope，需 Paul 同意 |

**整體信心：高。主線 A 可以開始寫 handoff 了。**

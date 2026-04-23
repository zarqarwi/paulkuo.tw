---
title: session-handoff skill v5.1 規劃 — revision 1
target: paul
project: session-handoff skill
purpose: v5.1 收尾 rev3 §3 七項 scope 中未完成的三項（B 護欄編號化 / D 撞車 retro / E 抽 changelog）
date: 2026-04-18
revision: 1
author: Cowork（本視窗）
status: Proposed（等待 Paul 拍板，rev2 才是 Accepted 定稿）
supersedes: handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md（僅就 v5.1 scope 部分，不推翻 v5.0 已落地決策）
upstream:
  - handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md（rev3 §3 七項 scope 源頭）
  - docs/governance/retrospective-2026-04-18-v5-split-reversal.md（v5.0 教訓）
  - docs/governance/working-environment.md（§2 源頭事實規範、§1.3 verifier + planner 分離）
  - worklogs/investigations/2026-04-18-v5-1-source-verification.md（本 rev1 的源頭事實依據）
next_step: Paul 拍板 Q-V51-1 ~ Q-V51-5 → Cowork 寫 rev2 定稿 → 三份 Code handoff
confidence: 高（源頭事實已 Code 驗證，scope 限定為 rev3 §3 未完成項，無新增 scope）
estimated_task_size: S+S+S（B + D + E 共約 1-2 天）
sources_of_truth_manifest: §7 附錄 A
verified_by: Code-verified（2026-04-18，commit 734c476）
---

# session-handoff skill v5.1 規劃（revision 1）

## 0. TL;DR

v5.0 route C'' 完成 §0 治理複雜度上界 + frontmatter 補齊 + lint 工具，rev3 §3 七項 scope 仍有五項未動。本次 v5.1 依工程框架推導篩選 **B + D + E 三項**，共同主軸「將已發生但未資產化的治理產物，收進正確位置」。A（四層架構）與 C（Metrics 三階段）屬於「建新基礎設施」主軸，延 v5.2 再議。

---

## 1. 源頭事實清單（依 working-environment.md §2.6 規範）

本 rev1 所有「因為 X 所以要做 Y」論點的 X 來源，全部由 Code session 驗證（commit 734c476），指令輸出見 `worklogs/investigations/2026-04-18-v5-1-source-verification.md`。

| 論點 | X 的源頭數字 | 驗證指令 | 出處 |
|------|------------|---------|------|
| SKILL.md 不需拆分 | 553 行（< 800 觸發點，< 900 上限） | `wc -l .claude/skills/session-handoff/SKILL.md` | §2.1 |
| git 歷史從未 1000+ 行 | 峰值 553 | `git log --all ... \| wc -l` | §2.5 |
| changelog 區塊實際佔多少 | **38 行**（第 13-50 行） | `awk '/^> \*\*v4.8/{...}/^## 0\./{...}'` | Cowork sandbox 複驗 |
| 既有檔案無舊護欄編號引用 | 0 筆（rename mapping 成本 = 0） | `grep -rnE "護欄\s*#[0-9]+"` | §2.2 |
| SKILL.md 內無 `#N` 護欄編號格式 | 0 筆 | `grep -cE "^#### #[0-9]+"` | §2.2c |
| 所有 skill frontmatter 合規 | 5/5 OK | for loop head -1 check | §2.4c |
| investigations/ 現有檔案 | 1 份（skill-schema-lint-baseline） | `ls -la worklogs/investigations/` | §2.3a |
| 跨 Cowork 撞車 retro 不存在 | 0 份 | `grep -rlE "跨.?Cowork\|撞車\|collision"` | §2.3c |

### 1.1 本次驗證意外發現：rev3 §7「17 條護欄」前提與實況不符

rev3 §7 表格主張「現有 15 條護欄（#1-#15）+ 新增 2 條 = 17 條」，但核實 SKILL.md 實際內容：

- 實際格式：`### 鐵律` 下共 **11 條**，以 markdown 流水號 `1. 2. 3. ...` 呈現
- **無 `#N` 編號前綴**——既有檔案引用「護欄 #N」或「鐵律 #N」為 0 筆
- rev3 §7 表格的 `#1` `#2` ... `#15` 對應關係無法在 SKILL.md 找到源頭

**這是 v5.0「1086 行無 ground truth」教訓的第二個實例**——治理規劃引用了**從未在源檔存在過**的編號系統。

**對 v5.1 B 的影響**：

| 項目 | rev3 §7 預設 | 實際應做 |
|------|-------------|---------|
| 工作性質 | 舊 #N rename 為 A/B/C/D 主題代碼 | **首次建立編號系統**（11 條鐵律 + 新增 2 條 = 13 條起跳） |
| Rename 成本 | 需改既有 worklog / handoff / retro 引用 | 0（無既有引用） |
| 總條數 | 17 條 | 需重新分組後計算（可能 11-13 條之間） |

這個發現也記進 §6「治理 meta 紀錄」——v5.0 + v5.1 兩次撞到「治理文件空中樓閣」，需列為明文規則。

### 1.2 本次驗證次要發現：SKILL.md 的治理上界緩衝

| 指標 | 當前 | 觸發點 | 硬上限 | 緩衝 |
|------|-----|-------|-------|------|
| SKILL.md 行數 | 553 | 800 | 900 | 還有 247-347 行 |
| CLAUDE.md 行數 | 245 | — | 200（官方軟上限） | **已超 22.5%** |
| working-environment.md | 408 | — | 無明定 | — |
| 護欄條數 | 11 | — | 20 | 還有 9 條 |
| Skill 數量 | 5 | — | — | — |

SKILL.md 目前仍在安全範圍。CLAUDE.md 越界問題屬 v5.2 候選（不在 v5.1 scope）。

---

## 2. v5.1 主要矛盾

**將已發生但未資產化的治理產物，收進正確位置**。

v5.0 route C'' 落地後，下列三件事仍處於「已發生但未歸檔」狀態：

1. **鐵律的 11 條規則 + 4/17 兩條新事故**（B）——規則存在但無編號系統，無法引用
2. **跨 Cowork 撞車事件**（D）——事件發生 1 天了，尚無獨立 retro 檔案
3. **SKILL.md 頂部 38 行 changelog**（E）——歷史混在規範本體裡，違反「規範與歷史分離」原則

三者共同特徵：**產物已經存在，缺的是歸檔**。不是新建基礎設施，是現有治理資產的重整。

### 2.1 為什麼 A 與 C 不進 v5.1

| 項目 | 主軸 | v5.1 不納入理由 |
|------|-----|-------------|
| A. 四層檔案架構（L1+L2+L3+L5） | 建新基礎設施 | 38 個 handoff 要搬遷、搬遷 script 需 dry-run + Paul 審 → 工程量 M，破壞 v5.1 主軸收斂性 |
| C. Metrics 三階段 + 月結 task | 建新基礎設施 | scheduled task 管線 + aggregator script → 工程量 M，同樣破壞收斂性 |

v5.2 候選會是 A + C，加上 CLAUDE.md 245 行越界處置。

---

## 3. v5.1 scope 三項

### 3.1 D — 跨 Cowork 撞車 retro

**本質**：事件紀錄歸檔。

**交付物**：`worklogs/investigations/2026-04-18-cross-cowork-session-collision.md`

**為什麼先做**：
- 時效性最高（事件已 1 天，記憶開始模糊）
- 獨立無依賴
- 工程量 S（純文件）

**內容大綱**：
- 事實時序（4/17 PM 兩個 Cowork 視窗同時動治理規劃）
- 根因（假設 Chat/Cowork/Code 線性協作，未預見同角色並發）
- 目前間接對策（§0.6 major 版本宣告主要矛盾 + Issue #155 單一事實來源）
- 直接對策（meta 治理宣告護欄）延到 v5.2 觀察
- 信心等級

**執行者**：Cowork 自己寫（屬文件類，符合 working-environment.md §1.2「寫 handoff / retro 類：Cowork ✅」）。
但文件寫完**不由 Cowork commit**——sandbox `.git/index.lock` 已知問題，交 Code 本機 commit（同 v5.0 rev2 的模式）。

**Exit Gate**：
- [ ] retro 文件建立，含「事實時序 / 根因 / 代價 / 學到什麼 / 流程改動 / 信心等級」六區塊
- [ ] Code commit + push
- [ ] worklog 追加一行

---

### 3.2 B — 護欄編號系統首建

**本質**：為既有 11 條鐵律首次上編號 + 新增 2 條 = 13 條（分組待 rev2 決定）。

**交付物**：`.claude/skills/session-handoff/SKILL.md` §「鐵律」節改寫。

**重新定義（依 §1.1 發現）**：

工作從 rev3 §7 「舊 #N rename 為主題代碼」重新定義為：

- **B-a**：給 11 條鐵律首次上編號（目前無編號）
- **B-b**：新增 2 條事故對應護欄
  - A6：陰性結果結論節制（4/17 另一 Cowork 視窗事故源）
  - C6：SSoT 變更驗證（4/17 同上）
- **B-c**：依主題分組命名（A/B/C/D 代碼）

**分組草案（rev2 會依實際 11 條內容調整）**：

| 代碼 | 主題 | 預估條數 |
|------|-----|--------|
| A | 程式碼委託 + UI / 結論節制 | 4-5 條 |
| B | 驗證盲區意識 | 1-2 條 |
| C | 真相驗證 + SSoT | 3-4 條 |
| D | Propose-then-Commit / 善意過度 | 2-3 條 |

**實際分組由 rev2 階段進行（Cowork 讀 11 條實際內容後依主題歸類）**，rev1 先建立原則。

**為什麼 B 在 D 之後**：
- 與 D 無強依賴
- 工程量 S（純改 SKILL.md 文字）
- 順序是純時效考量（D 先做、B 次之）

**Exit Gate**：
- [ ] SKILL.md 「鐵律」節改寫為編號系統
- [ ] 新增 A6 / C6 條文
- [ ] skill-schema-lint 跑過 PASS
- [ ] worklog 追加 + commit + push

---

### 3.3 E — 抽 changelog 成獨立 CHANGELOG.md

**本質**：規範與歷史分離。

**交付物**：
- 新增：`.claude/skills/session-handoff/CHANGELOG.md`（收納 v3-v4.8 共七段註記 + v5.0）
- 改寫：SKILL.md 第 13-50 行區塊替換為一行「完整版本歷史見 CHANGELOG.md」

**為什麼做（採用「治理一致性」理由而非「縮行數」理由）**：

- **不是**為了省 token（skill loader 載入整份，前中後無差別）
- **不是**為了縮行數（6.9% 無感）
- **是**為了讓 skill 本體只講「當前規則」，歷史歸檔到專屬位置
- **是**收尾 rev3 §7「附錄 A 抽離 v3-v4.x changelog」的遺留項

**為什麼 E 最後做**：
- 純文件搬家，最無風險
- 放在 D + B 之後，確保 SKILL.md 改完的護欄編號同步寫進 v5.1 這一版的 changelog entry

**新 CHANGELOG.md 格式草案**：

```markdown
# session-handoff skill — Changelog

## v5.1 (2026-04-18)
- 鐵律首次上編號系統 + 新增 A6 / C6 共 13 條
- 跨 Cowork 撞車 retro 歸檔
- changelog 抽離 SKILL.md 獨立成本檔案

## v5.0 (2026-04-18)
- 新增 §0 治理複雜度上界（900 行硬界 / 800 觸發 / 200 預警）
- 補 3 個 skill 的 frontmatter（Exit Gate 5/5 PASS）
- route C''（不拆只整理，推翻 rev3 拆三份決策）

## v4.8 (2026-04-1x)
（沿用 SKILL.md 原文）

（... v4.7, v4.6, ... v3 依序往下）
```

**Exit Gate**：
- [ ] CHANGELOG.md 建立，收納 v3 → v5.1 完整歷史
- [ ] SKILL.md 第 13-50 行替換為一行指引
- [ ] skill-schema-lint PASS
- [ ] worklog + commit + push

---

## 4. 執行序列（依賴分析）

```
D（撞車 retro）── 獨立，最先
    ↓ 完成後
B（護欄編號化）── 改動 SKILL.md 「鐵律」節
    ↓ 完成後
E（抽 changelog）── 改動 SKILL.md 第 13-50 行 + 新增 CHANGELOG.md
```

**為什麼 B → E 不是 E → B**：

若 E 先做，抽離 changelog 後 SKILL.md 第 13-50 行已消失；B 完成後需在 CHANGELOG.md 新增 v5.1 entry 記錄編號化。順序 D → B → E 讓：
- B 執行時 SKILL.md 仍有 v4.8 changelog（作為歷史參照）
- E 執行時 B 已完成，CHANGELOG.md 的 v5.1 entry 可一次寫完整

**commit 原子性**：三項各自獨立 commit，不混改。

---

## 5. 治理 meta 紀錄：空中樓閣現象

### 5.1 兩次實例

| 事件 | 時間 | 性質 |
|------|-----|------|
| v5.0 「SKILL.md 1086 行」 | 2026-04-17 | 基於未驗證行數假設拍板拆 skill |
| v5.1 「rev3 §7 #1-#15 編號系統」 | 2026-04-18 | 基於未驗證編號系統規劃 rename |

### 5.2 共同模式

- 治理文件中出現**言之鑿鑿的具體數字 / 編號 / 規格**
- 在 Chat → Cowork 跨視窗接力時被引用
- 動工前沒人核對源檔，僅在執行準備階段 Cowork 手動驗才發現
- 代價：v5.0 浪費 1.2 天；v5.1 幸好在 rev1 階段就抓到（代價 15 分鐘 Code 驗證）

### 5.3 對應機制

working-environment.md §2.6「源頭事實清單」規範已建立，本 rev1 §1 就是首次落地實例。**機制成立**——連續兩次踩雷都被規範擋下（v5.0 事後、v5.1 事前）。

建議 v5.2 觀察本機制的三次以上實例後，考慮是否升格為 skill 護欄（暫名 E1「治理文件引用之源驗證」）。**v5.1 不納入 scope**。

---

## 6. 明確不納入 v5.1 的項目

依 rev3 §0.6「每個 major 只解一個主要矛盾」原則：

| 項目 | 來源 | v5.1 不做原因 | 去哪裡 |
|------|-----|------------|-------|
| A. 四層檔案架構 | rev3 §3 #2 | 建新基礎設施，破壞 v5.1「整理既有」主軸 | v5.2 候選 |
| C. Metrics 三階段 | rev3 §3 #5 | 同上，且需 scheduled task 管線 | v5.2 候選 |
| CLAUDE.md 245 行越界處置 | 本輪驗證發現 | 不屬 v5.1 主軸 | v5.2 候選 |
| E1 meta 治理護欄 | §5.3 | 只有兩次實例，一次事故不足以立護欄（rev3 §2 第 4 點原則） | v5.2+ 觀察 |
| fix/formosa-post-event 分支 stash | worklog 未完待辦 | 不屬 skill 治理主軸 | 另獨立處理 |

---

## 7. 需要 Paul 拍板的五題（Q-V51-1 ~ Q-V51-5）

### Q-V51-1：主要矛盾定義

「將已發生但未資產化的治理產物，收進正確位置」作為 v5.1 主要矛盾，接受嗎？

### Q-V51-2：scope 三項（B + D + E）確認

依 §3 重新定義後的 B + 撞車 retro D + 抽 changelog E，接受嗎？

### Q-V51-3：執行序列 D → B → E

依 §4 依賴分析，順序是 D → B → E，接受嗎？

### Q-V51-4：B 的重新定義

B 從「rename」重新定義為「首次建立編號系統 + 新增 2 條 = 13 條起跳（分組待 rev2）」，接受嗎？

### Q-V51-5：E 的理由採用「治理一致性」

E 的理由不採「擋住正文」或「縮行數」，改採「規範與歷史分離」+「rev3 §7 自然收尾」，接受嗎？

---

## 8. Paul 拍板後的下一步

1. Cowork 寫 `handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md`（Accepted 定稿）
2. Cowork 寫三份 Code handoff：
   - `handoffs/code--v5-1-D-cross-cowork-retro-2026-04-18.md`
   - `handoffs/code--v5-1-B-guardrail-numbering-2026-04-18.md`
   - `handoffs/code--v5-1-E-changelog-extraction-2026-04-18.md`
3. Code 依 D → B → E 順序執行（三天內可完成，依 Paul 排程）
4. 每項完成後 skill-schema-lint 驗證 + worklog 更新
5. v5.1 結案後 Cowork 更新 Issue #155 + 寫 v5.1 retrospective（簡短版，本次無重大教訓）

**模型建議**：
- D retro：Cowork 自寫 → Code commit（模型建議 Sonnet 4.6 + Low for commit 任務）
- B 編號化：Code + Sonnet 4.6 + Medium（需理解 11 條內容做主題分類）
- E 抽 changelog：Code + Sonnet 4.6 + Low（純文件搬家）

---

## 9. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| §1 源頭事實清單 | **極高** | Code 第三方驗證完成（commit 734c476），Cowork sandbox 複驗一致 |
| §2 主要矛盾定義 | **高** | 三項共同特徵「已發生但未資產化」收斂度高 |
| §3.1 D（撞車 retro） | **高** | 純文件，無技術風險 |
| §3.2 B（護欄編號化） | **中高** | 分組草案需讀 11 條實際內容後才能精確落地，rev2 階段會再核 |
| §3.3 E（抽 changelog） | **高** | 純文件搬家，理由採「治理一致性」避免 rationale drift |
| §5 空中樓閣 meta | **高** | 兩次實例模式清楚，機制已有（§2.6 規範） |
| §7 五題拍板設計 | **高** | 每題都有源頭事實支撐，無「憑感覺」選項 |

**整體信心：高**。rev1 的所有論點都有源頭事實或明文原則支撐，沒有「憑感覺」的判斷。

---

## 附錄 A：源頭事實清單（Sources of Truth Manifest）

依 working-environment.md §7 規範，本 rev1 每個「X → Y」論點的 X 源頭：

| 論點 | X 源頭 | 命令 / 出處 |
|------|-------|-----------|
| §1 所有數字 | Code 驗證報告 | `worklogs/investigations/2026-04-18-v5-1-source-verification.md`（commit 734c476） |
| §1.1 rev3 §7 編號系統不存在 | Code §2.2 全域 0 筆 + Cowork 讀 SKILL.md 第 84-108 行確認 | §2.2a/b/c + SKILL.md line 84-108 |
| §1.1 changelog 38 行 | Cowork sandbox 複驗（更精確 awk） | `awk '/^> \*\*v4.8/.../^## 0\./'` |
| §2.1 A/C 屬建新基礎設施 | rev3 §3 明載 Metrics 三階段 + 四層架構 | handoffs/chat--session-handoff-v5-planning-2026-04-17-rev3.md §3 |
| §5 空中樓閣兩次實例 | v5.0 retrospective + 本次驗證 | docs/governance/retrospective-2026-04-18-v5-split-reversal.md + §1.1 |

---

## 附錄 B：與 rev3 的差異對照

| 項目 | rev3（2026-04-17） | v5.1 rev1（2026-04-18） | 變因 |
|------|-------------------|----------------------|------|
| 主要矛盾 | 降低 skill 載入成本 + 治理上界 | 整理既有治理資產 | v5.0 已解完前者 |
| scope 數量 | 7 項 | 3 項（B/D/E） | §0.6 一個矛盾原則 |
| 拆 skill | 三份 core/guardrails/ops | 不拆（v5.0 route C''） | 源頭驗證 |
| 護欄總數 | 17（#1-#15 + 新增 2） | 13 起跳（11 + 新增 2） | §1.1 空中樓閣發現 |
| 四層架構 | v5.0 納入 | v5.2 候選 | 主軸收斂 |
| Metrics 三階段 | v5.0 納入 | v5.2 候選 | 主軸收斂 |
| 跨 Cowork 撞車 retro | v5.0 納入 | **v5.1 保留（D 項）** | 時效性 |
| 抽 changelog | v5.0 納入 | **v5.1 保留（E 項）** | rev3 §7 收尾 |
| 源頭事實清單規範 | 無 | **§1 首次落地** | v5.0 教訓 |

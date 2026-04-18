# v5.1 結案 Retrospective — 2026-04-18

## 事實時序

- 4/18 上半日：v5.0 結案（route C'' 落地，working-environment.md rev2 部署）
- 4/18 下半日：Paul 要求 v5.1 規劃，Cowork 依 v5.0 新規則跑流程
- 4/18 下半日：Cowork 先發 Code 驗證源頭事實（commit 734c476）——避免 v5.0「1086 行幻值」重演
- 4/18 下半日：Cowork 依驗證結果寫 rev1（Proposed，含 5 題待拍板）；發現 rev3 §7「17 條編號系統」從未在 SKILL.md 存在（空中樓閣 #2）
- 4/18 下半日：Paul 拍板 Q-V51-1 ~ Q-V51-5 全 5 題 → rev2 Accepted
- 4/18 晚：D 執行完成（fdb4564 → push 0609f16）——跨 Cowork 撞車 retro 歸檔
- 4/18 晚：B 執行完成（f0154e4 → push 8b75f2e）——13 條編號系統首建 + 命名規則子節
- 4/18 晚：E 執行完成（e17d6f4）——SKILL.md 10 段 changelog 抽離至 CHANGELOG.md

## v5.1 主要矛盾

**將已發生但未資產化的治理產物，收進正確位置**。

三項 scope（D → B → E）共同特徵：產物已經存在，缺的是歸檔。未建任何新基礎設施。

## 交付物

| scope | 交付物 | commit |
|-------|-------|--------|
| D | `worklogs/investigations/2026-04-18-cross-cowork-session-collision.md` | fdb4564 |
| B | SKILL.md 第 86-108 行 → 13 條編號系統（A2/B4/C5/D2）+ 命名規則子節 | f0154e4 |
| E | `.claude/skills/session-handoff/CHANGELOG.md`（12 段 v3→v5.1）+ SKILL.md 13-47 行 → 一行指引 | e17d6f4 |

**副產物**：
- `handoffs/code--v5-1-source-verification-2026-04-18.md` + `worklogs/investigations/2026-04-18-v5-1-source-verification.md`（source truth manifest 首次落地範例）
- `handoffs/cowork--session-handoff-v5-1-planning-rev1-2026-04-18.md`（Proposed，含 5 題 + 空中樓閣 meta 紀錄）
- `handoffs/cowork--session-handoff-v5-1-planning-rev2-2026-04-18.md`（Accepted 定稿）
- 三份 Code handoff（D / B / E）

## 根因分析（rev3 §7 的 17 條幻編號）

v5.0 的「1086 行」已記入 docs/governance/retrospective-2026-04-18-v5-split-reversal.md。v5.1 規劃時**再次發生同類事故**：rev3 §7 主張「既有 15 條 #1-#15 + 新增 2 條 = 17 條」，實際 SKILL.md 只有 11 條**無編號**規則，`#1-#15` 編號系統從未存在。

**共同模式**：
- 治理文件引用言之鑿鑿的具體數字 / 編號 / 規格
- 在 Chat → Cowork 跨視窗接力時被沿用
- 動工前無人核對源檔

## 代價對照

| 實例 | 發生時點 | 抓到時點 | 代價 |
|------|---------|---------|------|
| v5.0 「1086 行」 | 2026-04-17 Chat #2 | 2026-04-18 動工前 Cowork | 1.2 天（lint POC + 規劃 + 退回） |
| v5.1 「rev3 §7 #1-#15」 | 2026-04-18 Chat #2 rev3 | 2026-04-18 規劃 rev1 階段 | **15 分鐘**（Code 驗證即發現） |

**機制成立證據**：連續兩次空中樓閣，v5.0 事後抓（1.2 天），v5.1 事前抓（15 分鐘）。working-environment.md §2.6「源頭事實清單」規範把撞壁時點從工程落地階段提前到規劃階段，**代價降低 100 倍**。

## 學到什麼

1. **源頭事實規範 ROI 已被驗證**：v5.0 是 painful lesson，v5.1 是 working cure。從此規劃 rev1 必附源頭事實清單不再是「走流程」，是經證實的高 ROI 機制。

2. **空中樓閣不是偶發，是跨視窗接力的結構性風險**：兩次事故都發生在 Chat → Cowork 接力的交界。不是哪個角色粗心，是接力 protocol 本身需要把「源檔重驗」寫進規範。這條已落在 working-environment.md §2.6。

3. **Cowork verifier + planner 分離（Q-WE-7）首次執行成功**：v5.1 rev1 前先發 Code 驗證，不讓同一個 Cowork 視窗自己下結論。代價 15 分鐘，收益是避免基於 sandbox 盲點誤判。

4. **「整理既有」作為 major 主題本身有價值**：v5.1 無新基礎設施，純收納既有產物。三項交付物之間依賴關係清晰（D 獨立 → B → E），每項工程量 S，整體收斂 1 天內。這種 major 比「建新系統」型 major 風險更低、驗證更快。

5. **rev2 精確化的必要性**：rev1 §3.2 的 B 分組只寫「預估 A 4-5 / B 1-2 / C 3-4 / D 2-3」，rev2 讀完 11 條實際內容後精確落地為「A 2 / B 4 / C 5 / D 2 = 13 條」。若 rev1 直接發 Code 執行，Code 會基於錯誤預估分組。教訓：規劃階段的「草案分組」不等於「執行分組」，Cowork 必須自己先讀實際內容到底，再交 Code。

## 對未來 major 規劃的流程再強化

v5.1 驗證了 working-environment.md §2.6 的源頭事實清單規範。建議補強（延後 v5.2 或觀察兩週後評估）：

1. **Code 驗證 handoff 模板化**：v5.1 發的 `handoffs/code--v5-1-source-verification-2026-04-18.md` 可作為未來 major 規劃的樣板，減少每次重寫成本。
2. **空中樓閣檢查表**：規劃文件中出現具體數字（行數 / 編號 / 條數 / 百分比）時，Cowork 在 rev1 寫作當下就應自查「這個數字有沒有在本文件其他章節或附錄貼原始指令」，無則標「未驗證」。
3. **第三次實例若發生 → 升格為 skill 護欄**：暫名 **E1「治理文件引用之源驗證」**，延 v5.2 觀察。

## 與 v5.0 retrospective 的關係

v5.0 retro 記錄「拆 skill 決策推翻」；本 retro 記錄「整理既有資產 + 源頭事實規範再次驗證」。兩份都屬於同一 v5 故事線的 meta 治理事件紀錄，但主題不同，獨立成檔。

v5.2 若再發生同類事故，應與本兩份 retro 一起索引（可能升格為 `docs/governance/meta-governance-castle-in-air.md` 集中敘事）。

## 信心等級

**高**——三項 scope 全部落地，skill-schema-lint 5/5 PASS，機制 ROI 有數字對比，教訓寫進可執行的下一步（§「對未來 major 規劃的流程再強化」）。

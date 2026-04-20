# Handoff: Cowork 視窗收尾 + 下輪開場交接

> 方向：Cowork → Cowork / Chat
> 日期：2026-04-20 晚
> 狀態：Accepted

---

## 本視窗完成事項

| 事項 | 狀態 |
|------|------|
| 治理考題輸出（15 題，三層） | ✅ `docs/governance/governance-exam-2026-04-20.md` |
| 三視窗答卷分析（Code/Chat/Cowork） | ✅ 完成，見本 handoff 附錄 |
| auto-memory 補兩筆 | ✅ 考試調查結果 + 憲法五條摘要 |
| Worker deploy（paulkuo-ticker v7a7804aa） | ✅ |
| Wiki API route 調查 → 情況 A 結案 | ✅ 無需修改，所有端點正常 |
| handoffs/INDEX.md 更新 | ⚠️ 未更新（今日新增 handoff 尚未加入 INDEX） |
| Issue #155 Task C 條目 | ⚠️ 未更新（需 GitHub MCP，留下輪） |

---

## 考試分析摘要（下輪開場快速參考）

三視窗治理考試的核心發現：

1. **記憶結構決定成績**，不是智力：Code 有 repo → 97%；Chat 有 conversation memory → 77%；Cowork 新 session 無掛載 → 70%
2. **憲法五條是最大死角**：Chat 和 Cowork 都完全不知道。已存入 auto-memory（`project_constitution_v02_facts.md`）
3. **Memory lag 是結構性問題**：Chat 的 memory 停在 v4.7（04-12），skill 已到 v5.3。治理演進速度 > memory 更新速度
4. **三視窗互補**：Code 答「怎麼操作」、Chat 答「事故歷史 / 設計原因」、Cowork 答「邏輯框架」

---

## 待辦交接

### 高優先 🔴
- [ ] **Enrichment CLI** — 逐字稿 → LLM 摘要 + concept 提取（尚未開始）
- [ ] **Issue #155 同步** — 補 Task C（CLAUDE.md 瘦身）條目、今日 Wiki API 診斷結果

### 中優先 🟡
- [ ] internal 去識別化規則確認（Paul 決策）
- [ ] Concept 頁面擴充（目前 22，目標 50+）
- [ ] handoffs/INDEX.md 補上今日新增的 handoff（共 4-5 份）

### 低優先 🟢
- [ ] 考試機制改良：Chat 視窗考前需要「當天治理快照」（CLAUDE.md + INDEX + 憲法五條），否則第一層永遠測不到
- [ ] 考題答對率建立 metric（v4.11 動機 3/4 要求）

---

## 協作憲法後續

Paul 要在其他視窗繼續「協作憲法與治理工程」。

建議下個工作視窗開場讀：
- `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`（憲法全文）
- `docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`（v0.3 實施 ADR）
- `docs/governance/working-environment.md`（三視窗職責邊界）
- `worklogs/PENDING.md`（目前 76 行，健康）

憲法五條快查：SSoT / 載體對等 / 權責分工（剛性核查）/ 記憶層次 / 記憶擴充

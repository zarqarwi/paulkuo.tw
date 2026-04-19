# Cowork Handoff — 治理框架衛生清理 + v0.4 跨視窗協作規劃

> 建議模型：Sonnet 4.6 + Medium（Task A/B 是機械性清理）或 Opus 4.6 + Medium（Task C 需決策）
> Task Size：M（60-90 min，三個 Task 可分批做）
> 來源 session：Cowork 2026-04-20（Opus 4.6）

**Status**: Proposed
**Consequences**:
- **若決策正確**：PENDING.md 恢復可讀性，handoff 可查找，CLAUDE.md 越界在 5/2 收斂日前處理完
- **若決策錯誤的連鎖影響**：PENDING.md 刪太多條會丟跨 session 上下文；CLAUDE.md 抽太多會破壞 Code session 開場自動載入的完整性
- **可逆性**：全部可逆（git revert 即可）
- **驗證收斂條件**：PENDING.md < 80 行、handoff 索引可用、CLAUDE.md ≤ 250 行

---

## 1. 背景

v0.3 四軌落地後，治理框架的「憲法 → 實施細則 → 執行層」三層結構已完整。但日常運作中累積了三個衛生問題，再不處理會拖慢每次 session 開場效率：

1. **PENDING.md 144 行**，其中 60%+ 是已完成的 `[x]` 項目，活的待辦淹在裡面
2. **handoffs/ 58 份**，無索引無分類，找舊 handoff 要 grep
3. **CLAUDE.md 269 行**，比 WE §4.2 F4 的 233 行基線又漲 36 行，5/2 收斂日逼近

同時，v5.2 候選 scope 和未來治理演進（v0.4）需要釐清優先順序。

---

## 2. Step 0 偵察（開場做）

```bash
# 確認 HEAD
cd ~/Desktop/01_專案進行中/paulkuo.tw
git log --oneline -3
```

```bash
# PENDING.md 行數
wc -l worklogs/PENDING.md
# 預期：144 行
```

```bash
# CLAUDE.md 行數
wc -l CLAUDE.md
# 預期：269 行
```

```bash
# handoff 數量
ls handoffs/ | wc -l
# 預期：58-60 份
```

---

## 3. 三個 Task（可分批獨立做）

### Task A：PENDING.md 瘦身（15 min）

**目標**：把已完成的 `[x]` 項目歸檔，只留活的待辦。

**步驟**：

1. 讀 `worklogs/PENDING.md`
2. 已完成的 `[x]` 項目搬到 `worklogs/archive/pending-completed-2026-04.md`（如果 archive/ 不存在就建）
3. Scanner 重複產出的 `5c58ee02` 三條（04-17/04-18/04-19 各一筆同樣內容）合併為一條，標注「重複偵測，待 Code 補驗或標記 skip」
4. 保留所有 `[ ]` 未完成項和「跨專案備忘」、「格式說明」區塊
5. commit message: `chore: archive completed PENDING.md items [影響: 僅治理文件]`

**預期結果**：PENDING.md < 80 行，開場掃描一目了然。

**驗證**：`wc -l worklogs/PENDING.md` < 80

### Task B：Handoff 索引建立（20 min）

**目標**：建一份 `handoffs/INDEX.md`，讓未來查舊 handoff 不用 grep。

**步驟**：

1. 掃 `handoffs/` 所有 .md 檔案
2. 依時間倒序，產出索引表：

```markdown
# Handoff 索引

> 自動產出於 2026-04-20，後續由 Cowork session 維護。
> 新寫 handoff 時在索引頂部加一行。

| 日期 | 檔案 | 方向 | 摘要 | Status |
|------|------|------|------|--------|
| 04-20 | cowork--v0.3-closeout-... | Cowork→Cowork | v0.3 收尾驗證 | Accepted |
| 04-20 | cowork--v0.3-constitution-... | Cowork→Code | v0.3 四軌執行 | Accepted |
| ... | ... | ... | ... | ... |
```

3. `handoffs/done/` 子目錄的標注「已結案」
4. commit message: `docs: create handoff index [影響: 僅治理文件]`

**預期結果**：未來找 handoff 先看 INDEX.md，秒定位。

**驗證**：INDEX.md 存在且行數 ≥ 60（每份 handoff 一行 + header）

### Task C：CLAUDE.md 越界處置（30-45 min，需決策）

**目標**：把 CLAUDE.md 從 269 行降到 ≤ 250 行，回應 WE §6.3 收斂日 5/2 的要求。

**現狀分析**（本輪偵察結果）：

| 區塊 | 行數（估） | 抽離候選 |
|------|-----------|---------|
| 專案概覽 | ~10 | 不動 |
| Worklog 自動記錄 | ~65 | ✅ 可抽到 `docs/governance/worklog-sop.md` |
| 工程慣例 | ~80 | ⚠️ 部分可抽（Rollback Protocol ~20 行） |
| 跨子專案影響守則 | ~30 | 不動（Code 必讀） |
| 跨 Session 協作 | ~20 | 不動 |
| 工作環境定義引用 | ~5 | 不動 |
| 協作憲法引用 | ~10 | 不動 |

**建議方案**：

抽離 Rollback Protocol（~20 行）到 `docs/governance/rollback-protocol.md`，CLAUDE.md 留一行引用。這樣降到 ~250 行，剛好壓在 F4 基線附近。

Worklog SOP 暫不抽——它是 Code session 每次 commit 必讀的，抽出去會增加一次 file read 成本。等 CLAUDE.md 再漲到 300+ 時再考慮。

**需要 Paul 決策**：
- Q1：Rollback Protocol 抽離 OK 嗎？（Code session 需要時會去讀 `docs/governance/rollback-protocol.md`）
- Q2：如果不夠，要不要也抽 Wrangler 陷阱 + CDN 那段（~10 行）？

**驗證**：`wc -l CLAUDE.md` ≤ 250

---

## 4. 上游假設

1. v0.3 四軌已全部落地，HEAD 含 commit `4f96cce`
2. Issue #155 body 已包含 v0.3 里程碑（Step 0 偵察已確認）
3. sync-dashboard Action 正常運作
4. Paul 同意 Cowork 在白名單路徑（worklogs/、handoffs/、docs/governance/）直接 commit

---

## 5. 驗證方式

| # | 驗證項 | 方法 |
|---|--------|------|
| V1 | PENDING.md 瘦身 | `wc -l worklogs/PENDING.md` < 80 |
| V2 | handoff INDEX 存在 | `ls handoffs/INDEX.md` 且行數 ≥ 60 |
| V3 | CLAUDE.md 行數 | `wc -l CLAUDE.md` ≤ 250 |
| V4 | 沒有丟失活的待辦 | grep `- \[ \]` 確認所有未完成項都在 |

---

## 6. 注意事項

- Task A 歸檔時**不要刪 PENDING.md 裡的「跨專案備忘」區塊**——那段是永久性的參考資訊
- Task B 的索引不需要讀每份 handoff 的全文，從檔名 + 第一行標題就能產出摘要
- Task C 如果 Paul 不在，先做 A 和 B，C 等 Paul 回覆 Q1/Q2 再動
- ⚠️ CLAUDE.md 是非白名單路徑（程式碼層級），抽離動作需要走 Code handoff 或 Paul 確認 Cowork 可直接改

---

## 7. 信心等級

**高**（Task A/B）— 純機械性操作，沒有決策風險。
**中**（Task C）— Rollback Protocol 抽離方向明確，但「抽多少」需要 Paul 判斷。

---

## 8. Integration Checklist

- [ ] PENDING.md 歸檔後，Issue #155 的 PENDING 相關引用不受影響（PENDING.md 路徑不變）
- [ ] handoff INDEX.md 建立後，session-handoff skill 未來寫 handoff 時提醒加索引條目
- [ ] CLAUDE.md 如果行數變動，更新 Issue #155「§6.3 中期動作」的狀態
- [ ] 如果 Task C 落地，WE §4.2 的 F4 論點需要更新（233→新行數）

---

## 附錄：v0.4 / v5.2 候選優先排序（供下輪參考）

本輪盤點後，建議治理演進的優先排序：

| 優先 | 候選 | 理由 | 預估 |
|------|------|------|------|
| 🔴 | CLAUDE.md 越界處置 | 5/2 收斂日硬 deadline | S |
| 🟡 | PENDING.md 瘦身 | 每次開場浪費掃描時間 | S |
| 🟡 | Handoff 索引 | 58 份無索引，已到查找臨界點 | S |
| 🟡 | Scanner 去重機制 | 5c58ee02 連續 3 天重複產出 | S（Code） |
| 🟢 | v5.2 四層檔案架構 | 結構性改善但不急 | M |
| 🟢 | Metrics 三階段 | 治理 Dashboard Phase 3 | L |
| 🟢 | E1 護欄升格 | 第三次空中樓閣未發生，暫不觸發 | - |
| 🟢 | worklog 並發寫摩擦 | 頻率低，目前可接受 | M |

v0.4 憲法修正候選（如果累積足夠實施經驗）：
- 第四條補款擴充：跨 session 佇列（PENDING.md）的衛生規則
- 第三條實施細則：handoff 索引維護責任歸屬
- 第六條候選：context 容器管理量化機制（session-handoff skill 設計原則 #4 的制度化）

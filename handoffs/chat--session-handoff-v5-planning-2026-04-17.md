---
target: chat
project: session-handoff skill
purpose: v5.0 結構性重組規劃討論（含另一 Cowork 視窗提議整合）
date: 2026-04-17
revision: 2（整合另一視窗的管線層 + 三條護欄）
author: Cowork（本視窗）
merged_from: discuss--session-handoff-v4.13-crosswindow-2026-04-17.md（另一 Cowork 視窗）
next_step: Chat × Paul 討論 → 整合版交 Code 執行
confidence: 中高（結構完整、整合後覆蓋面更廣、10 個開放問題需全局視角）
estimated_task_size: XL（3+ 小時，含 Chat 討論 + Code 執行遷移 + skill 改寫 + Cockpit 介面）
related_skill: /sessions/intelligent-peaceful-mccarthy/mnt/.claude/skills/session-handoff/SKILL.md (v4.13)
related_retro: docs/governance/retrospective-2026-04-17-mcp-truncation.md
related_discuss: handoffs/discuss--session-handoff-v4.13-crosswindow-2026-04-17.md
---

# chat-- session-handoff v5.0 結構性重組規劃

> 這份文件是 **Cowork 準備、給 Chat 討論**的規劃草案。
> Paul 已拍板方向，Cowork 把骨架搭好，請 Chat 用全局視角挑戰、補強、收斂。
> 討論完的整合版由 Code 執行：改 skill 檔、寫遷移腳本、補 metrics 章節。

---

## 1. 背景

v4.13 因 4/17 MCP 截斷事故新增護欄 #15，但 retrospective 第四節指出：

> 從 v4.7 開始每次版本升級都是事故驅動，治理增長速度 ≈ 事故發生頻率。
> 真正的長期目標應該是降低事故發生頻率，而不只是「事故發生後補得快」。
> 這會牽涉到 metrics 迴圈（動機 #3 提到但還沒建的 Dashboard Phase B/C）。

Paul 決定動 v5.0 結構性重組，同時處理三個痛點：

1. **Session 檔案散落在四個地方**——repo 根目錄、`handoffs/`、`docs/governance/`、`worklogs/` 各自為政，v4.x skill 只定義 worklog + handoff 兩種類型，其他無主
2. **檔案沒有完整生命週期**——handoffs/done/ 存在但無規則、reflection 永久留在 governance/ 無索引、worklog 有歸檔但 handoff 沒有
3. **Metrics 迴圈是動機 #3 的長期缺口**——v4.5 提過但從未實作

v5.0 不是單點補洞，是結構性重組（對應版本號規則：major bump）。

---

## 2. Paul 已拍板的決策

| # | 決策 | 理由 |
|---|------|------|
| 1 | **方向 = 選項 B**（四層架構 + Metrics 迴圈） | 選項 A 沒補 metrics 缺口不配 major bump；選項 C 遷移成本高、有 broken window 風險 |
| 2 | **Metrics 強制填寫** | 承認 tradeoff：拖慢 worklog 30 秒 vs 資料完整性。允許空值會無法區分「真的沒事」和「Claude 忘了填」 |
| 3 | **v5.0 scope 邊界交給工程專業判斷** | Cowork 決定把護欄 #1-#15 主題重分類一併納入 |

---

## 3. Step 0 偵察（Chat 先做）

進入討論前，Chat 請先確認以下資訊對齊：

```
# 讀 v4.13 skill（確認對現況的理解跟 Cowork 一致）
cat /sessions/intelligent-peaceful-mccarthy/mnt/.claude/skills/session-handoff/SKILL.md | head -200

# 讀 4/17 retrospective（確認動機 #3 缺口的脈絡）
cat /sessions/intelligent-peaceful-mccarthy/mnt/paulkuo.tw/docs/governance/retrospective-2026-04-17-mcp-truncation.md

# 快速掃現況散落檔案
ls /sessions/intelligent-peaceful-mccarthy/mnt/paulkuo.tw/ | grep -E "^(cowork|code|chat)--"
ls /sessions/intelligent-peaceful-mccarthy/mnt/paulkuo.tw/handoffs/
ls /sessions/intelligent-peaceful-mccarthy/mnt/paulkuo.tw/worklogs/ | head -20
ls /sessions/intelligent-peaceful-mccarthy/mnt/paulkuo.tw/docs/governance/
```

---

## 4. 具體規劃（5 個區塊）

### 4.1 Session 檔案六層架構（整合後）

> **Revision 2 調整**：原四層擴充為六層，新增 L1.5 管線層（源自另一 Cowork 視窗提議，詳見 Integration Note）。

| 層 | 類型 | 位置 | 命名 | 寫入者 | 生命週期 |
|---|------|------|------|--------|---------|
| **L1 運作層** | worklog | `worklogs/worklog-{date}.md` | `worklog-YYYY-MM-DD.md` | Code 主 / Cowork 次 | 14 天 → `worklogs/archive/`，月度產 `index-YYYY-MM.md` |
| **L1.5 管線層** | pipeline registry | repo 根目錄 `pipelines.yaml` + `worklogs/pipeline-digest-{date}.md` | `pipelines.yaml`（永久註冊表）／`pipeline-digest-YYYY-MM-DD.md`（日結） | Cowork scheduled task | 註冊表永久；日結 14 天歸檔 |
| **L2 交接層** | handoff | `handoffs/active/` → `handoffs/done/` | `{target}--{project}-{desc}-{date}.md` | 任一 session | 執行完搬 done/，30 天後 → `handoffs/archive/` |
| **L3 反思層** | retrospective | `docs/governance/retro/` | `retro-{date}-{topic}.md` | Chat / Cowork | **永久**（活規則依據），每季產 `index.md` |
| **L4 偵察層** | investigation | `worklogs/investigations/` | `{date}-{topic}-investigation.md` | Code / Cowork | 隨當月 worklog 歸檔 |
| **L5 度量層** | metrics | `docs/governance/metrics/` | `{metric-type}-YYYY-MM.md` | Cowork scheduled task | **永久**（ROI 證據鏈） |

**跨層引用 frontmatter 規範（新增）**：

- L1.5 `pipelines.yaml` 使用獨立 schema（見 Q8 / 另一視窗 discuss handoff）
- L2 必須標 `related_worklog:` 和（若適用）`related_pipeline:`
- L3 必須標 `related_incident:` 和 `guardrail_added:`（v4.13 已示範）
- L4 必須標 `parent_worklog:`
- L5 必須標 `sources:` 列出來源 worklog 清單

**L1.5 管線層存在理由**（4/17 事故教訓）：

4/17 兩個 Code session 平行跑 wiki-kv-seed + commit，產生 rebase 衝突，沒有人在管線層統整——L1 worklog 紀錄個別 session 的成果，L2 handoff 負責 session 之間的交棒，但「同一 repo 多條排程之間的協調」沒有專屬層級。L1.5 正是這個空位。

**pipelines.yaml 最小 schema**（細節見 Q8）：
```yaml
project / type / schedule / cron / produces / consumes / conflicts_with / owner_session / health / status / last_incident
```

**一次性遷移策略**：

- 遷移**不由 skill 負責**，獨立一次性 PR 處理
- Code 寫 `scripts/migrate-session-files-v5.sh`，可審視、可 rollback
- **遷移完成後再 bump skill 到 v5.0**，避免 broken window
- commit: `chore: migrate session files to v5.0 four-layer structure [影響: 治理]`

### 4.2 Metrics 迴圈資料模型

**worklog 強制新增 `## Metrics` 區塊**：

```markdown
## Metrics
### 護欄觸發
- #14 跨 repo 真相驗證：觸發 1 次 → 擋下（Code 宣稱 pushed 但 GitHub MCP grep 找不到）
- #15 MCP 寫後驗證：觸發 2 次 → 通過
（無觸發時寫「本日無護欄觸發」）

### Reconciliation
- 開場 Step 2.7 修正 3 筆
- Exit Gate 攔截 0 筆
（無時寫「本日無 reconciliation」）

### Task Cycle Time
- handoff: code--xxx-2026-04-17.md
  - 建立：13:00 / 完成：22:28 / 時長：9h28m
```

**Cowork scheduled task：`session-metrics-aggregator`**
- 排程：每月 1 號 09:00
- 動作：讀上月所有 worklog 的 Metrics 區塊 → 產 3 份月度檔案到 `docs/governance/metrics/` → 更新 index.md → Issue #155 貼月度摘要 comment

**月度檔案 frontmatter schema（Dashboard Phase B/C 對接預備）**：

```yaml
---
month: 2026-04
guardrail_hits:
  "#14": { triggered: 3, blocked: 2, passed: 1 }
  "#15": { triggered: 8, blocked: 1, passed: 7 }
reconciliation_fixes: 12
task_cycle_time_p50_hours: 2.3
task_cycle_time_p95_hours: 18.5
---
```

未來 Dashboard 只解析 frontmatter，不解析內文。

### 4.3 護欄 #1-#18 主題重分類（整合後）

> **Revision 2 調整**：併入另一 Cowork 視窗提議的三條新護欄 #16 / #17 / #18。
> 護欄編號策略：v4.13 已公開的 #15（MCP 寫後驗證）保留；另一視窗原本提議的 #15/#16/#17 順延為 #16/#17/#18。

從「時間/來源排序」改成「錯誤來源本質」分組：

| 組 | 主題 | 護欄編號 | 觀察 |
|---|------|---------|------|
| **A** | 人為判斷失誤 | #1 #3 #4 #5 #6 #17 | 6 條。**新增 #17 陰性結果結論節制**（4/17 Cowork 反覆誤判 KV seed 狀態──「沒看到」≠「不存在」，陰性結論必須標信心等級 + 列已驗證範圍） |
| **B** | 工具層失真 | #2 #15 | 2 條但**增速快**，4/17 事故揭露的新興風險類別 |
| **C** | 跨系統溝通斷點 | #7 #8 #12 #13 #14 #16 #18 | **7 條最多**，呼應動機 #2 是主戰場。新增 **#16 SSoT 變更驗證**（動 Issue body 前先 get_issue 看最新狀態；結構性變更走 comment 先行）和 **#18 多管線 race condition 防護**（同 repo 多管線同日觸發時，後觸發者 commit 前必須 rebase；Cowork 開場讀當日管線 digest） |
| **D** | 流程控制 | #9 #10 #11 | 3 條**全部來自業界研究**，尚無實戰 ROI |

**三條新護欄來源事故**：
- #16：4/17 Wiki + Code 同日 edit Issue #157，差點覆蓋彼此
- #17：4/17 Cowork 反覆誤判 wiki-kv-seed 有沒有跑（兩個 session 都成功但只看到一個回報）
- #18：4/17 兩個 Code session 平行 commit 導致 rebase 分三段（bfeb94f / 0e0c136 / 7d0e265）

未來新增護欄時先看能否併入既有分組，避免「按編號累加」失控。

### 4.4 v5.0 skill 章節骨架（六章，整合後）

> **Revision 2 調整**：新增第六章「駕駛艙與地面站」處理 L1.5 管線層的兩介面治理（Cockpit / Ground Station）。

```
# 多 Session 協作狀態管理 SOP v5.0

## 第一章：設計原則
  1.1 四個動機（含 metrics 迴圈作為動機 #3 的補完）
  1.2 兩個目標
  1.3 錨點三句
  1.4 新提議對齊檢查
  1.5 版本號規則

## 第二章：術語與檔案架構
  2.1 三種 session 角色（神經系統比喻 + 能力對比表 + 跨 session 三原則）
  2.2 儀表板（Issue #155）+ 格式標準
  2.3 檔案六層架構（L1 / L1.5 / L2-L5）+ 跨層引用規則
  2.4 Handoff 必備 8 區塊

## 第三章：協作層護欄（按主題分組）
  3.A 人為判斷失誤（#1 #3 #4 #5 #6 #17）
  3.B 工具層失真（#2 #15）
  3.C 跨系統溝通斷點（#7 #8 #12 #13 #14 #16 #18）
  3.D 流程控制（#9 #10 #11）
  3.E 護欄自我檢查 4 問
  3.F 不可逆操作清單

## 第四章：流程
  4.1 Cowork 開場 Checklist（+ 讀當日 pipeline-digest）
  4.2 Exit Gate（+ metrics 填寫驗證 + SSoT 變更驗證 + 管線事故紀錄）
  4.3 Paul 手動回報
  4.4 Worklog 格式（+ 強制 Metrics 區塊）
  4.5 Learned Preferences
  4.6 檔案六層歸檔（擴充自 v4.x 的 worklog 歸檔）
  4.7 防重複執行黃金法則

## 第五章：度量層（v5.0 新增）
  5.1 為什麼要度量
  5.2 Worklog Metrics 區塊強制欄位
  5.3 月度聚合 scheduled task
  5.4 Dashboard Phase B/C 對接規範
  5.5 ROI 審視節奏（每季）

## 第六章：駕駛艙與地面站（v5.0 新增）
  6.1 為什麼需要兩介面（動機 #1 跨專案治理 + L1.5 管線層）
  6.2 Cockpit（駕駛艙）：跨專案、跨管線的當日狀態總覽
      - 資料來源：pipelines.yaml + pipeline-digest-{date}.md + Issue #155
      - 形式：Worker API 產出 HTML 儀表板 or Issue #155 comment
      - 觸發：Cowork 開場自動拉
  6.3 Ground Station（地面站）：管線註冊表與排程治理
      - pipelines.yaml schema 完整定義
      - 管線衝突 detection（conflicts_with + owner_session）
      - 管線 health status 更新規則
  6.4 兩介面與護欄 #16 #18 的對應關係
  6.5 首次部署 MVP 界線（先做 pipelines.yaml + 日結；HTML dashboard 延到後續）

## 附錄
  A. 版本歷程（v3-v5.0 changelog 從主文移這）
  B. 事故索引（連 docs/governance/retro/）
  C. 護欄主題分組索引
  D. Cockpit / Ground Station 介面 spec（預留，v5.1 若需要可獨立章節）
```

**刪除項目**：
- 主文開頭 80 行的 v3-v4.13 changelog → 附錄 A
- 理由：v5.0 是里程碑，歷史保留但不佔主文開頭

**Cockpit / Ground Station 收斂說明**：
- 本視窗原傾向延後到 v5.1，Paul 拍板**納入 v5.0 scope**
- 妥協方案：v5.0 先交付「pipelines.yaml schema + 每日 pipeline-digest 產出 + Cowork 開場讀 digest」三件核心物件（Ground Station MVP）
- HTML Cockpit UI 列為「v5.0 Phase 2」，skill 章節先留 spec、實作排程見 Q9

### 4.5 v4.13 → v5.0 內容遷移對照表

| v4.13 位置 | v5.0 位置 | 處理 |
|-----------|----------|------|
| 版本變更日誌 v3-v4.13 | 附錄 A | 移 |
| 為什麼要做治理 | 1.1-1.4 | 章節化 |
| 術語定義 | 2.2-2.3 | 擴充檔案四層 |
| 版本號規則 | 1.5 | 移 |
| 核心架構 | 2.1 | 合併 session 角色 |
| 跨 Session 三原則 | 2.1 | 合併 |
| 護欄 #1-#15 | 3.A-3.D | 重分類 |
| 護欄 #16 #17 #18（新增） | 3.C / 3.A / 3.C | 來源：另一 Cowork 視窗 discuss handoff |
| pipelines.yaml（新增） | 2.3 / 第六章 | 來源：另一 Cowork 視窗 POC（沙盒已寫、本機未套） |
| Cockpit / Ground Station（新增） | 第六章 | MVP: Ground Station 先；Cockpit UI 延後 |
| 不可逆操作清單 | 3.F | 移 |
| Session 角色與分工 | 2.1 | 合併 |
| Cowork 開場 Checklist | 4.1 | 保留 |
| Exit Gate | 4.2 | 新增 metrics 欄位 |
| Paul 手動回報 | 4.3 | 保留 |
| Worklog 格式 | 4.4 | 強制 Metrics 區塊 |
| 儀表板格式標準 | 2.2 | 合併 |
| 完成日誌格式 | 4.4 | 合併 |
| Handoff 文件 | 2.4 + 4.x | 拆分 |
| 防重複執行 | 4.7 | 保留 |
| Learned Preferences | 4.5 | 保留 |
| Worklog 分層歸檔 | 4.6 | 擴充為四層歸檔 |
| Metrics 收集（v4.5 殘段） | 第五章 | 大幅擴充 |

---

## 5. 上游假設（Chat 先驗證）

1. **Paul 能接受 Metrics 強制填寫的 30 秒成本**（Paul 已口頭確認，但 Chat 建議再挑戰一次：是否考慮「首月試跑非強制、第二月起強制」的漸進方案？）
2. **Issue #155 body 容量還夠**（v4.13 術語定義提到 65K 上限，v5.0 若加月度摘要 comment 會累積）
3. **scheduled task 在 Cowork 環境穩定運作**（目前已有 wiki-ingest-scanner 等在跑，機制成熟）
4. **Code session 能執行遷移腳本**（需要本機 bash、有 git push 權限，符合 Code 職責）

---

## 6. 驗證方式

| 驗證項 | 方法 | 驗證來源 |
|-------|------|---------|
| v5.0 skill 可讀性 | Chat 10 分鐘能讀完第一章 + 第二章就上手 | Chat 自我檢核 |
| 15 條護欄行為未變 | 對照 v4.13 每條護欄內文，只動分類不改規則 | 本機 diff 比對 |
| Metrics 區塊可機械解析 | frontmatter YAML 合法、markdown 結構一致 | `yq` 解析測試 |
| 遷移腳本冪等 | 跑兩次結果一致 | 本機模擬 |
| 跨層引用可追溯 | 每份 L3 能追回 L1、每份 L5 能追回當月 L1 清單 | grep frontmatter |

---

## 7. 注意事項

⚠️ **不可逆操作**：
- 遷移 PR 動到 repo 根目錄大量檔案 → 走護欄 #11 Propose-then-Commit，Paul 先看腳本再執行
- skill 檔 bump v5.0 後必須同步 Paul 桌面 App Skills 設定（護欄 #12）

⚠️ **可讀性紅線**：
- 主文不能超過 v4.13 的 1086 行，目標 ≤ 900 行（改寫後應該更精煉）
- 如果第五章寫完發現超過，考慮把 Dashboard 對接規範拆到附錄

⚠️ **向後相容**：
- 既有 v4.x worklog（沒有 Metrics 區塊）不強制補回，v5.0 正式啟用日之後的 worklog 才強制
- 舊 handoff 檔案不強制重新命名

---

## 8. 信心等級

| 區塊 | 信心 | 說明 |
|------|------|------|
| 六層架構設計 | **高** | 對應 v4.x 現況散落 + 4/17 管線層盲點，結構清晰 |
| 護欄重分類（#1-#18） | **高** | 純分類重組，不改行為；三條新護欄編號經協調後無衝突 |
| skill 骨架（六章） | **中高** | 第六章 Cockpit/Ground Station 是新增，MVP 邊界待 Q9 收斂 |
| Metrics 資料模型 | **中** | frontmatter schema 是首次嘗試，未來可能要微調 |
| 一次性遷移策略 | **中** | 實際遷移腳本還沒寫，可能遇到檔案命名不一致 |
| pipelines.yaml schema 沿用 | **中** | 另一視窗 POC 未親驗；Chat 需對照 schema |
| 開放問題 Q1-Q10 | **低** | 需要 Chat 全局視角才能收斂 |

---

## 9. Integration Checklist

這次 v5.0 規劃可能影響以下系統：

- [ ] `session-handoff` skill 本體（主要變更）
- [ ] Cowork scheduled tasks（新增 `session-metrics-aggregator`）
- [ ] Issue #155 body 結構（可能新增「治理 metrics 月度摘要」區塊）
- [ ] 所有子專案的 `CLAUDE.md`（是否需要提 v5.0 檔案結構？建議不改，讓 skill 單點收納）
- [ ] `cross-project-impact` skill（檔案路徑改動可能影響其 scan 規則，需驗證）
- [ ] `paulkuo-writing` / `formosa-feedback` 等其他 skill（是否一併重組？→ 見 Q7）

**新增機制檢查**（對應護欄 #13 精神）：
- [ ] scheduled task `session-metrics-aggregator` 是否繼承現有同類 task 的錯誤處理？
- [ ] 月度 metrics 檔案寫入是否走護欄 #15 的寫後驗證？（月度檔案約 5-10KB，落在 2-10KB 驗證區間）

---

## 10. 開放問題（需 Chat 決策）

### Q1：Metrics 強制填寫的「破窗風險」

Code session 忘了填 Metrics 時，應該：
- (a) Exit Gate 擋住結案
- (b) 允許空值但標註，下次 reconciliation 補回
- (c) Cowork 開場自動補回

Cowork 傾向 (a)，但 Chat 判斷短期摩擦 vs 長期資料完整性。

### Q2：L3 retrospective 的觸發門檻

不是每個事故都值得寫 retrospective。門檻？
- (a) 任何線上損壞
- (b) 新增護欄時強制附帶
- (c) Paul 判斷「有架構啟發」時

Cowork 傾向 (b)（呼應護欄 #12 閉環精神）。

### Q3：Metrics 保存年限

永久保留 vs 3 年後退休？累積多年後資料量會大。

### Q4：Dashboard Phase B/C 動工時程

- (a) 累積 3 個月資料後
- (b) 跟 v5.0 同步動工
- (c) 等第二次事故驅動護欄出現

### Q5：未來新增護欄的命名規則

繼續 #16 #17 流水號，還是改用 B3、C6（主題代碼 + 序號）？

### Q6：遷移策略的 git history 風險

一次性搬大量檔案對 git history 可讀性有影響。Chat 有漸進式建議？

### Q7：v5.0 是否一併整合其他 skill？

`paulkuo-writing`、`formosa-feedback` 可能也有檔案散落問題。要不要做 repo 級 workspace 架構？這可能是 v6.0 議題。

### Q8：pipelines.yaml POC 如何銜接

另一 Cowork 視窗已在沙盒 `/Paukuo網站/pipelines.yaml` 產出 POC，但未寫到本機 repo。選項：
- (a) Code 直接採用 POC 版本搬到 `~/Desktop/01_專案進行中/paulkuo.tw/pipelines.yaml`
- (b) Chat 重新設計 schema（風險：兩份 schema 打架）
- (c) 本視窗跟另一視窗先對齊 schema（Paul 協調），定稿後一次進 repo

Cowork 傾向 (a)——POC schema 已涵蓋 project/type/schedule/cron/produces/consumes/conflicts_with/owner_session/health/status/last_incident，Chat 審視後若無結構性問題就沿用。

### Q9：Cockpit（HTML UI）實作時程

Paul 已拍板 Cockpit/Ground Station 進 v5.0，但 HTML UI 工程量可能 fork 出子專案級任務。分兩 Phase：
- **Phase 1（v5.0 初版）**：pipelines.yaml + 每日 pipeline-digest + Cowork 開場讀 digest（純文字 + Issue comment）
- **Phase 2（v5.0 後續）**：HTML dashboard by Worker API，解析 pipelines.yaml + 日結產狀態卡

問題：Phase 2 是 v5.0 必須還是 v5.1 再補？影響遷移腳本 scope。

### Q10：跨 Cowork 視窗撞車事件本身要不要寫 retrospective

今天這次（本視窗 vs 另一 Cowork 視窗平行改同一份 skill）本身就是護欄 #16 / #18 要防的情境──**這是 v5.0 規劃過程自己觸發了新規則**。

- (a) 寫一份 `retro-2026-04-17-cross-cowork-version-collision.md` 納入 L3 永久層
- (b) 只在 changelog 附帶說明，不獨立成篇
- (c) 併入 4/17 MCP 截斷 retrospective 作第二則事故

Cowork 傾向 (a)——兩次事故性質不同（工具失真 vs session 並發），分篇可追溯性更好。

---

## 11. 下一步

**Chat 討論完後**，請產出「整合版 v5.0 規劃」，包含：
1. Q1-Q10 的拍板答案（Q8-Q10 新增）
2. 修正過的六層架構 / Metrics 資料模型 / pipelines.yaml schema
3. 遷移腳本的具體步驟清單
4. 交給 Code 的 handoff 檔案（命名 `code--session-handoff-v5-implementation-{date}.md`）

**Code 執行順序建議**：
1. 先寫遷移腳本（dry-run 模式）
2. Paul 審視腳本輸出
3. 執行遷移 + commit（`chore: migrate session files to v5.0 six-layer structure`）
4. 套用 pipelines.yaml 到 repo 根目錄（採 Q8 選項 (a)/(c) 視 Chat 拍板）
5. 建 scheduled task `wiki-pipeline-digest`（每日晚間產出 L1.5 digest）
6. 改寫 skill 到 v5.0（含新章節六 Cockpit/Ground Station）
7. Paul 同步到 Skills 設定
8. 建 scheduled task `session-metrics-aggregator`
9. 寫跨 Cowork 撞車 retrospective（Q10 選 (a) 的話）
10. Exit Gate 驗證全套閉環
11. （Phase 2）HTML Cockpit dashboard 實作（若 Q9 拍板為 v5.0 必須）

---

## 附錄 A：Cowork 本輪產出清單

- 本 handoff：`handoffs/chat--session-handoff-v5-planning-2026-04-17.md`（revision 2 已整合另一視窗）
- 另一視窗 discuss handoff：`handoffs/discuss--session-handoff-v4.13-crosswindow-2026-04-17.md`（引用）
- Worklog 更新：`worklogs/worklog-2026-04-17.md`（補完 23:55 條目）
- Issue #155 comment：v5.0 規劃啟動通知

**模型建議**：
- Chat 討論階段：Opus 4.6 + High（跨域決策、架構判斷）
- Code 執行階段：Sonnet 4.6 + Medium（遷移腳本 + skill 改寫是明確任務）
- Skill 改寫可考慮 Opus 4.6 + High（需理解大量 context）

---

## 附錄 B：事故索引（納入 v5.0 附錄 B 的候選條目）

| 日期 | 事故 | 本質 | 對應護欄 | retro 檔案 |
|------|------|------|---------|-----------|
| 4/12 | （v4.7 事後分析） | 跨 session 版本落後 | #12 | — |
| 4/13 | Issue #168 | — | #13 | — |
| 4/14 | Issue #170 | — | #14 | — |
| 4/17 AM | changelog MCP 截斷 | 工具層失真（B 組） | #15 | `retro-2026-04-17-mcp-truncation.md` |
| 4/17 PM | Wiki KV seed 誤判 × 兩 Code 平行 commit | 跨系統溝通斷點（C 組） | #17 #18 | 待寫 `retro-2026-04-17-wiki-pipeline-race.md` |
| 4/17 PM | 跨 Cowork 視窗平行改 skill | 跨系統溝通斷點（C 組）+ SSoT race | #16 | 待寫 `retro-2026-04-17-cross-cowork-collision.md`（見 Q10） |

**觀察**：4/17 單日三起不同類事故──v5.0 規劃本身正由這三起事故驅動，形成「事故 → 規劃 → 新規則」完整閉環，對應護欄 #12「Skill 版本同步閉環」的實戰驗證第二輪。

---

## 附錄 C：Integration Note（與另一 Cowork 視窗對齊）

### 整合時機
另一 Cowork 視窗於 4/17 同日獨立提出 v4.13 升級版本（與本視窗共用版號、內容不同）。Paul 提醒後兩視窗同時停手，本視窗被指派負責合併。

### 整合策略（Paul 確認）
1. **護欄編號**：v4.13 已公開 #15（MCP 寫後驗證）優先。另一視窗原 #15/#16/#17 順延為 #16/#17/#18
2. **管線層**：放 L1.5（worklog L1 與 handoff L2 之間），不用 L2.5
3. **Cockpit / Ground Station**：納入 v5.0 scope（Paul 覆寫本視窗「延後到 v5.1」的建議）

### 直接繼承項目
- pipelines.yaml schema（另一視窗 POC，Q8 待 Chat 審）
- 三條新護欄的規則內容（只改編號不改規則）
- Cockpit / Ground Station 命名

### 待確認項目
- pipelines.yaml 沙盒版本 vs Chat 最終版本的 diff（走 Q8）
- HTML UI Phase 2 時程（走 Q9）
- 跨 Cowork 撞車事件要不要獨立 retro（走 Q10）

# Briefing: session-handoff skill 四層分裂 — 方案 C 規劃起手包（v2）

**From**: Cowork (Opus 4.7, 2026-04-19 本輪 retro 收尾視窗)
**To**: 下一個 Cowork 視窗（Opus 4.6 或 4.7）
**建議模型**: Opus 4.6 或 4.7（規劃決策類任務，Sonnet 不夠）
**影響範圍**: session-handoff skill + 所有 user-level Personal skills + 跨介面治理敘事統整
**本路線已考慮接手方 MCP 能力**: ✅ 接手 Cowork 有 bash + filesystem read + computer-use（可截圖 App UI）+ GitHub MCP（Issue #155 同步）

**版本修訂歷史**：
- v1（Opus 4.7, 17:05）：以「三副本」敘事起草，副本 C 視為 Claude Desktop App 獨立儲存
- **v2（Opus 4.7, 本次）**：吸收 Chat 補充的「四層架構」盤點 handoff（`/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`），C 層正名為 Anthropic 雲端 Personal Cloud（多介面共享），新增 D 層（Organization，個人方案 N/A）；偵察清單重構為串接 Chat 盤點 handoff 的決策用前置步驟

---

## 題記

> 「我們本來要處理的就是跨視窗溝通，設置 user level 通用的 skill。
> 現在這個過程就是一個反例。也是一個經驗。」
> —— Paul, 2026-04-19

本 briefing 的存在本身，就證明了它要解決的問題。

---

## 1. 背景

2026-04-19 Cowork 完成「空中樓閣第 3 次」retro，v5.3（C4 邊界固化）commit + push、使用者級 `~/.claude/skills/session-handoff/` cp 同步。Cowork 宣稱「跨介面一致」後：

1. **Chat 主動回報**它讀到的 SKILL.md 版本是 v4.13
2. Cowork 我一開始推論「Chat 在幻覺」——C4 誤判（陰性結論過早），下 §7.1 詳述
3. Paul 到 Claude Desktop App 的 **Customize → Skills → session-handoff** 截圖：Personal Skill，Last updated Apr 17 2026，標題「v4.13」，內容走完全不同版本樹
4. Code 獨立從另一角度驗證：同樣結論
5. **Chat 隨後主動補齊**四層架構盤點 handoff（`/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`），C 層確認為 Anthropic 雲端管理的 Personal Cloud，同步到 Claude.ai、Desktop、Excel/PPT 外掛

**結論**：session-handoff skill（以及其他 user-level Personal skills）存在**四個獨立儲存層**，讀取路徑依介面而定。

---

## 2. 四層 Skill Storage 架構（吸收自 Chat 盤點）

| 層級 | 儲存位置 | 版本管理 | 誰讀 | 更新方式 |
|---|---|---|---|---|
| **A. Project** | repo 內 `.claude/skills/`（例：`paulkuo.tw/.claude/skills/session-handoff/`） | git | Claude Code 在該 repo 內、Cowork sandbox mount | git commit |
| **B. Personal CLI** | `~/.claude/skills/session-handoff/` | 無（手動同步） | Claude Code 從任何 repo 打 | 手動 `cp -r` 或 rsync |
| **C. Personal Cloud** | Anthropic 雲端（UI 編輯） | 無（Anthropic 內部同步） | **Claude.ai（Chat）、Claude Desktop App、Excel/PPT 外掛、Chat runtime `/mnt/skills/user/`** | App/Web UI 手動貼 |
| **D. Organization** | Team/Enterprise 組織目錄（雲端） | Owner 管理 | Team/Enterprise 成員 | Owner 上傳 |

### 本輪現況版本對照

| 層級 | session-handoff 版本 | 證據來源 |
|---|---|---|
| A（paulkuo.tw） | v5.3（標題列 v4.8 + 內容 v5.3） | Cowork 本輪 commit `d5b0877` |
| B（本機 `~/.claude/skills/`） | v5.3（Code 本輪 cp 同步） | Code 本輪 `diff -r` 無輸出 |
| C（Anthropic 雲端 Personal） | **v4.13**（Apr 17 凍結） | Chat 截圖 + App UI Customize 截圖 |
| D（Organization） | **N/A**（Paul 個人方案） | Chat 盤點確認 |

### 關鍵觀察

1. **A ↔ B 之間**：有 `cp -r` 可同步，但沒有自動觸發——「空中樓閣第 3 次」就是 B 長期 stale 造成
2. **A/B ↔ C 之間**：完全沒有橋接——沒有指令可同步、沒有提醒機制、連本機檔案系統都不是 C 層的 SSoT（C 在 Anthropic 雲端）
3. **C 層內部**：Anthropic 在 Claude.ai、Desktop、`/mnt/skills/user/` 之間維持可靠同步，所以 Chat 讀 v4.13 = App UI 顯示 v4.13 = 其他介面也都是 v4.13
4. **副本數 ≥ 3 × skill 數**：光 session-handoff 就三份，Paul 有 5 個 Personal skills，所以實際儲存點至少 3 × 5 = 15 份（還沒算其他 repo 可能的 A 層副本）

### C 層 Personal skills 清單（Chat 已完成盤點）

| skill | C 層狀態 | Chat runtime 掛載 | 備註 |
|---|---|---|---|
| session-handoff | ✅ v4.13（Apr 17） | `/mnt/skills/user/` | **本 briefing 討論對象** |
| paulkuo-writing | ✅ 存在 | `/mnt/skills/user/` | 版本號待 B 層比對 |
| paulkuo-social | ✅ 存在 | `/mnt/skills/user/` | 同上 |
| formosa-feedback | ✅ 存在 | `/mnt/skills/user/` | 同上 |
| organize-downloads | ✅ 存在 | `/mnt/skills/user/` | 同上 |
| skill-creator | Example（非 Personal） | `/mnt/skills/examples/` | Anthropic 官方，UI 誤分組，不算發散 |

**重點**：方案 C 決策**不只影響 session-handoff 這一個 skill**。如果決定合併或統整，5 個 skills 都要統一處理。

---

## 3. 兩條版本樹的治理哲學分岔

兩棵樹**不只版本號不同，連設計哲學都分岔了**：

**C 層（v3 → v4.13 路線）— 通用治理哲學**
- 核心概念：Chat/Cowork/Code 三元分工、Learned Preferences、業界護欄 **#8-#11**
- 面向：任何專案、任何 session 都能套用的通用 SOP
- 事故型態：4/05 deploy/LIFF 反覆催促、4/04 跨 Session 三原則、pushHours 幽靈部署、/track/sync 幽靈里程
- 命名空間：業界護欄編號（#1, #2, ..., #11, #15）

**A/B 層（v4.8 → v5.3 路線）— paulkuo.tw 專案特化哲學**
- 核心概念：**C1-C5** 編號護欄系統、治理複雜度上界、working-environment.md 三視窗職責
- 面向：paulkuo.tw 這個 repo 的實戰決策 + retro
- 事故型態：1086 行幻值、空中樓閣第 1/2/3 次、workspace 警訊誤判、C4 邊界歧義
- 命名空間：C1-C5 特化編號

**命名空間衝突**：Chat 在四層盤點 handoff 提到要升級成「護欄 #16 跨載體 skill 版本同步」，我（Cowork v1 briefing）提到「C6 跨介面儲存一致性」——兩者是同一件事但命名空間不同，這本身就是兩棵樹分岔的具體案例。方案 C 決策也要解決命名空間統一問題。

兩棵樹**本來就是回應不同層級的治理需求**。C 偏「方法論」，A/B 偏「案例庫」。

粗暴覆蓋任何方向都會丟失東西：

- 把 A/B 的 v5.3 覆蓋到 C → 失去「三元分工」「Learned Preferences」等通用設計
- 把 C 的 v4.13 覆蓋到 A/B → 失去 C1-C5 編號系統、空中樓閣 retro、C4 邊界

所以方案 C 不只是技術同步問題，**是治理敘事的整併或分工設計問題**。

---

## 4. 核心決策（接手 Cowork 必須跟 Paul 對齊）

### Q1 — 兩棵樹該合併成一棵，還是刻意分工為兩棵？

**選項 1a（合併）**：所有 session 共讀一套 SKILL.md
- 優點：單一 SSoT、跨介面治理敘事一致、命名空間統一
- 缺點：v5.3 的 paulkuo.tw 特化內容在 Chat 處理其他專案時未必適用；v4.13 的通用內容在 paulkuo.tw 深度決策時不夠細

**選項 1b（分工）**：C 當「通用 SOP 骨架」，A 當「paulkuo.tw 專案護欄延伸」，B 當「本機個人 CLI 預設通用」
- 優點：各司其職、不互相拖累
- 缺點：需要明文規定邊界（什麼進 C、什麼留 A）、需要借鏡機制（A 的成熟案例回流到 C）、B 層放哪個版本要定義

### Q2 — 若選合併（1a），合併方向？

- **1a-i**：以 A/B 的 v5.3 為底，吸收 C 的「三元分工」「Learned Preferences」等通用設計
- **1a-ii**：以 C 的 v4.13 為底，吸收 A/B 的 C1-C5、空中樓閣 retro
- **1a-iii**：不選邊，開 v6.0 重構，從兩棵樹擷取精華重寫，併命名空間統一

### Q3 — 若選分工（1b），B 層該同步哪邊？

- **1b-i**：B 層維持 v5.3（paulkuo.tw 特化），因為 Code 主要在 paulkuo.tw 工作
- **1b-ii**：B 層同步到 v4.13（通用），因為 B 層的定義本來就是「個人 CLI 全域」
- **1b-iii**：B 層不單獨存在，刪除 B 的 session-handoff，強制 Code 回落到 A 層讀

### Q4（新增）— 這個決策該推廣到其他 4 個 Personal skills 嗎？

paulkuo-writing、paulkuo-social、formosa-feedback、organize-downloads 同樣存在 B/C 層版本發散風險。方案 C 的架構決策**應該是統一規則**，不該一個 skill 一個規則。

---

## 5. 候選方案 matrix + trade-off

| 方案 | 實施難度 | 維護成本 | 保留完整性 | 適合誰 |
|---|---|---|---|---|
| **1a-i**（v5.3 為底合併） | 中 | 低 | 丟失 v4.13 部分通用設計 | 主力在 paulkuo.tw 的人 |
| **1a-ii**（v4.13 為底合併） | 中 | 低 | 丟失 v5.x 所有 retro 資產 | 多專案跨 repo 工作者 |
| **1a-iii**（v6.0 重構） | 高 | 中 | 最完整，但需重寫時間 | 願意花一整個 Cowork 視窗做 meta-design |
| **1b-i**（分工 + B=v5.3） | 低 | 中 | 100% 保留 | Code 主戰場在 paulkuo.tw |
| **1b-ii**（分工 + B=v4.13） | 低 | 中 | 100% 保留 | 接受兩棵樹、能記得切換 |
| **1b-iii**（分工 + 刪 B） | 低 | 低 | 100% 保留，簡化架構 | 接受 Code 必須 cd 到 repo 才能讀 A |

**我（前一輪 Cowork）的傾向**：1a-iii（v6.0 重構）或 1b-iii（分工 + 刪 B）。理由：
- 兩棵樹的哲學差太遠、直接合併容易出 Frankenstein
- B 層存在本身就是「不在 SSoT 清單但會被讀」的問題根源（「空中樓閣第 3 次」就是 B stale）

但這是 Paul 自己的治理品味決策，接手 Cowork 不要替 Paul 下判斷。

---

## 6. 前置偵察（接手 Cowork 開場必跑）

### 6.1 先跑 Chat 的四層盤點 handoff（必做）

📄 **讀並執行**：`/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`

這份 handoff 是**零改動純偵察**，產出 `docs/skill-storage-inventory-2026-04-19.md`。裡面涵蓋：
- A 層：`paulkuo.tw/.claude/skills/` + 其他可能 repo
- B 層：`~/.claude/skills/` 全部 skills 版本 + mtime
- C 層：Chat 已完成盤點結果可直接採用（本 briefing §2 已摘要）
- D 層：N/A（Paul 個人方案）
- 發散點分析：B vs C 所有 5 個 skill 版本對照

**這是本輪決策的前置資料**。沒盤點就下決策 = C4 違反升級版。

### 6.2 偵察結束後，本 briefing 額外補問

Chat 的 handoff 沒涵蓋但本 briefing 決策需要的事實：

#### 6.2.1 本機有無 C 層快取（診斷用，不是寫入點）

```bash
ls -la ~/Library/Application\ Support/Claude/ 2>/dev/null
find ~/Library/Application\ Support/Claude/ -name "session-handoff*" 2>/dev/null
```

若有，是 App 端 read-only mirror，**不是 SSoT**（C 層 SSoT 在 Anthropic 雲端）。寫入仍必須走 App UI。

#### 6.2.2 Claude Desktop App 設定有無「從資料夾匯入 / 自動同步」

到 Claude Desktop App 的 Settings 全看一遍。若有，方案 1a 的實施路徑能大幅簡化。

#### 6.2.3 C 層 v4.13 完整內容

請接手 Cowork 用 computer-use 截圖 Claude Desktop App → Customize → Skills → session-handoff → 滾到底讀完 v4.13 全文（或請 Chat 輸出 v4.13 全文），建立 v4.13 vs v5.3 **段落級 diff**，為合併方案提供依據。

#### 6.2.4 SKILL.md 標題行 vs CHANGELOG 脫鉤（獨立子議題）

A/B 層的 SKILL.md 標題行凍結在 v4.8，但 CHANGELOG 最新是 v5.3。可能的解法：
- pre-commit hook 檢查 SKILL.md 標題 vs CHANGELOG 最新條目一致
- 或 SKILL.md 標題不放版本號，版本資訊專責給 CHANGELOG

這個子議題可以併入 1a-iii（v6.0 重構）一起重新設計，或另案 Code handoff 處理。

---

## 7. 不浪費踩過的坑（本輪值得進記憶的發現）

### 7.1 我的 C4 誤判 — 陰性結論過早

**事實**：Chat 首度回報 v4.13 時，Cowork 我（前一輪）列了三種可能性，其中「Chat 在幻覺」被列為可能性 A，敘述時對「Chat 編故事」著墨較多。後來 Paul 到 App UI 截圖，證明 Chat 讀的是真實存在的 C 層，不是幻覺。

**C4 違反等級**：🟡
- 來源：Cowork sandbox + grep paulkuo.tw repo CHANGELOG
- 方式：搜 v4.9~v4.13 在 paulkuo.tw 的出處 → 沒找到 → 推論 Chat 幻覺
- 違反點：單一來源（paulkuo.tw repo）+ 沒考慮 Anthropic 雲端儲存
- 幸好：Paul 掌握 App UI 事實，及時修正

**對方案 C 的啟示**：任何「skill 治理」決策都要**先盤點所有可能儲存位置**（本 briefing §6.1 的 Chat 盤點 handoff 就是為了防這種 C4 違反）。

### 7.2 Chat 主動補盤點 — C1/C2 跨來源的正面案例

Cowork（我）在 v1 briefing 只寫了「三副本」——以為 Claude Desktop App 是獨立儲存層。**Chat 隨後主動發起四層盤點 handoff**，正名 C 層是 Anthropic 雲端管理（多介面共享），D 層是 Organization（N/A）。

這是 C1（SSoT 一致性追溯）+ C2（跨來源驗證）的正面案例：**Chat 沒接到任何指令，純粹從自己掌握的事實（App UI、Chat runtime `/mnt/skills/user/`）主動補齊 Cowork 看不到的盲區**。這種主動補洞是 meta-governance 本身的設計目標之一。

**值得記入 CHANGELOG 當範例**。

### 7.3 Code 獨立驗證一致 — C1/C2 另一個正面案例

Cowork 和 Code 從不同路徑偵察（Cowork 從 sandbox + Paul 截圖、Code 從本機 filesystem diagnostic），得到同樣結論（三副本、C 層住 App 內部、cp 只影響 A/B）。

### 7.4 C5 的落地 gap — SSoT 變更後的「下游」定義太窄

Cowork 本輪做了 C5（cp 後 `grep -c "C4 邊界"` + `diff -r` 雙重驗證），但「下游」只涵蓋「使用者級檔案 B」。真正的下游清單應該是：

1. ✅ 專案級 A — 已驗
2. ✅ 本機 Personal CLI B — 已驗
3. ❌ Anthropic 雲端 Personal Cloud C — **漏驗**（也無檔案系統驗證路徑）
4. ❌ 其他 repo 可能的 A 層副本 — 未盤點
5. ❌ 其他 4 個 Personal skills 的 B vs C 對照 — 未盤點

**C5 升級建議**（留給 v6.0 或 C5.1，等同 Chat 的護欄 #16）：SSoT 變更後必須先跑一份「下游清單」偵察，列出所有已知讀取入口，逐一重驗。**對無檔案系統驗證路徑的層（如 C 層），必須明文標註「人工介入檢查」**。

### 7.5 本輪本身是「跨視窗溝通」的 meta 案例

- 本 briefing 要解決的議題（四層同步）
- 本輪發現這議題的過程（Chat 報版本不對 → 以為幻覺 → Paul 截圖 → Code 獨立驗證 → Chat 主動補四層盤點 → 確認架構）
- 兩者是自指關係

**啟示**：如果 Chat 沒主動回報版本、沒主動補盤點、Paul 沒截圖 App UI、沒 Code 獨立驗證，四層分裂會繼續隱形。這代表現有 C1-C5（+ #8-#11）護欄**無法自動偵測介面層的儲存分裂**。方案 C 成案後，必須加新護欄（暫稱 **C6 / #16 跨介面儲存一致性**，命名空間依 Q1 決策）。

### 7.6 Briefing 的 v1 → v2 本身也是 meta-case

我的 v1 briefing 用「三副本」敘事，忽略了 Anthropic 雲端是獨立一層而不是 App 的屬性。Chat 補盤點之後，v2 才整併到正確的四層架構。**這本身就是「不先完整盤點就下敘事」的案例**——跟 §7.1 的 C4 誤判同源。

---

## 8. 接手 Cowork 第一輪要做什麼

**建議流程**（預計 1 個 Cowork 視窗完成，約 90-120 min）：

### 階段 1：偵察（約 30-45 min）

1. 讀完本 briefing（§1-7）
2. 讀 Chat 的四層盤點 handoff（`/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`）
3. 執行 Chat handoff 的 Step 0-5（四層全盤點）
4. 產出 `docs/skill-storage-inventory-2026-04-19.md`
5. 額外跑本 briefing §6.2 的補充偵察（本機快取、App 設定、v4.13 全文）

### 階段 2：決策（約 30-45 min）

1. 把盤點結果整理給 Paul
2. 切入 Q1 決策（合併 vs 分工）
3. Q1 對齊後，依結果走 Q2 或 Q3
4. Q4：決策推廣到其他 4 個 Personal skills 的規則
5. 產出 ADR（`docs/governance/adr-skill-sync-strategy-2026-04-XX.md`）

### 階段 3：執行交付（約 15-30 min）

1. 若決策需要執行（改 App UI / 重構 SKILL.md / 加 pre-commit hook / 刪 B 層），寫 handoff 給 Code
2. 若需要 Paul 手動操作（App UI 貼上新版），整理操作步驟清單
3. 更新 Issue #155 + 本輪 worklog 三維度

**不要**在本輪就讓 Code 動 App UI 或直接 cp 覆蓋 C 層（C 層也無 cp 路徑，只能 UI 貼）。決策沒做完就動手 = 本輪 C4 誤判的升級版。

---

## 9. 必讀檔案

1. **本 briefing**（本檔 v2）
2. **Chat 的四層盤點 handoff**：`/mnt/uploads/cowork--skill-storage-inventory-2026-04-19.md`
3. `.claude/skills/session-handoff/SKILL.md`（目前 A/B 層 v5.3 內容）
4. `.claude/skills/session-handoff/CHANGELOG.md`（v5.3 + v5.2 + v5.1 + v5.0 + v4.8 條目）
5. `docs/governance/working-environment.md`（三視窗職責邊界）
6. `worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`（空中樓閣第 3 次 retro）
7. `worklogs/worklog-2026-04-19.md`（本輪完整脈絡）
8. Paul 的 Claude Desktop App 截圖（由接手 Cowork 用 computer-use 重新截取當下狀態）

---

## 10. Metrics（怎麼算成功）

接手 Cowork 視窗結束時，應產出：

- ✅ **盤點報告**：`docs/skill-storage-inventory-2026-04-19.md`（四層 × 5 skills 全盤點，含發散點等級）
- ✅ **ADR**：`docs/governance/adr-skill-sync-strategy-2026-04-XX.md`（Q1-Q4 決策）
- ✅ **下游清單**：所有已知 skill 副本位置 + 各自的更新機制 + 人工介入點
- ✅ **執行交付**：若選 1a 方案，產出 v6.0 草稿路徑；若選 1b 方案，產出「分工邊界條款」+ B 層處置方式
- ✅ **後續 handoff**：給 Code（檔案系統改動）或 Paul（App UI 手動貼）執行決策結果
- ✅ **命名空間決定**：C6（paulkuo.tw 編號）/ #16（業界護欄編號）二選一，或宣告兩套並存規則
- ✅ **Issue #155 log 更新**（護欄 #15 寫後驗證）

**不算成功的案例**：
- 跳過 Chat 盤點 handoff 直接下決策
- 直接動 App UI 或直接 cp 覆蓋
- 只處理 session-handoff 一個 skill，忽略其他 4 個
- 在沒盤點副本數時就宣稱「方案 C 完成」

---

**啟動口令（Paul 開新 Cowork 後貼這行即可）**：

> 讀 `handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.md` 啟動方案 C 規劃。

---

**本輪（2026-04-19 Cowork retro 收尾視窗）最終狀態**：

- ✅ v5.3 護欄 commit `d5b0877` + worklog commit `f1b4f9f`（均 pushed）
- ✅ 使用者級 `~/.claude/skills/session-handoff/` 同步到 v5.3（A + B 一致）
- ✅ 發現 C 層停在 v4.13（Anthropic 雲端 Personal Cloud，Apr 17 凍結）
- ✅ Chat 主動補四層盤點 handoff（C 層完成盤點，B 層待接手 Cowork 補）
- ✅ Briefing v1 → v2 整併（三副本 → 四層架構正名）
- ⏳ 方案 C（四層統整策略）留給下一個 Cowork 視窗
- ⏳ Chat 暫時仍依 v4.13 行事，不急於覆蓋，避免失去通用治理哲學

收工。

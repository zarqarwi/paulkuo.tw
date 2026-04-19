建議模型: Sonnet 4.6 + Medium

# Cowork Handoff — v5.1 護欄 24 小時落差 Retro

**日期**：2026-04-19
**來源 session**：Cowork
**目標 session**：Code
**任務大小**：M（1–2 hr，結構化分析 + 閱讀，不改 code）
**信心等級**：中（偵查目標明確，但「違反案例」判斷有主觀成分，故預期要帶 evidence 回 Cowork/Paul 共審）

---

## 0. Skill 版本背景

本 handoff 產出時間：2026-04-19 14:40
Cowork 載入的 session-handoff skill 版本：**v4.13（使用者級 `/sessions/dreamy-zealous-mayer/mnt/.claude/skills/`，Apr 17 15:39 stale snapshot）**
paulkuo.tw repo 內的 skill 版本：**v5.2（專案級 `.claude/skills/session-handoff/`，剛 commit 尚未 push，本地已有 diff）**

⚠️ Code 讀 skill 時請注意：
- Code session cwd = `~/Desktop/01_專案進行中/paulkuo.tw/`，讀到的是**專案級 v5.2**（含新鮮 CHANGELOG）
- Cowork session cwd = `/sessions/dreamy-zealous-mayer/`，讀到的是**使用者級 v4.13**（stale snapshot）
- 這個落差本身就是本次 retro 的根本成因，見 §1。

---

## 1. 背景

### 1.1 事件時序

| 時間 | 事件 |
|------|------|
| 2026-04-18 00:41:41 | ec71e17 v5.1 預備（frontmatter 規範） |
| 2026-04-18 11:16:48 | f0154e4 v5.1-B 護欄編號系統（13 條，新增 C4/C5） |
| 2026-04-18 12:48:16 | **e17d6f4 v5.1-E CHANGELOG 抽離（v5.1 完全落地）** |
| 2026-04-18 ~ 2026-04-19 | Cowork 多次運作，但載入的是使用者級 v4.13 |
| 2026-04-19 14:37 | 今日 commit 包含 v5.2 升版（L1），但同樣只落專案級 |

**核心脫節**：v5.1 的 13 條護欄（含新增的 C4/C5）只進了 `paulkuo.tw/.claude/skills/`（專案級），**從未同步到 `~/.claude/skills/`（使用者級）**。Cowork session cwd 不在 paulkuo.tw repo 內，skill 解析走使用者級 → 實際載入的是 v4.13。

### 1.2 本次 retro 要驗什麼

v5.1 新增兩條核心護欄，這 24 小時內 Cowork 沒有這兩條保護：

- **C4 陰性結果結論節制**：查無 ≠ 不存在。grep / search / list 回傳空結果時，不可直接下「X 不存在」結論，須交叉驗證（換工具 / 換關鍵字 / 換資料源）或標「未確認」。（2026-04-17 Wiki KV seed 誤判事件教訓）
- **C5 SSoT 變更後下游重驗**：Single Source of Truth 被修改後，所有依賴該 SSoT 的下游產物（報告、dashboard、衍生文件）必須重新驗證，不得沿用舊結論。（2026-04-17 SSoT 變更案教訓）

Paul 要求：retro 檢查 2026-04-18 12:48:16（v5.1 完全落地）之後，Cowork 產出是否有違反 C4 或 C5 的案例，以便決定下一步（skill 同步機制改進 / 個別文件補註 / 個別結論重驗）。

### 1.3 為什麼交給 Code 而不是 Cowork 自己做

Cowork 是「嫌疑人」兼「評審」雙重身分，獨立性不足。Code 在 paulkuo.tw 有完整 git 視角 + 讀取專案級 v5.1/v5.2 skill 的能力，做獨立偵查比 Cowork 自查可信。

---

## 2. Step 0 偵察

> 本路線已考慮接手方 Code 可用能力：git log / Read / Grep / GitHub MCP。未動用 Cowork 專屬 MCP（scheduled-tasks、apple-notes），理由見 §5 信心等級。

### 2.1 確認 v5.1 落地時間點

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git log --format="%H %ai %s" -- .claude/skills/session-handoff/ | head -5
```

預期命中：`e17d6f4 ... 2026-04-18 12:48:16 ... chore(skills): v5.1-E extract changelog`。以此時間戳作為 retro 窗口起點。

### 2.2 列出窗口內 Cowork 產出

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && find handoffs worklogs -name "cowork--*" -newer .claude/skills/session-handoff/CHANGELOG.md 2>/dev/null | sort
```

並補抓 Chat 產出（Chat 也讀使用者級 skill，同樣受脫節影響）：

```bash
find handoffs worklogs -name "chat--*2026-04-1[89]*.md" 2>/dev/null | sort
```

### 2.3 確認 Cowork 讀到的 skill 版本

```bash
head -20 /sessions/dreamy-zealous-mayer/mnt/.claude/skills/session-handoff/SKILL.md 2>/dev/null || echo "路徑不存在（正常 — Code 環境不掛載 sandbox）"
# 改查你自己 home 目錄的使用者級：
head -20 ~/.claude/skills/session-handoff/SKILL.md
grep -c "C4\|C5\|護欄編號\|陰性結果\|SSoT 變更後" ~/.claude/skills/session-handoff/SKILL.md
```

**預期**：`~/.claude/skills/session-handoff/SKILL.md` **不存在 C4/C5 字串**（grep count = 0），證明使用者級是 v4.13 或更早。若這條命中了（grep > 0），代表 Paul 其實已經同步過（只是這場對話中 Cowork 沒讀到更新），retro 命題就不成立，要回 Paul 覆核。

---

## 3. 具體步驟

### Step 1：產出窗口內 Cowork 產出清單

依 §2.2 命令，預期命中（按 mtime 排序，最舊在上）：

| 檔案 | mtime | 大小 | 備註 |
|------|-------|------|------|
| `handoffs/cowork--governance-kv-reseed-2026-04-18.md` | 2026-04-18 22:06 | 10.5 KB | v5.1 後 9 小時產出 |
| `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` | 2026-04-19 10:19 | 7.7 KB | 今早 workspace 警訊診斷 |
| `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md` | 2026-04-19 10:30 | 11.2 KB | Cowork 寫給 Chat 的 handoff |

若 §2.2 回傳其他檔案，也納入範圍。

### Step 2：對每份文件執行 C4 / C5 檢核

對每份文件逐段閱讀，建立對照表：

#### C4 陰性結果結論節制檢核清單

掃描以下關鍵字模式（grep-friendly）：
- `沒有`、`無`、`不存在`、`未找到`、`查無`、`尚無`、`沒提到`、`空`、`無對應`、`無命中`
- `N/A`、`null`、`0 results`、`empty`

每命中一次，判斷：
- 🟢 **合規**：有交叉驗證（換工具 / 換關鍵字 / 換資料源）或明確標「未確認」
- 🟡 **可疑**：只用一種工具 / 一次搜尋就下結論
- 🔴 **違反**：用一次搜尋結果直接下絕對結論，後續依此結論推進

#### C5 SSoT 變更後下游重驗檢核清單

識別該份文件的 SSoT 依賴：
- 依賴 Issue #155（儀表板 SSoT）的結論
- 依賴 session-handoff SKILL.md（治理 SSoT）的結論
- 依賴 PENDING.md / CLAUDE.md 的結論

檢查：
- 文件產出時間點，上述 SSoT 是否有變更？
- 文件是否引用了變更前的舊版本？
- 若有，是否有標注「依據 SSoT 某時間點快照」或「已重新對照最新版 SSoT」？

三態判定：🟢 重驗過 / 🟡 沒標注但結論仍正確 / 🔴 引用了舊結論且影響後續判斷。

### Step 3：特別檢核 — 本 session 的 Cowork 判斷

本 session（2026-04-19）Cowork 在對話中曾對「SKILL.md v5.1 是否存在」下陰性結論（稱之為「空中樓閣第 3 次」），後經 Paul 要求走方案 B 偵察後反轉。這個判斷本身不在任何 worklog 檔案，但可能在 `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` 或 `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md` 中留下書面線索。

Code 請特別檢查這兩份文件是否有以下痕跡：
- 對 SKILL.md 版本、CHANGELOG.md 存在性、v5.1 落地與否的敘述
- 是否基於單一資料源（sandbox 路徑 read-only snapshot）就下結論
- 是否提及「交叉驗證過 paulkuo.tw repo git log」

此為書面版 C4 違反候選案例。若文件裡沒有相關敘述，在報告中註明「僅存在於對話中，未留書面紀錄」，並建議 Cowork 下次 retro 時自查對話紀錄。

### Step 4：違反案例分級與建議

對每個 🔴/🟡 案例，填寫：

```markdown
#### 案例 N：{檔案}:{行號}
- **護欄**：C4 / C5
- **嚴重度**：low / medium / high
  - low：僅措辭不嚴謹，結論本身正確
  - medium：結論有風險但未擴散到下游
  - high：錯誤結論已被下游引用 / 已推動錯誤決策
- **實際結論**：{這份文件裡寫了什麼}
- **正確結論**（Code 判斷）：{若依 v5.1 規範應該怎麼寫}
- **建議處理**：
  - 補註（在原文件加 stale 標記）
  - 實質修正（改寫結論）
  - 不處理（結論正確，僅流程瑕疵）
```

### Step 5：整體結論與建議

- 違反案例總數（按嚴重度分類）
- 分佈（哪些 session、哪些文件高發）
- 對 skill 同步機制的改進建議：
  - 是否需要在 CLAUDE.md 加一條「skill 改動必須同步到使用者級」的護欄？
  - 是否需要寫一個 pre-commit hook 在 `.claude/skills/` 有變更時自動 `cp -r` 到 `~/.claude/skills/`？
  - 是否考慮把 session-handoff skill 完全搬到使用者級，paulkuo.tw repo 內留 symlink？
- 對 v5.1 C4/C5 護欄自身的評估：實戰違反率高低，是否需要補充具體範例 / 反例到 skill 內。

---

## 4. 上游假設

Code 接手前驗證：

1. **v5.1 確實只落專案級**
   執行 §2.3，若 `~/.claude/skills/session-handoff/SKILL.md` 已有 C4/C5 字串，本 retro 的前提不成立，回 Paul 重新確認脫節時間。

2. **窗口內 Cowork 產出清單完整**
   §2.2 命令以 CHANGELOG.md mtime 為基準，若有時序顛倒（例如 CHANGELOG 之後被 touch 過），可能漏抓。交叉用 git log 驗證：
   ```bash
   git log --since="2026-04-18 12:48:16" --format="%H %ai %s" -- handoffs/cowork--* worklogs/cowork--* | head -30
   ```

3. **Cowork 對話中其他未留檔的判斷**
   本 handoff 只能檢查書面產出。Cowork 在對話中的瞬時判斷（未寫入 worklog）無法 retro。Code 若發現書面證據指向「對話中可能也有違反」，在報告中標記但不追究。

4. **C4/C5 定義的判斷邊界**
   C4 的「交叉驗證」強度沒定量標準（2 個工具？3 個？）。Code 採用「至少 2 種來源或 2 種方式」作為及格線，若 Code 判斷某案例處於邊界模糊地帶，標 🟡 並列出 Cowork 判斷的依據，交由 Paul 終裁。

---

## 5. 驗證方式

Code 完成後，以下驗證項目必須全部 PASS：

- [ ] §2.2 列表非空，至少命中 3 份 Cowork 產出
- [ ] 每份文件都有 C4 + C5 雙軸檢核結果（🟢/🟡/🔴）
- [ ] 違反案例（🔴）都有具體行號 + 建議處理
- [ ] Step 3 特別檢核結果有明確結論（書面證據有 / 無）
- [ ] Step 5 整體建議至少包含 3 條具體動作（skill 同步 / 護欄補強 / 個案處理）

**交叉驗證**：Code 若自身判斷某案例為 🔴，在報告中附上**至少一條交叉驗證依據**（例如：「此結論與 Issue #155 line NNN 引用產生矛盾」），避免 retro 自身踩到 C4。

---

## 6. 注意事項

- ⚠️ **偵查不改**：本 handoff 只做 retro 分析，**不修改任何原始 worklog / handoff 檔案**。若發現 🔴 案例，在 retro 報告中建議處理方式，由 Paul/Cowork 決定是否補註或重寫
- ⚠️ **不擴散 retro 範圍**：只檢核 v5.1 落地後的產出（e17d6f4 時間戳之後）。v5.1 之前的 Cowork 產出本來就在 v4.13 規範下，不存在違反
- ⚠️ **C4 案例判斷要留彈性**：許多「陰性結論」在當下情境其實合理（例如「找不到這個 function」+ 後續沒依賴該結論）。判斷時考慮「結論是否真的影響後續決策」，否則 🟡 就好
- ⚠️ **C5 重驗的 SSoT 清單**：v5.1 窗口內實際變更過的 SSoT 包含 Issue #155、session-handoff SKILL.md、PENDING.md、CLAUDE.md。Code 可從 git log 交叉比對變更時間與引用時間
- ⚠️ **本 retro 本身要符合 v5.2**：Code 可讀專案級 v5.2（含 Step 0 偵察擴充 MCP 工具條款）。回報時請標注「本路線已考慮 MCP 能力」

---

## 7. 回報格式

Code 完成後回 Cowork 一份 markdown 報告，檔名：`worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`。

內容骨架：

```markdown
# v5.1 護欄 24 小時落差 Retro 報告

## 摘要（3 行內）
- 窗口：2026-04-18 12:48:16 ~ 2026-04-19 14:37
- 檢核檔案數：N
- 違反案例：C4 🔴 X 件、🟡 Y 件；C5 🔴 A 件、🟡 B 件

## 窗口內 Cowork 產出清單
（§2.2 結果）

## 逐檔檢核結果
（每份文件一個子章節，含 C4/C5 判定 + 行號 + 引文）

## 違反案例詳細表
（每個 🔴/🟡 案例按 Step 4 格式填）

## Step 3 特別檢核結論
（對本 session 今日 Cowork 判斷的書面證據盤點）

## 整體建議
1. skill 同步機制改進（具體可執行的 action items）
2. v5.1 C4/C5 護欄的實戰評估
3. 個案處理優先序

## 本輪 metrics
{files_read} files read, {kb} KB processed, {time} min
```

**回報必須包含驗證結果**（v4.5 規範），不要把驗證留給 Cowork 二次確認。

---

## 8. 本輪 metrics 預估

- Files to read: 3 Cowork 產出 + 1 Chat 產出（參考）+ v5.1 SKILL.md + CHANGELOG.md
- 讀取量：~50 KB
- 預估時間：60–90 min
- Commits / files changed：0（純分析，不改 code）
- Deploys：0

---

## 9. Integration Checklist

本次不涉及以下系統，護欄 #13 跳過：

- [ ] 不改 API endpoint
- [ ] 不改共用函式 / KV / D1
- [ ] 不動 deploy / CI
- [ ] 不改任何現有 worklog / handoff 原文件

**涉及系統**：
- [ ] `worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`（新建，retro 產出）
- [ ] 可能涉及 `worklogs/PENDING.md`（若 Step 5 建議產出後續 action items，由 Paul/Cowork 決定是否加入）

---

## 10. 信心等級

**中**。

加分因素：
- 窗口起點時間戳精確（e17d6f4 git log 可驗）
- 檢核目標檔案數量少（3 份核心），可逐字閱讀
- C4/C5 定義明確，判斷框架結構化

扣分因素：
- 「違反」的嚴重度判斷有主觀成分（low/medium/high 邊界）
- Cowork 對話中的判斷可能沒留書面，retro 不完整
- Code 自身做 retro 時可能也踩 C4（自我指涉問題），Step 5 驗證方式已設防線

**降低風險方式**：Code 把報告帶回 Cowork + Paul 共審，不由 Code 單方面下最終結論。

---

**產出者**：Cowork（讀 v4.13 狀態下產出的本 handoff，內容遵循 v5.2 規範但 Cowork 自身無 v5.2 保護，故有自我指涉風險，見 §10）
**產出時間**：2026-04-19 14:40
**目標完成時間**：當日 session 內
**後續 Cowork 需做**：收 Code 報告 → 與 Paul 共審 → 決定 skill 同步機制改進方向

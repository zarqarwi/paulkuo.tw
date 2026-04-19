建議模型: Opus 4.6 + Medium
預估量級: M（45–75 分鐘，審核 retro 報告 + 決定落地動作 + 可能的 SKILL.md v5.3 修訂）

# Cowork Handoff — v5.1 護欄 Retro 後續處理（收 Code 報告 → 審核 → 落地）

**日期**：2026-04-19
**來源 session**：Cowork（今日視窗，處理完 alignment 對焦）
**目標 session**：Cowork（下一視窗，收 Code 完整 retro 報告後接手）
**任務大小**：M
**信心等級**：中高（流程清楚，但「審核者 = 嫌疑人」的自我指涉風險需要你格外警戒）
**後續依賴**：若發現 🔴 違反案例且涉及 SKILL.md 補強 → 觸發 session-handoff skill v5.3 視窗；若使用者級 skill 落差確認 → 觸發 user-level skill sync 動作。

---

## ⚠️ 開場必讀：你是誰、在哪個位置

下一視窗的你（Cowork）**本身就是這場 retro 的被告**。v5.1 護欄能拿出來檢核，是因為 Cowork 在 2026-04-19 今日 session 對「SKILL.md v5.1 是否存在」下了陰性結論（「空中樓閣第 3 次」），之後走方案 B 偵察才反轉。這個事件正是 retro 報告要檢查的對象之一。

所以審核 Code 的 retro 報告時，你**必須額外警戒兩種偏差**：

1. **輕判誘惑**：看到 Code 把某條 Cowork 產出標 🔴，你腦中第一反應若是「沒那麼嚴重吧」——這個反應就是 C4 違反的再現。先自問：你的反駁有沒有至少 2 種來源交叉驗證，還是只是「我記得當時不是這樣」？
2. **自我洗白**：報告裡如果找不到 🔴 案例，你鬆一口氣的瞬間也要停下——Code 在 §7 已經自指承諾「查無違反就標未確認而非合規」。你要用同樣標準看這份報告：Code 的「全部合規」結論有沒有附交叉驗證？

**建議防線**：審核時把每個 🟡/🔴/🟢 逐條貼到對話裡，寫一行「我為什麼同意/不同意」，不要整份吞下去默認通過。

---

## 1. 背景脈絡（給下一視窗補 context）

### 1.1 事件時間軸

```
2026-04-18 11:16  f0154e4  v5.1-B 護欄編號系統首建（13 條 A/B/C/D）
2026-04-18 12:48  e17d6f4  v5.1-E CHANGELOG 抽離 — v5.1 完全落地
2026-04-18 22:07  531f9f3  governance-kv-reseed handoff rewrite（v4.13 格式）
2026-04-19 今日   空中樓閣事件：Cowork 查 user-level skill 看不到 C4/C5，
                 下「v5.1 不存在」陰性結論（第 3 次），Paul 要求方案 B 偵察反轉
2026-04-19 07:15  8ed6765  v5.2 落地：Step 0 偵察路徑考量接手方 MCP + CLAUDE.md + PENDING.md
2026-04-19 07:25  f26f8b6  merge + push，sync-dashboard Action 12 秒內 PATCH Issue #155
2026-04-19 下午   alignment 對焦 handoff（本鏈第一份）
2026-04-19 下午   Code 對焦回報，7 題全對齊，主動提 2 歧義
2026-04-19 下午   Paul 裁決 → 放行完整 retro（本 handoff 產出時刻）
```

### 1.2 為什麼要做這場 retro

v5.1 引入了 C4（陰性結果結論節制）/ C5（SSoT 變更後下游重驗）兩條護欄，但：

- **Cowork 自己就是 v5.1 護欄的首要違反者**（今日空中樓閣事件）
- 護欄剛落地 1 天，需要一次實戰檢核確認 Cowork 後續產出是否真的遵守
- 若不檢核，v5.1 會像過去「被動文件」一樣——規範寫了但不執行，下次再撞到相同的 bug

**關鍵定位**：這場 retro 不是整頓歷史舊帳（v5.1 之前的產出不受管），而是**驗證 v5.1 護欄是否真的在 Cowork 的實戰產出中被執行**，用 retro 結果決定是否要升級規範、是否要給 skill 加自動執行層、是否要同步 user-level skill。

### 1.3 為什麼 Paul 指定 Code 做（而不是 Cowork 自查）

「嫌疑人兼評審」問題：

- Cowork 的對話 context 裡有對自身舊判斷的強化偏差（你讀這份 handoff 時仍可能帶入）
- Code 在 paulkuo.tw repo 有完整 git 視角，對 Cowork 的對話沒有記憶偏差
- 這也是為什麼本 handoff §0「你是被告」開場白放最前面——提醒下一視窗你無法假裝自己是中立評審

### 1.4 為什麼先做 alignment 對焦再放行完整 retro

- 完整 retro 60–90 分鐘，若理解偏差重跑成本高
- C4/C5 的判斷有主觀成分，事前對齊及格線比事後重判便宜
- Paul 裁決「放行」之前已確認 Code 對焦 7 題無誤解，兩個歧義都是有建設性的邊界反饋

---

## 2. Step 0 偵察（接手前必跑）

### 2.1 git pull 拿最新狀態

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull origin main
```

### 2.2 確認 Code 的 retro 報告已到位

```bash
ls -la worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md
wc -l worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md
```

- 若檔案不存在 → Code 尚未完成，去 Issue #155 / git log 確認是否還在執行中
- 若檔案存在但 < 50 行 → 疑似被截斷或 Code 中途放棄，需要追蹤

### 2.3 確認兩份關鍵前置文件也在

```bash
# alignment handoff（本鏈起點，給下一視窗看脈絡）
ls -la handoffs/cowork--v5-1-guardrail-retro-alignment-2026-04-19.md
# Code 對焦回報（7 題答案 + 2 歧義 + Paul 裁決依據）
ls -la worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md
# 完整 retro handoff（Code 執行的主 handoff）
ls -la handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md
```

### 2.4 確認專案級 SKILL.md 仍是 v5.2（沒被別的 session 改動）

```bash
grep -cE "(C4|C5|陰性結果|SSoT 變更後|本路線已考慮接手方)" \
  .claude/skills/session-handoff/SKILL.md
wc -l .claude/skills/session-handoff/SKILL.md
```

預期：grep > 0，行數 543 附近。若有變動，確認是誰改的（git log）再決定審核基準。

### 2.5 （重要）確認使用者級 SKILL.md 仍未同步

```bash
ls -la ~/.claude/skills/session-handoff/SKILL.md 2>/dev/null || echo "使用者級 skill 不存在"
```

- 預期：不存在。這是 v5.1 空中樓閣事件的結構性根因——使用者級沒同步，Cowork 載入的是 sandbox 內 stale snapshot
- 若仍不存在 → 審核完 retro 後要推動 sync 動作（§4.3）

---

## 3. 具體步驟

### Step 1：讀三份文件（按順序，不跳讀）

1. `worklogs/code--v5-1-guardrail-retro-alignment-2026-04-19.md`（先讀，建立 Code 理解基線）
2. `handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`（主 handoff，知道 Code 被要求做什麼）
3. `worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`（retro 報告，實質審核對象）

### Step 2：逐條審核 retro 報告裡的 🟡/🔴/🟢 標注

對每個案例寫一行審核判斷：

```
- [報告第 N 行] Code 標 🔴 / 我：{同意 / 不同意}，理由（含至少 2 種來源）：...
```

**自律檢查**（每審 5 條停一下）：
- 我有沒有不自覺地把 🔴 往 🟡 降？
- 我拒絕某個判斷時，依據是不是「我記得當時」這種無可驗證的來源？
- 我同意某個判斷時，是不是只因為 Code 寫得有氣勢？

### Step 3：歧義固化 — 寫進 SKILL.md v5.3 草稿（關鍵）

Paul 在放行時已經**明確拍板歧義 1 的裁決**：

> **來源 vs 方式 固化定義**：
> - 來源 = 系統/工具層級（git / filesystem / GitHub MCP / curl API）
> - 方式 = 同系統內不同查詢策略（keyword / flag / endpoint）
> - 及格線收緊：同系統只換方式 = 🟡 上限，不能免責；
>   要降到 🟢 需換到不同來源（例如 git log + filesystem Read）

這個裁決**必須**寫進 SKILL.md C4 條款旁邊，否則下次仍會吵。建議做法：

```bash
# 在 .claude/skills/session-handoff/SKILL.md C4 條款段落下方
# 加一個「來源 vs 方式邊界」子節，內容如上 Paul 裁決
```

草稿寫在對話裡先給 Paul 審，通過後 commit。commit message 格式：

```
chore(skills): v5.3 固化 C4 來源/方式邊界定義 [影響: session-handoff skill]

依 2026-04-19 v5.1 護欄 retro alignment 階段 Paul 裁決：
- 來源 = 系統/工具層級
- 方式 = 同系統內不同查詢策略
- 及格線：同系統只換方式 = 🟡 上限

retro 報告：worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md
```

### Step 4：決定其他落地動作（依 retro 發現）

依 retro 結論走以下分流：

| retro 發現 | 動作 |
|-----------|------|
| 🔴 案例 0 個、🟡 案例 ≤ 2 個 | 僅需 Step 3 歧義固化。在 retro report 底部加 Cowork 審核結論 |
| 🔴 案例 1–2 個 | Step 3 + 針對 🔴 案例補註「stale」標記到原文件（不改結論，加 meta） |
| 🔴 案例 ≥ 3 個 | Step 3 + 升格 E1 護欄（「治理文件引用之源驗證」），觸發 v5.3 視窗 |
| 使用者級 skill 仍未同步 | Step 3 + 建立 PENDING.md 待辦，要求 Paul 手動 cp 或寫 sync 腳本 |

### Step 5：同步到 Issue #155（SSoT）

retro 完成後必須更新：

```bash
# 編輯 issue-155-body.md，在完成日誌加一行
# 格式：
# - 04-19 HH:MM v5.1 護欄 retro 完成 ✅：Code 報告 + Cowork 審核 + v5.3 歧義固化（commit hash）
#   結果：🔴 N 個 / 🟡 N 個 / 🟢 N 個；使用者級 skill 同步狀態 {已完成 / 待辦}

git add worklogs/issue-155-body.md && \
git commit -m "chore(issue-155): v5.1 retro 結案同步 [影響: Issue #155 only]" && \
git push origin main
```

sync-dashboard Action 應在 15 秒內 PATCH Issue #155。驗證：

```bash
# 用 GitHub MCP get_issue 查 updated_at，應在 push 後 30 秒內
```

### Step 6：Worklog 三維度收尾

```markdown
## 完成日誌
- HH:MM v5.1 護欄 retro 完成 + v5.3 歧義固化 + Issue #155 同步 Cowork

## 狀態變更
- v5.1 護欄 retro：待執行 → 已結案（Code 報告 + Cowork 審核）
- 歧義 1（來源/方式邊界）：未固化 → 固化入 SKILL.md v5.3
- 使用者級 skill：{未同步 / 已同步}（依 Step 4 結果）

## 決策紀錄
- 是否升格 E1 護欄：{是/否}（理由）
- 是否觸發 v5.3 視窗：{是/否}（理由）

## 阻礙與踩坑
- {審核時遇到的任何 C4 自省時刻 — 即使小事也記，給未來視窗參考}
```

---

## 4. 上游假設

### 4.1 Code retro 報告符合 alignment 對焦的 7 題理解

若發現 Code 在完整 retro 中偏離對焦答題的標準（例如 §4 的「Code 自己不踩 C4 機制」沒落實），視為 Code 執行偏差，暫停後續、回報 Paul。

### 4.2 歧義 1 的 Paul 裁決已經是最終決定

本 handoff §3 Step 3 寫的裁決內容是 2026-04-19 下午 Paul 口頭拍板，**未有其他管道 override**。若你讀到這份 handoff 時發現 Paul 又改過（例如新 handoff / CLAUDE.md），以最新決定為準。

### 4.3 使用者級 SKILL.md sync 是跨 session 老問題

這不是 retro 造成的，是 v5.1 之前就存在的結構問題：user-level `~/.claude/skills/` 沒有自動同步 project-level skill 的機制。retro 審核完若發現這是 🔴 等級風險，**需推動**建立 sync 腳本（Code 執行），不要留著當下次踩坑的根。

### 4.4 Cowork 載入狀態可能仍是 v4.13

下一視窗開場時 Cowork 載入的仍是 user-level 的 v4.13（沒 C4/C5），本 handoff §1.2 + §3 Step 3 已把 C4/C5 + 歧義裁決內容全部自帶，不依賴你「記得」v5.2。若你發現自己在審核時想不起來 C4 定義，回本 handoff §1.2 重讀。

---

## 5. 驗證方式

結案前必須 PASS：

- [ ] Step 1 三份文件全部讀完（不跳讀 alignment 對焦回報）
- [ ] Step 2 每個 🟡/🔴 案例都有獨立審核判斷（不整份吞）
- [ ] Step 3 SKILL.md v5.3 修訂草稿已寫進對話 + Paul 簽字
- [ ] Step 3 commit 推上遠端
- [ ] Step 4 落地動作依分流矩陣執行（或明確跳過 + 理由）
- [ ] Step 5 Issue #155 已同步 + sync-dashboard Action 驗證 PATCH 成功（updated_at 更新）
- [ ] Step 6 worklog 三維度完整（做了什麼 + 決策 + 阻礙，缺一都不能收）
- [ ] 本輪自我 C4 檢查：有沒有任何一條審核判斷只用了 1 種來源？

**自我驗證（重要）**：收尾前自問——這場 retro 我自己有沒有踩 C4？如果我對某條 Cowork 產出標「合規」，有沒有至少 2 種來源佐證？還是只是「沒看到有問題」？

---

## 6. 注意事項

- ⚠️ **不要因為 Code 寫得流暢就整份通過**。Code 的 alignment 對焦回報已經示範了「自覺歧義」的健康標準，retro 報告若完全沒自省、全部綠燈，反而要警戒是否速通
- ⚠️ **不改被檢核的 3 份 Cowork 產出內容本身**，只能加 stale 標記 meta（若 Step 4 分流落在「補註」欄位）。原文件是歷史紀錄，改了就污染證據鏈
- ⚠️ **歧義 2（對焦 vs 完整 retro 階段）不需要寫進 SKILL.md**，那只是 Code 解讀 alignment handoff 時的階段混淆，不是 v5.x 規範本身的洞
- ⚠️ **使用者級 skill 的 sync 動作不要自己做**：Cowork 沒有 user-level 寫權限，必須 Code 或 Paul 手動執行。你要做的是把待辦寫進 PENDING.md
- ⚠️ **C5 應用**：本 handoff 本身就是 SSoT（v5.1 retro 流程的基準），若你審核時發現 SKILL.md 已被改過（例如被其他並行 session 編輯），所有依賴舊版本的結論都要重驗

---

## 7. 回報格式

Cowork 本視窗收尾時，產出：

1. **對話中**：Step 3 SKILL.md v5.3 修訂草稿（給 Paul 簽字）+ Step 4 分流判斷說明
2. **commit**：
   - SKILL.md v5.3（若 Step 3 通過）
   - retro report 底部追加「Cowork 審核結論」區塊（inline edit）
   - issue-155-body.md 完成日誌條目
3. **worklog**：三維度寫滿

---

## 8. 本輪 metrics 預估

- Files to read：3 份核心（retro report + alignment report + retro handoff）+ SKILL.md ≈ 50 KB
- Files to edit：SKILL.md（+~20 行 C4 邊界子節）+ retro report（底部 +審核結論）+ issue-155-body.md（+1 行）
- Commits：1–2（v5.3 + issue-155 同步）
- Deploys：0（skill / Issue 同步不需部署）
- 預估時間：45–75 min

---

## 9. Integration Checklist

- [ ] 不改 API endpoint
- [ ] 不改共用函式 / KV / D1
- [ ] 不改 deploy / CI / wrangler.toml
- [ ] 修改的檔案只有：`.claude/skills/session-handoff/SKILL.md`、`worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`（append only）、`worklogs/issue-155-body.md`
- [ ] commit message 必須標 `[影響: session-handoff skill]` 或 `[影響: Issue #155 only]`
- [ ] 不使用 `--no-verify` 跳 pre-commit hook
- [ ] 不改任何子專案 runtime 檔案

---

## 10. 後續分流

| 本視窗結果 | 後續 |
|-----------|------|
| SKILL.md v5.3 落地 + retro 0 個 🔴 + 使用者級 skill 已同步 | 完全結案，不再需要後續視窗 |
| SKILL.md v5.3 落地 + 🔴 ≥ 1 且需 E1 升格 | 觸發 v5.3 規劃視窗（新 handoff） |
| 使用者級 skill sync 待 Paul 手動執行 | PENDING.md 新增待辦，Cowork 下次開場時再掃 |
| Code retro 報告偏離對焦答題 | 暫停審核，本 handoff 標記未完成，Paul 裁決是否重跑 |

---

## 11. Cowork 自我警戒 checklist（正式審核前再看一遍）

- [ ] 我知道我（Cowork）是今日空中樓閣事件的主角
- [ ] 我承諾審核每條判斷時至少列 1 種獨立來源，不用「我記得」當依據
- [ ] 我不會因為 Code 寫得流暢就整份放行
- [ ] 我會對「全部合規」結論保持懷疑——如同 Code 自己承諾的標準
- [ ] 若我想把某條 🔴 降級，我會先檢查降級依據是不是也踩 C4

---

**產出者**：Cowork（2026-04-19 下午視窗，alignment 對焦通過之後）
**產出時間**：2026-04-19
**目標完成時間**：Code 產出 retro report 後當日 session 內（若 Code 延後至明日，本 handoff 仍有效，不需重寫）
**後續 Cowork 需做**：依 §3 Step 1–6 執行，結案後本 handoff 移到 `handoffs/archived/` 或留主目錄待下次 retro 參考

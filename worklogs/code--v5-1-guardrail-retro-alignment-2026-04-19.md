# v5.1 護欄 Retro 對焦調查回報

**日期**：2026-04-19
**產出者**：Code（Sonnet 4.6）
**本路線已考慮接手方 MCP 能力**：Code 環境用 git log / Read / Grep / Bash；未使用 Cowork 專屬的 scheduled-tasks MCP，因為目標是 repo 書面產出，git/filesystem 是最低 token 路徑。

---

## Step 0 偵察事實

### 2.1 v5.1 落地時間戳

```
8ed6765 2026-04-19 15:15:28 +0800  chore(skills): v5.2 Handoff 偵察路徑必須考慮接手方 MCP 能力
e17d6f4 2026-04-18 12:48:16 +0800  chore(skills): v5.1-E extract changelog to CHANGELOG.md
f0154e4 2026-04-18 11:16:48 +0800  chore(skills): v5.1-B guardrail numbering system (13 rules)
```

**確認**：e17d6f4（2026-04-18 12:48:16）為 v5.1 完全落地 commit，與 alignment handoff §2.1 預期完全吻合。Retro 窗口起點以此為準。

### 2.2 窗口內產出清單

**git log（--since="2026-04-18 12:48:16"，限 handoffs/cowork--\* / handoffs/chat--\* / worklogs/cowork--\* / worklogs/chat--\*）**：

```
8ed6765  2026-04-19 15:15:28  chore(skills): v5.2 ...（含窗口內新增的 cowork/chat 產出）
531f9f3  2026-04-18 22:07:28  docs: rewrite Cowork handoff to session-handoff v4.13 format
d281bde  2026-04-18 22:01:04  docs: Cowork handoff to re-run governance-kv-seed
```

**find -newer CHANGELOG.md**（filesystem mtime，CHANGELOG.md 本次於 2026-04-19 15:15 被更新）：

```
handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md
handoffs/cowork--v5-1-guardrail-retro-alignment-2026-04-19.md
worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md
worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md
```

**差異標注**：find 未捕捉到 `handoffs/cowork--governance-kv-reseed-2026-04-18.md`，原因是該檔案 mtime（2026-04-18 22:xx）早於 CHANGELOG.md 的最新 mtime（2026-04-19 15:15，因 v5.2 commit 觸碰了 CHANGELOG.md）。git log 有追到（531f9f3 / d281bde），以 **git log 為準**。

窗口內確認的 Cowork 書面產出（依 git log）：
1. `handoffs/cowork--governance-kv-reseed-2026-04-18.md`（531f9f3 rewrite + d281bde 原版）
2. `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md`
3. `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md`
4. `handoffs/cowork--v5-1-guardrail-retro-2026-04-19.md`（retro handoff 本身，今日 push）
5. `handoffs/cowork--v5-1-guardrail-retro-alignment-2026-04-19.md`（本 alignment handoff，Cowork 產出）

### 2.3 使用者級 SKILL.md 狀態

```
ls -la ~/.claude/skills/session-handoff/SKILL.md → 使用者級 skill 不存在
grep count → 0（路徑不存在，命令返回 exit code 1）
head -5 → 無輸出
```

**結論：前提成立**。使用者級 `~/.claude/skills/` 下沒有 session-handoff skill，意即 Cowork session 載入的是其 sandbox 環境內的 stale snapshot（v4.13，不含 C4/C5）。§2.3 停止條件未觸發，繼續執行對焦。

### 2.4 專案級 SKILL.md v5.2 狀態

```
grep count（C4|C5|陰性結果|SSoT 變更後|本路線已考慮接手方）= 3
wc -l = 543
```

**確認**：grep > 0，行數 543（alignment handoff 預期「543 附近」），專案級 v5.2 已含新條款，Code 讀到的是正確版本。

---

## 對焦答題

### 題 1：Retro 窗口

起點是 `e17d6f4 2026-04-18 12:48:16`，這是 v5.1 完全落地的 commit（護欄 C4/C5 正式寫入 SKILL.md 的時刻）。終點是今日 retro 執行當下（2026-04-19）。這樣選是因為：v5.1-E 之前的 Cowork 產出本來就在 v4.13 規範下，對其要求 C4/C5 沒有依據；只有在 C4/C5 正式落地後的產出，才能被公正地檢核是否應遵守但未遵守。

### 題 2：C4 / C5 定義

**C4（陰性結果結論節制）**：當 grep / search / list 等查詢回傳空結果，不能直接宣告「X 不存在」或「X 沒有做過」。這個空結果只代表這次查詢沒命中，可能是工具盲區、路徑錯誤、keyword 不對、或快照過期。必須用至少 2 種來源或 2 種方式交叉驗證，或明確標「未確認」。想防止的錯誤：以單次查詢的「查無」當作充分依據，推進後續決策（例如「找不到 v5.1，所以 v5.1 是空中樓閣」→ 基於此結論開會討論，後來發現 v5.1 只是在另一個路徑）。

**C5（SSoT 變更後下游重驗）**：Single Source of Truth（Issue #155、SKILL.md、PENDING.md 等）被修改後，所有依賴舊版本的下游產出（報告、handoff、衍生文件）必須重新對照新版本重驗，不得沿用舊結論。想防止的錯誤：SSoT 已改版，但某份 handoff 還在引用舊快照的結論，Cowork 讀了這份 handoff 就繼續用舊結論做決策，無人察覺已經失效。

### 題 3：違反判斷及格線 + 兩個案例

「2 種來源」在實戰中的邊界理解：「來源」是指能獨立提供資訊的系統或資料路徑。git log 是一種來源，filesystem MCP 讀 Paul 電腦上的實際 repo 是另一種，curl API endpoint 又是另一種。同一個工具查兩次不同 keyword 算「換方式」但不算「換來源」——如果兩次查詢都走同一個系統，有相同的盲區（例如 GitHub MCP 的截斷問題），換 keyword 不能抵消系統性風險。

**⚠️ 此處我有歧義（見「自覺歧義」）：**「來源」vs「方式」的邊界在 handoff §4.4 沒有明確定義，我的解釋有可能偏嚴或偏寬。

🟡（邊界模糊）案例：Cowork 用 GitHub MCP `get_file_contents` 找不到某 function → 改用 GitHub MCP `search_code` 換關鍵字再找，也找不到 → 下結論「此 function 不存在」。換了方式（get vs search），但資料源同樣是 GitHub MCP，有相同截斷風險。我會標 🟡，因為有換方式但未換系統層級的資料源。

🔴（明確違反）案例：Cowork 只從 sandbox 路徑的 stale filesystem snapshot 查 `~/.claude/skills/session-handoff/SKILL.md`，看不到 C4/C5，直接下「v5.1 護欄不存在、是空中樓閣」的結論，沒有進一步查 paulkuo.tw repo 的 `git log` 或用 filesystem MCP 讀 Paul 電腦上的實際 repo。單一工具、單一路徑、直接下絕對結論，且後續據此結論推進（「v5.1 空中樓閣」），明確觸發 C4。

### 題 4：為什麼 Code 做 + 自己不踩 C4 的機制

Paul 指定 Code 做這次 retro，因為 Cowork 是「嫌疑人兼評審」——自查有明顯利益衝突，且 Cowork 的對話 context window 裡可能有強化自身舊判斷的偏差。Code 在 paulkuo.tw repo 有完整 git 視角，能直接讀到 v5.2 SKILL.md，對 Cowork 這段時間的對話沒有記憶偏差。

Code 不踩 C4 的機制：每個「此文件無違反案例」結論都必須附上至少兩種來源或方式的查詢記錄（例如：git log 確認 commit 時間 + filesystem Read 文件內容）。若某文件找不到違反案例，不直接下「合規」結論，而標「依可見書面內容判定，🟢；對話中判斷無從驗證，未確認」。這樣即使 retro 本身無從防止對話盲區，至少書面層的判斷有交叉依據。

### 題 5：Step 3 特別檢核的「本 session」理解

「本 session」指 2026-04-19 今天這輪 Cowork 對話，具體事件是：Cowork 在對話中對「SKILL.md v5.1 是否存在 / 護欄 C4/C5 是否落地」下了陰性結論（稱為「空中樓閣第 3 次」），Paul 要求走方案 B 偵察後，結論反轉。

依 alignment handoff §6「不讀那 3 份被檢核的 Cowork 產出」規定，對焦階段我不讀 `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` 和 `worklogs/chat--cowork-warning-workflow-optimization-2026-04-19.md` 的內容。

處理方式：在完整 retro 時讀這兩份文件，若找不到書面痕跡，在 retro 報告中標注「此事件僅存在於對話中，未在書面文件留下直接紀錄」，並建議 Cowork 下次 retro 時自查對話記錄補充，不追究無書面記錄的對話內瞬時判斷。

### 題 6：Retro 修改權限

不直接修改原始文件。retro handoff §6 明確說「偵查不改」，原因是 Code 沒有原始 Cowork 對話的完整 context，單方面改寫已歸檔的判斷可能引入新偏差。

如果發現 🔴 案例，在 retro 報告（`worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`）中填寫案例格式（檔案、行號、引文、建議處理方式：補註 stale 標記 / 改寫結論 / 不處理）。實際修改授權由 Paul / Cowork 共審後決定執行，Code 只提供偵查結果和建議。

### 題 7：自我指涉風險標注方式

v5.2 + C4/C5 的定位是「評審 Cowork 產出」的標準，不是「評審本 retro 報告自身」的指定角色——但邏輯上，如果 Code 在寫 retro 報告時自己違反了 C4（例如找不到違反案例就下「全部合規」），報告本身就示範了 C4 違反。

在完整 retro 報告（非本對焦回報）的開頭，我會加一行標注：

> 本報告遵循 v5.2 規範（含 C4/C5），並自我適用 C4：每個「查無違反」結論都附交叉驗證依據，否則標「未確認」而非「合規」。本報告可被用同樣標準檢查。

這讓 Cowork / Paul 審查報告時有明確的自指評審依據，同時避免 Code 在遞交報告前自我宣告「本報告符合標準」卻沒有給出可驗證的依據。

---

## 自覺歧義 / 需澄清事項

**歧義 1（題 3 — 「2 種來源」邊界）**：handoff §4.4 定義「至少 2 種來源或 2 種方式」作為 C4 的交叉驗證及格線，但「來源」和「方式」沒有明確區分。我的理解是「來源 = 系統層級（git / filesystem / API）、方式 = 查詢策略（keyword / flag / 不同 endpoint）」，且換方式但同系統不等於換來源。若這個邊界定義有誤，題 3 的 🟡 / 🔴 案例分類可能需要調整。

**請 Cowork / Paul 確認**：「GitHub MCP get_file_contents + search_code 換 keyword」算 2 種方式 or 2 種來源？

**歧義 2（題 5 — 對焦階段是否可讀 Step 3 的兩份文件）**：alignment handoff §6 說「不讀那 3 份被檢核的 Cowork 產出」，但 §5 驗證方式和 §8 files to read 都提到要讀那些文件（完整 retro 才讀）。對焦階段我選擇不讀，以「待完整 retro 確認」作答。若 Cowork 認為對焦答題需要先確認 Step 3 書面痕跡，請指定。

---

## 本輪 metrics

3 files read (SKILL.md ×2 + retro handoff), ~40 KB processed, ~20 min, 0 commits, 1 new file created

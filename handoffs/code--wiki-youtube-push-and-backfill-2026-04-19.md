# Handoff · Cowork → Code · Wiki YouTube Pipeline push + 批次 backfill

**日期**：2026-04-19
**發起**：Cowork session（LLM Wiki 專案）
**接手**：Code session
**相關 Issue**：[#157 LLM Wiki 知識管線儀表板](https://github.com/zarqarwi/zarqarwi/paulkuo.tw/issues/157)（handoff 鏡像 comment #4274087781）
**本次交接 commit**：`61e40e1` — local main，**尚未 push**

---

## 模型建議 & Task Sizing

- **模型**：Claude Sonnet 4.6
- **Effort**：Medium
- **Task Size**：**M**（30 min ~ 2 hr，主要時間在 backfill 跑 18 支影片）
- **理由**：任務是 deterministic pipeline 操作（push / 跑 CLI / update issue），沒有架構決策、沒有跨檔案重構。Sonnet 夠用、比 Opus 省成本。只有在 backfill 跑到一半遇到非預期錯誤、要追根源時才升 Opus + high。

---

## 1. 背景

Cowork session 在 2026-04-19 修補 YouTube ingest pipeline 的兩個痛點。這批 pipeline 問題源自 2026-04-16 Code 已經修過第一輪（Innertube API 被 YouTube 封鎖 → 改走 yt-dlp + Groq Whisper），當時還剩 19 支影片沒字幕需要 Whisper STT backfill，但卡在兩個新問題：

1. 排程 scheduled task 跑 `wiki-youtube-ingest.cjs` 時 `GROQ_API_KEY` 沒載入 → Whisper 層直接 skip
2. 長影片音訊 >25 MB 超過 Groq 上限 → 直接 skip

Cowork 這輪補了這兩個痛點 + 實測跑通一支（IRb_X7zwNi4 斯坦福衰老實驗），剩下 18 支交給 Code 批次處理 + push。

**為什麼 Cowork 不自己跑完 18 支**：沙盒環境無法執行 `git push`，所以任務切點劃在「commit 完交給 Code push + batch」。

---

## 2. Step 0 偵察（接手前先驗證）

動手前先確認下列假設是否成立：

```bash
# 偵察 1：確認 local main 有 61e40e1 commit
cd ~/Desktop/01_專案進行中/paulkuo.tw
git log --oneline -3
# 預期：HEAD = 61e40e1 "feat(wiki-ingest): YouTube ingest 自動載 .env ..."

# 偵察 2：確認未 push 到 origin
git status
# 預期：「您的分支位於 'origin/main' 之前 1 個提交」

# 偵察 3：確認 .env 有 GROQ_API_KEY
grep -c '^GROQ_API_KEY=gsk_' .env
# 預期：1

# 偵察 4：確認 ffmpeg 可用（backfill 會用）
which ffmpeg && ffmpeg -version | head -1
# 預期：/opt/homebrew/bin/ffmpeg + version >= 6

# 偵察 5：算待 backfill 數量
grep -rL 'transcript_lang: "zh\|transcript_lang: "en\|transcript_lang: "ja\|transcript_lang: "Chinese\|transcript_lang: "English' \
  src/content/wiki/sources/youtube-*.md | wc -l
# 預期：18（IRb_X7zwNi4 已補完，扣掉它後剩 18）
```

**任一偵察失敗 → 停下來，不要盲推**。先跟 Paul 確認狀態，可能是假設出錯。

---

## 3. 具體步驟

### Task 1 — Push commit `61e40e1`

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git push origin main
git status   # 確認訊息：您的分支與上游分支 'origin/main' 一致
```

**完成訊號**：`git status` 顯示與 origin/main 同步。

### Task 2 — 批次 backfill 18 支 YouTube source

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
node scripts/wiki-youtube-ingest.cjs --backfill 2>&1 | tee /tmp/wiki-backfill-$(date +%F).log
```

**預期行為**：
- 掃 `src/content/wiki/sources/youtube-*.md`，找 `transcript_lang: ""` 的 18 支
- 每支走 yt-dlp（這批已知無字幕，預期全 fallback）→ 下載 m4a → 若 >24 MB ffmpeg 壓縮 → Groq Whisper
- 成功就 inject transcript 回 source 檔、更新 `transcript_lang` 和 `updated` 欄位

**時間估計**：
- 短片（<10 min）：15-25 秒
- 長片（30+ min，需壓縮）：35-50 秒
- 18 支：估 **10-15 分鐘**

**跑完確認數量**：
```bash
grep -rL 'transcript_lang: "zh\|transcript_lang: "en\|transcript_lang: "ja\|transcript_lang: "Chinese\|transcript_lang: "English' \
  src/content/wiki/sources/youtube-*.md | wc -l
# 預期：0（若有殘留，檢查 log 哪幾支失敗）
```

### Task 3 — Commit backfill 結果並 push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git add src/content/wiki/sources/youtube-*.md
git status --short
# 應該只看到 M  src/content/wiki/sources/youtube-*.md（數量對應成功的支數）

git commit -m "$(cat <<'EOF'
chore(wiki-sources): YouTube Whisper STT backfill {N} 支（2026-04-19）

執行 scripts/wiki-youtube-ingest.cjs --backfill，用新版 ffmpeg 壓縮
+ Groq Whisper 補上之前無字幕的 YouTube source。

失敗清單（若有）：{填入 videoId + 原因}

[影響: wiki content only]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

### Task 4 — 更新 Issue #157

用 GitHub MCP `update_issue` 改 body：

**要改的地方**：
1. 「YouTube Source 統計」表格：`待 Whisper STT 18 → 0`（或殘留數）、`有字幕 4 → 22`
2. 「YT Transcript Fix」狀態 ⏳ → ✅
3. 「待辦」勾掉 `Whisper STT backfill 剩餘 19 個影片`
4. 新增「今日工作紀錄」段落，日期 2026-04-19：

```markdown
### YouTube Transcript Pipeline 完整修復 ✅

**Cowork 2026-04-19 commit `61e40e1`**：
- `wiki-youtube-ingest.cjs` 加零依賴 dotenv loader（自動讀 `.env`）
- Whisper STT fallback 在音訊 >24 MB 時用 ffmpeg 壓成 mono 16 kHz 32 kbps opus
- 新增 `scripts/backfill-one.cjs`（debug 工具）
- 驗證：IRb_X7zwNi4（30 min，無字幕）backfill 成功，648 段 9329 字中文

**Code 2026-04-19 commit `{backfill commit SHA}`**：
- 批次 backfill 剩餘 18 支影片
- 失敗清單：{填入 or 「無」}
```

**完成後留一則 comment 在 Issue #157 標記 Code 端結案**（附 commit 三態宣告）：

```
## ✅ 2026-04-19 · Code 端結案

- Task 1 `✅ commit 61e40e1 pushed`
- Task 2 batch backfill：{N} 支成功，{M} 支失敗
- Task 3 `✅ commit {backfill SHA} pushed`
- Task 4 Issue #157 body 已更新

失敗清單：
- {videoId}: {原因}

YT Transcript Fix → ✅ 結案。
```

---

## 4. 上游假設

接手方應先在 Step 0 驗證：

| # | 假設 | 驗證方法 |
|---|------|---------|
| A1 | `.env` 檔內有有效的 `GROQ_API_KEY`（gsk_ 開頭、56 字） | 偵察 3 |
| A2 | local main HEAD 是 `61e40e1`，未 push | 偵察 1 + 2 |
| A3 | 本機有 ffmpeg，版本 ≥ 6 | 偵察 4 |
| A4 | 確切還剩 18 支待 backfill（Cowork 已補 IRb_X7zwNi4） | 偵察 5 |
| A5 | `.gitignore` 會擋住 `.env`（不會被 Task 3 誤推） | `git check-ignore -v .env` 預期顯示 gitignored |

A1~A4 任一失敗 → 停下來回報 Cowork / Paul。
A5 失敗 → 緊急中止，立刻檢查為什麼 `.env` 沒被 ignore。

---

## 5. 驗證方式

### Task 1 驗證
```bash
git log --oneline origin/main..HEAD     # 預期：空輸出（已同步）
```

### Task 2 驗證
```bash
# 成功的檔案數
grep -l 'transcript_lang: "Chinese\|transcript_lang: "English\|transcript_lang: "zh\|transcript_lang: "en' \
  src/content/wiki/sources/youtube-*.md | wc -l
# 預期：5 + N（5 原本就有，N 是這次補到的）

# 檢查 log 裡的成功/失敗分佈
grep -E '✓|✗' /tmp/wiki-backfill-$(date +%F).log | sort | uniq -c
```

### Task 3 驗證（GitHub 真相驗證，護欄 #14）
用 GitHub MCP 驗證 backfill commit 在 main：
```
mcp__github__get_file_contents → src/content/wiki/sources/youtube-{某個成功的 videoId}.md
→ grep 'transcript_lang: "Chinese"' or similar
```
預期：main 上該檔案有非空 transcript_lang。

### Task 4 驗證
用 `mcp__github__get_issue` 重抓 #157 → 確認 body 改動到位（護欄 #15 MCP 寫後驗證）。

---

## 6. 注意事項

- ⚠️ **不可逆 / 高風險操作**：
  - `git push origin main` — push 後很難撤，Task 1 + 3 都算，確保 commit 對再 push
  - Task 4 `update_issue` — MCP 寫入 Issue body 也受護欄 #15 規範，寫完要 `get_issue` 重抓驗證
- ⚠️ **Issue #157 body 長度接近上限**：目前 ~8KB，加完 2026-04-19 段落還很安全。若擔心，先備份舊 body（Issue body 的 GET response），改完對比
- ⚠️ **backfill 跑失敗的影片不要砍檔**：就算 transcript 沒抓到，`fetchTranscriptLocal` 也不會刪檔。失敗的維持原 `transcript_lang: ""`，列在 Task 3 commit message 的失敗清單即可
- ⚠️ **.bak 不要 commit**：`scripts/wiki-youtube-ingest.cjs.bak` 是 Cowork 留的本機備份，不用處理也不要加進 staging
- ⚠️ **不要順手 commit 其他未追蹤檔**：repo 裡有一大堆 iCloud 衝突副本（`* 2.md / 3.md`）和其他 session 的未提交 handoff。這次 Task 只動 `scripts/` + `src/content/wiki/sources/youtube-*.md`，其他全部跳過

---

## 7. 信心等級

- Task 1（push 61e40e1）：**高**。commit 已本機驗過語法，diff 小且乾淨
- Task 2（batch backfill）：**中**。單支（IRb_X7zwNi4）已驗證 pipeline 正確，但 18 支裡可能有：(a) 影片被下架、(b) 地區限制、(c) 極長影片（>2 hr）壓縮後仍 >25 MB、(d) Whisper 辨識失敗。這些都屬非預期但 skip 即可的情境，不影響整批
- Task 3（commit + push backfill 結果）：**高**。pattern 固定
- Task 4（更新 Issue #157）：**中**。body 編輯有 race condition 風險（多 session 同時改），建議動手前先 `get_issue` 確認最新 body，編輯時保留本次 comment 不覆蓋

---

## 8. Integration Checklist

這次改動只動本機 CLI 腳本 + content update，**不碰**：

- ❌ 不動 Worker（`worker/src/*`）
- ❌ 不動 KV schema
- ❌ 不動前端頁面（`src/pages/wiki/*`）
- ❌ 不動 API endpoint（`/api/wiki/*`）
- ❌ 不動排程設定（Cowork 的 scheduled tasks、Worker cron）

**跨專案影響**：無。`wiki-youtube-ingest.cjs` 只屬 paulkuo.tw 專案，不與 Formosa/其他 repo 共用。

**未來可能的副作用**：
- backfill 跑完後若要讓新 transcript 出現在 `/api/wiki/search` 回應裡，需跑 `scripts/wiki-kv-seed.cjs`。**但架構備忘**（Issue #157 最底）提到 `/api/wiki/search` 只索引 concept 頁不索引 source，所以新 transcript 對搜尋 API 影響為 0。若要讓轉錄內容被 Ask API 利用，才需重新 seed

---

## Code 完成三態宣告（結案時必填，護欄 #14）

Code 在 Issue #157 留 comment 或 Cowork 回報完成時，每項任務必須標三態之一：

- `✅ commit {SHA} pushed` — 改動在 GitHub main
- `⚠️ commit {SHA} local only` — 已 commit 未 push
- `⚠️ local edit uncommitted` — 檔案改了未 commit

Cowork 看到「done / updated / fixed」等模糊詞**會追問**，請直接附 SHA 避免來回。

---

## 小結

- Cowork 這輪修補兩個 YouTube ingest 痛點，驗證通過 1 支
- Code 接手跑完剩 18 支、push 兩輪 commit、更新 Issue #157
- 整件事結案後，LLM Wiki 的三大管線（notes / web / youtube）就全部健康

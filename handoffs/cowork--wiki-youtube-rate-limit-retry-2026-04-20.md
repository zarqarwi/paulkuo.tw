# Handoff · Cowork → Cowork · YouTube Whisper STT Rate Limit 重試

**日期**：2026-04-19 晚間寫，**預定執行：2026-04-20（隔日）**
**發起**：Cowork session（LLM Wiki 專案）
**接手**：下一個 Cowork session
**相關 Issue**：[#157 LLM Wiki 知識管線儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)
**前置 commit**：`61e40e1`（dotenv + ffmpeg）+ `be49a9a`（7 支成功）both pushed to main

---

## 模型建議 & Task Sizing

- **模型**：Claude Sonnet 4.6
- **Effort**：Low（純執行，不含決策）
- **Task Size**：**S**（< 30 min，其中 backfill 跑片預估 15-20 min，剩下是 commit + Issue 更新）
- **理由**：純粹重跑 rate-limited 的 11 支，程式碼不動、邏輯不動。Haiku 也夠用，但 Sonnet 比較穩；Opus 浪費。

---

## 1. 背景

2026-04-19 白天已完成 YouTube ingest pipeline 完整修復（Cowork `61e40e1` + Code `be49a9a`）。批次 backfill 19 支影片時：

- ✅ **7 支成功**（Groq ASPH quota 用完之前跑進去的）
- ⏳ **11 支 Groq ASPH rate limit**（每小時 7200 秒音訊配額耗盡）
- 🚫 **1 支 Po6xqJsCook** yt-dlp 無法下載（影片不公開，**永遠 skip，別重試**）

這份 handoff 目的是「隔日 quota reset 後，把剩 11 支跑完」，拿到 26/26 中 25 支有字幕（剩 1 永遠 skip）的最終狀態。

**為什麼 Cowork 而不是 Code？**
因為沙盒可以跑 `node scripts/wiki-youtube-ingest.cjs`，且這次不需要 terminal 做複雜操作——唯一的 terminal 動作是 `git commit + push`，可以直接交給 Paul 在 iTerm 按一次或走 Cowork 的 Bash。任務小到不值得開 Code session。

---

## 2. Step 0 偵察（接手前先驗證）

用 Cowork 的 Bash 或 GitHub MCP 確認：

```bash
# 偵察 1：main 仍在 be49a9a（沒有人動過）
# 用 GitHub MCP list_commits → 第一筆應該是 be49a9a

# 偵察 2：本機 repo 跟 origin 同步
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
# 預期：您的分支與上游分支 'origin/main' 一致

# 偵察 3：算待 backfill 數量
grep -rL 'transcript_lang: "zh\|transcript_lang: "en\|transcript_lang: "ja\|transcript_lang: "Chinese\|transcript_lang: "English' \
  src/content/wiki/sources/youtube-*.md | wc -l
# 預期：12（11 rate limit + 1 Po6xqJsCook 永遠失敗）

# 偵察 4：.env 還有 GROQ_API_KEY
grep -c '^GROQ_API_KEY=gsk_' .env
# 預期：1

# 偵察 5：ffmpeg 可用
which ffmpeg
# 預期：/opt/homebrew/bin/ffmpeg

# 偵察 6：Groq quota 是否 reset（2026-04-19 晚間用完，隔日白天應該 reset）
# 這個沒辦法靠 API 直接查，就直接跑看看。如果還是 rate limit，晚一點再跑
```

**偵察 3 若 > 12**：代表有新 ingest 進來，確認一下是排程幫的還是 Paul 手動，把新進來的影片納入這次 backfill 範圍即可。
**偵察 3 若 < 12**：代表已經有人重試過一部分，也沒關係，繼續跑剩下的。

---

## 3. 具體步驟

### Task 1 — 批次 backfill 剩餘影片

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
node scripts/wiki-youtube-ingest.cjs --backfill 2>&1 | tee /tmp/wiki-backfill-$(date +%F).log
```

**預期行為**：自動挑 `transcript_lang: ""` 的影片（11 或 12 支），跑 yt-dlp + Whisper 管線。估 15-20 分鐘。

**預期結果**：
- ✅ 11 支全部成功（quota 已 reset）
- 🚫 Po6xqJsCook 維持失敗（yt-dlp 抓不到，不是配額問題）

**若又撞 rate limit**：
- 跑到一半再撞，commit 已經跑完的，剩下的標記「再等一段時間」
- 開頭就撞 → Groq 單日配額也可能有上限，晚幾小時再試

**若有影片之外的非預期錯誤**（網路、ffmpeg、磁碟）：
- 停下來回報 Paul，不要盲目重試
- 檢查 `/tmp/wiki-backfill-{日期}.log` 的錯誤訊息

### Task 2 — Commit + Push backfill 結果

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git add src/content/wiki/sources/youtube-*.md
git status --short
# 應該看到 M src/content/wiki/sources/youtube-*.md（11 或其他數字）

git commit -m "$(cat <<'EOF'
chore(wiki-sources): YouTube Whisper STT backfill rate limit 重試（2026-04-20）

延續 2026-04-19 commit be49a9a，跑完當天 Groq ASPH rate limit 失敗的 11 支。

成功：{列出 videoId}
仍失敗：Po6xqJsCook（yt-dlp 影片不公開，永遠 skip）

[影響: wiki content only]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

**Cowork 沙盒不能 push** → 請 Paul 本機跑 `git push origin main`，或走 Cowork 的 Bash 假設 sandbox 掛得到 Paul 本機 git remote 憑證（通常不行）。

**務實做法**：產出 commit command 交給 Paul 複製到 iTerm 執行。護欄 #14 要求 commit 之後要有 SHA——commit 完 Paul 回傳 SHA，Cowork 再更新 Issue。

### Task 3 — 更新 Issue #157

用 GitHub MCP `update_issue` 改 body：

1. **YouTube Source 統計** 表格：
   - 有字幕 14 → 25
   - 待 Whisper STT 11 → 0
   - 影片不公開 1 → 1（不變）
2. **今日工作紀錄** 加一個 2026-04-20 段落：

```markdown
## 今日工作紀錄（2026-04-20）

### YouTube Whisper STT Rate Limit 重試 ✅

**Cowork 2026-04-20 commit `{新 SHA}`**：
- 延續前一日（be49a9a）的 rate limit 失敗批次，跑完剩 11 支
- 25/26 支 YouTube source 有字幕（剩 1 支 Po6xqJsCook 影片不公開，永遠 skip）
- YouTube ingest pipeline 閉環完成
```

3. **待辦** 劃掉「Whisper STT 重試 11 支」那行。

**寫後驗證（護欄 #15）**：用 `get_issue` 重抓 #157，確認：
- 統計表改對了
- 新段落有加
- 舊內容沒被覆蓋（特別是 2026-04-19 紀錄要保留）

### Task 4 — 留結案 comment

```
## ✅ 2026-04-20 · YouTube Transcript Pipeline 100% 結案

- commit `{SHA}` pushed
- 25/26 支 YouTube source 有字幕
- 1 支 Po6xqJsCook 永遠 skip（影片不公開，不計為失敗）

YouTube ingest 三大管線全健康：
- ✅ Worker cron 抓新影片
- ✅ Cowork 排程 pull 到本機
- ✅ yt-dlp + Whisper fallback（新版 dotenv + ffmpeg）補字幕

下一步：Worker deploy（把修好的 ingest 上線給每日 cron 用）。
```

---

## 4. 上游假設

| # | 假設 | 驗證方法 |
|---|------|---------|
| A1 | Groq ASPH 每小時配額已 reset | 直接跑 Task 1，若又 rate limit 就晚點再試 |
| A2 | main HEAD 仍是 `be49a9a`（或之後有合理 commit） | 偵察 1 |
| A3 | 本機 `.env` 仍有 GROQ_API_KEY | 偵察 4 |
| A4 | 本機 ffmpeg 仍可用 | 偵察 5 |
| A5 | 待 backfill 剩 12 支（或 11 支，若 Paul 手動跑了一部分） | 偵察 3 |

---

## 5. 驗證方式

### Task 1 驗證
```bash
# 跑完後算剩多少待 backfill（應該只剩 1 支 Po6xqJsCook）
grep -rL 'transcript_lang: "zh\|transcript_lang: "en\|transcript_lang: "ja\|transcript_lang: "Chinese\|transcript_lang: "English' \
  src/content/wiki/sources/youtube-*.md | wc -l
# 預期：1

# 哪一支還是空的
grep -rL 'transcript_lang: "zh\|transcript_lang: "en\|transcript_lang: "ja\|transcript_lang: "Chinese\|transcript_lang: "English' \
  src/content/wiki/sources/youtube-*.md
# 預期：只剩 Po6xqJsCook
```

### Task 2 驗證（護欄 #14）
用 GitHub MCP `list_commits` 確認新 commit SHA 在 main。
用 `get_file_contents` 挑一支成功的（例如 `youtube-{slug}-{videoId}.md`）grep `transcript_lang: "Chinese"` 確認在 main。

### Task 3 驗證（護欄 #15）
用 `get_issue` 重抓 #157，diff 新舊 body：
- 新增段落出現
- 統計表數字對
- 舊內容全留
- Issue `updated_at` 是剛剛的時間

---

## 6. 注意事項

- ⚠️ **Po6xqJsCook 不要當作失敗**：已確認是影片不公開，永遠抓不到，應標記為「skip」而不是「rate limit」。未來 rate limit 清單不該再有它
- ⚠️ **同時改 Issue body 的 race condition**：動手前先 `get_issue` 確認最新 body，編輯時複製最新版再改，避免覆蓋別的 session 的寫入
- ⚠️ **跨 session 禁止重複提醒**（護欄 #2.5 驗證優先）：開場先掃 memory 看這件事是否已完成。若 `project_youtube_transcript_fix.md` 已標記 100% 結案，就不用再跑，請跟 Paul 確認是否還有新的 ingest
- ⚠️ **Worker deploy 不在這次範圍**：Issue #157 待辦裡的 `wrangler deploy` 是另外一件事，需要 Paul 在本機終端跑，不要順手一起做

---

## 7. 信心等級

- Task 1（backfill 11 支）：**中高**。管線已驗證沒問題，唯一不確定是 Groq quota reset 時間，若又撞就換個時段
- Task 2（commit + push）：**高**。pattern 固定
- Task 3（Issue 更新）：**中**。有 race condition 風險，先 get 再 update
- Task 4（結案 comment）：**高**

---

## 8. Integration Checklist

這次改動只動 wiki source 內容 + Issue body，**不碰**：

- ❌ 不動 `scripts/wiki-youtube-ingest.cjs`（上輪已定型）
- ❌ 不動 Worker（`worker/src/*`）
- ❌ 不動 KV schema / KV seed
- ❌ 不動前端 / API endpoint
- ❌ 不動排程設定

**跨專案影響**：無。

**未來可能的副作用**：
- 新轉錄後若要讓內容被 `/api/wiki/ask` 利用，需跑 `scripts/wiki-kv-seed.cjs` 重建 KV。但 `/api/wiki/search` 只索引 concept 不索引 source 全文，不影響搜尋功能
- Worker cron 上線後（獨立任務）會開始自動抓新影片，未來這類 rate limit 問題會自然出現，不需要手動 backfill

---

## Cowork 完成三態宣告（結案時必填，護欄 #14）

回報時每項任務必須標三態之一：

- `✅ commit {SHA} pushed` — Paul 已在本機 push，改動在 GitHub main
- `⚠️ commit {SHA} local only` — 已 commit 未 push
- `⚠️ local edit uncommitted` — 檔案改了未 commit

## Cowork Sandbox 特別註記

- **沙盒不能 `git push`**：Task 2 的 commit + push 需要 Paul 本機執行，Cowork 只負責產出指令 + 寫 commit message
- **Paul 本機執行後**回傳 SHA，Cowork 才能進 Task 3、4

---

## 小結

- 昨天 2026-04-19 完成 pipeline 修復（dotenv + ffmpeg）+ 首輪 backfill（7/19 成功）
- 今天 2026-04-20 目標：rate limit reset 後補完剩 11 支，達到 25/26 有字幕的終態
- 做完這件事，YouTube ingest 管線進入「不用管」狀態，Worker cron 上線後自動運作

# Code Handoff — YouTube blocklist 串接 wiki-youtube-ingest.cjs（2026-04-27）

> 建立：2026-04-27 由 Cowork session 結束時產出
> 來源：v5 handoff 任務 #1「YouTube blocklist 擴充」
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low（30 min，純機械改 + 跑 dry-run 驗證）

---

## 1. 上下文

`data/wiki-ingest-blocklist.json` 04-26 之前只支援 `raw_note_id`（getnote 雪花 ID）。
`scripts/build_wiki_ingest_report.py`（scanner）讀 `blocklist` 區塊跳過 get_筆記 候選。
但 `wiki-youtube-ingest.cjs` **完全沒接 blocklist**，只靠檔案是否存在做 dedup。

04-26 wrong_pillar 9 支裁決時 #8（`youtube-0h3P7Ojn-3o`）被 drop，source 已刪，
但下次 ingest pipeline 跑 KV pending 撈回來就會重新落檔，等於沒擋住。

Cowork 04-27 已完成 schema 擴充：

- commit `5aa3ba8` — JSON 加 `youtube_blocklist` 獨立區塊（Option A：兩個 ID space 分離）
- commit `a9cbb1c` — `docs/wiki-visibility-rules.md` SSOT 補完雙區塊職責

`youtube_blocklist` 已預先放好第一筆 entry：

```json
"0h3P7Ojn-3o": {
  "reason": "wrong_pillar_drop — 中東滯脹相關，主題離 paulkuo.tw 主軸太遠",
  "added_at": "2026-04-27",
  "added_by": "cowork+paul",
  "title_at_delete": "youtube-0h3P7Ojn-3o（中東滯脹相關，wrong_pillar 9 支裁決 #8）"
}
```

**本 handoff 任務**：把 `youtube_blocklist` 讀取與檢查邏輯接進 `wiki-youtube-ingest.cjs`。

---

## 2. 動作清單

### 動作 1：新增 blocklist loader（純函數，仿 dotenv loader 風格）

在檔案 top-level helpers 區（`kvGet` 函數之前）加：

```js
// ── Blocklist loader ───────────────────────────────────────────────────
// SSOT: docs/wiki-visibility-rules.md（Ingest Blocklist 機制）
// JSON: data/wiki-ingest-blocklist.json
// 注意：只讀 youtube_blocklist 區塊，blocklist 區塊（raw_note_id）不影響 youtube ingest

const BLOCKLIST_PATH = path.join(PROJECT_ROOT, 'data', 'wiki-ingest-blocklist.json');

function loadYoutubeBlocklist() {
  if (!fs.existsSync(BLOCKLIST_PATH)) return {};
  try {
    const raw = fs.readFileSync(BLOCKLIST_PATH, 'utf-8');
    const doc = JSON.parse(raw);
    return doc.youtube_blocklist || {};
  } catch (err) {
    console.warn(`[blocklist] failed to parse ${BLOCKLIST_PATH}: ${err.message}`);
    return {};
  }
}
```

### 動作 2：`pullPending()` 加 blocklist check

定位點：`pullPending()` 函數內，`for (const entry of keys)` 迴圈起始處。

加在 `kvGet(key)` 之前（最早 short-circuit）：

```js
const blocklist = loadYoutubeBlocklist();  // 移到 for 之前讓整個迴圈共用一次讀取

for (const entry of keys) {
  const key = entry.name;

  // Extract videoId from key for blocklist check (key format: "youtube:pending:<videoId>")
  const videoIdFromKey = key.split(':').pop();
  if (videoIdFromKey && blocklist[videoIdFromKey]) {
    console.log(`  ⊘ Blocklisted: ${videoIdFromKey} — ${blocklist[videoIdFromKey].reason}`);
    kvDelete(key);  // 清掉 KV pending 避免下次又掃到
    continue;
  }

  // ... 原本的 kvGet / parse / write 邏輯不動
}
```

**重點**：blocklisted 的 KV pending key 直接刪掉，避免每次 ingest 跑都印同樣的 ⊘ 訊息。

### 動作 3：`triggerIngest()` 加 blocklist check

定位點：`triggerIngest()` 函數內，呼叫 API 之前。

```js
async function triggerIngest(videoUrl, options = {}) {
  // ... 既有的 adminToken 檢查 ...

  // Extract videoId from URL or use as-is if it's already 11-char id
  const videoIdMatch = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/) || [null, videoUrl];
  const videoId = videoIdMatch[1];

  const blocklist = loadYoutubeBlocklist();
  if (videoId && blocklist[videoId]) {
    console.error(`Error: ${videoId} is in youtube_blocklist`);
    console.error(`  Reason: ${blocklist[videoId].reason}`);
    console.error(`  Added: ${blocklist[videoId].added_at} by ${blocklist[videoId].added_by}`);
    console.error(`  To re-enable, remove from data/wiki-ingest-blocklist.json youtube_blocklist`);
    process.exit(1);
  }

  console.log(`Triggering ingest for: ${videoUrl}\n`);
  // ... 原本的 fetch API 邏輯不動
}
```

### 動作 4：dry-run 驗證

```bash
cd <repo root>

# 場景 1：手動 trigger 黑名單影片應該被擋
node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=0h3P7Ojn-3o
# 期望：印 "is in youtube_blocklist" + reason，exit 1

# 場景 2：手動 trigger 正常影片應該照常運作（不會誤擋）
# 找一個明顯不在 blocklist 的 videoId 測，例如已經 ingest 過的 j1V_C6qxT20
node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=j1V_C6qxT20 --force
# 期望：照常呼叫 API（API 端可能說 already ingested，也是正確行為）

# 場景 3：pullPending 不會對 blocklist videoId 落檔
# 如果剛好沒有 KV pending，跳過此驗證即可（手動 put 一筆假 KV 過於繁瑣）
node scripts/wiki-youtube-ingest.cjs
# 期望：若無 pending → 印 "No pending YouTube videos in KV."；若 0h3P7Ojn-3o 在 pending 會被 ⊘ + KV 清掉
```

### 動作 5：commit + push

```bash
git add scripts/wiki-youtube-ingest.cjs
git commit -m "feat(wiki-youtube-ingest): respect youtube_blocklist before fetch

讀 data/wiki-ingest-blocklist.json youtube_blocklist 區塊，在
pullPending（KV-driven）和 triggerIngest（manual URL）兩條
路徑都先擋掉黑名單影片：

- pullPending：blocklisted videoId 直接 ⊘ + 清 KV pending
- triggerIngest：blocklisted videoId 印 reason + exit 1

避免 04-26 wrong_pillar drop 的 #8 0h3P7Ojn-3o 下次又被 ingest 撈回。

驗證：
- node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=0h3P7Ojn-3o
  → exit 1 with reason
- 正常影片（不在黑名單）行為不變
- pullPending 對非黑名單影片照舊運作

Refs: Issue #157、cowork--wiki-youtube-blocklist-handoff-2026-04-27.md
SSOT: docs/wiki-visibility-rules.md（Ingest Blocklist 機制）"

git push
```

---

## 3. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| 黑名單 manual trigger 被擋 | exit 1 + 印 reason | 動作 4 場景 1 |
| 正常 manual trigger 不受影響 | 行為不變 | 動作 4 場景 2 |
| pullPending 黑名單影片 ⊘ + KV 清掉 | 略過落檔 | 動作 4 場景 3（有 KV 才驗證） |
| Blocklist JSON 解析失敗 graceful | warn + 回 `{}`（fail-open） | code review |
| 既有 raw_note_id `blocklist` 區塊不被誤讀 | scanner 行為不變 | 跑 `python3 scripts/build_wiki_ingest_report.py` 看 blocklist count = 13 |

---

## 4. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-youtube-ingest.cjs` | 加 loader + 兩處 check（pullPending / triggerIngest） |
| `data/wiki-ingest-blocklist.json` | **不本次動**（Cowork 已 commit `5aa3ba8`）|
| `docs/wiki-visibility-rules.md` | **不本次動**（Cowork 已 commit `a9cbb1c`）|
| `scripts/build_wiki_ingest_report.py`（scanner）| 不動，繼續只讀 `blocklist` 區塊 |
| `scripts/wiki-quarantine-apply.py` | 不動，繼續只寫 `blocklist` 區塊 |
| `data/shared-file-impact-map.md` | 加一行登記 `wiki-youtube-ingest.cjs` 跟 blocklist 互動（可選）|
| KV `youtube:pending:*` keys | 黑名單影片的 KV key 會被 `kvDelete` 清掉（idempotent，安全）|

---

## 5. 護欄

- **不要改 `blocklist` 區塊讀寫邏輯** — scanner / quarantine apply 維持只讀寫該區塊
- **不要把 `youtube_blocklist` 跟 `blocklist` 合併** — ID space 不同（純數字 vs 英數混合），合併會破壞 idempotency
- **Fail-open 原則** — JSON parse 失敗就回 `{}` 不擋 ingest，避免一個 typo 把整個 pipeline 卡死
- **`triggerIngest` 的 videoId regex** — 11-char 規則涵蓋 `youtu.be/X`、`watch?v=X`、`X` 三種形式；不確定時印 `videoId` 出來 debug

---

## 6. 完成後在 Issue #157 留言回報

模板：

```
## YouTube blocklist 擴充完成（2026-04-27）

### Schema（Cowork 已 commit）
- 5aa3ba8 feat(wiki-blocklist): youtube_blocklist 區塊建立 + #8 entry
- a9cbb1c docs(wiki-visibility): SSOT 補完雙區塊職責

### Pipeline 串接（Code 本次）
- <commit-sha> feat(wiki-youtube-ingest): respect youtube_blocklist

### 驗證
- ✅ 手動 trigger 0h3P7Ojn-3o 被擋（exit 1 + reason）
- ✅ 正常影片 trigger 行為不變
- ✅ scanner 讀 raw_note_id blocklist 不受影響（13 筆數量正確）

### 後續
- v5 任務 #1 結案
- 將來新 wrong_pillar drop YouTube 影片，直接編 youtube_blocklist 即可
```

---

## 7. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 1-3 改檔 | Sonnet 4.6 | 15 min |
| 動作 4 dry-run 驗證 | Sonnet 4.6 | 10 min |
| 動作 5 commit + push | Sonnet 4.6 | 5 min |

整體 Sonnet 4.6 + Low effort 即可。**不需要 Opus**——純機械改、無設計決策。

---

## 8. 依賴 / 來源

- v5 handoff：`worklogs/cowork--next-session-handoff-2026-04-26-v5.md`（任務 #1）
- 04-26 wrong_pillar 9 支：`worklogs/cowork--wiki-wrong-pillar-9-handoff-2026-04-26.md`（#8 來源）
- SSOT：`docs/wiki-visibility-rules.md`（Ingest Blocklist 機制段落）
- Cowork 04-27 commits：`5aa3ba8`（JSON 擴充）、`a9cbb1c`（SSOT 文件）

---

## 9. 不做的事（明確排除）

- **不擴充 `wiki-quarantine-apply.py` 寫 `youtube_blocklist`** — 目前 quarantine 流程只處理 raw_note_id，YouTube drop 走人工 + Cowork handoff 即可
- **不寫 backfill scan** — 沒有需要回溯的歷史 source（已刪），只擋未來
- **不動 `wiki-enrich.cjs`** — enrichment 在 source 已落檔之後跑，blocklist 在 ingest 階段擋就夠
- **不動 KV namespace 結構** — `youtube:pending:*` key format 不變

---

*產出：Cowork session 2026-04-27 接手 v5 handoff*
*下一手：Code session 接此 handoff 30 min 完成；或合併下個 Cowork session 之前確認串好*

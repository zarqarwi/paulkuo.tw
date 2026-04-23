# Handoff: Scanner 去重機制（Layer 1 + Layer 2A）

> **給 Code session 的交辦文件**
> 來源：Cowork session 2026-04-20（Opus 4.6）
> 建議模型：Sonnet 4.6
> Task size：M（45 分鐘，單一 commit 交付）
> 前置：無
> 觸發來源：worklogs/PENDING.md 第 76 行，`5c58ee02` 連續 3 天重複偵測

---

## 0. 進入目錄

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
```

⚠️ 開工前確認：

```bash
pwd  # 必須是 /Users/paulkuo/Desktop/01_專案進行中/paulkuo.tw
git status  # 應該是 clean
git log --oneline -3  # 確認在 main 且最新 commit 是 467e968（憲法速記卡）或更新
```

---

## 1. 問題背景

`scripts/cross-project-scanner.cjs` 每日 10:30 由 Cowork scheduled task 觸發，掃近 3 天 git log 比對 `docs/shared-files.json`，flagged 且缺 Smoke Test 的 commit 會被追加到 `worklogs/PENDING.md`。

**Bug**：去重邏輯（第 215 行）只檢查「今天 scanner 有沒有寫過」，而非「這個 commit hash 有沒有已經被記在 PENDING.md」。結果：

- commit `5c58ee02`（2026-04-16）在 3 天滑動視窗內被 scan 了 3 次（17/18/19）
- PENDING.md 累積 3 筆針對同一個 hash 的 "flagged" 紀錄
- Paul 每天看到重複提醒，但該 commit 實質上不需要 smoke test（Worker 端 YouTube ingest 修復，前端無依賴）

---

## 2. 要做的事

### Layer 1：改 scanner 去重邏輯（hash 級別）

**檔案**：`scripts/cross-project-scanner.cjs`

**目前行為**（第 203-229 行）：只要今天沒寫過 `auto-scanner {today}`，就把所有 missing_smoke_tests 的 flagged 追加一行。

**目標行為**：
1. Parse 現有 PENDING.md，取出已經出現過的所有 7-8 字元 commit hash
2. 過濾 flagged，只保留「缺 smoke test **且** hash 不在 PENDING.md」的項目
3. 若過濾後為空 → 印日誌後跳過，不追加
4. 若有新項目 → 追加一行（保留原本的格式）

**建議實作**（替換第 204-229 行）：

```js
  if (missing_smoke_tests > 0) {
    try {
      // 讀 skip list（Layer 2A）
      const SKIP_LIST_PATH = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'smoke-skip.json');
      let skipSet = new Set();
      if (fs.existsSync(SKIP_LIST_PATH)) {
        try {
          const skipData = JSON.parse(fs.readFileSync(SKIP_LIST_PATH, 'utf-8'));
          skipSet = new Set(Object.keys(skipData));
        } catch (e) {
          console.error('[scanner] smoke-skip.json 解析失敗（忽略）：', e.message);
        }
      }

      // 讀 PENDING.md 已存在的 hash
      let existingHashes = new Set();
      let pendingExists = fs.existsSync(PENDING_PATH);
      if (pendingExists) {
        const existing = fs.readFileSync(PENDING_PATH, 'utf-8');
        const matches = [...existing.matchAll(/\b([0-9a-f]{7,8})\b/g)];
        existingHashes = new Set(matches.map(m => m[1]));
      }

      // 過濾：缺 smoke test & 不在 skip list & 不在 PENDING.md
      const newCandidates = flagged.filter(f =>
        !f.has_smoke_test &&
        !skipSet.has(f.hash) &&
        !existingHashes.has(f.hash)
      );

      if (newCandidates.length === 0) {
        console.log('[scanner] 無新的 missing smoke test（已在 PENDING.md 或 skip list）');
      } else {
        const missingItems = newCandidates
          .map(f => `${f.hash}（${f.affected_projects.slice(0, 3).join(', ')}）`)
          .join(', ');
        const pendingLine = `- [ ] 🟡 跨專案 smoke test 缺漏：${missingItems} → Code (auto-scanner ${today})\n`;

        if (pendingExists) {
          fs.appendFileSync(PENDING_PATH, pendingLine, 'utf-8');
          console.log(`[scanner] ✓ 追加 PENDING.md（${newCandidates.length} 個新 commit）`);
        } else {
          fs.writeFileSync(PENDING_PATH, `## 待 Code 執行\n${pendingLine}`, 'utf-8');
          console.log('[scanner] ✓ 建立 PENDING.md');
        }
      }
    } catch (e) {
      console.error('[scanner] 寫入 PENDING.md 失敗：', e.message);
      // non-fatal
    }
  }
```

**順便把 `summary.missing_smoke_tests` 也排除 skip list**——這樣 audit-results/*.json 的 summary 才不會每天都顯示 1（明明已經 skip）。在第 158 行後面加：

```js
const skipSetForSummary = (() => {
  try {
    const p = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'smoke-skip.json');
    if (!fs.existsSync(p)) return new Set();
    return new Set(Object.keys(JSON.parse(fs.readFileSync(p, 'utf-8'))));
  } catch { return new Set(); }
})();
const missing_smoke_tests = flagged.filter(f => !f.has_smoke_test && !skipSetForSummary.has(f.hash)).length;
```

（簡化起見，上面的實作把 skip 讀了兩次。Code 可以抽成 `loadSkipSet()` helper function 放到 `run()` 開頭，避免重複。）

---

### Layer 2A：建立 smoke-skip.json

**新檔案**：`worklogs/governance/smoke-skip.json`

**Schema**：

```json
{
  "$schema": "smoke-skip-v1",
  "description": "scanner 判定為缺 Smoke Test 但實質不需要驗的 commit 白名單。每筆必填 reason / skipped_at / skipped_by。",
  "entries": {
    "5c58ee02": {
      "reason": "YouTube transcript pipeline 修復（worker/src/youtube-ingest.js），Worker 端後端任務，前端無直接依賴；實際驗證走本機 node scripts/wiki-youtube-ingest.cjs --backfill，已完成 4/23 sources",
      "skipped_at": "2026-04-20",
      "skipped_by": "Paul (via Cowork handoff)"
    }
  }
}
```

⚠️ **實作細節**：
- scanner 程式碼裡我示範是直接 `Object.keys(skipData)`——這只在「整份 JSON 就是 hash→entry 的 map」時成立
- 上面 schema 多包了一層 `entries`，所以 scanner 讀取時要改成 `Object.keys(skipData.entries || {})`
- 選一個即可。**我建議用有 `entries` 包起來的版本**，將來要加 metadata（version / last_updated）才不用 schema migration

**記得把 scanner 裡的 `Object.keys(skipData)` 改成 `Object.keys(skipData.entries || {})`。**

---

### Layer 2A 配套：docs 規範

**新檔案**：`docs/governance/smoke-skip-policy.md`（60-80 行）

內容涵蓋：
1. **什麼 commit 可以 skip**（舉例）
   - Worker 端修復但前端無依賴
   - 已由其他途徑驗證（本機 backfill、單元測試通過、手動 curl 驗過寫進 worklog 別的區塊）
   - 純文件、純 comment、純格式化
2. **什麼 commit 不可以 skip**
   - 任何 `critical` risk_level
   - 影響前端 UI 的共用模組（`BaseLayout.astro`、`translator.js`）
3. **操作流程**
   - Paul 決定 skip 某 commit → 改 `smoke-skip.json` → commit push
   - commit message 建議：`chore(governance): skip smoke test for {hash} — {一句話原因}`
4. **審計**
   - 每季 Cowork review 一次 skip list，確認沒有濫用
   - skip 必須附 reason，沒理由就該補 smoke test 而非 skip

---

## 3. 驗收

### 手動驗證

```bash
# 1. 直接跑 scanner，確認 5c58ee02 被排除
node scripts/cross-project-scanner.cjs

# 2. 看輸出日誌，應該出現「無新的 missing smoke test（已在 PENDING.md 或 skip list）」

# 3. 看 audit-results/2026-04-20.json（若今天跑過被覆蓋 OK）
cat worklogs/governance/audit-results/2026-04-20.json | python3 -m json.tool | grep -A 2 missing_smoke_tests
# 預期 missing_smoke_tests: 0
```

### 手動清理既存重複紀錄

`worklogs/PENDING.md` 第 75-76 行目前有重複的 scanner 紀錄，**Layer 1 不會自動清**（Layer 3 才會，本輪暫不做）。開工時先手動把這行刪掉：

```
- [ ] 🟡 跨專案 smoke test 缺漏：5c58ee02（paulkuo-main, llm-wiki）（scanner 連續 3 天重複偵測，2026-04-17/18/19 各產出一筆）
      → 待 Code 補驗或標記 skip；根治靠 scanner 去重機制（v5.2 候選）
```

刪了之後，`5c58ee02` 在 smoke-skip.json 裡已經掛號，scanner 下次跑不會再追加。

### 邊界測試（建議做一次）

臨時在 smoke-skip.json 移除 `5c58ee02` → 跑 scanner → 確認會追加 PENDING.md 一行 → 再把 skip 放回去 → 跑 scanner → 確認不會重複追加同一行。測完把 commit 還原（不要把測試副作用推到 main）。

---

## 4. Commit

**單一 commit** 涵蓋三件事：

- `scripts/cross-project-scanner.cjs`（Layer 1 改去重邏輯）
- `worklogs/governance/smoke-skip.json`（新檔，含 5c58ee02 一筆）
- `docs/governance/smoke-skip-policy.md`（新檔）
- `worklogs/PENDING.md`（手動刪 75-76 行的重複紀錄）

**Commit message 建議**：

```
feat(scanner): hash 級別去重 + smoke-skip.json 白名單機制 [影響: governance]

- scanner 去重改以 commit hash 為單位（原本只按日期，導致同一個 hash 連續 3 天重複追加 PENDING.md）
- 新增 worklogs/governance/smoke-skip.json 白名單：實質不需要 smoke test 的 commit 可登記跳過
- 配套規範 docs/governance/smoke-skip-policy.md 定義 skip 條件、流程、審計頻率
- 首批登記 5c58ee02（YouTube transcript pipeline 修復，Worker 端、前端無依賴）
- 手動清理 PENDING.md 第 75-76 行既存重複紀錄

Fixes: PENDING.md 第 76 行連續 3 天重複偵測問題
```

⚠️ `[影響: governance]` 必填（CLAUDE.md 跨子專案規則）。

---

## 5. Worklog 記錄

`worklogs/worklog-2026-04-20.md` 追加三維度紀錄：

**做了什麼**
- scanner 改 hash 級別去重 + 讀 smoke-skip.json 做白名單
- 建立 smoke-skip.json schema + 首批登記 5c58ee02
- 寫 smoke-skip-policy.md 規範
- 清理 PENDING.md 重複紀錄

**決策紀錄**
- 去重單位選 commit hash 而非日期：日期去重只擋住「同日重複」，解決不了「跨日滑動視窗重複」這個真正的 bug
- smoke-skip.json 用 `entries` 外層包起來（而非扁平 hash→entry）：為未來加 metadata（version / last_updated）留空間
- Layer 3（自動清理 PENDING.md）暫不做：Layer 1+2 先上，觀察 1-2 週再決定是否值得做 parse 成本

**阻礙與踩坑**
- （Code 自行填寫實際遇到的）

---

## 6. Push（Paul 執行）

Code session 在 sandbox 寫不到 `.git/`，commit + push 由 Paul 跑 oneliner：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git add scripts/cross-project-scanner.cjs worklogs/governance/smoke-skip.json docs/governance/smoke-skip-policy.md worklogs/PENDING.md worklogs/worklog-2026-04-20.md && git commit -m "feat(scanner): hash 級別去重 + smoke-skip.json 白名單機制 [影響: governance]" && git push
```

（完整 commit message 見第 4 節，Paul 可以改用 HEREDOC 帶完整版，或簡化成上面單行版。）

---

## 7. 完成後更新

- [ ] PENDING.md 第 76 行的「scanner 去重決策」待辦 → 刪除或標記 `[x]`
- [ ] 本 handoff 檔頂部加 `> ✅ 完成於 2026-04-20 by Code / Sonnet 4.6`
- [ ] 明天（2026-04-21）10:30 scanner 自動跑完後，回看 audit-results/2026-04-21.json，確認 `summary.missing_smoke_tests === 0`

---

## 附註

**為什麼不做 Layer 3（自動清理 PENDING.md）**

Layer 3 是 scanner 跑完後回頭清 PENDING.md 裡已完成/已 skip 的舊紀錄。不做的理由：
1. Layer 1+2 上線後，**新增的重複**已經不會再發生，止血任務完成
2. 既存重複紀錄只有這一筆，手動刪一次就乾淨
3. 自動 parse + 改 markdown 檔有非零風險（regex 吃錯別的行），投入產出比不高
4. 觀察 1-2 週，若真的又累積重複紀錄，再評估 Layer 3 值不值得做

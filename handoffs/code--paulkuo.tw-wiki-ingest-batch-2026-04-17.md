# Handoff: Wiki Ingest 批次（Batch 2026-04-17）

> **Target**: Code session
> **Project**: paulkuo.tw LLM Wiki（Issue #157）
> **Date**: 2026-04-17
> **Source**: `worklogs/wiki-ingest-pending.md`（Cowork `wiki-ingest-scanner` 10:02 自動掃描產出）
> **模型建議**：Sonnet 4.6 + **Medium**
> **Task Sizing**：**M**（30 min ~ 2 hr，預期 1 小時完成第一批 13 篇）

---

## 1. 背景

Cowork 每日 10:02 排程 `wiki-ingest-scanner` 完成今日掃描，結果：

- 已 ingest wiki sources：140 篇
- get_筆記 非 private 總數：234 篇
- **尚未 ingest：94 篇**（public 11 + internal 76 + private 7）

本輪目標先處理 **public 11 篇 + 2 篇檔名正規化異常的 01_專欄文章**（共 13 篇），符合 Wiki 專案每週 10-20 篇的節奏，也把最容易的部分先清掉。internal 76 篇留到 Paul 審查後再拆批次，private 7 篇不進 Wiki。

---

## 2. Step 0 偵察（先查再改）

動手前必跑：

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw

# 2-0. 確認 ingest 腳本位置與最近一次執行狀況
ls -la scripts/ | grep -E "(wiki|ingest|kv-seed)"
git log --oneline -10 -- src/content/wiki/sources/

# 2-1. 確認 wiki sources 現狀（應為 140 篇）
ls src/content/wiki/sources/ | wc -l
ls src/content/wiki/sources/ | head -5

# 2-2. 確認本批 13 筆來源檔案全部存在於 get_筆記（sanity check）
cd ~/Desktop/01_專案進行中/get_筆記/notes
ls "01_專欄文章/" | grep -E "(780_|781_|885_|051360|349784|027360|779_清华|884_硅谷)"
ls "03_環保循環經濟/" | grep "1907120797253949040"
ls "04_AI與科技/" | grep -E "(1889383220122860776|1889383220123426280|1889383221197126888|1876069511921294528)"

# 2-3. 確認 content collection schema
cat ~/Desktop/01_專案進行中/paulkuo.tw/src/content.config.ts | grep -A 30 "wiki.*sources"

# 2-4. 確認 04_AI與科技 中 4 篇是否為錄音卡筆記（應為 false，才是 public）
# 讀 frontmatter 的 tags 區塊確認沒有 "录音笔记" 或 "录音卡笔记" 系統 tag
```

**偵察重點**：
- 2-2 若找不到某筆檔案 → 中止該筆，記到「待人工確認」清單
- 2-4 若發現其中一篇是錄音卡筆記 → 降級為 internal，跳過本輪

---

## 3. 具體步驟

### 3.1 本批 13 篇清單

#### 🟢 01_專欄文章（6 篇，直接 ingest）

| note_id (suffix) | title | source path |
|---|---|---|
| `852296` | 780_顶级创业孵化器YC押注 | `01_專欄文章/780_顶级创业孵化器YC押注/` |
| `286224` | 781_斯坦福开源Merlin模型 | `01_專欄文章/781_斯坦福开源Merlin模型/` |
| `379272` | 885_怎样对抗心中那个一念成魔的时刻 | `01_專欄文章/885_怎样对抗心中那个一念成魔的时刻/` |
| `051360` | untitled_051360 | `01_專欄文章/untitled_051360/` |
| `349784` | untitled_349784 | `01_專欄文章/untitled_349784/` |
| `027360` | 万维钢_卷王_027360 | `01_專欄文章/万维钢_卷王_027360/` |

#### 🟢 03_環保循環經濟（1 篇）

| note_id (suffix) | title | source path |
|---|---|---|
| `949040` | （英文新书）《马斯克言行录》 | `03_環保循環經濟/...1907120797253949040.md` |

#### 🟢 04_AI與科技（4 篇，需 3.2 錄音標記複查）

| note_id (suffix) | title | source path |
|---|---|---|
| `860776` | untitled_1889383220122860776 | `04_AI與科技/untitled_1889383220122860776.md` |
| `426280` | untitled_1889383220123426280 | `04_AI與科技/untitled_1889383220123426280.md` |
| `126888` | untitled_1889383221197126888 | `04_AI與科技/untitled_1889383221197126888.md` |
| `294528` | 👏👏Hi，欢迎来到 Get 笔记 | `04_AI與科技/...1876069511921294528.md` |

#### ⚠️ 01_專欄文章 檔名異常（2 篇，Cowork 端讀不到 frontmatter）

| path (Cowork 掃到的字串) | 備註 |
|---|---|
| `01_專欄文章/快刀青衣_專欄/779_清华李宁教授：40分钟投入+AI完成20人天工作，工作量咋算.md` | 「咋」vs「咂」的 UTF-8 變體 |
| `01_專欄文章/快刀青衣_專欄/884_硅谷"站队风波"背后，美国政府与科技巨头的极限拉扯.md` | 「扯」vs「扇」的 UTF-8 變體 |

Code 本機跑 `ls 01_專欄文章/快刀青衣_專欄/` 應該能看到正確檔名。確認實際 note_id 後補進 ingest 批次。

### 3.2 每篇 ingest 流程

1. **讀來源** `notes/{folder}/{path}` 的 frontmatter 與 body
2. **轉 wiki source**：產出 `src/content/wiki/sources/getnote-{suffix}-{slug}.md`
   - `raw_note_id`：完整 19 位 note_id
   - `visibility`：`public`
   - `source_folder`：對應資料夾代號（例如 `01_專欄文章`）
   - `title`、`tags`、`ingested_at`（today）
3. **wikilinks**：如果 body 提到既有 concept（`src/content/wiki/concepts/*.md`）→ 改 `[[concept-name]]`，不新增 concept
4. **sanity check**：`pnpm astro check` 或 `pnpm build` 確認 collection 不爆

### 3.3 批次收尾

```bash
# 所有 ingest 完成後
node scripts/wiki-kv-seed.cjs  # 更新 TICKER_KV
pnpm astro check               # schema 驗證
git add src/content/wiki/sources/
git commit -m "wiki: ingest batch 2026-04-17 (public 13 files)"
git push origin main
```

### 3.4 更新 Issue #157

在 Issue comment 追加：

```
2026-04-17 batch ingest 完成
- 新增 {N} 篇 sources（public）
- sources 總數：140 → {140+N}
- 待 ingest 殘量：{94-N} 篇（internal 76 + private 7 不動）
- commit: {SHA}
```

---

## 4. 上游假設（接手方先驗證）

本 handoff 基於下列前提，Code 動手前可 grep / 快速確認：

| 假設 | 怎麼驗證 | 出錯時怎麼辦 |
|---|---|---|
| `src/content/wiki/sources/` 已有 140 篇 getnote-*.md | `ls src/content/wiki/sources/ \| wc -l` | 實際數不等 → 先跑 `scripts/wiki_rescan.py`，掃描基線可能已飄移 |
| `scripts/wiki-kv-seed.cjs` 可跑且連到正確 KV | `node scripts/wiki-kv-seed.cjs --dry-run`（若支援） | 失敗 → Code 判斷腳本狀況，別直接覆蓋 KV |
| `content.config.ts` 的 wiki.sources schema 未變 | `git log -p src/content.config.ts \| head -50` | schema 已變 → 新增欄位需調整本 handoff 的 frontmatter 模板 |
| 04_AI與科技 4 篇**非**錄音卡筆記（否則降級） | 讀各檔 frontmatter 的 `tags` 區，找 `录音笔记` / `录音卡笔记` system tag | 發現是錄音 → 從本批移除，併入 internal 清單等 Paul 審查 |
| get_筆記 notes/ 路徑沒有被搬動 | `ls ~/Desktop/01_專案進行中/get_筆記/notes/` | 路徑變了 → 停，改回 Cowork 更新掃描腳本 |

---

## 5. 驗證方式（多源對照，不自我驗證）

| 驗證項 | 方法 | 驗證來源 |
|---|---|---|
| 新增 sources 數量正確 | `ls src/content/wiki/sources/ \| wc -l` → 應為 140 + N | 本機 filesystem |
| frontmatter schema 通過 | `pnpm astro check`（應為 0 error） | Astro build |
| KV seed 成功 | Worker API 回應新 source：`curl https://paulkuo.tw/api/wiki/concept?id={任一新 suffix}` | 線上 API |
| 頁面 render OK | `curl -s https://paulkuo.tw/wiki/{slug} \| grep -c "<h1"` ≥ 1 | 線上瀏覽器 |
| Wikilinks 不指向不存在頁 | `grep -oE "\[\[[^]]+\]\]" src/content/wiki/sources/getnote-*.md \| sort -u` 對照 concepts/ 目錄 | 本機 grep |

⚠️ 禁止用本 handoff 或 ingest 腳本自己產出的 log 驗證結果（護欄 #3）。

---

## 6. 注意事項

- **不可逆操作**（走 Propose-then-Commit，護欄 #11）：
  - ⚠️ `node scripts/wiki-kv-seed.cjs` 會覆寫 KV — 先跑 dry-run（若支援），或先在 staging KV 驗證
  - ⚠️ `git push origin main` — 推送前跑 `pnpm astro check`
- **錄音卡筆記 tag 變體**：SKILL 規範說 `录音卡笔记`，實際 frontmatter 可能是 `录音笔记`（少一字）。Cowork 側已修正為兩種都認；Code ingest 時也要同步判斷
- **slug 命名**：避免中文直接當檔名結尾，建議 `getnote-{suffix}-{pinyin-or-raw-id}.md`，保留既有命名慣例
- **跨專案影響檢查**（記憶規則）：`wiki-kv-seed.cjs` 和主站共用 `TICKER_KV`，推送前看一下 `docs/shared-file-impact-map.md` 有沒有其他功能讀相同 key
- 01_專欄文章 的 2 篇檔名異常：務必用本機 `ls`（會正確顯示 UTF-8 NFC 形式）確認實際檔名後再 ingest

---

## 7. 信心等級

- **整體**：中高
- **public 6 篇（01_專欄文章）**：高 — 純 markdown，frontmatter 完整
- **public 1 篇（03_環保循環經濟）**：高
- **public 4 篇（04_AI與科技）**：中 — 需 Code 現場確認不是錄音卡筆記
- **2 篇檔名異常（779、884）**：中 — 需 Code 本機 `ls` 對照後再 ingest

---

## 8. Integration Checklist

這次改動可能影響的其他系統：

- [ ] **Worker API**（`/api/wiki/search`、`/api/wiki/concept`、`/api/wiki/graph`、`/api/wiki/ask`）— ingest 後 KV 內容變更，API 回應會跟著變。推送後打一次 `curl https://paulkuo.tw/api/wiki/search?q=YC` 確認新 source 可被搜到
- [ ] **Wiki Graph View**（D3 force-directed）— 新增 source 如果有 wikilinks，graph 節點和邊會增加。肉眼在 `/wiki/graph` 看一眼沒破版即可
- [ ] **OG image worker** — 每個新 source 頁面應該自動有 OG image，首次產出時會冷啟。部署後打一次 `curl -I https://paulkuo.tw/og/wiki/{slug}` 確認 200
- [ ] **`TICKER_KV` 命名空間共用**：KV 內容同時被主站其他功能讀（見 `docs/shared-file-impact-map.md`）。本批只新增 `wiki:source:*` 這種 prefix 的 key，不該影響 ticker 相關 key，但 seed 腳本跑完確認一下 `wrangler kv:key list` 沒有異常新增
- [ ] **Issue #157 corpus 計數**：sources 140 → 140+N，在 Issue body 的統計區塊同步更新（或在 comment 備註由 Cowork 下次開場同步）
- [ ] **新 endpoint 防護繼承**（護欄 #13）：本批**沒有新增 API endpoint**，此項 N/A

---

## 9. 完成回報格式（護欄 #14，硬性要求）

Code 回報時必須帶下列三態之一：

- ✅ `commit {SHA} pushed`（改動已在 GitHub main）
- ⚠️ `commit {SHA} local only`（已 commit 未 push，需 Paul 本機 `git push`）
- ⚠️ `local edit uncommitted`（未 commit，需 `add + commit + push`）

另外附帶：
1. 本批實際 ingest 的檔名清單（可能少於 13，例如 04 篇發現是錄音卡筆記）
2. `src/content/wiki/sources/` 總數 before / after
3. `pnpm astro check` 結果
4. `scripts/wiki-kv-seed.cjs` 是否跑、何時跑、KV 寫入筆數
5. **Code-side audit**（如果 endpoint 行為有變才需要，本批單純新增 md 檔，預期不需要）

---

## 10. 交接動作

- [ ] Cowork 已將本 handoff 寫入本機 `handoffs/code--paulkuo.tw-wiki-ingest-batch-2026-04-17.md`
- [ ] Cowork 於 Issue #157 追加 comment 指向本 handoff
- [ ] Paul **git pull** 同步到本機後打開 Code session
- [ ] Code 開工時讀 `worklogs/wiki-ingest-pending.md`（完整 94 篇清單）+ 本 handoff（本批 13 篇範圍）

---

*Handoff 由 Cowork session 產出，scheduled-task `wiki-ingest-scanner` 衍生 ｜ 2026-04-17*

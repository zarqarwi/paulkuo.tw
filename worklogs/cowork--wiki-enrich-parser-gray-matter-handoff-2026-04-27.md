# Code Handoff — wiki-enrich.cjs parser 換 gray-matter（2026-04-27）

> 建立：2026-04-27 由 Cowork session 接手 v5 #2
> 來源：v5 handoff 中期 ToDo「wiki-enrich.cjs parser 換 gray-matter」
> 目標 session：Code [WIKI]
> **建議模型**：Claude Sonnet 4.6
> **Effort**：Low-Medium（30-45 min，模板照抄 + 驗證等價性）

---

## 1. 上下文

`scripts/wiki-enrich.cjs` 整支用手寫 YAML helper：

| 函數 | 行數範圍 | 風險 |
|------|---------|------|
| `splitFrontmatter()` | 75-79 | regex `^(---\n)...` 假設嚴格格式，BOM / multi-line value 炸 |
| `yamlGet(fmRaw, key)` | 81-91 | 只抓單行 value，遇 block scalar (`\|`)、list、nested 全失敗 |
| `yamlStr(s)` | 110-113 | 自製 escaper，沒處理 `\r` `\t` Unicode 控制字元 |
| `buildEnrichmentYaml(data)` | 115-160 | 手組 string lines，list-of-objects 容易錯 |
| `writeFrontmatter()` | 163-180 | string concat 強制 enrichment append 尾巴 |

對照組：`scripts/wiki-kv-seed.cjs` 已用 [`gray-matter`](https://github.com/jonschlinkert/gray-matter)：

```js
const matter = require('gray-matter');

function parseFrontmatter(content) {
  const parsed = matter(content);
  return { frontmatter: parsed.data, body: parsed.content.trim() };
}
// 寫回：matter.stringify(body, frontmatter)
```

**潛在炸點預警**：今天 dialogue detector 啟用就因為 `tags` 是 `list[str]` 不是 `list[dict]` 而崩潰（commit `fb3b10c`）。同樣的炸法只要 frontmatter 加任何 nested 結構就會在 wiki-enrich 再來一次——**先改 wiki-enrich，把這個技術債移除**。

**為什麼提前**：原本是中期 ToDo，但 wiki-enrich.cjs 接下來還要做「Enrichment 邏輯改良」（區分 wrong_pillar vs concept_gap），先把 parser 換掉再動邏輯會省時間。

---

## 2. 動作清單

### 動作 1：確認 dependency

```bash
grep -E '"gray-matter"' package.json
```

期望：`gray-matter` 已列為 dependency（`wiki-kv-seed.cjs` 已 require）。如果沒列，加進去：

```bash
npm install gray-matter --save
```

### 動作 2：refactor `wiki-enrich.cjs`——拔掉手寫 helper

**頂部加 require**：

```js
const matter = require('gray-matter');
```

**移除**（整段刪掉）：

- `splitFrontmatter()`（行 75-79）
- `yamlGet()`（行 81-91）
- `yamlStr()`（行 110-113）
- `buildEnrichmentYaml()`（行 115-160）
- `writeFrontmatter()`（行 163-180）

### 動作 3：用 gray-matter 重寫，拆成兩個小函數

**A. `buildEnrichmentObject(data)` — 取代 `buildEnrichmentYaml`**

```js
function buildEnrichmentObject(data) {
  const matched = data.concept_links?.matched || [];
  const candidates = (data.concept_links?.candidates || []).map(c => ({
    slug_zh: c.slug_zh || '',
    title:   c.title   || '',
    reason:  c.reason  || '',
  }));

  const enrichment = {
    enriched_at: TODAY,
    enriched_by: 'haiku-4.5',
    summary:     data.summary,
    key_points:  data.key_points || [],
    quotes: (data.quotes || []).map(q => ({
      text:      q.text,
      timestamp: q.timestamp || '',
    })),
    chapters: (data.chapters || []).map(ch => ({
      title:   ch.title,
      start:   ch.start || '',
      summary: ch.summary,
    })),
    concept_links: { matched, candidates },
  };

  // E2.5 wrong_pillar detection（邏輯不變）
  const firstReason = candidates[0]?.reason || '';
  const wrongPillar = matched.length === 0 &&
    firstReason.includes('主題與現有 concept 清單無核心對齊');
  if (wrongPillar) {
    enrichment.wrong_pillar_suspected = true;
    enrichment.enrichment_notes = '本 source 主題與 concept 清單無對齊，建議人工審查 pillar 分類';
  }

  return { enrichment, wrongPillar };
}
```

**B. `writeFrontmatter()` — 用 matter 解析 / 合併 / 序列化**

```js
const ENRICHMENT_KEYS = [
  'enriched_at', 'enriched_by', 'summary', 'key_points',
  'quotes', 'chapters', 'concept_links',
  'wrong_pillar_suspected', 'enrichment_notes',
];

function writeFrontmatter(sourcePath, content, enrichmentObj) {
  const parsed = matter(content);

  if ('enriched_at' in parsed.data) {
    if (!force) {
      console.warn('[wiki-enrich] Already enriched. Use --force to overwrite. Skipping.');
      return false;
    }
    console.warn('[wiki-enrich] --force: overwriting existing enrichment.');
    for (const k of ENRICHMENT_KEYS) delete parsed.data[k];
  }

  Object.assign(parsed.data, enrichmentObj);

  const newContent = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(sourcePath, newContent, 'utf-8');
  return true;
}
```

### 動作 4：所有 call site 改用 matter

**A. `enrichOne()`**（行 ~205）：

```js
const content = fs.readFileSync(sourcePath, 'utf-8');
const parsed = matter(content);
const fm = parsed.data;

if (!dryRun && !force && 'enriched_at' in fm) {
  console.error(`[wiki-enrich] ${targetSlug}: already enriched, skipping`);
  return { skipped: true };
}

const meta = {
  title:           fm.title           || targetSlug,
  pillar:          fm.pillar          || 'ai',
  raw_note_id:     fm.raw_note_id     || null,
  raw_source_type: fm.raw_source_type || 'youtube',
};

const transcript = extractTranscript(parsed.content);
```

**B. `runSingle()`**（行 ~245）— 同樣模式：`matter(content).data` 取代 `yamlGet`，`matter(content).content` 取代 `body`。

**C. `discoverSources()`**（行 ~313）：

```js
function discoverSources() {
  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
  const sources = [];

  for (const f of files) {
    const fSlug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(SOURCES_DIR, f), 'utf-8');
    let fm;
    try { fm = matter(raw).data; } catch { continue; }

    const sourceType = fm.raw_source_type || fm.source_type || '';
    const pillar     = fm.pillar          || '';
    const enriched   = 'enriched_at' in fm;

    if (typeArg && sourceType !== typeArg) continue;
    if (pillarArg && pillar !== pillarArg) continue;
    if (enriched && !force) continue;

    sources.push({ slug: fSlug, enriched });
  }
  return sources;
}
```

**D. `loadConcepts()`**（行 ~94）— concept loader 也升級：

```js
function loadConcepts() {
  const files = fs.readdirSync(CONCEPTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw   = fs.readFileSync(path.join(CONCEPTS_DIR, f), 'utf-8');
    const cSlug = f.replace(/\.md$/, '');
    const parsed = matter(raw);
    const title = parsed.data.title || cSlug;
    const description = parsed.content.trim().split(/\n##|\n\n/)[0].slice(0, 120);
    return { slug: cSlug, title, description };
  });
}
```

### 動作 5：等價性驗證（最關鍵的一步）

挑一支已 enriched 的 source 當 fixture，跑 `--force` 重寫後比對 frontmatter 等價。

**選 fixture**：`youtube-j1V_C6qxT20-ai.md`（04-26 wrong_pillar 9 支裡 #9，剛 re-enrich 完，frontmatter 完整有 enrichment block）

```bash
# 備份原檔
cp src/content/wiki/sources/youtube-j1V_C6qxT20-ai.md /tmp/before.md

# Dry-run（不應寫檔）
node scripts/wiki-enrich.cjs youtube-j1V_C6qxT20-ai --dry-run
# 期望：only LLM call info，無檔案變動
diff /tmp/before.md src/content/wiki/sources/youtube-j1V_C6qxT20-ai.md
# 期望：empty

# Force 重寫（會 call LLM）—— 注意這會用掉 token，但唯一能驗證 round-trip 等價性
# 如果不想 call LLM，可改成把舊 enrichment block 留著，跑 buildEnrichmentObject(舊資料) 然後 stringify
node scripts/wiki-enrich.cjs youtube-j1V_C6qxT20-ai --force

# 比對 — frontmatter 應該有相同 keys + values（順序可能變），body 完全不動
git diff src/content/wiki/sources/youtube-j1V_C6qxT20-ai.md
# 期望：
#   - 只有 frontmatter key 排序變化，或 quoting style 微差（單引號 vs 雙引號）
#   - body 段（## 來源追蹤 / ## 逐字稿 / 等）完全不動
#   - schema 仍能解析（Astro build 不報錯）
```

**等價性 acceptance**（人工目測 git diff）：

| 項目 | 期望 |
|------|------|
| body 段 | 完全等同（0 行變動） |
| frontmatter key 集合 | 完全等同（不能多 / 不能少） |
| frontmatter value | 對每個 key 語意等同（字串就字串、list 就 list、object 就 object） |
| YAML quoting style | 可變（gray-matter 用 js-yaml 預設 style） |
| key 順序 | 可變（不影響 schema 解析） |

如果上面有破壞（例如某個欄位被 stringify 成不同 type），停手回報。

### 動作 6：跑 batch dry-run + consistency-check

```bash
# Batch dry-run（不打 LLM，只列 candidates）
node scripts/wiki-enrich.cjs --batch --type=youtube --dry-run
# 期望：候選清單跟換 parser 前一致

# Schema 一致性
python3 scripts/wiki-consistency-check.py
# 期望：pass

# Astro build smoke check（如果方便）
npm run build  # 或 npx astro check
# 期望：wiki content collection 全部 parse 過
```

### 動作 7：commit + push

兩個 commit：

```bash
# Commit 1：純 refactor，行為不變
git add scripts/wiki-enrich.cjs
git commit -m "refactor(wiki-enrich): replace hand-written YAML parser with gray-matter

- 拔掉 splitFrontmatter / yamlGet / yamlStr / buildEnrichmentYaml /
  writeFrontmatter（string concat 版）共 5 個 helper
- 改用 gray-matter（同 wiki-kv-seed.cjs 模板）
- 新增 buildEnrichmentObject（產 plain object）+ matter-based writeFrontmatter
- enrichOne / runSingle / discoverSources / loadConcepts 全部改用 matter().data

行為等價性驗證：youtube-j1V_C6qxT20-ai 重跑 --force 後 git diff
僅 frontmatter key 排序 / quoting style 微差，value 完全等同。
body 段 0 行變動。

消除技術債：原 yamlGet 只抓單行 value，遇 multi-line / list / nested
會 silent fail。今天 dialogue detector 啟用時 string vs dict tag 形狀
差異炸過一次（commit fb3b10c），同型態風險在 wiki-enrich 也存在。

Refs: Issue #157、cowork--wiki-enrich-parser-gray-matter-handoff-2026-04-27.md
SSOT: docs/wiki-visibility-rules.md"

# Commit 2（如果有 fixture / smoke test 變更）
git add tests/  # 或 worklogs/
git commit -m "chore(wiki-enrich): worklog + handoff completion notes"

git push
```

---

## 3. Acceptance criteria

| 檢查項 | 期望 | 怎麼驗 |
|------|------|--------|
| `--dry-run` 行為不變 | 不寫檔 + 印 LLM call info | 動作 5 step 1 |
| `--force` 重寫等價 | git diff 只有 quoting / key 順序差異 | 動作 5 step 2 |
| Batch discoverSources | 候選清單跟換前一致 | 動作 6 |
| consistency-check | pass | 動作 6 |
| Astro build | wiki collection 全 parse | 動作 6 |
| 程式碼行數 | 應該減少 ~30-50 行（5 helper 拔掉，3 個更短的取代） | code review |

---

## 4. 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-enrich.cjs` | 主要改動 |
| `package.json` | 確認 `gray-matter` 在 dependencies（應該已有） |
| `src/content/wiki/sources/*.md` | **不應該** 受影響（只有 fixture 那支會被 `--force` 重寫，內容語意等價） |
| `src/content/wiki/concepts/*.md` | 不動 |
| `data/wiki-corpus.json`、KV seed | 不動 |
| `scripts/wiki-kv-seed.cjs` | 不動（gray-matter 用法已是模板） |
| `scripts/build_wiki_ingest_report.py` | **本次不動**——Python 端的 frontmatter regex 是另一個任務（後續再做） |
| `scripts/wiki-quarantine-apply.py` | 不動（用 yaml.safe_load，已合理） |

---

## 5. 護欄

- **不動 enrichment 邏輯本身**——只換 parser，不改 wrong_pillar 偵測規則 / prompt / token 預算
- **不動 SYSTEM_PROMPT / buildUserPrompt**——這次 refactor 嚴格限定在 frontmatter parsing
- **不動 schema (`src/content.config.ts`)**——除非 gray-matter round-trip 暴露 schema 缺陷（不太可能）
- **fixture 比對是必做**——沒做就不要 push（commit 1 等同要承諾「行為等價」）
- **不一次改 wiki-enrich + Python 端**——Python 端 regex 是獨立的下一輪任務
- **gray-matter 可能會把字串型日期 `"2026-04-27"` 解析成 Date object**——若有此狀況，加 `matter(content, { engines: { yaml: ... } })` 自訂 parser，但通常預設行為 OK

---

## 6. Commit 計畫（重申）

```
refactor(wiki-enrich): replace hand-written YAML parser with gray-matter
chore(wiki-enrich): worklog + handoff completion notes（可選，視驗證紀錄量）
```

不需要分 feat/test/chore 三段——這純粹是 refactor，行為等價是 acceptance criteria。

---

## 7. 完成後在 Issue #157 留言回報

模板：

```markdown
## wiki-enrich.cjs parser 換 gray-matter 完成（2026-04-27）

### Commits
- <sha-1> refactor(wiki-enrich): replace hand-written YAML parser with gray-matter

### 程式碼變化
- 拔掉 5 個 helper（splitFrontmatter / yamlGet / yamlStr / buildEnrichmentYaml / writeFrontmatter string 版）
- 加 2 個新 helper（buildEnrichmentObject / matter-based writeFrontmatter）
- 行數：-X +Y（淨減 Z 行）

### 等價性驗證
- ✅ youtube-j1V_C6qxT20-ai dry-run 0 變動
- ✅ youtube-j1V_C6qxT20-ai --force 重寫後 git diff 僅 quoting style + key 順序
- ✅ batch dry-run 候選清單與換前一致
- ✅ wiki-consistency-check.py pass
- ✅ Astro build pass

### 後續 ToDo（已加進 Issue #157）
- Python 端 frontmatter regex 升級（build_wiki_ingest_report.py 用 ruamel.yaml）—— 獨立下一輪
- Enrichment 邏輯改良（wrong_pillar vs concept_gap 區分）—— 等本 refactor merge 後再開
```

---

## 8. 建議模型 / Effort

| 子任務 | 模型 | 時間 |
|------|------|------|
| 動作 2-4 改檔 | Sonnet 4.6 | 20 min |
| 動作 5 等價性驗證 | Sonnet 4.6 | 10-15 min |
| 動作 6 + 7 commit | Sonnet 4.6 | 5-10 min |

整體 **Sonnet 4.6 + Low-Medium effort**。不需要 Opus——模板照抄、邏輯不變。

---

## 9. 不做的事（明確排除）

- **不動 Python 端 frontmatter parser**——`build_wiki_ingest_report.py` 還是用 regex，那是下一個 ticket 的事
- **不動 enrichment 邏輯 / prompt / wrong_pillar 偵測**——純 refactor
- **不動 wiki-kv-seed.cjs**——它已經是模板來源，沒必要改
- **不動 wiki-youtube-ingest.cjs**——youtube ingest 走的是另一條路徑（KV → markdown 落檔），暫不在 refactor 範圍
- **不寫白盒單元測試**——驗證走 fixture-based round-trip（time-box 35 min 能完成的工作量）

---

## 10. 依賴 / 來源

- 本任務來源：`worklogs/cowork--next-session-handoff-2026-04-26-v5.md` 中期 ToDo 任務 #2
- 模板：`scripts/wiki-kv-seed.cjs`（既有 gray-matter 用法）
- 上下游：本 refactor 完成後，下個 ticket「Enrichment 邏輯改良」（`matched=[]` 區分 wrong_pillar vs concept_gap）才能開——因為改邏輯時要動 `buildEnrichmentObject`，先把 parser 換掉再改邏輯比較安全

---

*產出：Cowork session 2026-04-27 接手「按工程角度依序處理」第一步*
*下一手：Code session 接此 handoff，30-45 min 完成；或合併下個 Cowork session 之前 confirm。Cowork 寫完此 handoff 停下等回報，按 feedback_handoff_flow_discipline 不預先寫下個任務的 handoff*

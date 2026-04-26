# Code Handoff — wiki-kv-seed.cjs YAML parser 升級

> 從 Cowork 2026-04-26 v3 session 接手。承接 commits `1e9c983` + `769dfe0`（paul_perspective 第三筆）。

---

## 1. 上下文

### 為什麼做
04-26 寫 paul_perspective 進 `harness-engineering.md` 時發現：`scripts/wiki-kv-seed.cjs` 的手寫簡易 YAML parser 不支援 block scalar（`>-` / `|-`）。多行字串會被解析成字串 `">-"`、內容全丟。

我已在 commit `769dfe0` 用 single-line double-quoted 規避，但這只是繞過。未來 paul_perspective 想多段寫就會踩坑。

### Root cause
`scripts/wiki-kv-seed.cjs` 第 12-90 行有一個手寫的 `parseFrontmatter` 函數，只支援：
- 單行 `key: value`
- 單行 array `[a, b, c]`
- 多行 array (`-` 開頭)
- boolean / number / quoted string

不支援：block scalar、quoted string 跨行、nested object、anchor。

### Goal
換成 `gray-matter`（Astro Content Collections 內部已用、業界標準），讓 KV seed 跟 Astro build 共用同一套 parser，永久解決。

---

## 2. 修改範圍

### Task 2.1 — 安裝 gray-matter

```bash
npm install gray-matter
```

加進 `dependencies`（**不是 devDependencies** — wiki-kv-seed 是 runtime 跑的）。

### Task 2.2 — 修改 `scripts/wiki-kv-seed.cjs`

**移除整個 `parseFrontmatter` 函數**（第 12-90 行，約 80 行手寫 parser），用 gray-matter 替代：

```javascript
// 頂部加：
const matter = require('gray-matter');

// 替換 parseFrontmatter 函數：
function parseFrontmatter(content) {
  const parsed = matter(content);
  return {
    frontmatter: parsed.data,
    body: parsed.content.trim(),
  };
}
```

注意事項：
- `matter()` 回傳的 `data` 是 plain JS object，date 欄位是 `Date` 物件（不是 string）
- 確認 `JSON.stringify` 能正確序列化 Date（會變成 ISO string，OK）
- `tags` / `links_to` / `linked_from` 等 array 會自動正確解析（gray-matter 用 js-yaml）

### Task 2.3 — 加 `--dry-run` flag

```javascript
// 頂部加（在 const 區塊）：
const isDryRun = process.argv.includes('--dry-run');

// 替換 uploadToKV 開頭：
function uploadToKV(key, value) {
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);

  if (isDryRun) {
    console.log(`  [DRY-RUN] would upload ${key} (${Math.round(jsonStr.length / 1024)}KB)`);
    return;
  }

  // ...原本 wrangler 邏輯
}

// 啟動時加：
async function seed() {
  console.log('=== Cloudflare KV Wiki Seeder ===');
  if (isDryRun) console.log('=== DRY-RUN MODE — no actual KV writes ===');
  console.log('');
  // ...
}
```

### Task 2.4 — 寫 fixture test

新建 `tests/test_kv_seed_parser.cjs`：

```javascript
const matter = require('gray-matter');

// Test 1: block scalar 解析
const fixture1 = `---
title: "Test"
paul_perspective: >-
  這是 block scalar 測試，會折成單行。
  第二段內容也要保留。
---

body content
`;
const { data: data1 } = matter(fixture1);
console.assert(
  data1.paul_perspective.includes('block scalar 測試'),
  '❌ block scalar 第一段必須被正確解析'
);
console.assert(
  data1.paul_perspective.includes('第二段內容也要保留'),
  '❌ block scalar 多行內容必須保留'
);
console.log('✓ Test 1: block scalar 解析 passed');

// Test 2: array 解析（簡繁混合）
const fixture2 = `---
title: "Test"
tags: [AI編碼代理, Harness工程, 前饋控制]
links_to: [tacit-knowledge, human-ai-collaboration]
---
`;
const { data: data2 } = matter(fixture2);
console.assert(
  data2.tags.length === 3 && data2.tags[0] === 'AI編碼代理',
  '❌ array with 簡繁中文必須正確解析'
);
console.log('✓ Test 2: array 解析 passed');

// Test 3: Date 解析
const fixture3 = `---
title: "Test"
created: 2026-04-26
updated: 2026-04-26
---
`;
const { data: data3 } = matter(fixture3);
console.assert(
  data3.created instanceof Date,
  '❌ date 應該是 Date 物件'
);
console.assert(
  JSON.stringify(data3).includes('2026-04-26'),
  '❌ Date JSON.stringify 應該保留日期'
);
console.log('✓ Test 3: Date 解析 + 序列化 passed');

console.log('\n=== All parser fixtures passed ===');
```

---

## 3. Tests Fixtures

見 Task 2.4。三個 fixture 涵蓋：
1. block scalar（核心 bug）
2. 簡繁中文 array
3. Date 解析 + JSON 序列化

---

## 4. Dry-run 驗收腳本

```bash
# 1. 安裝
npm install

# 2. 跑 fixture test
node tests/test_kv_seed_parser.cjs

# 3. dry-run 全 corpus
node scripts/wiki-kv-seed.cjs --dry-run > /tmp/seed-dryrun.log 2>&1
echo "--- 解析錯誤 ---"
grep -iE "error|✗" /tmp/seed-dryrun.log || echo "(no errors)"
echo ""
echo "--- concept 計數 ---"
grep -c "wiki:concept:" /tmp/seed-dryrun.log
echo "預期: 38"
echo ""
echo "--- harness-engineering paul_perspective spot check ---"
grep -A1 "wiki:concept:harness-engineering" /tmp/seed-dryrun.log | head -5
```

預期結果：
- fixture test：3 個 ✓
- dry-run：38 個 `[DRY-RUN] would upload`、0 errors
- spot check：harness-engineering 顯示為 ~3-4 KB（含 paul_perspective 完整內容）

---

## 5. 拆 commits 建議

```
1. chore(deps): add gray-matter for YAML parsing
2. refactor(wiki-kv-seed): replace hand-written parser with gray-matter
3. feat(wiki-kv-seed): add --dry-run flag for safe testing
4. test(wiki-kv-seed): add parser fixture tests (block scalar / array / date)
```

每個 commit 獨立可 revert，方便回溯。

---

## 6. ★ 完成後回報

回報以下指標（直接貼回 Cowork session）：

```
1. Commits：
   - <hash1> chore(deps): add gray-matter
   - <hash2> refactor(wiki-kv-seed): replace parser
   - <hash3> feat(wiki-kv-seed): --dry-run
   - <hash4> test(wiki-kv-seed): fixtures

2. gray-matter 版本：^X.Y.Z

3. Fixture test 結果：
   ✓ Test 1 / 2 / 3 全部 pass
   或失敗訊息

4. dry-run 結果：
   - 解析錯誤：N
   - concept 計數：N（預期 38）
   - harness-engineering 大小：N KB

5. 意外發現（如有）
```

---

## 7. 跨專案影響檢查

| 系統 | 影響 | 動作 |
|------|------|------|
| `wiki-enrich.cjs` | 可能也用手寫 parser | **grep 確認**：`grep -n "parseFrontmatter\|frontmatter" scripts/wiki-enrich.cjs`，若有同款手寫 parser，列入後續 ToDo（不在本 handoff 範圍）|
| `build_wiki_ingest_report.py` | Python 用 PyYAML | 不受影響 |
| Astro build | 已用 gray-matter | 不受影響 |
| KV namespace | dry-run 不寫入 | **正式 reseed 等 Cowork 確認** — 不要在這個 handoff 跑 wrangler kv put |

---

## 8. 護欄

- ❌ **不要動 frontmatter 檔案本身**（只改 parser）
- ❌ **不要跑 wrangler kv put** — 只跑 dry-run
- ❌ **不要把 gray-matter 加進 devDependencies** — 是 runtime dep
- ❌ 不要試圖修 `wiki-enrich.cjs`（同問題另案）
- ✅ commit message 用 conventional commits（refactor/feat/test/chore）
- ✅ Date 序列化 spot check 一次（grep dry-run output 看 created/updated 是 ISO string）
- ✅ 如 fixture test 失敗、立刻停下來回報 — 不要硬推

---

## 9. 建議模型 / Effort

- **Sonnet 4.6 / Effort Low**（30-45 分鐘）
- 任務拆得很乾淨、tests 已給 fixture、不需架構決策
- 如有意外（gray-matter 行為不符預期），停下來問 Cowork 不要硬解

---

## 啟動 prompt（Code session 開場貼）

```
請閱讀 code--wiki-kv-seed-parser-upgrade-handoff-2026-04-26.md 後執行。
```

---

*建立：2026-04-26 由 Cowork 寫給下個 Code session。承接 paul_perspective 第三筆 session（commits 1e9c983 / 769dfe0）。*

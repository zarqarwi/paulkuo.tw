# Cowork→Code Handoff — Phase 4 i18n derived_from 同步（2026-04-28）

> 建立：2026-04-28 由 Cowork [WIKI] session 寫
> 接手：Code session
> 上游：`worklogs/cowork--wiki-session-end-2026-04-28.md`（Phase 4 全閉環）
> 任務性質：純機械化同步（已寫 zh derived_from → en/ja/zh-cn 翻譯文）
> 對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）

---

## §1 任務目的

Phase 4 Step F 兩 batch 已把 9 篇 zh article 的 `derived_from` 寫進 frontmatter。本任務把這些 entries **沿用相同 source slug** 同步到對應的 en/ja/zh-cn 翻譯文 frontmatter，讓 i18n 雙向 UI 在非 zh 語系也完整顯示。

**Why**：Step F 期間刻意跳過翻譯文（先讓 zh 跑通驗收）。i18n 雙向 UI 在 en/ja/zh-cn 目前沒有「衍生自 N 篇素材」section，補上後 Phase 4 對所有語系完整。

---

## §2 9 篇 zh article 清單（source of truth）

| # | zh slug | derived_from 數 |
|---|---------|----------------|
| 1 | `knowledge-pipeline-not-discipline` | 3 |
| 2 | `ai-collab-realtime-translator` | 3 |
| 3 | `code-is-cheap-vibe-coding-to-claws` | 4 |
| 4 | `ai-capability-gap-2026` | 3 |
| 5 | `claude-usage-nyan-chrome-extension` | 2 |
| 6 | `ai-agent-planning-guide` | 3 |
| 7 | `multi-model-collab-website-rebuild` | 3 |
| 8 | `post-code-era-taste` | 3 |
| 9 | `google-chirp3-japanese-stt-benchmark` | 1 |

**累計**：9 篇 / 25 entries / 10 unique sources

源頭路徑：`src/content/articles/{slug}.md`（zh 在 articles 根目錄）
翻譯文路徑：`src/content/articles/{en,ja,zh-cn}/{slug}.md`

**已驗證 sample**（sample 2 / 9）：
- knowledge-pipeline-not-discipline → en / ja / zh-cn 三語系全有翻譯
- ai-collab-realtime-translator → en / ja / zh-cn 三語系全有翻譯

剩 7 篇翻譯文存在情況請 Code 本機 ls 一次性確認，不存在的列入 done report 的 skipped section。

---

## §3 執行步驟

### Step 1 — 偵察（先做，10 min）

```bash
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 9 篇翻譯文存在情況
for slug in knowledge-pipeline-not-discipline ai-collab-realtime-translator \
            code-is-cheap-vibe-coding-to-claws ai-capability-gap-2026 \
            claude-usage-nyan-chrome-extension ai-agent-planning-guide \
            multi-model-collab-website-rebuild post-code-era-taste \
            google-chirp3-japanese-stt-benchmark; do
  for lang in en ja zh-cn; do
    f="src/content/articles/${lang}/${slug}.md"
    if [ -f "$f" ]; then echo "✓ $f"; else echo "✗ $f"; fi
  done
done > /tmp/i18n-translation-existence.txt
cat /tmp/i18n-translation-existence.txt
```

### Step 2 — 預先 grep（重要工程預警）

```bash
# A. validator 是否對翻譯文 strict 檢查？
python3 scripts/wiki-derived-from-validate.py --help 2>&1 | head -20
grep -n "lang\|articles/.." scripts/wiki-derived-from-validate.py | head -20

# B. build-derived-index 對多語系如何處理？是否會重複計數？
grep -n "lang\|articles/" scripts/wiki-build-derived-index.py | head -20
```

**判斷準則**：
- 若 validator 只掃 `articles/*.md`（不含子目錄翻譯文）→ 翻譯文寫 derived_from 不會被 strict 擋，安全
- 若 validator 也掃翻譯文 → 確認規則一致即可
- 若 build-derived-index 把翻譯文也 index → **會把同 source 重複計數**（例如 yang-tianrun 從 4 變 16）→ 不可接受，必須 Code 先評估是否要改 build script 把翻譯文 dedup

**踩坑風險**：build-derived-index 重複計數會破壞 Phase 4 累計成果（10 unique source keys）。Step 2 grep 結果若顯示腳本沒過濾 lang，**先停下來回報 Cowork**，這超出機械化同步範圍，要重新拍板。

### Step 3 — 同步 frontmatter（純機械化）

對每篇 zh article：
1. Read `src/content/articles/{slug}.md` 抽出 `derived_from:` block 全文（含縮排）
2. 對 `lang in [en, ja, zh-cn]`：
   - 若 `src/content/articles/{lang}/{slug}.md` 存在：
     - Read 該檔 frontmatter
     - 在 `tags:` block 之後**插入相同 derived_from block**（slug 不翻譯，因 source 是統一識別碼）
   - 若不存在：跳過，記入 done report skipped section

**關鍵**：source slug 全部沿用，不做翻譯（getnote-XXX 是 wiki source 的識別碼，跨語系一致）。

### Step 4 — 驗收（6 條，跟 batch 1/2 相同基準）

| # | 驗收項目 | 通過標準 |
|---|---------|---------|
| 1 | `python3 scripts/wiki-derived-from-validate.py --strict` | exit 0 |
| 2 | `pnpm wiki:build-derived-index` | Index entries 數要符合預期（看 Step 2 結論決定）|
| 3 | `pnpm build` | 835 pages（或新增頁數）/ 0 errors |
| 4 | `pytest` | 180 passed |
| 5 | `data/wiki-derived-index.json` 快照 | 10 unique source keys 不應變動（除非 Step 2 結論說腳本要改）|
| 6 | 視覺驗證 | 抽 1 篇翻譯文 build 後 HTML 確認「衍生自 N 篇素材」section 顯示（lang prop 取對 i18n 字串）|

### Step 5 — Commit + Push

```
wiki(phase4): sync derived_from to i18n translations (en/ja/zh-cn)

Phase 4 i18n 同步 — 把 9 篇 zh article 的 derived_from
沿用 source slug 同步到對應翻譯文 frontmatter。
i18n 雙向 UI 在非 zh 語系完整。

Files: ~25 翻譯文（依 Step 1 偵察結果）
Validation: pytest 180 / build-derived-index / pnpm build 0 errors
```

push 到 main（按 `project_paulkuo_branch`，paulkuo.tw 用 main 不是 master）。

### Step 6 — 寫 done report

`worklogs/code--wiki-phase4-i18n-derived-from-sync-done-2026-04-28.md`，包含：
- Commit hash
- 異動 file 清單（按語系分組）
- 6 條驗收結果
- skipped section（不存在翻譯文的 slug × lang 組合）
- Step 2 grep 結論（validator / build-index 多語系處理判斷）

---

## §4 護欄速查

| 護欄 | 注意點 |
|------|-------|
| C3 偵察先行 | Step 2 grep 是必做，不能跳 |
| C5 SSoT 變更下游重驗 | build-derived-index.json 快照 unique keys 不應變動 |
| 14 跨 repo 真相驗證 | 沿用 zh frontmatter 的 derived_from，不自創 source slug |

---

## §5 模型 / Effort 建議

- **模型**：Claude Haiku 4.5（純機械化任務，Step 2 grep 結論若無意外，無判斷力需求）
- **Effort**：low（預估 ~1 hr 含偵察 + 機械化同步 + 驗收）
- **若 Step 2 結論需改 script**：升級為 Sonnet 4.6 / medium effort，停下來回報 Cowork 重新拍板

---

## §6 防重複執行 / 衝突保護

- ❌ 不要動 zh article frontmatter（已是 SSOT，commit `497974a` + `ffbc1be` 鎖定）
- ❌ 不要修改 source slug（getnote-XXX / clip-XXX 是統一識別碼）
- ❌ 不要重新提議 derived_from 內容（沿用 zh 的）
- ❌ Step 2 結論若指向腳本要改，先停下來，不要硬幹

---

## §7 完成後 Cowork 接手

Code 推完 done report 後，Cowork 在同 session 跑 D 北極星驗證（不再開新 session）：
- 開 https://paulkuo.tw/ja/wiki/sources/getnote-072896-yang-tianrun-non-tech-claw-native（最高密度 source 日語版）
- 走「衍生自 → 反查 article」流程
- 列 Phase 4.5 UI/UX candidate
- 寫收尾 worklog 把 B + D 一起總結

---

*產出：Cowork [WIKI] session 2026-04-28*

*下一手：Code session 接手執行（建議 Haiku 4.5 / low effort）*

*對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）*

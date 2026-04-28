# Code Handoff — Phase 4 Step F batch 2：derived_from frontmatter 寫入（2026-04-28）

> 建立：2026-04-28 由 Cowork [WIKI] session 寫
> 接手 session：Code session
> 上游：batch 1 已綠（commit `497974a` + worklog `8553942`）
> Cowork 已跑：7 篇 sample 比對 → 提議清單 → Paul 整體 yes
> **建議模型**：Claude Haiku 4.5
> **Effort**：low（7 篇 frontmatter 改動，一個 commit 完成）

---

## 1. 任務

把以下 `derived_from` 寫進 7 篇 article 的 frontmatter（zh 主語系），加在 `tags:` 之後。
共 **19 個 derived_from entry**。

### Article 1：`src/content/articles/code-is-cheap-vibe-coding-to-claws.md`

```yaml
derived_from:
  - getnote-439768-talk-cheap-code-cheap
  - getnote-268104-vibe-coding-trend
  - getnote-072896-yang-tianrun-non-tech-claw-native
  - clip-claude-agent-sdk-building-agents
```

### Article 2：`src/content/articles/ai-capability-gap-2026.md`

```yaml
derived_from:
  - getnote-201104-kazike-ai-three-year-insights
  - getnote-403816-lobster-talk-launch
  - getnote-072896-yang-tianrun-non-tech-claw-native
```

### Article 3：`src/content/articles/claude-usage-nyan-chrome-extension.md`

```yaml
derived_from:
  - getnote-498792-claude-skills-guide
  - getnote-918240-maltbot-ai-assistant
```

### Article 4：`src/content/articles/ai-agent-planning-guide.md`

```yaml
derived_from:
  - getnote-703240-ai-coding-harness-engineering
  - clip-claude-agent-sdk-building-agents
  - getnote-918240-maltbot-ai-assistant
```

### Article 5：`src/content/articles/multi-model-collab-website-rebuild.md`

```yaml
derived_from:
  - clip-claude-agent-sdk-building-agents
  - getnote-918240-maltbot-ai-assistant
  - getnote-072896-yang-tianrun-non-tech-claw-native
```

### Article 6：`src/content/articles/post-code-era-taste.md`

```yaml
derived_from:
  - getnote-439768-talk-cheap-code-cheap
  - getnote-268104-vibe-coding-trend
  - getnote-077512-wanweigang-qa-constraints
```

### Article 7：`src/content/articles/google-chirp3-japanese-stt-benchmark.md`

```yaml
derived_from:
  - getnote-703240-ai-coding-harness-engineering
```

---

## 2. 裁決理由（Cowork 提議內容，Paul 整體 yes）

詳細推薦理由參見 Cowork 提議清單；摘要如下（節錄關鍵 hit）：

| Article | derived_from | 推薦核心 |
|---|---|---|
| code-is-cheap | 439768 / 268104 / 072896 / agent-sdk | Karpathy + Willison + 龍蝦原生 + Claws=編排調度 |
| ai-capability-gap-2026 | 201104 / 403816 / 072896 | 84% 統計 + 0.04% 開發者 + 卡茲克 1:1 hit |
| claude-usage-nyan | 498792 / 918240 | 自製跨平台工具補齊使用體驗 + 為模型構建 |
| ai-agent-planning-guide | 703240 / agent-sdk / 918240 | Harness 五原則個人實踐 + Agent Loop 三步 + 擴展能力邊界 |
| multi-model-collab | agent-sdk / 918240 / 072896 | WebMCP=MCP 標準化 + 為模型構建 + 寫給人類也寫給 AI Agent |
| post-code-era-taste | 439768 / 268104 / 077512 | 巨觀趨勢的微觀延伸 + 萬維鋼內核自我修改神經網路參數 |
| google-chirp3-stt | 703240 | Speech Adaptation = Harness 計算型 vs 推理型執行策略 |

---

## 3. Cowork 已驗證

所有 10 個 unique source slug 都在 batch 1 work 階段讀過 frontmatter，**全部 visibility=public**：
- `getnote-072896-yang-tianrun-non-tech-claw-native`
- `getnote-077512-wanweigang-qa-constraints`
- `getnote-201104-kazike-ai-three-year-insights`
- `getnote-268104-vibe-coding-trend`
- `getnote-403816-lobster-talk-launch`
- `getnote-439768-talk-cheap-code-cheap`
- `getnote-498792-claude-skills-guide`
- `getnote-703240-ai-coding-harness-engineering`
- `getnote-918240-maltbot-ai-assistant`
- `clip-claude-agent-sdk-building-agents`

7 篇 article 路徑都驗證存在（在 `src/content/articles/` 直接子層）。

---

## 4. 累計 Source 端「被引用」次數（含 batch 1）

| Source slug | 累計被引用 | 來自 |
|---|---|---|
| `getnote-072896-yang-tianrun-non-tech-claw-native` | **4** | batch 1 (1) + batch 2 (3) |
| `clip-claude-agent-sdk-building-agents` | **3** | batch 2 (3) |
| `getnote-918240-maltbot-ai-assistant` | **3** | batch 2 (3) |
| `getnote-439768-talk-cheap-code-cheap` | **3** | batch 1 (1) + batch 2 (2) |
| `getnote-703240-ai-coding-harness-engineering` | **3** | batch 1 (1) + batch 2 (2) |
| `getnote-268104-vibe-coding-trend` | 2 | batch 2 (2) |
| `getnote-403816-lobster-talk-launch` | 2 | batch 1 (1) + batch 2 (1) |
| `getnote-498792-claude-skills-guide` | 2 | batch 1 (1) + batch 2 (1) |
| `getnote-077512-wanweigang-qa-constraints` | 2 | batch 1 (1) + batch 2 (1) |
| `getnote-201104-kazike-ai-three-year-insights` | 1 | batch 2 (1) |

驗收時要重點看「被引用 4 篇」的 yang-tianrun source 頁，UI 列表能否正確排序（多 article entry sort by date desc）。

---

## 5. 驗收

| 步驟 | 通過標準 |
|------|---------|
| `python3 scripts/wiki-derived-from-validate.py --strict` | exit 0（19 個 slug 全在 wiki/sources/，無 dangling；累計 25 個 entries 跨 9 篇 article）|
| `pnpm wiki:build-derived-index` | stdout 印 `built 25 entries from 9 articles`（或類似），non-public skipped: 0 |
| `pnpm build` | 不變或 +0 page，0 errors |
| `pytest` | 180 不變 |
| `data/wiki-derived-index.json` | 含 10 個 unique source key（batch 1 用 6 個 + batch 2 多出 `clip-claude-agent-sdk-building-agents` / `getnote-918240-maltbot-ai-assistant` / `getnote-268104-vibe-coding-trend` / `getnote-201104-kazike-ai-three-year-insights`，共 10 個） |
| 視覺檢查（高密度 source）| `getnote-072896-yang-tianrun-non-tech-claw-native` 頁面看到「被以下 4 篇文章引用」，4 篇 article 連結都顯示且按日期倒序 |
| 視覺檢查（article 端）| 7 篇新 article 頁面分別看到「衍生自 N 篇素材」section（N = 4/3/2/3/3/3/1） |

---

## 6. 約束

- **不動其他 article**：本批就這 7 篇（加 batch 1 的 2 篇，累計 9 篇有 derived_from）
- **不動 source frontmatter**：雙向同步靠 build-time JSON
- **多語系翻譯文（en/ja/zh-cn）本批不同步**：等 zh 主語系穩了再批量同步
- **frontmatter 順序**：統一加在 `tags:` 之後，Schema optional 不影響 build
- **如某篇 article 已有 derived_from 欄位**：不應該（batch 1 之外其他 article frontmatter 都沒填）；如真有就 merge slug list，不覆蓋

---

## 7. Commit message 建議

```
wiki(phase4): backfill derived_from for 7 articles (Step F batch 2)

- code-is-cheap-vibe-coding-to-claws: 4 sources
- ai-capability-gap-2026: 3 sources
- claude-usage-nyan-chrome-extension: 2 sources
- ai-agent-planning-guide: 3 sources
- multi-model-collab-website-rebuild: 3 sources
- post-code-era-taste: 3 sources
- google-chirp3-japanese-stt-benchmark: 1 source

19 derived_from entries / 10 unique sources / all visibility=public.
Cumulative w/ batch 1: 9 articles / 25 entries / 10 unique sources.
Validator strict pass expected. Step E visual verification can run after this commit.

Refs: #157
```

---

## 8. 完成後

- push 到 `main`（**不是 master**）
- 寫 Code→Cowork 回報 `worklogs/code--wiki-phase4-step-f-batch2-done-2026-04-28.md`：
  - 6 條驗收結果（含被引用 4 篇的 source 頁特別截圖描述）
  - commit hash
  - JSON 快照（10 unique source key，特別注意 yang-tianrun 是 list of 4 articles）
- Issue #157 加 comment 同 batch 1 格式
- Cowork 接到回報後決定 Step G 收尾（SSOT + Issue #157 結案 Phase 4），或要不要再追 batch 3（剩餘 ~80 篇 article，多數預期低引用密度）

---

## 9. 風險與緩解

| 風險 | 緩解 |
|------|------|
| 某 article 已有 frontmatter 欄位順序敏感 | 統一加在 `tags:` 之後；Schema optional 不影響 build |
| validator 對 slug 比對嚴格（含/不含 .md 副檔名）| 本 handoff 提供純 slug（無 .md） |
| 視覺驗收時 source 端 4 篇引用排序錯 | 檢查 `wiki-build-derived-index.py` 是否 sort by date desc；若沒，reorder JSON entries |
| `pnpm build` 因 derived_from 過多 prebuild 變慢 | 19 entries 量級下 prebuild 仍應 <2 秒；若 >5 秒 flag 給下個 Cowork session 看 |
| 7 篇 frontmatter 一次改完出錯難回滾 | 個別 article 改完先 yarn lint：`pnpm astro check` 過了再 commit；validator 跑過再 push |

---

## 10. 不在本 Code handoff 範圍

- 不動 batch 1 已寫的 2 篇 article（accumulate, 不重寫）
- 不動 source frontmatter
- 不動 schema / build script / UI 元件（Phase 4 Code 端已關門）
- 不做多語系翻譯文同步
- 不做 Step G 收尾（SSOT + Issue #157 結案，那是下一手）

---

*產出：Cowork [WIKI] session 2026-04-28（batch 2 sample 比對 7 篇 + Paul 整體 yes 裁決）*

*下一手：Code session 接 frontmatter 寫入 → push → 回報後 Cowork 決定 Step G 收尾或 batch 3*

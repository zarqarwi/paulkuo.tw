# Handoff → Code：Wiki Batch 1.5 — 開 4 個新 concept

- **建議模型**：Sonnet 4.6（需要閱讀 source、提取核心觀點、撰寫概念定義）
- **Size**：M（30-45 分鐘）
- **前置**：Batch 1 收尾完成（commit 5 sources + KV seed 完成）。本批要把那 5 個 source 從「索引不到的孤島」升級成「可搜尋的知識節點」。

---

## 背景

Wiki 的 `/api/wiki/search` 只索引 concept 頁（tags + 摘要），不索引 source 全文（見 Issue #157「架構備忘」）。Batch 1 ingest 的 5 個 source 觸及 4 個還沒 concept 頁的重要主題。建這 4 個 concept 是讓 batch 1 真正發揮策展價值的關鍵動作。

---

## 起手路徑

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
ls src/content/wiki/concepts/ | wc -l   # 應該是 22
```

讀 reference concept 樣本（用「完整中文版」格式，類似 `narrative-power.md`，**不是**簡約英文版）：

```bash
cat src/content/wiki/concepts/narrative-power.md
```

讀本批 5 個新 source 作為輸入：

```bash
cat src/content/wiki/sources/getnote-343376-attention-time-paradigm.md
cat src/content/wiki/sources/getnote-703240-ai-coding-harness-engineering.md
cat src/content/wiki/sources/getnote-732352-content-moat-inauguration.md
cat src/content/wiki/sources/getnote-880568-cybernetics-homeostasis-tacit-knowledge.md
cat src/content/wiki/sources/getnote-975896-gutenberg-meets-ai.md
```

---

## 4 個要建的 concept

### 1. `attention-time` — 注意力時長範式

- **slug**：`attention-time`
- **pillar**：`ai`
- **核心定義**：取代「人天」的 AI 時代生產力度量單位。AI 接管執行後，人類價值集中在四種注意力（啟動 / 監督 / 整合 / 孵化），其中孵化注意力是 AI 無法複製的獨特價值
- **必填 frontmatter**：
  - `tags`: [注意力經濟, AI生產力, 人月神話, 工作範式]
  - `links_to`: [one-person-team, human-judgment-in-ai-era]
  - `linked_from`: [getnote-343376-attention-time-paradigm]
  - `source_count`: 1
  - `confidence`: medium
- **body 結構**（用 narrative-power.md 為模板）：
  - 摘要：1 段
  - 核心觀點：四種注意力 + 主動碎片化 + 與「人月神話」對照
  - 來源引用：[[getnote-343376-attention-time-paradigm]]
  - 延伸連結：→ one-person-team、→ human-judgment-in-ai-era

### 2. `harness-engineering` — AI 編碼代理 Harness 工程

- **slug**：`harness-engineering`
- **pillar**：`ai`
- **核心定義**：AI 代理 = Model + Harness。Harness 是 AI 代理中除模型本身外的所有組件，分內建（系統提示、工具、編排）與外部（前饋 Guides + 反饋 Sensors）。控制論的當代延伸
- **必填 frontmatter**：
  - `tags`: [AI編碼代理, Harness工程, 前饋控制, 反饋控制, Claude Code]
  - `links_to`: [tacit-knowledge, human-ai-collaboration]
  - `linked_from`: [getnote-703240-ai-coding-harness-engineering, getnote-880568-cybernetics-homeostasis-tacit-knowledge]
  - `source_count`: 2
  - `confidence`: medium
- **body**：
  - 摘要 + 三層同心圓架構（核心 / 中間 / 外層）
  - Guides vs Sensors / 計算型 vs 推理型
  - 三大調節維度（可維護性 / 架構適應性 / 功能行為）
  - 來源引用 + 延伸連結

### 3. `tacit-knowledge` — 隱性知識

- **slug**：`tacit-knowledge`
- **pillar**：`ai`（也可考慮 `life`，但本批 source 都偏 AI 語境）
- **核心定義**：邁克爾・波蘭尼 1958 年《個人知識》提出，「我們所知道的，多於我們所能言說的」。經驗、社會責任感、組織記憶、美學判斷——這些無法被編碼成規則的隱性智慧，是人類最不可替代的 Harness
- **必填 frontmatter**：
  - `tags`: [隱性知識, 波蘭尼, 內穩態, 控制論, 人類判斷力]
  - `links_to`: [harness-engineering, human-judgment-in-ai-era, human-ai-collaboration]
  - `linked_from`: [getnote-880568-cybernetics-homeostasis-tacit-knowledge, getnote-703240-ai-coding-harness-engineering]
  - `source_count`: 2
  - `confidence`: medium
- **body**：
  - 摘要 + 波蘭尼的核心命題
  - 三個歷史錨點（1948 維納控制論、1968 軟體危機、1958 波蘭尼隱性知識、19 世紀內穩態）
  - 在 AI 時代的應用（程序員的「味道不對」、團隊文化感知）
  - 來源引用 + 延伸連結

### 4. `content-moat` — 內容護城河

- **slug**：`content-moat`
- **pillar**：`startup`
- **核心定義**：AI 時代個人影響力的核心策略——本質是「被信任」而非「被看見」。打造隨身攜帶的價值容器，不隨公司興衰清零、不隨行業更替失效
- **必填 frontmatter**：
  - `tags`: [個人影響力, 內容創作, AI時代, 個人品牌, 第二次文藝復興]
  - `links_to`: [one-person-team, narrative-power]
  - `linked_from`: [getnote-732352-content-moat-inauguration, getnote-005824-yu-kunun-personal-ip]
  - `source_count`: 2
  - `confidence`: medium
- **body**：
  - 摘要 + 「被信任 vs 被看見」
  - 三大論證（可靠資產 / AI 平權 / 獨特性不可替代）
  - 第二次文藝復興（丹・科伊）
  - 五大模組系統（戰略定位 → 內容創作 → 內容打磨 → 實戰演練 → 與算法共舞）
  - 來源引用 + 延伸連結

---

## 反向 link 維護

新 concept 建好後，要更新已存在 concept 的 `linked_from`：

| 既有 concept | 要追加的 linked_from |
|------------|---------------------|
| `one-person-team` | `attention-time`, `content-moat` |
| `human-judgment-in-ai-era` | `attention-time`, `tacit-knowledge` |
| `human-ai-collaboration` | `harness-engineering`, `tacit-knowledge` |
| `narrative-power` | `content-moat` |

也要更新 `getnote-005824-yu-kunun-personal-ip.md` 的 frontmatter，把 `linked_from` 加上 `content-moat`。

---

## Step：commit

分兩個 commit：

**Commit 1**：4 個新 concept 檔
```
wiki: add 4 concepts (batch 1.5)

- attention-time: AI 時代生產力度量範式
- harness-engineering: AI 代理可控性架構
- tacit-knowledge: 波蘭尼隱性知識
- content-moat: 內容護城河（被信任 vs 被看見）

source_count: attention-time(1), harness-engineering(2), tacit-knowledge(2), content-moat(2)
Wikilinks: 與 4 個既有 concept 形成反向連結

Ref: #157
```

**Commit 2**：反向 link 更新
```
wiki: update reverse linked_from for batch 1.5

- one-person-team: +attention-time, +content-moat
- human-judgment-in-ai-era: +attention-time, +tacit-knowledge
- human-ai-collaboration: +harness-engineering, +tacit-knowledge
- narrative-power: +content-moat
- getnote-005824-yu-kunun-personal-ip (source): +content-moat

Ref: #157
```

---

## Step：重建 stats + KV seed + push

```bash
# 重建 stats.json + graph.json（用 batch 1 收尾時的同一套方法）
# concept: 22 → 26（+4），source_count 增加，graph nodes +4 + edges +多

node scripts/wiki-kv-seed.cjs

git add src/content/wiki/stats.json src/content/wiki/graph.json
git commit -m "wiki: rebuild stats + graph for batch 1.5 (+4 concepts) — Ref: #157"

git push origin main
```

---

## Step：Issue #157 回報

加 comment：
```
✅ Batch 1.5 concept 擴充完成

- 新 concept ×4：attention-time / harness-engineering / tacit-knowledge / content-moat
- corpus 233 → 237（concept 22 → 26）
- 4 個既有 concept 反向 link 已更新
- KV seed 完成，搜尋已生效
- 驗證：https://paulkuo.tw/api/wiki/search?q=注意力 應該找到 attention-time
```

把 body 裡的「Concept 頁面」計數從 22 改成 26，corpus 233 → 237。

---

## 驗證 checklist

- [ ] 4 個新 concept 檔都用「完整中文版」格式（摘要 / 核心觀點 / 來源引用 / 延伸連結）
- [ ] 每個 concept 的 `linked_from` 與對應 source 的 `links_to` 互相對齊
- [ ] 反向 link 全部更新（不要留斷鏈）
- [ ] `narrative-power` 的格式是模板，務必參考它

---

## 建議模型 / Effort

- **本 handoff**：Sonnet 4.6 / M（30-45 分鐘）
- 不要用 Haiku — concept 撰寫需要從 source 萃取核心、組織邏輯，Haiku 容易產出制式化內容

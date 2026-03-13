# Cowork Handoff：30 篇毛坯文章改寫（全自動防斷線版）

## 任務

將 30 篇毛坯文章（≤3KB）改寫為完成級（>6KB），遵循 paulkuo-writing skill 規格。

**Paul 不需要手動介入。** Cowork 自行讀檔、改寫、寫檔、git push，全程自動。

---

## 防斷線設計

### 1. 微批次：每 5 篇為一輪，每輪自動 push

| 輪次 | 文章編號 | 自動 push |
|------|---------|----------|
| Round 1 | #1 ~ #5 | ✅ Cowork 自動執行 |
| Round 2 | #6 ~ #10 | ✅ Cowork 自動執行 |
| Round 3 | #11 ~ #15 | ✅ Cowork 自動執行 |
| Round 4 | #16 ~ #20 | ✅ Cowork 自動執行 |
| Round 5 | #21 ~ #25 | ✅ Cowork 自動執行 |
| Round 6 | #26 ~ #30 | ✅ Cowork 自動執行 |

每輪完成後，用 osascript 執行：

```applescript
do shell script "cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw && git add src/content/articles/ rewrite-progress.md && git commit -m 'rewrite: round N (#X-#Y)' && git push 2>&1"
```

### 2. 進度追蹤檔（磁碟上，斷線不遺失）

路徑：`/Users/apple/Desktop/01_專案進行中/paulkuo.tw/rewrite-progress.md`

每完成一篇就更新：

```markdown
# 毛坯改寫進度
最後更新：2026-03-03 HH:MM

| # | slug | 狀態 |
|---|------|------|
| 1 | ai-always-on-economy-restructure | ✅ done |
| 2 | algorithm-cannot-replace-decisions | ⏳ working |
| 3 | breaking-silo-effect | ⬜ pending |
...
```

### 3. 單篇原子操作

每篇流程，**嚴格按順序、一篇做完才做下一篇**：

```
讀取 {slug}.md → 改寫 → 寫回 {slug}.md → 更新 rewrite-progress.md 為 ✅
```

### 4. 斷線恢復 SOP

如果斷線，新 session 第一步：

```
1. 讀取 rewrite-progress.md
2. 找到最後一個 ✅ done
3. 從下一篇繼續（不重複、不重來）
```

---

## 改寫規格

### 路徑
`/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/articles/{slug}.md`

### 要求
- FM 17 欄位齊全（含 subtitle, abstract, thesis, domain_bridge, confidence, content_type, related_entities, reading_context）
- 六幕敘事結構（開場鉤子→張力建立→展開分析→Paul 經驗接入→觀點收斂→結尾餘韻）
- Paul 的聲音特徵（口語化但不隨便、跨域連結、台灣用語）
- 至少 1 處站內連結（`[文章名](/articles/slug)`）
- readingTime 依實際字數重算
- updated: 2026-03-03
- **只改 zh-TW 原文**，翻譯走 CI 自動產生

### 重要規則
- **公司名去識別化**：不提 SDTI、佳龍科技、CircleFlow，改用「我在經營的公司」「我們的 AI 平台」等模糊表達
- **draft: false**（全部維持 published）
- **L1 素材查證**：改寫過程中同步處理，有疑問標記在 rewrite-progress.md 備註欄
- **L2 成稿查證**：改寫完成後另外跑，這次先專注改寫

---

## 30 篇清單

| # | slug | 大小 |
|---|------|------|
| 1 | ai-always-on-economy-restructure | 2,434B |
| 2 | algorithm-cannot-replace-decisions | 2,632B |
| 3 | breaking-silo-effect | 2,242B |
| 4 | broken-crutch-elderly-faith | 2,612B |
| 5 | burnout-society-self-exploitation | 2,298B |
| 6 | cioran-on-suffering-and-clarity | 2,908B |
| 7 | civilization-metric-system-over-goal | 2,579B |
| 8 | digital-footprint-the-one | 2,180B |
| 9 | digital-transformation-pain | 2,916B |
| 10 | elite-arrogance-youth | 2,127B |
| 11 | eq-group-education | 2,584B |
| 12 | facebook-algorithm-humanity | 2,887B |
| 13 | falsification-market-crisis | 2,087B |
| 14 | god-beyond-definition | 2,053B |
| 15 | homeschool-gentle-resistance | 2,886B |
| 16 | ironman-group-education | 2,619B |
| 17 | jensen-huang-ai-mirror | 2,517B |
| 18 | language-truth-gemini-dialogue | 2,703B |
| 19 | negentropy-taiwan-enterprise | 2,579B |
| 20 | nudity-as-language-algorithm | 2,834B |
| 21 | online-learning-resource-war | 2,745B |
| 22 | quiet-edge-thirteen-notes | 2,742B |
| 23 | reformation-printing-politics | 2,312B |
| 24 | refuse-follower-be-builder | 2,725B |
| 25 | remote-work-cruel-truth | 2,494B |
| 26 | safer-4-ai-governance | 2,557B |
| 27 | sam-altman-sora-energy-ai | 2,578B |
| 28 | sovereign-ai-digital-autonomy | 2,355B |
| 29 | system-vs-intuition-planning | 2,464B |
| 30 | traffic-beyond-currency | 2,465B |

---

## 品質對照：已完成文章範例

同目錄內 >6KB 的文章都是完成級，可參考結構和 FM 格式：
- `post-code-era-taste.md`（11KB，AI 柱子）
- `faith-collapse-rebuild.md`（11.6KB，Faith 柱子）
- `why-greatness-cannot-be-planned.md`（10.8KB，Startup 柱子）
- `social-media-value-spectrum.md`（7.6KB，Life 柱子）

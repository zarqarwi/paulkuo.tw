# AICollabPortfolio.tsx 拆分評估報告

> 產出日期：2026-04-23
> 評估對象：`src/components/ai-collab-portfolio/AICollabPortfolio.tsx`
> 產出來源：Code session（上一輪 closeout Task 2）

---

## 現況量測

| 指標 | 數值 | 備註 |
|------|------|------|
| 行數 | **1268 行** | handoff 估 ~1800，差距 532 行 |
| 檔案大小 | 68 KB | 符合 handoff 描述 |
| 元件數 | 9 個（含主元件） | |
| 最大單一元件 | `AICollabPortfolio`（主，~531 行） | |
| 純 UI 元件（可獨立）| 5 個 | 見下表 |
| 有狀態元件 | 4 個 | |

### 元件清單（依複雜度）

| 元件 | 行範圍 | 行數 | 外部 state 依賴 | 可獨立程度 |
|------|--------|------|----------------|-----------|
| `RadarChart` | 215–274 | 60 | 無 | ✅ 高 |
| `ScoreBar` | 277–303 | 27 | 無 | ✅ 高 |
| `WeightSlider` | 306–321 | 16 | 無 | ✅ 高 |
| `Tooltip` | 563–583 | 21 | 無 | ✅ 高 |
| `EvidenceBadge` | 586–598 | 13 | 無 | ✅ 高 |
| `GitHubConnect` | 323–435 | 113 | `onDataLoaded` callback | ✅ 中 |
| `VerificationPanel` | 437–560 | 124 | `verification` prop only | ✅ 中 |
| `AccordionSection` | 600–736 | 137 | 7 個 props（含 callback） | 🟡 中低 |
| `AICollabPortfolio`（主） | 738–1268 | 531 | 所有狀態集中於此 | ❌ 不適合再拆 |

---

## 分析結論

### 為什麼 1268 行不是「緊急技術債」

1. **可讀性**：元件邊界已清楚（`/* ── 名稱 ── */` 區塊分隔），閱讀不困難
2. **邏輯內聚**：所有狀態（answers / github / verification / saved）在主元件中集中管理，邏輯緊密、相互依賴
3. **目前無 bug**：ACP v2 Phase 1–3 技術面完工，無功能性 bug，拆分純屬維護便利
4. **handoff 行數估算偏差**：預估 ~1800 行 vs 實際 1268 行，代表原始擔憂的緊迫程度已降低

### 拆分風險

- 主元件的 `handleGitHubData` 更新 8 個 state 欄位，拆分後必須用 React Context 或 props drilling
- `AccordionSection` 已有 7 個 prop，再往下傳 state 會更複雜
- L 級重構在沒有 E2E 測試的情況下，regression 風險高於維護成本節省

---

## 建議：**局部拆分（Tier 1 only），不做完整架構拆分**

### Tier 1 — 建議立即執行（5 個純 UI 元件）

這 5 個元件完全沒有外部 state，現在就能安全提取：

```
src/components/ai-collab-portfolio/
├── AICollabPortfolio.tsx     # 主元件，保留所有有狀態元件
├── RadarChart.tsx            # 純 SVG 繪圖
├── ScoreBar.tsx              # 純 display
├── WeightSlider.tsx          # 純 input
├── Tooltip.tsx               # 純 UI
└── EvidenceBadge.tsx         # 純 badge
```

**預估效果：** 主檔從 1268 行降至 ~1130 行；6 個新檔各 13–60 行

**風險：** 極低。這些元件已是純函數，零 state 依賴，改動只需調整 import。

### Tier 2 — 待觀察（條件觸發）

只在以下情況才做 `GitHubConnect` / `VerificationPanel` / `AccordionSection` 的拆分：

- 主元件超過 1500 行（目前未達到）
- Paul 明確表示要做完整架構升級
- 引入 hooks 測試框架（需要測試隔離）

### Tier 3 — 不建議（過度工程）

handoff 原案的 `hooks/useAssessment.ts` + `hooks/useGitHubFetch.ts` + React Context：
- 8 個狀態欄位跨 hooks 傳遞，複雜度升而非降
- 目前 ACP 不是多頁面共享 state 的場景，Context 殺雞用牛刀

---

## 對 Task 3（tsx 拆分重構）的建議

| 選項 | 說明 |
|------|------|
| ✅ **Tier 1 局部拆分** | 安全、低風險、半天內完成。**建議執行** |
| ⏸️ **Tier 2 暫停** | 主元件行數未觸發閾值，等下次機會 |
| ❌ **Tier 3 完整架構** | 不做。收益不如成本 |

**結論：建議做 Tier 1（5 個純 UI 元件提取），Tier 2/3 暫停。**

---

## 附錄：元件行數快照（2026-04-23）

```
$ wc -l src/components/ai-collab-portfolio/AICollabPortfolio.tsx
1268
```

主要邏輯分布：
- 常數/設定（C, S, DIMS, QUESTIONS, GRADES 等）：第 1–213 行（~213 行）
- 純 UI 元件（RadarChart 等 5 個）：第 214–598 行（~385 行）
- AccordionSection：第 600–736 行（~137 行）
- 主元件 AICollabPortfolio：第 738–1268 行（~531 行）

# Handoff: ACP UX / A11y / Copy 修復

> **來源**: Cowork session 2026-04-08（Stitch design review）
> **目標**: Code session（Sonnet）
> **專案**: paulkuo.tw — AI Collaboration Portfolio
> **範圍**: 僅 Critical + Major，Minor 暫不處理

---

## 背景

ACP v2 三個 Phase 部署完成後，跑了 Stitch 三輪 UX 審查（design critique + accessibility audit + UX copy review）。以下是 Critical 和 Major 級別的修復清單。

---

## Critical（2 項）

### C1: 輸入欄位缺少 aria-label
**位置**: 所有 `<input type="number">` 欄位
**問題**: 只有 placeholder「Enter a number」，螢幕閱讀器使用者無法理解每個欄位在問什麼
**WCAG**: 3.3.2 Labels
**修復**:
- 每個 input 加 `aria-label` 對應問題文字
- placeholder 從「Enter a number」改為具體範例
- 加 helper text

```
欄位: Reusable workflows → aria-label="Number of reusable AI workflows" placeholder="e.g., 5"
欄位: Automation pipelines → aria-label="Number of automation pipelines" placeholder="e.g., 3"
欄位: AI models used → aria-label="Number of AI models used simultaneously" placeholder="e.g., 4"
```
其餘欄位同理，每個 input 都要有對應的 aria-label。

### C2: GitHub Connect 狀態缺少 aria-live
**位置**: GitHub Connect 區塊的狀態訊息
**問題**: 連接中 → 成功 → 失敗的狀態變化，螢幕閱讀器不會播報
**WCAG**: 4.1.2 Name, Role, Value
**修復**:
- 狀態區塊加 `aria-live="polite"`
- 成功時播報「GitHub connected successfully. X fields auto-filled.」
- 失敗時播報「GitHub connection failed. Please check your username.」

---

## Major（4 項）

### M1: Accordion 缺少 aria-expanded
**位置**: 五個維度的折疊按鈕（Command, Delivery, Leverage, Quality, Influence）
**問題**: 折疊狀態對鍵盤和螢幕閱讀器不可見
**WCAG**: 1.3.1 Info & Structure
**修復**:
- 每個折疊按鈕加 `aria-expanded="true/false"`
- 加 `aria-controls` 指向對應內容區塊的 id
- 鍵盤操作：Enter/Space 展開收合、Arrow Up/Down 切換維度

### M2: Radio group 缺少 fieldset/legend
**位置**: Task decomposition complexity（Simple prompts / Multi-step chains / Multi-session orchestration / Full architecture with SOPs）
**問題**: 四個 radio button 沒有群組語義
**WCAG**: 2.1.1 Keyboard
**修復**:
- 用 `<fieldset>` + `<legend>` 包裹，或加 `role="radiogroup" aria-label="Task decomposition complexity"`

### M3: 缺少 input validation 和錯誤提示
**位置**: 所有數字輸入欄位
**問題**: 填負數或超大數字時沒有提示
**WCAG**: 3.3.1 Error Identification
**修復**:
- 數字欄位加 `min="0"` `max="100"`
- 即時 validation：超出範圍時顯示紅色提示「Please enter a number between 0 and 100」
- 提示文字加 `role="alert"` 讓螢幕閱讀器播報

### M4: UX Copy 關鍵文案更新
**位置**: 多處

| 元素 | 現狀 | 改為 |
|------|------|------|
| Badge | "Assessment Tool" | "Portfolio Builder" |
| Subtitle | "20 questions across 5 dimensions. 3-layer evidence architecture." | "5 dimensions. Auto-verified. Takes ~5 min with GitHub." |
| GitHub Connect 標題 | "📡 Layer 2: GitHub Auto-Fetch" | "Connect GitHub — skip 8+ questions" |
| GitHub Connect 說明 | "Connect your GitHub to auto-fill verifiable fields" | "We'll pull your commits, repos, and CI/CD data to pre-fill your portfolio. Read-only access only." |
| Leverage 描述 | "Cognitive amplification multiplier" | "How much more do you get done with AI?" |
| CTA 按鈕 | "Calculate My Portfolio Score" | "Build My Portfolio" |

**注意**: 這些文案改動需要同步到四個語言版本（zh-TW / zh-cn / en / ja）。英文先改，其他語言跟進。

---

## Step 0 偵察

```bash
# 找到所有 input 欄位
grep -rn "placeholder.*Enter a number" src/pages/tools/ai-collab-portfolio/

# 找到 accordion 相關 component
grep -rn "aria-expanded\|accordion\|collapse" src/pages/tools/ai-collab-portfolio/

# 找到 GitHub Connect component
grep -rn "GitHub\|github\|Connect" src/pages/tools/ai-collab-portfolio/ --include="*.astro" --include="*.jsx" --include="*.tsx"

# 找到 CTA 按鈕文案
grep -rn "Calculate My Portfolio" src/pages/tools/ai-collab-portfolio/
```

---

## 驗證方式

1. 用瀏覽器 DevTools 的 Accessibility panel 確認所有 input 都有 accessible name
2. 鍵盤 Tab 過所有欄位，確認 accordion 可用 Enter 展開、Arrow 切換
3. GitHub Connect 連接後，開 VoiceOver 確認有狀態播報
4. 填入 -1 或 999，確認有 validation 錯誤提示
5. 確認所有文案已更新且四語言一致

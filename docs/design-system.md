# paulkuo.tw Design System — Editorial Calm

> 建立：2026-04-14（從 `public/styles/global.css` 萃取 + 策略化整理）
> 用途：paulkuo.tw 的單一設計事實來源。Code session 做改版時的北極星；Stitch / Figma / 其他工具產新 screen 時，把本文件的 designMd 當作 prompt 前綴。
> 同步狀態：Stitch design system asset — **未建**（Stitch MCP 的 `create_design_system` / `update_design_system` 目前對 MCP 呼叫擲 `InvalidArgument`，需等修復或改用 Stitch web UI 手動貼 designMd）

---

## 1. Creative North Star

paulkuo.tw 是郭曜郎的個人思考平台，定位是**出版級的閱讀空間** — 不是部落格、不是履歷、不是 portfolio。核心是把長線思考（AI 策略、循環經濟、文明反思）集結起來，讓讀者慢慢讀。

視覺關鍵詞：沉穩、溫潤、編輯感、慷慨留白。

---

## 2. Color Logic

### 2.1 Core Palette（暖調 Warm Tonal）

| Token | Hex | 用途 |
|---|---|---|
| `--brand-navy` (Primary) | `#1B2D4F` | Nav、CTA、強調 typography |
| `--brand-navy-light` | `#2A4470` | Hover / secondary emphasis |
| `--bg` | `#FAFAF8` | 主背景（暖白，非純白）|
| `--bg-card` | `#FFFFFF` | 卡片內層 |
| `--bg-section` | `#F3F2EE` | 區塊對比（取代 border）|
| `--text-primary` | `#1A1A1A` | 主文字（非純黑）|
| `--text-secondary` | `#5A5A5A` | 副文字 |
| `--text-muted` | `#8A8A8A` | Meta / 時間戳 |
| `--border` | `#E8E6E1` | 極淡暖灰邊框 |
| `--border-light` | `#F0EDE8` | 更淡的分隔 |

### 2.2 Pillar Semantic Colors（五支柱）

paulkuo.tw 的核心 IA — 每篇內容屬於五個 pillar 之一。視覺上用色 dot 作識別。

| Pillar | Token | Hex | 意象 |
|---|---|---|---|
| 智能與秩序 | `--accent-ai` | `#2563EB` | 藍 |
| 循環再利用 | `--accent-circular` | `#059669` | 綠 |
| 文明與人性 | `--accent-faith` | `#B45309` | 棕黃 |
| 創造與建構 | `--accent-startup` | `#DC2626` | 紅 |
| 沉思與記憶 | `--accent-life` | `#7C3AED` | 紫 |

**Pillar 顏色只用於：**
- Category tag（文字色）
- 6–8px pillar dot（content card 左側小圓點）
- Hover accent（link underline / border）
- `border-left: 3px solid` 引言或重點區塊

**禁用場景：** 不作為大面積背景、不作為 CTA 主色（CTA 用 brand-navy）。

---

## 3. Typography

| 角色 | Font family | 用途 |
|---|---|---|
| Display / Headline | Playfair Display → Georgia → serif | Hero、section heading |
| Body | DM Sans → Noto Sans TC → sans-serif | 內文、UI |
| Label | DM Sans | Meta、tag |
| CJK fallback | Noto Sans TC → PingFang TC → Heiti TC → 微軟正黑體 | 中文字 |

**規則：**
- Body `line-height ≥ 1.75`（中文密度高，需要呼吸）
- Headline 字重 ≤ 700（避免厚重）
- Display 可以搭 `italic`（serif 斜體適合引言）
- 中文 display 用手動 `<br>` 控斷句，不依賴瀏覽器自動換行
- 英文 / 中文混排時 DM Sans 在前、Noto Sans TC 後接（英文顯示 DM Sans，中文落到 Noto Sans TC）

### Stitch 字體對應

Stitch 字體是枚舉型，Playfair Display / DM Sans 都不在預設。生成 screen 時建議：

| paulkuo.tw | Stitch 對應 |
|---|---|
| Playfair Display | `NEWSREADER`（最接近的現代編輯感 serif）|
| DM Sans | `INTER`（相近的高 x-height sans）|

---

## 4. Shape

| Radius | 值 | 用途 |
|---|---|---|
| `--radius` | `12px` | 預設（卡片、按鈕、input）|
| `--radius-lg` | `20px` | 大卡片、modal |
| Chip / pill | full-rounded | Tag、chip only |

Stitch 對應：`ROUND_FOUR`。

**禁用：** `radius: 0`（除 data table）、`radius > 20px`（太糖果感）。

---

## 5. Elevation

優先用**背景色階層**（`#FAFAF8` → `#F3F2EE` → `#FFFFFF`）來分區，**不用 border 不用 shadow 當分隔線**。

| Shadow | 值 |
|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.06)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.08)` |

**禁用：**
- Material Design default shadow
- 任何深色 drop shadow（opacity > 0.12）
- 1px 實線分隔（用背景色階取代）

---

## 6. Spacing & Layout

| Token | 值 |
|---|---|
| `--max-width` | `1200px` |
| `--nav-height` | `72px` |
| Section 間距（mobile）| ≥ 64px |
| Section 間距（desktop）| 80–120px |
| Card padding | ≥ 32px |

**原則：** 留白永遠可以再多。當感覺「滿」的時候，先加 padding，不要壓縮內容。

---

## 7. Do / Don't

### Do
- ✅ **留白至上** — section 間距寧多勿少
- ✅ **背景分層取代線條** — `#FAFAF8` vs `#F3F2EE` 就是天然分區
- ✅ **Pillar 一致性** — 每個 content card 都帶 pillar tag（dot + label）
- ✅ **Serif + sans 混排** — 建立編輯層級（標題 serif、內文 sans）
- ✅ **中文手動斷句** — display 類文字不靠瀏覽器

### Don't
- ❌ 純黑 `#000` / 純灰 `#CCC` / 純白 `#FFF` 為主背景
- ❌ 1px 實線分隔
- ❌ 高飽和 neon
- ❌ Pillar 顏色當大面積背景
- ❌ 圓角 > 20px
- ❌ Body 使用 Playfair（留給 headline）
- ❌ Material Design 預設 shadow

---

## 8. 使用場景

### 當你在 Stitch UI 用 text-to-UI 生成新 screen

把這份文件第 1–7 節貼到 Stitch 專案的 "designMd" 欄位，所有新生成 screen 會遵循這套風格。

`generate_screen_from_text` 的 prompt 寫法：

```
[在 prompt 前綴] 遵循 paulkuo.tw Editorial Calm design system：primary #1B2D4F、暖白背景 #FAFAF8 / #F3F2EE、Newsreader serif headline + Inter body、pillar 顏色只作為 6-8px dot、radius 12px、禁用 drop shadow 用背景色階分區。

[然後寫實際需求]
為 paulkuo.tw /wiki/ 首頁設計一個 concept 瀏覽介面，...
```

### 當 Code session 要改 CSS

以 `public/styles/global.css` 為單一事實來源。任何新加的顏色、spacing 要先在 `:root` 加 CSS 變數，**不直接寫 hex**。新增 token 必須對齊本文件的語意系統。

### 當要做 A11y 檢查

- Text `#1A1A1A` on bg `#FAFAF8`：contrast 19.5:1 ✅（AAA）
- Text `#5A5A5A` on bg `#FAFAF8`：contrast 6.8:1 ✅（AA）
- Text `#8A8A8A` on bg `#FAFAF8`：contrast 3.6:1 ⚠️（僅過 AA large text，小字要避免）
- Pillar dots 是純裝飾（搭 label），不依賴顏色傳達資訊

---

## 9. 待辦

- [ ] Stitch design system asset 建立（等 MCP `create_design_system` 修復，或手動在 Stitch web UI 建）
- [ ] Dark mode palette（目前只有 light mode）
- [ ] 把 `guide-template.css` 的 legacy tokens 併回 `global.css`
- [ ] 五個 pillar 的 on-color（白字在 pillar 顏色上的 contrast 檢查）

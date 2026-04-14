# Handoff → Code：Commit design system 文件與 worklog 變更

- **建議模型**：Sonnet 4.6（純 commit，無邏輯判斷）
- **Size**：XS（5 分鐘）
- **前置**：無，Cowork session 2026-04-14 17:20 已產出變更，尚未 commit

---

## 起手路徑（務必 cd 到專案根）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status
```

預期看到的 working tree：

```
Untracked:
  docs/design-system.md
  handoffs/code--design-system-doc-commit-2026-04-14.md

Modified:
  worklogs/worklog-2026-04-14.md
```

（如果還有其他 modified 檔案，**不要一起 commit**，只處理下面列出的三個檔案。）

---

## 變更說明

### 1. `docs/design-system.md`（新檔）

paulkuo.tw 設計系統的單一事實來源。從 `public/styles/global.css` `:root` 萃取全站 CSS 變數 + 策略化整理。

內容涵蓋：
- Creative north star（Editorial Calm 定位）
- Core palette（brand-navy `#1B2D4F` + 暖白三階 `#FAFAF8`/`#FFF`/`#F3F2EE` + 文字三層）
- 五支柱 pillar 語意色（AI/Circular/Faith/Startup/Life）
- Typography（Playfair Display + DM Sans + Noto Sans TC）
- Stitch 字體對應表（Playfair→NEWSREADER、DM Sans→INTER）
- Shape / Elevation / Spacing 規範
- Do / Don't 清單
- A11y contrast 檢查結果
- 使用場景（Stitch prompt 寫法、Code 改 CSS 準則）

### 2. `worklogs/worklog-2026-04-14.md`（更新）

追加內容：
- 完成日誌兩筆（17:00 建 Stitch 空殼專案、17:20 design system 建檔）
- 決策紀錄兩筆（放棄 Stitch 側建立改走 repo 檔案、Stitch 用途從「比對舊稿」轉「產新稿」）
- 阻礙與踩坑兩筆（Stitch MCP 寫入擲 InvalidArgument、測試專案無法刪除）
- 狀態變更三筆（比對待辦擱置、design system 單一事實來源收斂、Stitch asset 未建）
- 待辦快照更新（中優先新增 2、擱置 1；低優先新增 1）

### 3. `handoffs/code--design-system-doc-commit-2026-04-14.md`（本檔）

這份 handoff 本身也一併 commit。

---

## Commit 指令（照這個跑）

**只有一個 commit**，訊息如下：

```bash
git add docs/design-system.md worklogs/worklog-2026-04-14.md handoffs/code--design-system-doc-commit-2026-04-14.md

git commit -m "$(cat <<'EOF'
docs: 建立 paulkuo.tw Design System 單一事實來源

- 新增 docs/design-system.md（Editorial Calm 設計系統）
  從 public/styles/global.css 萃取 + 策略化整理：tokens、五支柱 pillar 語意、
  Typography、Shape、Elevation、Do/Don't、A11y 檢查、Stitch 字體對應表
- worklog-2026-04-14 追加三維度紀錄：Stitch MCP create_design_system 擲
  InvalidArgument → 改走 repo 檔案為單一事實來源
- Stitch 空殼專案 projects/6228487101449773171 建立備用

這份文件未來作為：
1. Code session 改 CSS 的北極星
2. Stitch / Figma 產新 screen 的 prompt 前綴
3. 設計系統版本控制的起點

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

**不影響核心共用檔**，`docs/shared-file-impact-map.md` 的 ⚠️ 欄位不包含 `docs/*` 或 `worklogs/*`，所以不用加 `[影響:]` 標注。

---

## 不要做的事

- ❌ 不要 push（Paul 要自己 push，避免和他正在推的東西打架）
- ❌ 不要動 `public/styles/global.css`（這次只是建文件，還沒要 refactor CSS）
- ❌ 不要把其他 modified 檔案一起 commit（如果 git status 還有其他東西，先用 `git stash -u -- <那些檔案>` 暫存，或直接問 Paul）
- ❌ 不要跑 `npm run build` 或 deploy（純文件變更，build artifact 不受影響）

---

## 完成後

1. 貼 commit hash 回覆，格式範例：
   ```
   ✅ commit e.g. 1a2b3c4
   ```
2. 追加 worklog 完成日誌（你自己那行）：
   ```
   - HH:MM commit design system 文件 (1a2b3c4) Code
   ```
3. 更新 `worklogs/PENDING.md`：把本檔從「待 Code 執行」區塊刪除，或標 `[x]`（視你收到時的狀態）
4. 回報 Paul「已 commit，待 push」

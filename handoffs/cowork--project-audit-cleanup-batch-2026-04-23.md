# Handoff: 專案盤點後的 Code 批次執行

**From：** Cowork（Opus 4.7）
**To：** Code（建議 Sonnet 4.6 — 大部分是機械性清理 + 少量判斷，Opus 負責 AI Ready JSON-LD 那項）
**Date：** 2026-04-23
**參照報告：** `worklogs/project-audit-2026-04-23.md`
**預估總時長：** 45-60 分鐘（全部做完），可分批

---

## 開場 SOP

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status                            # 先看當前狀態
git log --oneline -5                  # 確認 HEAD 位置
cat worklogs/PENDING.md | head -30    # 看一下跨 session 佇列
```

⚠️ **依賴順序很重要**：Task A（push + clean）必須先做，不然後續 commit 會卡在 untracked 泥沼裡。

---

## Task A：Git 同步 + iCloud 衝突殘留清理（🔴 優先）

### A1. Push main 4 筆未推送 commit

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status                           # 確認分支是 main、領先 origin/main 4 筆
git log --oneline origin/main..HEAD  # 列出要 push 的 4 筆
git push origin main
```

**預期：** push 成功，`git status` 顯示 "Your branch is up to date with 'origin/main'"

### A2. 清理 iCloud 衝突殘留（32+ 個重複檔）

這些是 iCloud 同步產生的「空格 2/3/4」副本，跟主檔內容一致，可安全刪除。

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先預覽要刪什麼（務必先跑這步確認清單）
find . -not -path "./node_modules/*" -not -path "./.git/*" \
  \( -name "* 2.md" -o -name "* 3.md" -o -name "* 4.md" -o -name "* 5.md" \
     -o -name "* 2.yaml" -o -name "* 3.yaml" -o -name "* 4.yaml" \) \
  -type f | sort

# 檢查清單沒問題後才刪（約 40+ 個檔案）
find . -not -path "./node_modules/*" -not -path "./.git/*" \
  \( -name "* 2.md" -o -name "* 3.md" -o -name "* 4.md" -o -name "* 5.md" \
     -o -name "* 2.yaml" -o -name "* 3.yaml" -o -name "* 4.yaml" \) \
  -type f -delete
```

⚠️ **驗收：** 刪除後跑 `git status`，應該只剩正常的 untracked，不再有「空格 N」檔名

### A3. 清理 .bak 檔與明顯殘留

```bash
rm -f scripts/wiki-youtube-ingest.cjs.bak
rm -f .env.example.bak
```

### A4. Commit A1-A3 的清理

```bash
git add -A
git status                           # 確認只有刪除動作（沒多出奇怪的東西）
git commit -m "$(cat <<'EOF'
chore: 清理 iCloud 衝突殘留與 .bak 檔

- 刪除 32+ 個「空格 2/3/4」iCloud 同步副本（worklogs/、handoffs/、根目錄）
- 刪除 scripts/wiki-youtube-ingest.cjs.bak、.env.example.bak

影響：無（全部是副本檔）
EOF
)"
git push origin main
```

---

## Task B：更新 Issue #157 的過期數據（🔴）

Wiki 儀表板 Issue #157 標的 Concept 數 19 與 stats.json total_pages 250 都已過期。

### B1. 重跑 wiki 統計

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
python3 scripts/wiki_rescan.py    # 如果這是正確腳本名；否則用下面手動方式
```

**如果 `wiki_rescan.py` 不存在或報錯**，手動更新：
```bash
# 檢查腳本是否存在
ls scripts/wiki_rescan.py scripts/build_wiki_ingest_report.py

# 如果沒有重算腳本，用這個方式快速核實
echo "Sources:   $(ls src/content/wiki/sources/ | wc -l)"
echo "Concepts:  $(ls src/content/wiki/concepts/ | wc -l)"
echo "Entities:  $(ls src/content/wiki/entities/ | wc -l)"
echo "Raw clips: $(ls src/content/wiki/raw/clips/ | wc -l)"
```

### B2. 更新 stats.json（如果 rescan 腳本不跑了）

Cowork 實測 2026-04-23：
- sources: 300
- concepts: 38
- entities: 1

若需手動更新 `src/content/wiki/stats.json`，把 `total_pages` 從 250 改為 339，`by_type.concept` 從 26 改為 38，`by_type.source` 從 237 改為 300。但**優先建議找並跑自動重算腳本**。

### B3. 通知 Cowork 更新 Issue #157

這部分留給 Cowork 做（要透過 GitHub MCP 更新 issue body），Code 只需要在 worklog 記錄實測數字。

---

## Task C：AI Ready JSON-LD 缺口修復（🟡，+8 分）

**建議模型：** Sonnet 4.6（邏輯判斷為主，不需要 Opus）

### 問題背景

AI Ready eval 打 `/articles` 但這個路徑 301 redirect 到 `/blog`，eval-worker 不追蹤 redirect → `/articles` 抽樣 0 schemas → Article property completeness 0/0。

### 兩個選項，請先確認再選

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先看 eval-worker 抽樣哪些 URL
grep -rn "articles\|blog" eval-worker/src/ | head -20

# 看 /articles 的 redirect 是怎麼設的
grep -rn "articles" astro.config.mjs public/_redirects functions/ 2>/dev/null | head -20
```

**選項 A（推薦）：改 eval-worker 改抽樣 /blog**
- 改 `eval-worker/src/index.ts` 裡的 article 抽樣 URL 從 `/articles` → `/blog`
- 好處：改一個地方、不動線上路由
- 風險：需要同步確認 benchmark 設定

**選項 B：在 /articles/ 直接加 CollectionPage schema 取消 redirect**
- 改 `src/pages/articles.astro`（如果存在）或新建一支，不再 redirect
- 好處：eval + 使用者都受益
- 風險：動到路由結構

**判斷依據：**
- 如果只是為了 eval 分數，走 A
- 如果 `/articles` 本身對 SEO 有獨立意義，走 B

### 執行

選定後修改、本地 build 確認、commit：

```bash
npm run build                        # 確認沒 build 錯
# 修改後
git add -A
git commit -m "fix(ai-ready): JSON-LD 抽樣路徑修正 [影響: 主站 AI Ready eval]"
git push origin main

# 部署
npm run build && wrangler deploy

# 部署後驗證
curl -sI https://paulkuo.tw/articles | grep -i "location\|content-type"
curl -s https://paulkuo.tw/blog | grep -o 'application/ld+json' | head -3
```

### Worklog 格式

```markdown
## AI Ready JSON-LD 修復 | 2026-04-23

### 做了什麼
- 選項 {A/B}：{描述改動}
- build + deploy 完成

### 決策原因
- {為什麼選這個選項}

### 阻礙踩坑
- {或「無」}

## Smoke Test
- ✅ /articles 回傳 {狀態}
- ✅ /blog JSON-LD schemas 數量：{N}
- ✅ 手動跑 eval 本地抽樣結果：{分數}
```

---

## Task D：AI Ready AI Comprehension Q3 精度修正（🟡，+2 分）

**建議模型：** Sonnet 4.6

### 問題

Q3「content pillars 數量」在 eval 標記錯誤，可能是 `llms.txt` 與 `benchmark_questions.yaml` 的答案不一致。

### 執行

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 比對兩邊的 pillar 數
grep -A 20 "pillar\|Pillar" public/llms.txt 2>/dev/null | head -30
grep -A 5 "pillar" eval-worker/benchmark_questions.yaml 2>/dev/null | head -20

# 或找 llms.txt 的產生來源
find . -name "llms.txt*" -not -path "./node_modules/*" -not -path "./dist/*"
```

確認實際 content pillars 有幾個（Cowork 從 wiki stats 看到：ai / life / startup / circular / faith 共 **5 個 pillar**）。

對齊完 commit + deploy：
```bash
git add -A
git commit -m "fix(ai-ready): content pillars 數量對齊 llms.txt 與 benchmark [影響: 主站 AI Ready]"
git push origin main
npm run build && wrangler deploy
```

---

## Task E：Formosa #176 P1 回歸 bug 修復（🔴 P1）

**建議模型：** Opus 4.6 或 4.7（P1 bug 需要仔細 debug）

### 問題

GPS 軌跡停在彰化，用戶實際已抵達北港朝天宮。#169 修過一次但又回歸。

### 執行

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先看 #169 當時怎麼修的
git log --all --oneline | grep -i "169\|GPS\|彰化" | head -20
git show {那個 commit hash}

# 檢查 GPS 相關邏輯
grep -rn "GPS\|lat\|lng" worker/src/formosa.js | head -30
```

這項比較複雜，建議：
1. 先重現問題（看 D1 裡彰化那位用戶的 checkin 記錄）
2. 確認 #169 當時的修法
3. 判斷回歸根因（是否是同一個 bug 繞路回來、或另一個類似 bug）
4. 修完務必寫**回歸測試**，避免第三次回來

### Worklog + Issue

修完：
```bash
git commit -m "fix(formosa): GPS 軌跡回歸 (#176) [影響: Formosa tracker]"
git push origin main
cd worker && wrangler deploy --config wrangler.toml

# 透過 gh 或 GitHub MCP 更新 #176、關閉它
```

---

## Task F：Handoffs 歸檔與根目錄整理（🟢 低優先，有空再做）

### F1. 把 handoffs/ 根目錄的已完成 handoff 搬到 handoffs/done/

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/handoffs

# 列出可以搬的（2026-04-18 以前的應該都結案了）
ls *.md | grep -E "2026-04-1[0-8]" 

# 搬之前先眼看一下確認是已結案
# 然後批次搬
mkdir -p done
# 建議逐批搬，確認沒搬錯
```

### F2. 根目錄 41 個 .md 歸位

根目錄散落的 .md 分類：
- `SKILL.paulkuo-writing.v2.4.md` → `.claude/skills/paulkuo-writing/` 已有的覆蓋
- `code--*.md`、`cowork--*.md`、`chat--*.md` → `handoffs/done/`
- `*-architecture.svg`、`*-audit-report.md` → `docs/archive/`
- `article-audit-report.md`、`paulkuo-tw-audit-*.md` → `docs/archive/`

**注意：** 只搬不刪，最後 git mv 成 commit 保留歷史。

### F3. 刪除已 merge 的 local 分支

```bash
# 確認 fix/formosa-post-event 真的 merged
git branch --merged main | grep "fix/formosa-post-event"

# 確認後刪
git branch -d fix/formosa-post-event
git branch -d fix/issue-90-redirect
git branch -d fix/issue-92-checkin-count-jump
git branch -d fix/post-incident-regression
git branch -d fix/checkin-cors-and-cleanup

# fix/youtube-transcript-pipeline 還在用（PENDING 任務），先留
# feat/sedan-gps-tracking 確認是否還活著再決定
```

---

## Task G：YouTube transcript Whisper backfill（⏸️ 阻塞中，需要 GROQ_API_KEY）

**狀態：** 卡 Paul 提供 `GROQ_API_KEY`，如果 Paul 這次有給就跑，沒給就繼續留在 PENDING.md。

```bash
# Paul 若已設 export GROQ_API_KEY=xxx
cd ~/Desktop/01_專案進行中/paulkuo.tw
git checkout fix/youtube-transcript-pipeline
node scripts/wiki-youtube-ingest.cjs --backfill
# 跑完 merge 回 main
node scripts/wiki-kv-seed.cjs
```

---

## 完成後回報格式

全部或分批做完後，回 Cowork 一份精簡 handoff：

```markdown
## Code → Cowork: Project Audit Batch 結果 | 2026-04-23

### 已完成
- [x] A1-A4: git push + iCloud 清理（N 個檔案）
- [x] B1-B2: wiki stats 更新
- [x] C: AI Ready JSON-LD 修復（選項 A/B，分數 90 → ?）
- [x] D: AI Comprehension Q3 修正（分數 ? → ?）
- [ ] E: Formosa #176 — 狀態/阻礙
- [x] F: handoffs 歸檔

### Smoke Test 結果
- ✅ paulkuo.tw 首頁 200
- ✅ api.paulkuo.tw/api/wiki/search 200
- ✅ {其他驗證項}

### 留給 Cowork 的事
- [ ] 更新 Issue #157（Concept 數 19 → 38、total_pages 250 → 339）
- [ ] 更新 PENDING.md，標記 [x] 已完成項
- [ ] {其他}

### 阻礙踩坑
- {有的話寫，沒有就「無」}
```

---

## 工作原則提醒（from memory）

1. **Oneliner for Paul terminal**：如果要 Paul 幫跑任何指令，一律用 `&&` 串成單行
2. **Worklog 三維度必填**：做了什麼 / 決策原因 / 阻礙踩坑（沒有也要寫「無」）
3. **跨子專案影響標注**：共用檔（`translator.js`、`index.js`、`utils.js`、`BaseLayout.astro`）的 commit message 必須加 `[影響: XXX]`
4. **部署後 Smoke Test 立刻做**，結果寫 worklog
5. **不懂就 grep / curl / git log，不要直接重做**

---

## 優先級速查

| Task | 優先級 | 建議模型 | 預估時長 | 依賴 |
|------|-------|---------|---------|------|
| A. Git + iCloud 清理 | 🔴 | Sonnet | 10 min | — |
| B. Wiki 統計更新 | 🔴 | Sonnet | 5 min | A 完 |
| C. AI Ready JSON-LD +8 | 🟡 | Sonnet | 20 min | A 完 |
| D. AI Comprehension +2 | 🟡 | Sonnet | 10 min | A 完 |
| E. Formosa #176 P1 | 🔴 | Opus | 30-60 min | A 完 |
| F. Handoffs 歸檔 | 🟢 | Sonnet | 15 min | A 完 |
| G. YouTube backfill | ⏸️ | Opus | 30 min | GROQ_API_KEY |

**如果 Code session 時間有限，優先順序：A → B → E → C → D → F**（A/B 是短平快的基礎工作，E 是 P1 必修，C/D 是分數優化可延後，F 是清理可最後做）

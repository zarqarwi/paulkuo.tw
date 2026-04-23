# Git Workspace Cleanup Handoff

> 建立：2026-04-23
> Cowork session：paulkuo.tw 專案盤點（`worklogs/2026-04-23-project-audit.md`）
> 目標 session：Code [主站 / 全域]
> 來源：Project Audit §6 R1 + §8.1
> **建議模型**：Claude Sonnet 4.6 + Effort Low（單純工作區清理，無邏輯改動）

---

## 問題描述

盤點時發現工作區處於「髒」狀態：

1. **165 個 untracked 檔案** 散在 repo（盤點當下 `git status` 結果）
2. **4 個 local commits 還沒 push** 到 origin/main
3. **~40 個 iCloud 衝突副本**（`* 2.md`、`* 3.md` 格式）混在 `src/content/articles/` 底下，下次 build 有機會被 Astro 誤抓進頁面

這三件事放著會讓下一輪 AI Ready 自動化（每週一 01:00 UTC）跟手動改動打架，也會污染 commit history。

---

## 需要做的事

### Step 1：盤點現狀（先看，不動）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認目前 branch
git status -sb | head -5

# 查 local vs remote 差距
git log origin/main..HEAD --oneline

# 把 untracked 檔案依副檔名分類統計
git status --porcelain | grep '^??' | awk '{print $2}' | \
  sed 's/.*\.//' | sort | uniq -c | sort -rn

# 列出所有 iCloud 衝突副本
find src/content/articles -name "* 2.md" -o -name "* 3.md" -o -name "* 4.md" 2>/dev/null
find public -name "* 2.*" -o -name "* 3.*" 2>/dev/null
```

把三份輸出貼到本 handoff 底部「Code 回報」區塊，**先不要動任何東西**。

### Step 2：Paul 確認後再動

Paul 看完 Step 1 的分類後會告訴 Code 每一類怎麼處理（留 / 丟 / 進 .gitignore）。常見三類處理：

- **iCloud 衝突副本**（`* 2.md` / `* 3.md`）→ 預設全刪，除非檔名對應的原始檔不存在
- **scratch / tmp / 本地實驗檔** → 加進 `.gitignore`
- **合法待 commit 檔案** → 分主題 commit，一個 commit 只做一件事

### Step 3：Push local commits

確認 4 個 local commits 內容沒問題後：

```bash
# 先 rebase 確保最新
git pull --rebase origin main

# push
git push origin main
```

### Step 4：驗證

```bash
# 工作區應該 clean
git status
# 預期輸出：nothing to commit, working tree clean

# local 和 remote 應該同步
git log origin/main..HEAD --oneline
# 預期輸出：（空）

# iCloud 衝突副本應該為 0
find src/content/articles -name "* 2.md" -o -name "* 3.md" 2>/dev/null | wc -l
# 預期輸出：0
```

---

## 刪除 iCloud 衝突副本的安全指令

**先列出，確認後再刪：**

```bash
# 先列出（dry run）
find src/content/articles public -type f \( -name "* 2.*" -o -name "* 3.*" -o -name "* 4.*" \) 2>/dev/null

# 確認 list 沒有誤殺原始檔後再執行刪除
find src/content/articles public -type f \( -name "* 2.*" -o -name "* 3.*" -o -name "* 4.*" \) -delete 2>/dev/null
```

⚠️ **刪除前的安全檢查**：每個衝突副本 `foo 2.md` 必須對應一個已存在的 `foo.md`。如果原始檔不存在，那個「2」版本可能才是真正的內容，不能直接刪。用這段確認：

```bash
for f in $(find src/content/articles -name "* 2.md" 2>/dev/null); do
  orig="${f/ 2.md/.md}"
  if [ ! -f "$orig" ]; then
    echo "⚠️ 原始檔不存在，需人工確認：$f"
  fi
done
```

有列出任何 ⚠️ 項目 → **停下來回報 Paul**，不要自動刪。

---

## 跨專案影響

- 只動 git 狀態和 iCloud 衝突副本
- 不改任何共用模組（`worker/src/*.js`、`siteSchema.ts`、`BaseLayout.astro` 等）
- 無須跑 shared-file-impact-map §最低驗證指令

---

## 完成後請做

1. 在本 handoff 底部加「Code 回報」區塊，貼：
   - Step 1 的三份輸出（branch 狀態 / commits / untracked 分類 / 衝突副本清單）
   - Step 4 的三個驗證指令輸出
2. Worklog（`worklogs/worklog-2026-04-23.md`）追加一筆三維度紀錄
3. 回報 Cowork 完成，Cowork 會更新 audit 報告 R1 為 ✅

---

## Code 回報區塊

```
驗收時間：
branch 狀態：
local 未 push commits：
untracked 檔案分類：
iCloud 衝突副本：刪除 N 個 / 保留 M 個（原因：...）
最終 git status：
push 結果：
```

# code--paulkuo-tw-projects-title-change-2026-03-22

## 背景

Paul 要把 `/projects/` 頁面的標題從「在結構性問題中工作。」改成「致力於結構性問題的分析、解決與系統建立」。四個語言版本都要改。

## Step 0 偵察

```bash
# 找出所有包含這段文字的檔案
grep -rn "在結構性問題中工作" src/

# 同時找其他語言版本（EN / 日 / 簡）
grep -rn "Working in structural problems" src/
grep -rn "構造的問題" src/
grep -rn "在结构性问题中工作" src/
```

## 具體步驟

### 1. 繁體中文

找到含「在結構性問題中工作」的位置，改成：

```
致力於結構性問題的分析、解決與系統建立
```

（注意：原本結尾有句號「。」，新版本不加句號）

### 2. 簡體中文

找到對應的簡體版本，改成：

```
致力于结构性问题的分析、解决与系统建立
```

### 3. English

找到對應的英文版本，改成：

```
Dedicated to analyzing, solving, and building systems around structural problems.
```

### 4. 日本語

找到對應的日文版本，改成：

```
構造的問題の分析・解決・システム構築に取り組む
```

## 驗證方式

```bash
# 確認四個檔案都改好了
grep -rn "致力於結構性問題" src/
grep -rn "致力于结构性问题" src/
grep -rn "Dedicated to analyzing" src/
grep -rn "構造的問題の分析" src/

# 確認舊文字已經不存在
grep -rn "在結構性問題中工作" src/
grep -rn "在结构性问题中工作" src/
```

完成後 `git add . && git commit -m "chore: update projects page title across 4 languages" && git push`

## 注意事項

- cron 每 10 分鐘跑 `git stash/pop`，commit + push 要一行串起來跑
- 這是前端改動，`git push` 會觸發 CI/CD 自動部署，不需要 `wrangler deploy`
- CDN 快取 max-age=3600，部署後最多等 1 小時生效

## 回報格式

- 改了哪些檔案（路徑 + 行號）
- commit hash
- push 成功與否

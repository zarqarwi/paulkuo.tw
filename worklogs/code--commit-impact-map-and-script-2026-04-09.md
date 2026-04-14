# Handoff → Code
> 日期：2026-04-09
> 任務：commit 兩個本機已建立但尚未 git commit 的檔案

---

## 背景

今天 Cowork session（"Update dashboard and organize Cowork projects"）建立了兩個檔案，
但結案前忘記 commit。Issue #155 上有標注「待 git commit」。

---

## Step 0 偵察（先確認）

```bash
# 確認兩個檔案存在
ls docs/shared-file-impact-map.md
ls scripts/build_wiki_ingest_report.py

# 確認 git status（這兩個應該是 untracked）
git status
```

---

## 具體步驟

```bash
# 1. commit 跨專案影響地圖
git add docs/shared-file-impact-map.md
git commit -m "docs: add shared-file-impact-map for cross-project impact tracking"

# 2. commit ingest report script
git add scripts/build_wiki_ingest_report.py
git commit -m "scripts: move build_wiki_ingest_report.py from desktop into repo"

# 3. push
git push
```

> 可以分開 commit（建議），或合併成一個也可以。

---

## 驗證方式

```bash
git log --oneline -3
```

確認兩個 commit 都進去，push 成功即可。

---

## 完成後請更新

worklog 追加：
```
- {HH:MM} commit docs/shared-file-impact-map.md + scripts/build_wiki_ingest_report.py ({hash}) Code
```

Issue #155「待 git commit」區塊的兩項改為 `[x]`。

---

## 注意事項

- 這兩個檔案互相獨立，分開 commit 比較乾淨
- `scripts/` 目錄如果不存在記得先建（但 Step 0 偵察會告訴你）
- 不需要 deploy，純 git 操作

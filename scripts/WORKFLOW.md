# paulkuo.tw 部署與操作準則

> 2026-02-24 建立，源自封面圖功能開發的實戰經驗。
> 所有協作者（含 AI）執行前必須閱讀。

---

## 核心原則：批次操作必須分階段

**絕對不能一口氣生成 + 修改 + commit + push。**

任何影響超過 5 個檔案的操作，必須拆成：

1. **生成/修改階段** — 只改檔案，不動 git
2. **本地驗證階段** — 跑 `scripts/pre-deploy.sh`（build + frontmatter 檢查 + 備份 tag）
3. **推送階段** — 確認驗證全過，才 commit + push

每個階段之間要有明確的人工確認點。

---

## 部署流程（每次 push 前必做）

```bash
# 1. 打備份 tag（pre-deploy.sh 會自動做）
# 2. 驗證
bash scripts/pre-deploy.sh

# 3. 全部通過才 push
git add . && git commit -m "描述" && git push

# 4. 若部署後出問題，回滾：
git reset --hard backup-YYYYMMDD-HHMMSS
git push -f
```

---

## 翻譯 bot 注意事項

- 翻譯 bot（translate.yml）會忠實傳播 source 的問題到 en/ja/zh-cn
- **推之前必須確認 build 通過**，否則壞 YAML 會被傳播到三個語言版本
- commit message 加 `[skip-translate]` 可跳過翻譯 bot
- 英文翻譯會把全形冒號 `：` 翻成半形 `:`，造成 YAML 解析失敗
  - frontmatter 的 title/description 含冒號時必須用引號包住

---

## 圖片生成（DALL-E）注意事項

- 使用 `scripts/generate_covers.py`（v2，冪等設計）
- 生成後**不會自動 commit/push**，需手動驗證
- DALL-E 回傳的圖片不可盲目信任，下載後需檢查：
  - 檔案大小是否合理（正常 > 150KB）
  - 是否有大面積黑色區塊（截斷圖）
- billing limit 會中斷流程，v2 已加入連續 3 次錯誤自動停止
- 圖片路徑統一：`/images/covers/{slug}.jpg`

---

## Git 操作準則

- 每次大改動前打 `backup-YYYYMMDD-HHMMSS` tag
- git repo 損壞時：重新 clone + 覆蓋修改檔，不要花時間修 git internals
- 大檔案走本地 git CLI，不走 GitHub API（~40KB 限制）
- binary 上傳失敗重試一次就建議手動

---

## 跨 Session 接續

- 先花 30 秒技術偵察（讀既有腳本、測 API、確認 git status）
- 不要盲目沿用上次 session 的路徑，尤其上次是失敗收場的
- 同一條路失敗兩次就換方向

---

## 腳本清單

| 腳本 | 用途 | 注意事項 |
|------|------|----------|
| `generate_covers.py` | DALL-E 封面圖生成 | 冪等設計，不自動 push |
| `run_covers.sh` | 封面圖生成的 wrapper | 提示手動驗證 |
| `pre-deploy.sh` | 部署前檢查 | backup tag + frontmatter 檢查 + build 驗證 |
| `auto_update_data.sh` | crontab 每 10 分鐘跑 | Timing + Fitbit 數據更新 |
| `translate-article.mjs` | 翻譯 bot 核心 | CI/CD 自動觸發 |

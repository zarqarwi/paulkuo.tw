# worklogs/PENDING.md — 跨 Session 待辦佇列

> 這個檔案是 Code ↔ Cowork 的直接溝通管道。
> Paul 不需要手動傳遞——兩個 session 開場時都應該先掃這個檔案。

## 使用規則

- **Code 寫**：需要 Cowork 接手的事項（狀態同步、文件產出、Issue 更新）
- **Cowork 寫**：需要 Code 執行的事項（deploy、DB migration、腳本跑測試）
- 完成後把該項目刪掉或標記 `[x]`，保持這個檔案乾淨
- 每項格式：`- [ ] {做什麼} → {給誰} ({日期})`

---

## 待處理

_（目前無待辦）_

---

## 範例格式

```
- [ ] 更新 Issue #155 阿哥拉廣場 Stage B 進度 → Cowork (2026-04-10)
- [ ] 跑 TQEF eval_runner.py 抽樣 100 句 → Code (2026-04-10)
- [ ] deploy worker + smoke test → Code (2026-04-11)
```

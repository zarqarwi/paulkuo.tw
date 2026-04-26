# Cowork Session Handoff — B：Sensitivity 補檔（2026-04-26 → 下次 Cowork）

承接 2026-04-26 上輪 next-session-handoff 第 4 項。本次 session 目標：**Sensitivity 補檔 design + spot-check**。

---

## 開場狀態（2026-04-26 末）

### A（wrong_pillar 9 支）已交付給 Code
- Cowork handoff 推到 repo：[`worklogs/cowork--wiki-wrong-pillar-9-handoff-2026-04-26.md`](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--wiki-wrong-pillar-9-handoff-2026-04-26.md)
- Issue #157 已同步（待辦打勾、新增 keep+wait 4 支 / YouTube blocklist 擴充）
- Code session 跑完才會更新 corpus 數字（300 → 298）

### B 的範圍
詳見上輪 handoff `cowork--next-session-handoff-2026-04-26.md` 第 4 項。

簡述：
- 04-26 加了 schema `sensitivity` 欄位（safe / contains_pii / business_confidential / personal_reflection）
- 既有 281 public sources 全部預設 `safe`，沒 backfill
- 要對所有 sources 跑 `scripts/wiki-sensitivity-scan.py` detector，把實際命中的補進 frontmatter

---

## 跟 A 的相依關係

| 情況 | 影響 |
|------|------|
| A 還沒跑完 | corpus 還在 300 / 281 / 19，跑 detector 不會錯但會包含 #6 #8 兩支將被刪的 |
| A 跑完 | corpus = 298 / 280 / 18，數據乾淨 |

**建議**：B 的 design + spot-check 不依賴 A 完成，可以先做。但**正式 backfill 套用要等 A commit 進去**，避免被 #6 / #8 干擾。

---

## 第一步建議

只做這件事先暖機（不要連 dry-run 也跑進來，避免一次抓太大）：

1. 讀 `scripts/wiki-sensitivity-scan.py` 確認 detector 邏輯（regex 在哪、回傳格式）
2. 設計 backfill script 骨架（呼叫 detector + 寫回 frontmatter）
3. **dry-run 5 支抽樣**（不寫檔，只 print 命中分布）
4. 寫 spot-check 表格給 Paul 看 false positive 風險
5. 等 Paul 拍板後才寫 Code handoff

---

## 護欄（從上輪教訓）

- 事件響應前必先抽樣驗證假設（不要從 bug 邏輯推到最壞情境）
- detector regex 可能誤報（phone regex 命中 raw_note_id 數字 — 上次已修，但其他 false positive 仍可能存在）
- backfill **絕不**在沒有 spot-check 過 dry-run 的情況下套用
- A 還沒 commit 完，不要跑全量 backfill

---

## 開場必讀

1. **這份 handoff** + 上輪 `cowork--next-session-handoff-2026-04-26.md` 第 4 項
2. **Issue #157**：[儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)（看 A 是否已 commit / corpus 數字）
3. `docs/wiki-visibility-rules.md`：sensitivity 欄位 SSOT 定義
4. `scripts/wiki-sensitivity-scan.py`：detector 實作

---

*建立：2026-04-26 由本輪 Cowork session 結束時產出*

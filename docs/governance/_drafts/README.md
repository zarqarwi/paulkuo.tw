# ADR 草稿區（_drafts）

> **本目錄存放觀察期內的 ADR 草稿，非現行治理規則。**

---

## 用途

當某條 ADR 內容已起草完成，但 Chat 裁決後認為需要一段觀察期才能決定升 Accepted 或 Reject 時，草稿暫存於本目錄。

特徵：

- frontmatter `status: Draft`
- frontmatter 含 `observation_period_until` 欄位
- frontmatter 含 `observation_trigger_for_acceptance` 與 `observation_trigger_for_rejection` 兩條條件
- 文件最開頭含 `> ## ⚠️ 本 ADR 為 Draft 狀態` 區塊，明示觀察期與引用限制

---

## 引用規範

- 草稿區內 ADR **不作為現行治理規則引用**
- 引用時必須註明「Draft，觀察期內」
- 觀察期結束時依 frontmatter trigger 條件升 Accepted 或 Reject

---

## 檔案清單

| 檔名 | 觀察期至 | 升 Accepted 條件 | Reject 條件 |
|---|---|---|---|
| adr-zero-legislation-as-valid-outcome-2026-04-25.md | 2026-06-25 | 觀察期內出現至少 1 次「Cowork 為配額硬湊 ADR」事件 | 觀察期結束無上述事件 |

---

## 治理依據

依 Chat 在 (c) ADR 階段裁決紀錄（2026-04-25），對 self-serving 風險中等且解的問題未驗證的 ADR 候選，採「降 Draft 觀察兩個月」處置，避免修辭遷移風險。

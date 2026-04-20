# 跨視窗治理考試 2026-04-20 — 索引

> 目的：測試三視窗（Chat / Code / Cowork）對 paulkuo.tw 治理框架的記憶與檢索能力
> 出題日期：2026-04-20
> 出題者：Paul

---

## 檔案清單

| 角色 | 檔案 | 說明 |
|------|------|------|
| 題目 | [exam-2026-04-20-questions.md](./exam-2026-04-20-questions.md) | 五層考題（事實 / 推理 / 情境 / 應用 / 治理哲學） |
| Chat 答卷 | [exam-2026-04-20-chat-answers.md](./exam-2026-04-20-chat-answers.md) | Chat 視窗作答（無 filesystem，只有 userMemories + conversation_search） |
| Code 答卷 | [exam-2026-04-20-code-answers.md](./exam-2026-04-20-code-answers.md) | Claude Code（Opus 4.7）作答，現場驗證 git HEAD |
| Cowork 答卷 | [exam-2026-04-20-cowork-answers.md](./exam-2026-04-20-cowork-answers.md) | Cowork 視窗作答（未連 paulkuo.tw 資料夾，模擬極限場景） |

---

## 結果概覽

| 視窗 | 分數 | 主要失分 |
|------|------|---------|
| Code | 97% | — |
| Chat | 77% | CLAUDE.md 行數 / 護欄編號 / 憲法第四條同層原子化細節 |
| Cowork | 70% | 司法對行政驗證場景 / 行政對立法前提 / 同層原子化實作 |

**結論**：
- Code 視窗因能現場驗證 git HEAD，幾乎滿分——**源頭事實規範（憲法第一條 SSoT）的威力**
- Chat 視窗 userMemories 有時間滯後，但推理能力足以補足細節缺口
- Cowork 視窗受限於「未掛載 repo」的極限場景，暴露 memory lag + 憲法五條知識死角

---

## 後續行動

| 行動 | 狀態 | 來源 |
|------|------|------|
| 憲法 v0.2 速記卡（含情境舉例） | ✅ 已完成 | commit 467e968，見 `constitution-v0.2-quick-reference.md` |
| auto-memory 補跨視窗考試發現 | ✅ 已完成 | `project_cross_window_exam_findings.md` |
| auto-memory 補憲法五條核心事實 | ✅ 已完成 | `project_constitution_v02_facts.md` |
| 檔案命名收斂 | ✅ 本次完成 | 本 INDEX + 四個檔案 rename |

---

## 相關文件

- 憲法 v0.2 速記卡：[constitution-v0.2-quick-reference.md](./constitution-v0.2-quick-reference.md)
- 協作憲法全文：[adr-collaboration-constitution-v0.2-2026-04-19.md](./adr-collaboration-constitution-v0.2-2026-04-19.md)
- 工作環境定義：[working-environment.md](./working-environment.md)

---

## 下次考試 Checklist（2026-Q3 或憲法 v0.3 後）

- [ ] 題目檔名沿用 `exam-{date}-questions.md` 格式
- [ ] 答卷檔名沿用 `exam-{date}-{role}-answers.md`（role = chat / code / cowork / [future window]）
- [ ] 寫入本 INDEX 對應欄位
- [ ] 對照本次分數，記錄進步與退步（哪些條文變強、哪些仍弱）

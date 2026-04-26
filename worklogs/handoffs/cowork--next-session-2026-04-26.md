# Cowork Session Handoff — 2026-04-26 → 下次

承接 2026-04-26 LLM Wiki incident response 完整收尾，下次 Cowork session 接續四個未完成事項。

---

## 開場狀態

### Corpus 現況（04-26 收尾後）
- public sources: **281**
- internal sources: **19**（quarantine outcome=keep_internal）
- total sources: **300**（中段 312 - 12 quarantine delete）
- concepts: 38 / entities: 1
- blocklist: 12 條（永久阻擋再 ingest）

### 04-26 完整 commit 鏈（時序）
```
2fdd571  feat: 4 則 public AI 筆記 ingest
b0931a4  fix: scanner 录音 tag contains 修復
4534ace  audit: 65 筆 quarantine block
2a65a22  feat: Tier 1A classifier
fa7eceb  feat: schema sensitivity + SSOT + detector
908a026  feat: ingest staging
0d03c63  feat: deny-list + tests + CI
7fa1a1b  feat: schema quarantine z.object
42b82a5  feat: classifier YAML 化 + 簡繁對映
fc2658b  docs: quarantine SOP
083ad1b  data: final overrides yml
7b9f79e  feat: apply script
7c3e432  fix: 套用 65 outcomes
af4b858  feat: 規則永久化（Phase 2 Rule）
```

### 必讀檔案（Onboarding）
1. **Issue #157**：[儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)（最完整現況）
2. `docs/wiki-visibility-rules.md`：visibility SSOT
3. `docs/wiki-quarantine-sop.md`：quarantine 流程
4. Memory：`project_llm_wiki_pipeline_fix_0423.md`、`feedback_verify_assumption_before_incident_handoff.md`

### 護欄重點（從上次教訓）
- **事件響應前必先抽樣驗證假設**（不要從 bug 邏輯推到最壞情境）
- **schema 不接受 `visibility: private`**，只有 public/internal
- **page count ≠ source count**（sources 不直接產 page）
- **同 repo 不開並行 Code session**

---

## 待辦四項（依執行順序）

### 1. 🟢 wrong_pillar 9 支人工確認分類

**為什麼**：04-22 batch rerun 結果有 9 支 source 被 enrichment 自動標記 `wrong_pillar_suspected: true`，意指 enrichment 認為 pillar 分類不對。需要 Paul 看實際內容決定 pillar 重分類。

**現狀**：
- 9 支具體哪幾筆需要拉清單（可從 Issue #157 待辦或 worklogs/wiki-daily-* 找）
- 一直掛在 wiki/sources/ 但沒重 enrich

**下一步**：
1. 拉 9 支清單 + 當前 pillar 標記
2. 整理成表格給 Paul 逐筆裁決（建議 `restart`/`change_to_X`/`drop`）
3. 變動 pillar 後寫小 handoff 給 Code 重跑 wiki-enrich.cjs

**工作量**：Cowork 整理 15-20 min + Paul 裁決 10 min + Code 重 enrich 10 min

**依賴**：無

---

### 2. 🟡 `paul_perspective` 欄位手動填寫

**為什麼**：E3 階段建立 38 個 concept 頁，每個都加了 `paul_perspective: ""` 占位。這是 L3 演化層的第一步——讓 wiki 不只是知識展示櫃，而是 Paul 個人觀點的累積。

**現狀**：
- 38 個 concept 頁的 paul_perspective 全部空白
- Cowork 只能輔助，**真正觀點要 Paul 自己寫**

**下一步**：
1. Cowork 列出 38 個 concept 給 Paul 看
2. Paul 挑「最有觀點」的 5-10 個先寫（不需要全部寫滿）
3. Cowork 協助：把 Paul 口頭說的觀點整理成 frontmatter 格式

**工作量**：Cowork 拉清單 10 min + Paul 寫 5-10 個 30-60 min（依深度）

**依賴**：無，可隨時開動

**建議**：等 Paul 有寫文章心情的時候做（不是純工程任務）

---

### 3. 🔴 Dialogue Marker 機制（啟用 Phase 2 Rule auto-match）

**為什麼**：04-26 把「錄音 + 商務會議 + 兩人以上討論 → delete」寫進治理體系，但「兩人以上 vs 獨白」自動偵測還沒實作。目前 classifier `requires_all` 邏輯是 placeholder，不會真實命中。下次商務會議錄音被 ingest 進來，還是會走 needs_human_review 而非自動 delete。

**現狀**：
- 規則文件化在 `docs/wiki-visibility-rules.md` Phase 2 Rule
- classifier rules YAML 有 entry 但 `requires_all` 邏輯回 False
- 沒有自動偵測 dialogue 的 ingest 步驟

**下一步**（這是工程任務，需要寫 Code handoff）：
1. 設計 dialogue 偵測機制（三選一或組合）：
   - **方案 A**：ingest pipeline 在 youtube transcript 階段加 speaker 統計（依 transcript timestamp + 說話者切換次數）
   - **方案 B**：frontmatter 加 `speakers: [...]` 或 `dialogue: true` 欄位，由 ingest 階段填入
   - **方案 C**：title 字眼 proxy（含「會議記錄」「討論會」）+ transcript heuristic
2. 修改 `scripts/wiki-quarantine-classify.py` 的 `requires_all` 邏輯啟用真實判斷
3. 加 classifier 測試 fixture（dialogue=true / dialogue=false 兩種情境）

**工作量**：
- Cowork 寫 design doc 30 min
- Paul 選方案 5 min
- Code handoff 執行 60-90 min（看複雜度）

**依賴**：需要 Paul 對方案 A/B/C 拍板

---

### 4. 🟡 Sensitivity 補檔（281 public sources backfill）

**為什麼**：04-26 加了 `sensitivity` schema 欄位（safe / contains_pii / business_confidential / personal_reflection），預設值 `safe`。既有 281 public sources 都是預設 safe 沒 backfill。應該對所有 sources 跑一次 `wiki-sensitivity-scan.py` detector，把實際命中的補進 frontmatter。

**現狀**：
- detector 已寫好（`scripts/wiki-sensitivity-scan.py`）
- 281 個 source 沒 sensitivity 欄位（預設 safe）
- 預期 detector 會找到 N 筆 contains_pii 或 business_confidential（含人名/公司名/合作條件等漏網）

**下一步**：
1. 寫 backfill script（呼叫 detector + 寫回 frontmatter）
2. dry-run 看命中分布
3. 對命中筆數做 spot-check（避免 detector false positive 干擾正確 sources）
4. 套用 backfill
5. 對「公開 source 命中 business_confidential」這種異常情況另做 quarantine review

**工作量**：
- Cowork 寫 design + spot-check 30 min
- Code handoff 執行 30-45 min
- 後續 review（如果命中很多）30 min

**依賴**：無，可隨時開動

**風險提醒**：detector regex 可能誤報（如 phone regex 命中 raw_note_id 數字——上次已修，但其他 false positive 仍可能存在）。先 dry-run 看分布再跑，遇異常停下來。

---

## 建議執行順序

```
A. 開場暖機：跑「1. wrong_pillar 9 支」（簡單、有成就感、清掉舊待辦）
   ↓
B. 「4. Sensitivity 補檔」（純工程，不卡 Paul）
   ↓
C. 「3. Dialogue Marker」設計：寫 design doc 給 Paul 選方案
   ↓
D. 「2. paul_perspective」隨時可開（看 Paul 寫作心情）
```

第一步建議**只做 A 一件事先暖機**——上次 session 一次抓太大導致中間狀態太多 round trip。下次目標：每個 session 一個明確產出。

---

## 給下個 Cowork 的提醒

1. **第一件事**：讀 Issue #157 確認最新狀態（可能有別 session 已處理某些事項）
2. **驗證 04-26 工程治理還在運作**：跑 `npm run check:wiki-visibility` 應 pass
3. **Memory 用 feedback_handoff_via_commit_msg 模式接手**：如果 git workspace 可用就直接用 git history 補背景
4. **如果 Paul 提新需求**：先抓 1-2 筆檔案驗證假設，不要從 bug 邏輯一路推到最壞情境（04-26 最大教訓）

---

*產生時間：2026-04-26 由 04-26 Cowork session 產出*

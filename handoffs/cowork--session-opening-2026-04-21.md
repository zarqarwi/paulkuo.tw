# Cowork Session Opening Handoff — 2026-04-21

> **給下一輪 Cowork 的開場交接**
> 上輪 Cowork：2026-04-20（Opus 4.6），於 ~13:55 正式結案
> 建議下輪模型：**Opus 4.6**（若要繼續治理議題或規劃新專案）/ **Sonnet 4.6**（若只做執行、清 S 級待辦）
> Task size：開場本身是 S（reconcile + 驗證），後續視 Paul 當日目標決定

---

## 0. 最優先動作（5 分鐘內做完）

開場三件事，照順序跑：

### 0.1 確認 repo 狀態乾淨

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status          # 應該 clean
git log --oneline -5
```

**預期 HEAD**：`1727bff docs(governance): CLAUDE.md + WE 加憲法速記卡反向連結 [影響: governance 文件]`

若最新 commit 不是這個，代表 Paul 或其他 session 之間又動過，**先 `git log --oneline -10` 搞清楚發生什麼**，不要急著往下。

### 0.2 確認今日 scanner 跑完（若時間 ≥ 10:30）

```bash
cat worklogs/governance/audit-results/2026-04-21.json | grep missing_smoke_tests
```

**三種可能結果**：

| 輸出 | 含義 | 動作 |
|------|------|------|
| `"missing_smoke_tests": 0` | Layer 1+2A 運作正常 | ✅ 報喜，繼續觀察，1-2 週後評估 Layer 3 |
| `"missing_smoke_tests": N`（N>0）且 hash 是新的 | 正常新 flagged commit，非 bug 回歸 | 判斷是否需補 smoke test 或加 smoke-skip.json |
| PENDING.md 又追加了 5c58ee02 | **Layer 1 hash 去重失效 = 有 bug** | 🔴 Debug scanner，這是回歸事故 |

若尚未 10:30 → 跳過此步，先做 0.3 + 0.4，等 10:30 後再回來看。

**若 audit JSON 還不存在**（`No such file or directory`）：代表 scheduled task 今天還沒跑，或跑失敗。先看 `worklogs/governance/audit-results/` 最新那份是哪天，若 >2 天沒跑要檢查 Cowork scheduled task 狀態。

### 0.3 讀本輪結案文件（按順序）

```
1. worklogs/worklog-2026-04-20.md            ← 上輪完整紀錄
2. handoffs/cowork--session-closeout-2026-04-20-rev1.md   ← 上輪結案摘要
3. worklogs/PENDING.md                        ← 跨 session 待辦佇列
```

### 0.4 問 Paul 今日目標

開場完成後，一句話問：

> 「上輪 v5.4 Close Protocol + 憲法第一條 SSoT 已全綠結案，scanner 觀察點已確認（✅ / ⚠️ / 🔴，看 0.2 結果）。今天想推進什麼？」

---

## 1. 上輪成果速覽

**五個 commit 全部已 push**（時間序，由舊到新）：

| Commit | 主題 | 對應治理條文 |
|--------|------|-------------|
| `467e968` | 憲法 v0.2 速記卡建立（147 行情境舉例版） | 憲法第一條 SSoT |
| `8f2c2d2` | Scanner hash 級去重 + smoke-skip.json 白名單 | 治理機制分層實作 |
| `57a7143` | 考試檔案命名收斂 + INDEX | 跨視窗協作產物管理 |
| `533af4c` | Cowork session closeout 記錄 | v5.4 Close Protocol |
| `1727bff` | CLAUDE.md + WE 加速記卡反向連結 | 憲法第一條 SSoT 工具層閉環 |

**兩個治理機制全綠**：

- ✅ **v5.4 Close Protocol**：A 層（repo）commit 完、B 層（`~/.claude/skills/`）`diff -r` 無輸出驗證通過
- ✅ **憲法第一條 SSoT**：文件互引（ADR / WE / 速記卡）+ 工具層互引（CLAUDE.md、WE → 速記卡）雙雙閉環

---

## 2. 未結事項（轉入本輪）

### 2.1 觀察型（不需動作，到觀察點自動觸發）

- [ ] **2026-04-21 10:30 scanner 跑完觀察** → 見 §0.2

### 2.2 長期監測（N=1 或 N=2，暫不升級）

- [ ] **護欄結構盲區：對話瞬時判斷無書面痕跡**
  - auto-memory：`project_guardrail_structural_hole.md`
  - 候選未來護欄 C6 / E1
  - **升級條件**：若再出現同類盲區（N ≥ 3），升級為正式 ADR 或護欄條款

### 2.3 跨 Session 待辦佇列（`worklogs/PENDING.md`）

上輪已把 Cowork 能推的都推了，PENDING.md 現在的「待 Code 執行」項目都有明確前提，**本輪 Cowork 不需要主動推進**，等 Paul 提條件：

| 項目 | 前提 |
|------|------|
| 🔴 Formosa Post-Event Issues 批次修復 | 活動結束或 Paul 確認 |
| 🟡 YouTube transcript Whisper backfill | `GROQ_API_KEY` 提供 |
| 🟡 YouTube transcript Worker deploy | backfill 完成 |
| 🟢 `scripts/wiki-youtube-ingest.cjs` 中間檔清理 | 當前轉檔批次跑完 |

---

## 3. 上輪關鍵決策（auto-memory 已落）

本輪若遇到類似情境，可直接沿用：

| auto-memory 檔名 | 適用情境 |
|-----------------|---------|
| `feedback_incremental_fix_observe_before_automate.md` | 治理機制設計：Layer 1 止血 → Layer 2 根治 → Layer 3+ 觀察 1-2 週再決定 |
| `feedback_sonnet_engineering_judgment.md` | Code handoff 寫作：純工程細節標「可優化」的段落 Sonnet 會主動重構，司法驗證要比對「改得比 handoff 更好嗎」 |
| `project_cross_window_exam_findings.md` | 跨視窗治理考試結果（Code 97% / Chat 77% / Cowork 70%）|
| `project_constitution_v02_facts.md` | 憲法五條摘要，跨視窗引用用 |

---

## 4. 本輪建議開場發言（給下一輪 Cowork 自己用）

跑完 §0.1 ~ §0.3 後，對 Paul 開場可以這樣講：

> 「上輪結案狀態確認：
> - 治理議題：v5.4 Close Protocol + 憲法第一條 SSoT 雙綠 ✅
> - Scanner 觀察：{0.2 結果填入這裡}
> - PENDING.md：沒有新的待 Cowork 執行項目，Code 佇列都有前提在等
>
> 今天想做什麼？」

如果 Paul 說「沒特別事，照平常節奏」→ 可以主動提議：
- (a) 把 `project_guardrail_structural_hole.md` 的 N=1 樣本回看一次，確認是否還留在 N=1 狀態
- (b) 檢查這週 worklogs 有沒有值得提煉進憲法或護欄的新訊號
- (c) 整理 `handoffs/` 目錄，2026-04-19 之前的 closeout handoff 可考慮歸檔到 `handoffs/archive/`（近期已累積 9+ 份）

---

## 5. 風險提醒（別踩上輪避過的坑）

### 5.1 Scanner 去重觀察的三種解讀

看到 PENDING.md 有新內容**不要立刻驚慌**，依 hash 判斷：
- 新 hash → 正常 flagged commit（scanner 做對事）
- 舊 hash（尤其 `5c58ee02`）→ 才是 Layer 1 失效的 bug

### 5.2 憲法第一條 SSoT 的實踐提醒

若本輪再產出任何下游衍生文件（speedrun 卡、checklist、flowchart），**必須從上位文件反向 hyperlink 指過去**，不要只產出下游不管互引。上輪最後那個 commit（`1727bff`）就是補這個缺口。

### 5.3 handoff 命名慣例

- `code--` 前綴 = 要給 Code 執行的
- `cowork--` 前綴 = Cowork 自己內部用的（closeout、規劃記錄）
- 本檔名為 `cowork--session-opening-2026-04-21.md`，給下一輪 Cowork 讀

---

## 6. 若本輪 Cowork 遇到「不確定該做什麼」的 fallback

**診斷順序**：

1. 讀 `worklogs/PENDING.md` → 有沒有新加入的項目？
2. 讀 `worklogs/worklog-2026-04-21.md`（今天）→ Paul 今天開過其他 session 嗎？
3. 用 GitHub MCP 查 Issue #155 → 儀表板有沒有狀態變更？
4. 還是沒頭緒 → 直接問 Paul「今天想推進什麼？」，不要腦補。

**不要做的事**：
- ❌ 主動開新議題（例如突然提議重構憲法）——除非 Paul 明確表達想動
- ❌ 再寫速記卡 / 檢核表——上輪剛做完，資訊密度已飽和
- ❌ 重跑上輪驗證——v5.4 / SSoT 雙綠，除非 Paul 說要再驗

---

## 7. 結案確認

**上輪 Cowork 狀態**：✅ 已結案（Paul 最後操作：commit `1727bff` push 成功）

**本輪 Cowork 開場完成條件**：
- [ ] §0.1 repo 狀態確認完成
- [ ] §0.2 scanner 觀察點檢查完成（若 ≥10:30）
- [ ] §0.3 上輪結案文件讀完
- [ ] §0.4 已問 Paul 今日目標

全部 ✅ 即可進入本輪正式工作。

---

## 附錄：給 Paul 的提示

開下一輪 Cowork 時，第一句話可以直接說：

> 「讀 `handoffs/cowork--session-opening-2026-04-21.md`，照裡面的開場 checklist 跑，然後我們開始。」

這樣下輪 Cowork 就會自動照本檔節奏開場，不用重新解釋脈絡。

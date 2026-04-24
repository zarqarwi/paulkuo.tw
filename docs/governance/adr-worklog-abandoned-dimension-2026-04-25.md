---
adr_id: adr-worklog-abandoned-dimension-2026-04-25
title: Worklog 四維度 — 新增 abandoned 維度
status: Accepted
date: 2026-04-25
supersedes: []
related_adrs:
  - adr-collaboration-constitution-v0.2-2026-04-19
  - adr-governance-lint-he-lu-2026-04-25
related_issues: []
ratified_by: Chat-Opus-4.7
drafted_by: Cowork-Opus-4.6
pillar: governance
---

# Worklog 四維度 — 新增 abandoned 維度

## Context

### 立法動機

現行 worklog 三維度（**做了什麼 / 為什麼這樣決定 / 遇到什麼阻礙**）由 `docs/governance/worklog-format.md` 規範，CLAUDE.md「Worklog 自動記錄」段落同步引用。三維度能涵蓋「成功完成」的工作軌跡，但**不涵蓋**以下情境：

1. Session 內評估了方案 A，最後選了方案 B，A 的否決理由只能擠進「決策紀錄」變得冗長
2. Paul 在對話中提了某個想法，討論後放棄，沒有 commit 也沒有失敗踩坑，什麼也沒寫
3. 跨 session 的方案被 Reject（例：Chat Reject 某議題），下次同樣想法重新被提時，原 Reject 理由已失聯

**共同症狀**：放棄的方案 + 原因沒有專屬欄位，容易散失，導致**決策脈絡斷裂**。

### 歷史脈絡：現行三維度 + 源頭事件

**現行三維度**（`docs/governance/worklog-format.md` 現況）：

```markdown
## 狀態變更
- {Issue/待辦名稱}：{之前狀態} → {現在狀態}（{原因}）

## 決策紀錄
- {決策}：{為什麼選 A 不選 B}（影響範圍：{哪些模組/專案}）

## 阻礙與踩坑
- {問題描述} → {怎麼解決的 / 還沒解決}
```

**源頭事件**：2026-04-24 Cowork 治理架構回顧 artifact（`cowork--governance-architecture-review-2026-04-24.md`）的 A5 段指出：「Cowork 本 session 曾考慮『為 H6 預寫 ADR 草稿』後放棄，這類『不選的路』目前只能散在決策欄」。同份 artifact 指出治理考試結果顯示的 memory lag 現象——被否決的方案若無紀錄，下次很容易重複提案。

### 現行三維度能做什麼、不能做什麼

| 情境 | 現行欄位 | 是否合適 |
|---|---|---|
| Code 成功修 bug、commit、push | 完成日誌 + 決策紀錄 | ✅ 合適 |
| Cowork 跑了檢查發現沒問題 | 完成日誌 | ✅ 合適 |
| 寫程式撞 sandbox 寫入邊界踩坑 | 阻礙與踩坑 | ✅ 合適 |
| **考慮方案 A 後放棄、選方案 B** | 決策紀錄（硬塞）或不寫 | ❌ 尷尬——決策紀錄會變長，或乾脆不寫 |
| **Cowork 起草 handoff 時想順手做某事、評估後放棄** | 沒地方寫 | ❌ 散失 |
| **Chat 收到建議 Reject，後續 Reject 理由怎麼讓下個 session 看到** | PENDING.md `[-]`（部分解法） | 🟡 解法不完整——PENDING 只記狀態，不記 session 內的評估過程 |

### 上位法依據

- **憲法 v0.2 第四條 記憶層次**：事件歷史層（worklog）的職能是「三維度歷史」——但當「被放棄的方案」沒有主責層時，它就會亂塞或漏接。本 ADR 把 `abandoned` 正式納入事件歷史層，給它一個明確的家。
- **憲法 v0.2 第四條補款 同層原子化**：同層文件內跨區塊表達同事實必須原子化。新增第四維度後，四個維度構成 worklog 的原子化 block，單區塊更新禁止（未來 H7 lint 可擴充檢查完整性）。

### 與 H7 的關係

H7 ADR 第一條檢查 5 項未覆蓋 worklog 四維度，但 Phase 2 第二條明文「增量檢查項 worklog 四維度」。意思是：

- 本 ADR 定義四維度是什麼（規範層）
- H7 Phase 2 lint 實作「commit 時 worklog 是否四維度齊備」（執行層）
- H7 Phase 2 的檢查設為 **Warning 級**（不擋 commit，只警告）——避免 lint 過嚴讓 Paul 寫 worklog 時壓力過大

---

## Decision

### 第一條 · 四維度（順序固定）

worklog 的**事件歷史** section 由四個維度組成，順序固定、皆必填：

| 順序 | 維度名（英文） | 中譯 | 涵蓋範圍 |
|---|---|---|---|
| 1 | **done** | 做了什麼 | 已完成的動作、commit、部署、更新（= 現行「完成日誌」+「狀態變更」） |
| 2 | **decisions** | 決策紀錄 | 做了某個選擇 + 為什麼（= 現行「決策紀錄」） |
| 3 | **pitfalls** | 阻礙與踩坑 | 遇到的阻礙、踩到的坑、已解 / 未解（= 現行「阻礙與踩坑」） |
| 4 | **abandoned** | 放棄了什麼 | 本 session / 跨 session 評估後放棄的方案 + 為什麼放棄（**新增**） |

**順序固定的理由**：
- done → decisions → pitfalls → abandoned 讓 worklog 有自然敘事流（做 → 選 → 困 → 棄）
- 固定順序讓未來 H7 lint 能以 regex 檢查四個章節標題依序出現
- Cowork 2026-04-24 夜間 worklog 已按此順序試寫（見 `worklogs/worklog-2026-04-24.md` Code session 段），實測可讀性正向

### 第二條 · abandoned 範圍界定

`abandoned` 維度**納入**：

1. **本 session 內放棄的方案**：考慮過、真的評估過、最後選擇不做的方案
   - 例：「原本打算為 H6 預寫 ADR 草稿，後來評估 Cowork 越權放棄，改為只起草 PENDING 條目等 Chat 裁決」
2. **跨 session 被 Reject 的方案**：Chat / Cowork / Code 對某議題給出 Reject 裁決時，Reject 理由的詳細脈絡寫入該 session 的 abandoned
   - 例：「Reject『開場貼 skill 摘要』方案，理由：違反『被動文件不等於主動防線』（依 auto-memory `feedback_passive_vs_active_defense.md`），併入 H2 處理」
3. **改優先級延後的方案**：短期不做、但不是永遠不做的方案
   - 例：「原本打算順手修 H6 ADR 某個小錯，後來判斷越權放棄，列為 Code 未來 pending」

`abandoned` 維度**排除**：

1. **閒聊中提到但沒認真評估的想法**：對話中隨口說「我們是不是該試試 X」但沒有展開討論——不寫 abandoned
2. **已在 decisions 寫過的反面選項**：例如 decisions 寫「選 B 不選 A，理由：A 會踩閾值」，A 的否決已經在 decisions 裡完整，abandoned 不重複
3. **被 pitfalls 覆蓋的踩坑**：例如「試了 approach X 失敗，改走 approach Y」屬 pitfalls（踩坑 + 處理），不是放棄（沒評估過）

### 第三條 · 強制性

**四個維度皆必填**。沒有實質內容時必須寫「無」，不可省略章節：

```markdown
### abandoned
- 無
```

**強制寫「無」的理由**：區分「忘寫」vs「確實沒有」。未來 H7 lint 檢查「四個章節標題依序出現」時，「無」讓 lint 能確認作者主動聲明無放棄方案，而不是漏寫。

### 第四條 · 短 session 縮寫格式

短 session（例：跑個小修、查個狀態）用下列縮寫格式**可**（不強制）：

```markdown
## Cowork session（HH:MM · 短任務）

### 四維度精簡版
- **done**: 跑 `wc -l` 核實三份文件行數，結果分別 239/641/200
- **decisions**: 無
- **pitfalls**: 無
- **abandoned**: 無
```

條件：
- 本 session 工作量 < 30 分鐘
- decisions / pitfalls / abandoned 其中 ≥ 2 項為「無」
- 完整版永遠可替代縮寫版，不反過來

### 第五條 · 寫入位置與 SSoT

本 ADR 是規則源頭。**三處同步引用**位置：

1. `docs/governance/worklog-format.md`（**SSoT 主文件**）：
   - 第一章節「格式（三維度必填）」升級為「格式（四維度必填）」
   - 新增順序固定說明、強制寫「無」規則、短 session 縮寫格式
   - 加「本格式由 `adr-worklog-abandoned-dimension-2026-04-25.md` 規範，修訂需另開 ADR」引言

2. `.claude/skills/session-handoff/SKILL.md` §12「Worklog 格式（精簡版）」：
   - Chat 不寫 worklog 但需讀懂，精簡版改為「四維度必填」
   - 原「三維度必填」段落更新

3. `CLAUDE.md` 根目錄 的「Worklog 自動記錄（必遵守）」段落：
   - 「三維度必填」改為「四維度必填」
   - 保留「沒有就寫『無』，但不能省略區塊」一行，範圍擴大到四維度

**更新原則**（憲法第四條同層原子化）：三處同步更新，不允許局部修改。可以由 Cowork 在同一 commit 修三處，但不可跨 commit 分散修改。

### 第六條 · 與 H7 的綁定

本 ADR 的 lint 檢查作為 H7 ADR 第一條 5 項之外的**擴充項**，屬 H7 Phase 2 增量實作：

- **檢查規則**：worklog 檔案（`worklogs/worklog-*.md`）若含 session 段落，必須有 `### done`, `### decisions`, `### pitfalls`, `### abandoned` 四個子章節
- **等級**：Warning（不擋 commit，但警告）
- **範圍**：僅檢查「session 段落」，不檢查「完成日誌（最新在上）」這類高層區塊
- **實作前提**：本 ADR 通過 + `docs/governance/worklog-format.md` 已更新為四維度版本
- **H7 側實施**：H7 ADR Phase 2 期限內完成（H7 ADR 通過後 2 週內）

### 第七條 · 回溯適用性

**不追溯**。本 ADR 通過前的既有 worklog 維持三維度不改。理由：
- 回溯修 100+ worklog 成本過高
- 既有 worklog 在實戰中已經好用了一段時間
- 新規則從通過日期生效更清楚

**切點**：本 ADR commit 當日（2026-04-25）及之後寫入的 worklog 段落適用四維度。該日之前的 worklog 維持原狀。

### 第八條 · 重新評估觸發條件

以下任一成立，重開 ADR 討論本條：

1. 連續兩週 abandoned 維度在全部 worklog 中**都是**「無」 → 代表此維度使用率低，可能需要更嚴的定義或降級為「非必填」
2. abandoned 與 decisions 的邊界在實戰中反覆錯分（例：同一件事每次寫的人判斷不一致） → 代表第二條範圍界定需要細化
3. H7 Phase 2 lint 實作後出現 false positive / false negative ≥ 3 次 → 代表四維度結構檢查邏輯需要調整

---

## Consequences

### 正面影響

- **決策脈絡斷裂問題結構性收斂**：被否決的方案有專屬維度記錄，不再散失到「決策欄塞不下」或「沒地方寫直接漏接」。
- **跨 session 方案 Reject 有錨點**：下次同樣想法被提起時，可以 grep `abandoned` 段落找到原 Reject 理由。這能減少 memory lag 造成的重複提案。
- **敘事更完整**：done → decisions → pitfalls → abandoned 的四維度讓 worklog 更接近「完整 session 故事」，不只是「成功軌跡」。
- **lint 有明確結構**：H7 Phase 2 的 worklog 四維度檢查有明確的 regex 範圍（四個固定 title），實作成本低。

### 負面影響

- **寫作成本微幅增加**：即使寫「無」也要寫，短 session 會覺得冗餘。緩解：第四條的縮寫格式降低寫作摩擦。
- **邊界可能持續模糊**：abandoned vs decisions vs pitfalls 的邊界在實戰中可能出現灰色案例（例：「試了失敗 + 放棄繼續嘗試」算 pitfalls 還是 abandoned）。緩解：第八條的觸發條件 2 提供糾偏機制；實戰累積的案例可在 auto-memory 記錄。
- **未追溯會讓歷史 worklog 格式不一致**：2026-04-25 前 worklog 三維度 vs 之後四維度。緩解：第七條明文切點，未來檢索時知道「看 abandoned 只要找 2026-04-25 起」。

### 中性觀察

- **本 ADR 不處理 PENDING.md 與 worklog 的同步**：PENDING.md 五符號 schema 已覆蓋「跨 session 狀態」，worklog abandoned 覆蓋「session 內的評估過程」。兩者互補不衝突。
- **Code 2026-04-24 夜間 session 已試寫四維度**：見 `worklogs/worklog-2026-04-24.md` Code session 段落（處理 H1-H9 PENDING.md 裁決寫入），實測可讀性正向。本 ADR 把那次試寫扶正為標準。

---

## Cross-References

### 依賴的 ADR（我需要這些先存在）

- `adr-collaboration-constitution-v0.2-2026-04-19.md` §2 第四條 + 補款：本 ADR 是第四條記憶層次的實施細則，也受補款「同層原子化」約束（四維度作為原子塊）。

### 被依賴的 ADR（這些 ADR 需要我存在）

- `adr-governance-lint-he-lu-2026-04-25.md` §五 Phase 2 增量：H7 ADR 的 Phase 2 worklog 四維度 lint 實作直接依賴本 ADR 的維度定義 + 順序 + 強制性規則。

### 相關但不依賴的檔案

- `docs/governance/worklog-format.md`（**SSoT 主文件**）：本 ADR 通過後此檔升級為四維度版本（第五條 1）。
- `.claude/skills/session-handoff/SKILL.md` §12「Worklog 格式（精簡版）」：引用本 ADR 的維度定義；Chat 不寫 worklog 但需讀懂。
- `CLAUDE.md`（根目錄）「Worklog 自動記錄（必遵守）」段落：引用本 ADR 的維度定義；規則源頭在 worklog-format.md。
- `worklogs/worklog-2026-04-24.md`（Code session 段落）：本 ADR 立法的第一個實戰範本。
- `cowork--governance-architecture-review-2026-04-24.md` A5：本 ADR Context 的源頭事件依據。

---

## Appendix

### 附錄 A · 四維度實戰範本（從 Code 2026-04-24 夜間 worklog 改寫）

以下是本 ADR 通過後，worklog session 段落的完整格式範本：

```markdown
## Code session（夜間 · H1-H9 裁決寫入 PENDING.md）

執行 handoff: `code--pending-md-h1-h9-ratification-2026-04-24.md`（Chat Opus 4.7 起草）
本段以 H8 裁決的四維度格式書寫，作為 H8 立法落地的首個範本。

### done

- Read `worklogs/PENDING.md`（215 行），完成 Step 1 四項前置檢查
- 逐項 Edit 六項議題，保留原內容至「原議題：」區塊，追加「裁決/理由/後續動作」三欄位
- 五項驗證全部通過（結構完整性、Chat-Opus-4.7 簽名計數、行數變化、憲法引用、單一檔案）
- Commit 完成：`d4f03ae`
- Push：**未執行**，等 Paul 授權

### decisions

- 「原議題：(保留原文)」的解讀：將原議題的子項目全部縮排一層
  - 理由：避免破壞原背景描述，讓下游 Cowork 起草 ADR 時仍可回溯原始立法動機
- H5 checkbox 維持 `[ ]` 而非改 `[>]`：執行層仍需動作，故不標已授權

### pitfalls

- 第一次 Bash `cd && grep` 鏈因 exit code 1 中斷後段命令
  → 改用工作目錄已在 repo 內的絕對/相對路徑分次執行
- 無其他實質踩坑

### abandoned

- **未自動 push**：handoff 明示 push 必須 Paul 授權，不可逆動作暫停請示
- **未起草正式 ADR**：handoff 明確排除（那是下一輪 Cowork 工作），不越權
- **未 `git mv` 上游 handoff 檔案歸檔**：handoff 明確排除
- **未動 `docs/governance/`**：紅線範圍
```

### 附錄 B · 邊界判定 FAQ

**Q：我試了 approach A 失敗改走 B，A 算 abandoned 還是 pitfalls？**
A：看評估過程。如果 A 是**嘗試執行後失敗**，屬 pitfalls。如果 A 是**開始前評估拒絕**，屬 abandoned。兩者可能都要寫（A 嘗試失敗→改走 B 是 pitfalls；中途放棄繼續調試 A 是 abandoned）。

**Q：Paul 在對話中提「我們要不要順便做 X」，我評估說不順便，這要寫 abandoned 嗎？**
A：要。這符合第二條納入規則 1「本 session 內放棄的方案」——即使只討論了 30 秒，只要是真的評估過（你有判斷「不順便」的理由），就寫。

**Q：Chat 在裁決 handoff 時 Reject 了某個建議，Reject 理由已經寫在裁決欄位，我的 worklog 的 abandoned 要重複寫嗎？**
A：要，但可縮減。Chat 的裁決欄位是「決議的產出」，worklog abandoned 是「session 脈絡」。worklog 可寫一行「承 [裁決路徑]，核心理由：XXX」，不複製整個 Reject 論述。

**Q：短 session 四維度都是「無」還要寫嗎？**
A：要。這是第三條強制性條款的核心——寫「無」讓 lint 能區分「忘寫」vs「確實沒有」。短 session 可用第四條縮寫格式簡化。

### 附錄 C · worklog-format.md 預期改動示意

本 ADR 通過後，`docs/governance/worklog-format.md` 預期改動範圍（由下次 Cowork 起草執行）：

**改動前（現行，三維度）**：

```markdown
# Worklog 格式規範

## 格式（三維度必填）

Worklog 必須涵蓋三個維度，缺一不可：
- **做了什麼**（完成日誌 + 狀態變更）
- **為什麼這樣決定**（決策紀錄）
- **遇到什麼阻礙**（阻礙與踩坑）
```

**改動後（本 ADR 要求，四維度）**：

```markdown
# Worklog 格式規範

> 本格式由 `docs/governance/adr-worklog-abandoned-dimension-2026-04-25.md` 規範，修訂需另開 ADR。

## 格式（四維度必填，順序固定）

Worklog 每個 session 段落必須依序涵蓋四個維度，缺一不可、無實質內容必須寫「無」：

1. **done**（做了什麼）：完成日誌 + 狀態變更
2. **decisions**（決策紀錄）：有其他選項時選了這個的理由
3. **pitfalls**（阻礙與踩坑）：已解 / 未解
4. **abandoned**（放棄了什麼）：本 / 跨 session 評估後放棄的方案 + 理由

### 短 session 縮寫格式

（詳見 ADR §四）
```

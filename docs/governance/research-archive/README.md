# 治理研究素材庫（research-archive）

> **本目錄存放治理研究素材，非 ADR、非定稿、不代表現行治理規則。**

---

## 用途

本目錄收錄 paulkuo.tw 治理體系演化過程中產生的研究稿、跨視角挑戰報告、立場衝突的多輪迭代稿。這些檔案：

- **不是** ADR（架構決策紀錄）
- **不是** 現行治理規則
- **不代表** Paul 或任何 session 的最終立場
- **保留** 立場衝突，讓事實衝突本身成為治理研究素材

---

## 引用規範

引用本目錄內檔案時，**必須**：

1. 標明是「研究稿」或「research material」
2. 說明檔案的版本／立場（v1.0 / v2.0 / v2.1 / 跨 session feedback）
3. 不得作為「現行治理規則」引用

**錯誤示範**：

> 依治理研究 v2.0，handbook 取代憲法是正確方向。

**正確示範**：

> 治理研究 v2.0（research material）曾建議用 handbook 取代憲法，但同批次 v2.1 對此提出根本質疑（research-archive/v2.1）。本目錄保留兩份檔案讓事實衝突可見，現行治理規則以 `docs/governance/adr-*.md` 為準。

---

## 檔案清單（2026-04-25 入檔）

| 檔名 | 版本 | 產出 session | 立場摘要 |
|---|---|---|---|
| research-governance-gaps-vs-industry-2026-04-25.md | v1.0 | Chat | 三權分立 + 憲法 framing |
| research-governance-gaps-vs-industry-2026-04-25-v2.md | v2.0 | Chat 自我挑戰 | 改用 handbook + MR framing |
| research-governance-gaps-vs-industry-2026-04-25-v2.1-cowork.md | v2.1 | Cowork peer review | 質疑 v2.0 是另一種修辭遷移 |
| code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md | Code feedback | Chat 模擬 Code 視角 | 工程角度提出 D1-D4 落地檢查 |

---

## 治理依據

依 `docs/governance/adr-governance-research-git-discipline-2026-04-25.md`（H10）§四第一款：

> 本 ADR 通過後，現有四份 untracked 報告的處理方式：進 git，但放在新建子目錄 `docs/governance/research-archive/`。子目錄用途：明示這些是研究素材庫、含立場衝突的多輪迭代稿，非定稿、不代表現行治理規則。

---

## 後續加入規範

未來新的治理研究稿（research-*、cowork--*-research-*、code--*-feedback-*）若性質相同（研究稿、非 ADR），應一併進入本目錄。

定稿後升格為 ADR 的內容，移至 `docs/governance/adr-*.md`，並在 ADR-INDEX 同步登記。

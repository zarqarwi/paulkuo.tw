# ADR 草稿：Skill 歸屬層級 — 使用者級 vs 專案級

> **狀態**：Draft（v0.4 候選議題，尚未採納）
> **建立**：2026-04-20（Cowork session）
> **提出人**：Paul + Cowork
> **前置 ADR**：協作憲法 v0.2（2026-04-19）、憲法 v0.3 實施（2026-04-20）

---

## 背景

2026-04-20 Cowork session 討論「結案宣告 Close Protocol」要加在哪一層 skill 時，浮現一個既有治理架構未處理的架構問題：

**現狀**：所有 skill 目前都照憲法第二條「載體對等原則」處理——A 層（`~/Desktop/01_專案進行中/paulkuo.tw/.claude/skills/`）是正本，B 層（`~/.claude/skills/`）是 mirror。每次 A 層改動後手動 `cp -r` 同步。

**矛盾**：`session-handoff` skill 的使用場景不限於 paulkuo.tw repo。任何 session（Cowork 開場、跨專案討論、Formosa 獨立 session、單純聊天）都會自動載入 B 層這份 skill。但它的正本綁在 paulkuo.tw 的 git 裡，在概念上是矛盾的——**一個普遍適用的機制，被綁在特定 repo 的版本控制**。

## 議題

Skill 本身有「歸屬層級」的差異，但憲法 v0.2 沒有區分。具體看：

| Skill 類別 | 當前 skills | 適合的正本層級 |
|-----------|------------|---------------|
| 使用者級（跨所有 session） | session-handoff、organize-downloads、consolidate-memory、setup-cowork、schedule、skill-creator | 應該在使用者級為正本 |
| 專案級（綁特定 repo） | paulkuo-writing、formosa-feedback、paulkuo-social | 當前 A 層在 paulkuo.tw repo 正確 |
| 跨專案共用但仍為使用者級 | session-handoff（協作機制，不屬某個 repo） | 當前歸屬錯位 |

## 選項

### 選項 A：維持現狀

所有 skill 都放 paulkuo.tw repo 的 A 層，繼續 `cp -r` 同步到 B 層。

- 優點：一個 repo 管理所有治理資產，憲法第二條不用改。
- 缺點：使用者級 skill 概念上綁在單一 repo，新 repo 出現時要決定要不要複製一份（例：未來若開 Mazu Today 的獨立 repo）。

### 選項 B：建立獨立的使用者級 skill repo

在 `~/claude-config/` 建新 repo，專門放使用者級 skill。A 層定義為「skill 最貼近正本的載體」，不一定是 paulkuo.tw repo。

- 優點：歸屬正確，符合實際使用場景。
- 缺點：多一個 repo 要維護，憲法第二條要補條文定義「載體」的界線。

### 選項 C：保留 A/B 層架構但分流

paulkuo.tw repo 的 `.claude/skills/` 只放專案級 skill；使用者級 skill 放獨立 repo。

- 優點：語意清楚，每個 skill 有明確歸屬。
- 缺點：需要一次性盤點與遷移現有 skill，工程量中等。

## 尚未決定

本 ADR 為**草稿**，不做決策。提出目的是把議題記下，避免漏失。

**觸發此 ADR 的小決策已在本次 session 處理**：「結案宣告 Close Protocol」（v5.4）照既有架構改 A 層、同步 B 層，不等此 ADR 結論。

## 建議處理時機

- 列為憲法 **v0.4 候選議題**
- 不急——目前 session-handoff 放在 paulkuo.tw repo 並未造成功能問題，只是架構上有語意歧義
- 觸發升級條件：
  1. 第二個獨立 repo 出現，需要載入同一份使用者級 skill，且手動 copy 成本累積到值得處理
  2. 使用者級 skill 數量超過 10 個，管理分散度超過單一 repo 能承擔
  3. 跨 repo 的 skill 版本漂移造成實際事故

## 參考

- 觸發對話：Cowork session 2026-04-20「磁碟警訊 → 治理深化 → 結案宣告落地 → skill 層級議題浮現」
- 相關 skill：session-handoff v5.4（本次改動）
- 憲法第二條：載體對等原則（A 層正本、B 層 mirror）
- 憲法第四條：記憶層次原則（本 ADR 本質是「skill 也有層次，需區分」的延伸）

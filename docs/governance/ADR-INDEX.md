# ADR INDEX

> paulkuo.tw 架構決策紀錄索引
>
> - **最後更新**：2026-04-25
> - **維護原則**：新 ADR 合併前須同步更新此檔（詳見底部維護 SOP）
> - **總數**：10 份（Accepted: 9 / Draft: 1）
> - **⚠️ 編號說明**：H1-H9 為 2026-04-24 立法後的議題編號（見 PENDING.md）；CON-v0.2/v0.3 為前置憲法文件；SKILL-OWN 為草稿（尚無 H 編號）

---

## 快速導航

| 編號 | 標題 | 狀態 | 日期 | 一句話摘要 |
|---|---|---|---|---|
| CON-v0.2 | [paulkuo.tw 協作憲法 v0.2](adr-collaboration-constitution-v0.2-2026-04-19.md) | Accepted | 2026-04-19 | 三視窗協作基礎框架與五條核心憲法 |
| CON-v0.3 | [協作憲法 v0.3 實施方案](adr-constitution-v0.3-implementation-2026-04-20.md) | Accepted | 2026-04-20 | v0.2 後四軌未決議題統一規劃 |
| SKL-draft | [Skill 歸屬層級 — 使用者級 vs 專案級](adr-skill-ownership-layer-draft-2026-04-20.md) | Draft | 2026-04-20 | Skill 歸屬層（使用者/專案）草稿 |
| H6 | [A/B/C 命名衝突消歧 — skill 儲存層改描述性命名](adr-naming-conflict-resolution-2026-04-24.md) | Accepted | 2026-04-24 | skill 儲存層改描述性命名 |
| H1 | [Cloud 層同步協議（A → C Personal Skill）](adr-cloud-sync-protocol-2026-04-25.md) | Accepted | 2026-04-25 | A→C 層同步五環責任鏈 |
| H2 | [Chat 精確事實查詢結構性上限（含 A3 併入）](adr-chat-factual-query-limit-2026-04-25.md) | Accepted | 2026-04-25 | Chat 禁以二手資訊回答精確事實 |
| H5 | [治理文件長度預算執行機制](adr-length-budget-enforcement-2026-04-25.md) | Accepted | 2026-04-25 | 超閾值自動觸發拆分 ADR 機制 |
| H7 | [governance-lint.sh 他律防線](adr-governance-lint-he-lu-2026-04-25.md) | Accepted | 2026-04-25 | lint.sh 五項核查兩級攔截 |
| H8 | [Worklog 四維度 — 新增 abandoned 維度](adr-worklog-abandoned-dimension-2026-04-25.md) | Accepted | 2026-04-25 | worklog 新增 abandoned 第四維度 |
| H9 | [L3 操作 SOP 定位釐清 — 維持現狀 + 寫作規則](adr-l3-positioning-2026-04-25.md) | Accepted | 2026-04-25 | L3 SOP 維持現狀補寫作分類規則 |

---

## 主題分組

### 憲法與治理框架

- CON-v0.2、CON-v0.3（基礎憲法與實施規劃）
- H7（governance-lint.sh 他律防線）
- H5（治理文件長度預算）

### 視窗職責邊界

- H1（Cloud 層同步協議）
- H2（Chat 精確事實查詢限制）
- H9（L3 操作 SOP 定位）

### 記憶與資料結構

- H8（worklog abandoned 維度）
- SKL-draft（Skill 歸屬層）

### 命名與工程基礎

- H6（A/B/C 命名消歧）

---

## 尚未立法的議題（H3 / H4）

以下議題已凍結，等待解凍門檻：
- **H3** auto-memory 跨視窗不對稱寫入（Cowork 司法，見 frozen-h1-h4-memo-2026-04-23.md）
- **H4** Cowork 新 session 剛性核查補強（Cowork 司法，見 frozen-h1-h4-memo-2026-04-23.md）

---

## 維護 SOP

1. **新 ADR 合併前**，此 INDEX 必須同步更新（INDEX 不是可選產物，是 ADR 的一部分）
2. **舊 ADR Superseded 時**，狀態欄更新為 `Superseded by Hxx`
3. **合併後驗證**：`grep -cE '^\| (H[0-9]|CON|SKL)' docs/governance/ADR-INDEX.md` 的結果應等於實際 ADR 檔案數
4. **INDEX 檢索規則**：用 `grep 'keyword' docs/governance/ADR-INDEX.md` 比 `grep -r 'keyword' docs/governance/` 快一個量級

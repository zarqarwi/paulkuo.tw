# Wiki Visibility 規則（單一真相源 / SSOT）

> Last updated: 2026-04-26
> Authoritative source. 三組件（scanner / ingest pipeline / 前端）的 visibility 邏輯必須引用本文。
> 任何規則修改先改本文，再同步三組件。違反者由 `scripts/wiki-consistency-check.py` 抓出。

---

## Visibility 值定義

| value | 意義 | 前端展示 | KV seed | 對外可訪問 |
|-------|------|---------|---------|-----------|
| `public` | 公開可見 | ✅ 渲染 | ✅ seed（concepts/entities） | ✅ |
| `internal` | 個人/敏感，不對外 | ❌ 跳過 | ❌ skip | ❌ |

**沒有 `private` 值。** Schema 不接受。試圖改成 private 會破壞 build。
（04-26 incident 暴露的失誤之一是 cowork handoff 假設有 `private`，實際 schema 從未支援。）

---

## 資料夾預設規則

| 資料夾 | 預設 visibility | 條件升級為 internal |
|--------|---------------|---------------------|
| `01_專欄文章` | public | 含 system tag `录音*`（任何含「录音」的） |
| `03_環保循環經濟` | public | 同上 |
| `04_AI與科技` | public | 同上 |
| `02_醫療健康` | internal | — |
| `05_商務會議` | internal | 含 `录音*` → 自動 sensitivity: business_confidential |
| `06_個人成長與學習` | internal | — |
| `07_生活雜記` | private（不 ingest） | — |
| `08_其他` | internal | — |
| `09_會議錄音` | private（不 ingest） | — |

「private（不 ingest）」表示 scanner 直接跳過此資料夾，不會出現在 wiki source corpus 內。

---

## Sensitivity 欄位

`sensitivity` 是 visibility 之外的補充欄位，用於說明「為什麼 visibility=internal」，避免靠人腦推測。

| value | 何時用 |
|-------|-------|
| `safe` | 預設，無敏感資訊 |
| `contains_pii` | 含具名個人資訊（人名、電話、Email） |
| `business_confidential` | 含公司名、合作條件、金額、商業機密 |
| `personal_reflection` | Paul 個人感觸、追思、私人經驗 |

`internal` source 可以是 `safe`（單純資料夾規則內訓）也可以是 `business_confidential`（額外敏感）。
`public` source 應為 `safe`。**前端不顯示 sensitivity，純內部分類。**

由 `scripts/wiki-sensitivity-scan.py` 自動偵測，ingest pipeline 落檔前呼叫一次補欄位。

---

## Tag 變體（系統錄音）

下列 system tag name 都被視為「錄音內容」，命中即升級 visibility=internal：

- `录音卡笔记`
- `录音笔记`
- `录音测试`
- 任何 contains `录音` 的 system tag（forward-compat 防呆）

實作：scanner 採 substring match — `"录音" in tag.name`，commit `b0931a4` 修正。
切勿改回精確比對（會回歸 04-26 incident root cause）。

---

## 規則執行位置

| 組件 | 檔案 | 規則段落 | 引用本文方式 |
|------|------|---------|------------|
| Scanner | `scripts/build_wiki_ingest_report.py` | `determine_visibility()` | inline comment |
| Ingest pipeline | `scripts/wiki-youtube-ingest.cjs`, `scripts/wiki-enrich.cjs` | 落檔/重寫 frontmatter 處 | inline comment |
| 前端（index） | `src/pages/wiki/index.astro` | `visibility === 'public'` filter | inline comment |
| 前端（slug） | `src/pages/wiki/[slug].astro` | `visibility === 'public'` filter | inline comment |
| Schema | `src/content.config.ts` | `wikiSchema.visibility` + `wikiSchema.sensitivity` | inline comment |
| KV seed | `scripts/wiki-kv-seed.cjs` | sources 不 seed；如未來改要對齊 | inline comment |
| Sensitivity detector | `scripts/wiki-sensitivity-scan.py` | docstring + per-pattern comments | docstring |
| CI | `scripts/wiki-consistency-check.py` | 主動檢查所有上述位置 | self-referential |

任何上述組件修改 visibility 邏輯必須同步更新本文，CI 會擋。

---

## 04-26 Incident 教訓（為什麼有本文）

1. **沒有 SSOT**：scanner 推測一次、ingest pipeline 強制一次、前端 filter 排除一次——三處規則散落，靠運氣對齊
2. **沒有敏感詞自動防線**：scanner 只看 tag 變體，沒掃內容裡的公司名、人名、合作金額
3. **沒有 ingest staging**：scanner 候選清單直接跑 ingest 落 `src/content/wiki/sources/`，錯了直接污染正式 corpus
4. **沒有防再犯機制**：被決定 delete 的 raw_note_id 沒有 blocklist，下次 scanner 又會掃出來
5. **沒有 schema 自我說明**：source 為什麼是 internal？是錄音？是商務？是個人感觸？frontmatter 看不出來

本文 + Tier 2 schema + Tier 3 staging + Tier 4 deny-list/CI 一次補完。

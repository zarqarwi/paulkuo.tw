# Wiki Quarantine Review SOP

> 適用情境：scanner / ingest pipeline 發現 source 內容可能敏感，需要 review 後才能決定 visibility outcome。
> 上次發動：2026-04-26 incident（scanner 录音 tag 偵測 bug 引發 65 筆 audit）

## 觸發條件

任一情況發生時啟動本 SOP：
1. 既有 source 被反查發現含敏感屬性（如錄音、人名、合作條件）
2. 新 ingest 的 source 命中 sensitivity detector（business_confidential / contains_pii）
3. 系統規則變更後既有 corpus 需重新審查
4. ingest 落檔的 source 命中「錄音 + 商務會議 + 兩人以上」三條件
   → 直接走 delete outcome（不需要 review queue）

## 流程（5 階段）

### Stage 1: Mark — 標記 quarantine

對涉及的 source 加 `quarantine:` block：

```yaml
quarantine:
  reason: "簡述發動原因（例：scanner_bug_2026_04_26_录音_tag_misdetection）"
  observed_visibility: <當前的 visibility>
  quarantined_at: "<ISO date>"
  needs_review: true
  review_outcome: pending
```

不改 visibility（除非已知必須立即下架）。

### Stage 2: Classify — 自動分類

跑 classifier：

```bash
python3 scripts/wiki-quarantine-classify.py
```

產出：
- `worklogs/incidents/quarantine-classification-<date>.md`（人讀報表）
- `worklogs/incidents/quarantine-overrides-<date>.yml`（機讀，下個階段用）

5 個 bucket：
- `restore_public`：恢復 public
- `keep_internal`：永久 internal
- `delete`：移檔 + 加 blocklist
- `redact_and_restore`：去識別化後恢復 public
- `needs_human_review`：規則打不到，下階段 Paul 審

**規則維護**：`data/wiki-quarantine-rules.yml`（v2+）。不要改 .py，改 YAML 即可。

### Stage 3: Human Review — 人工裁決

Paul 對 `needs_human_review` 桶逐筆裁決，更新 overrides yaml：

```yaml
1907123456789:
  outcome: restore_public  # 改自動分類，或 fill 缺的
  reviewer: paul
  reviewed_at: "2026-04-27"
  reasoning: "公開講座轉錄，無敏感資訊"
```

（Cowork 可協助粗分類，Paul final approve）

### Stage 4: Apply — 套用 outcome

跑 apply script（`scripts/wiki-quarantine-apply.py`，commit `7b9f79e`）：

```bash
python3 scripts/wiki-quarantine-apply.py worklogs/incidents/quarantine-overrides-<date>.yml
```

對應行為：
- `restore_public`：把 visibility 改 public，移除 quarantine block
- `keep_internal`：保持 internal，移除 needs_review 標記
- `delete`：移除檔案 + raw_note_id 加 `data/wiki-ingest-blocklist.json`
- `redact_and_restore`：手動去識別化後設 outcome 為 restore_public 重跑

### Stage 5: Verify — 驗收

- `npm run build` 通過
- `npm run check:wiki-visibility` 通過
- 前端無痕視窗 spot-check
- Issue #157 同步狀態

## 防呆原則

1. **不直接 delete**：deny-list 永久記錄，scanner 不會重複掃出
2. **不改 visibility 為 private**：schema 不接受
3. **保留 audit 鏈**：reviewer / reviewed_at / reasoning 必填
4. **`re_review_after` 為選填**：商務內容 N 年後可能可重審

## 相關文件

- `docs/wiki-visibility-rules.md`：visibility 規則 SSOT
- `data/wiki-quarantine-rules.yml`：classifier 規則（YAML，v2+）
- `scripts/wiki-quarantine-classify.py`：自動分類腳本
- `scripts/wiki_text_normalize.py`：簡繁對映 + 空白壓縮 helper
- `scripts/wiki-sensitivity-scan.py`：敏感詞 detector

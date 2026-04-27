# Quarantine Classification — 2026-04-27

Auto-classified by `scripts/wiki-quarantine-classify.py` over the 65 sources with `quarantine:` block (added by 4534ace). Rule-based, deterministic, re-runnable.

**This script does NOT execute outcomes.** Apply step is a separate handoff (human review + `wiki-quarantine-apply.py`, not yet written).

## Summary

- **restore_public**: 0
- **keep_internal**: 18
- **delete**: 0
- **redact_and_restore**: 0
- **needs_human_review**: 0
- **parse_error**: 0
- **TOTAL**: 18

## Bucket Details

### keep_internal (18)

- `1901466154980006336` — 幹細胞與外泌體自動化培養技術介紹
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-006336-stem-cell-exosome-automation.md`
- `1900527399683043024` — 二手物資回收與物流模式創新探討
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-043024-secondhand-recycling-logistics.md`
- `1900890547758048304` — 照顧管家服務模式與AI工具在長照領域的應用探討
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-048304-care-butler-ai-longterm-care.md`
- `1900387995782123160` — 子宮頸癌治療探索與醫療數據合作討論
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-123160-cervical-cancer-medical-data.md`
- `1901366025334174608` — 企業員工健康與長期照護服務的ESG整合
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-174608-employee-health-longterm-care.md`
- `1900480149674188584` — 對牧師的懷念與追思
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-188584-pastor-pang-memorial.md`
- `1900976653262270152` — 健康生態系與運動賽事平台的協作
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-270152-tech-sports-platform-collab.md`
- `1905623247384379840` — 大智若愚：真正有能力的人如何調成靜音模式
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-379840-silent-mode-wisdom.md`
- `1903118704850406952` — 個人網站搭建與AI工具應用的學習總結
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-406952-personal-website-ai-tools.md`
- `1901270027447435960` — AI 人力資源系統在製造業的應用：從履歷篩選到員工培訓
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-435960-ai-hr-manufacturing.md`
- `1903329278507519528` — 企業通訊工具的公私分離設計與合規管控
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-519528-enterprise-communication.md`
- `1900429853459558096` — 外星文明視角：宇宙秩序、地球監獄與精神生命的本質
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-558096-alien-life-civilization.md`
- `1905989546891580464` — 人在痛苦、空白和高壓交替狀態下成長最快
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-580464-growth-through-adversity.md`
- `1899065664472756056` — 牧師離世對我的影響與思考
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-756056-pastor-pang-reflection.md`
- `1901473991147782928` — 預防醫學服務設計與AI藥物開發的商業生態探討
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-782928-preventive-medicine-ai-drug.md`
- `1900822048398808040` — AI技術在醫療領域的應用與邊緣運算合作探討
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-808040-ai-medical-collaboration.md`
- `1903118811150847528` — 系統設計踩坑與學習反思
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-847528-system-design-lessons.md`
- `1901006869430898432` — AI藥物設計與生命科學研究的跨界合作
  - Rule: fast-path: existing review_outcome=keep_internal
  - File: `getnote-898432-ai-drug-design-biotech.md`

## Next Steps (separate small handoff)

1. Paul reviews `needs_human_review` bucket and any auto-classification disagreement
2. Update `quarantine-overrides-2026-04-26.yml` with final outcomes
3. Run `scripts/wiki-quarantine-apply.py` (to be written) to execute outcomes

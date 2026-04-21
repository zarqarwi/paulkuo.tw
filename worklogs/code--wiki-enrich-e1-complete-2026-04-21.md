# Code → Cowork Handoff: Wiki Enrichment CLI E1 完成

> 建立：2026-04-21
> Code session：[WIKI]
> 目標：Cowork 品質確認，決定是否放行 E2

---

## E1 交付內容

| 檔案 | 狀態 |
|------|------|
| `scripts/wiki-enrich.cjs` v0.1 | ✅ 新建，commit `eec404d` |
| `src/content.config.ts` +enrichment fields | ✅ 更新 |
| `package.json` @anthropic-ai/sdk ^0.90.0 | ✅ 安裝 |
| `.env` ANTHROPIC_API_KEY 已填（本機，不進 git） | ✅ |

---

## Dry-run 範例 JSON（youtube-8pncy425QqQ-ai，群核科技空間智能）

```bash
node scripts/wiki-enrich.cjs youtube-8pncy425QqQ-ai --dry-run
```

```json
{
  "summary": "群核科技創始人黃曉煌分享了空間智能的技術內核與商業應用路徑。空間智能是從認知科學演進而來的核心能力，涵蓋感知、表徵、推理、預測和行動五大模塊。它與世界模型、具身智能構成清晰的技術遞進關係：世界模型在「腦海中」預測世界運行規律，空間智能負責三維物理空間的理解與表示，具身智能則將兩者統一於真實機器人等系統。當前業界採取「空間生成」與「潛空間預測」兩條路線，前者更利於商業落地。群核以「物理世界導向」與「工程產業驅動」差異化策略，運用積累的海量CAD數據，打造了從空間工具、數據到大模型的完整產品矩陣，形成了中美空間智能發展的路線區隔。",
  "key_points": [
    "空間智能包含感知、表徵、推理、預測、行動五大模塊，是AI從認知走向行動的關鍵樞紐。",
    "世界模型→空間智能→具身智能構成清晰遞進，實現具身智能必須經過空間智能階段。",
    "空間表示從Mesh→NeRF→高斯泼溅演進，群核採用Mesh+3D高斯混合方案平衡精度與交互。",
    "中國空間智能聚焦物理世界，美國側重虛擬世界，反映製造力與大模型優勢的差異。",
    "群核早年押注GPU、後踩中房產週期、再轉向空間智能，體現「以技術尋找應用」的持續預判力。"
  ],
  "concept_links": {
    "matched": ["ai-embodiment", "build-for-models", "human-ai-collaboration", "enterprise-ai-adoption", "ai-capabilities-benchmark"],
    "candidates": [
      {"slug_zh": "spatial-intelligence-technology", "title": "空間智能：從感知到行動的技術棧", "reason": "影片核心主題，涉及感知、表徵、推理、預測、行動五大模塊，以及重建/推斷/生成三條技術路線，值得獨立概念化。"},
      {"slug_zh": "world-model-embodiment-stack", "title": "世界模型→空間智能→具身智能的遞進架構", "reason": "影片論述的核心遞進邏輯，從腦海模擬到三維表示再到現實機器人的完整技術棧。"},
      {"slug_zh": "geopolitical-ai-divergence", "title": "地緣AI分化：虛擬世界 vs 物理世界的路線選擇", "reason": "反映中美在AI發展上的戰略差異，具有地緣經濟意義。"}
    ]
  }
}
```

token 消耗：in 10,242 / out 2,340（約 $0.002/支，25 支 ≈ $0.05）

---

## Cowork 需確認的問題

1. **摘要品質**：約 230 字（規格 280-320），是否可接受，還是要調整 prompt 讓 Haiku 寫更長？
2. **concept_links.matched 準確度**：`build-for-models`、`enterprise-ai-adoption` 對這支影片是否算合理命中？
3. **candidates 取捨**：`spatial-intelligence-technology`、`world-model-embodiment-stack` 值得立為新 concept 嗎？（Slug 目前用英文，因為是技術術語，是否符合 handoff 裡「中文 slug」原則？）
4. **放行 E2 條件**：上述品質確認後，是否授權 Code 繼續做批次模式（`--batch`）？

---

## E2 預計範圍（待 Cowork 放行）

- `--batch` 模式：掃描所有無 `enriched_at` 的 youtube source，逐一呼叫
- 每支之間 sleep 1s（避免 rate limit）
- 進度顯示：`[3/25] youtube-xxx`
- 跳過已 enriched（除非加 `--force`）

---

## 已知限制（E1 範圍內不處理）

- Pass 2 新 concept candidates 目前寫在 frontmatter，尚未搬到 `worklogs/concept-candidates.md`
- Sonnet fallback 尚未實作
- 正式寫檔（非 dry-run）尚未跑過——請 Cowork 確認品質後，Paul 可手動跑一支驗收：
  ```bash
  node scripts/wiki-enrich.cjs youtube-8pncy425QqQ-ai
  git diff src/content/wiki/sources/youtube-8pncy425QqQ-ai.md
  ```

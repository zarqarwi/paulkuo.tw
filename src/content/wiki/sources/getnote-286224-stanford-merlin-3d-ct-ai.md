---
title: "Stanford Merlin：原生3D CT影像AI突破"
type: source
pillar: ai
visibility: public
created: 2026-04-16
updated: 2026-04-17
source_count: 1
confidence: low
tags: [醫學影像AI, 3D視覺語言模型, Stanford, Merlin, CT掃描]
links_to: [ai-medical-biotech, ai-capabilities-benchmark]
linked_from: []
raw_source_path: "notes/01_專欄文章/快刀青衣_專欄/781_斯坦福开源Merlin模型：从2D到3D，AI如何解决CT影.md"
raw_source_type: getnote
raw_note_id: "1907338720672286224"
---

## 原文摘要

Stanford MIMI/AIMI 中心開源 Merlin——首個原生 3D 視覺語言模型，直接處理完整腹部 CT 立體數據而非 2D 切片堆疊。訓練資料涵蓋 15,331 次 CT 掃描、180 萬條診斷代碼、600 萬詞元放射科報告，同時釋出 25,494 份腹部 CT 開源數據集（18,317 名患者）。Merlin 在 752 項任務評測中，以 10% 訓練數據超越 nnU-Net（3D 器官分割公認最強工具），臨床表型預測平均準確率 0.81。論文發表於 Nature。

## 關鍵概念

- **原生 3D 模型**：「3D 權重膨脹」技術將 2D 神經網路延伸為空間理解能力，非簡單切片堆疊 → [[ai-medical-biotech]]
- **多任務能力**：CT 查看、報告生成、3D 分割、5 年慢性病風險預測同時實現 → [[ai-capabilities-benchmark]]
- **解決數據稀缺**：利用醫院日常放射科報告，繞開專門標注需求，打破醫療數據壁壘

## 數據亮點

- 全球每年腹部 CT 約 7,500 萬次，按不眠不休計算需 2,854 年才能完成人工閱片
- 放射科住院醫師職業倦怠率 80-90%
- Merlin 以 10% 訓練數據超越領域最強專用工具

---
title: "GPU 算力演進趨勢：A100 → Rubin Ultra（2020-2028）"
type: source
pillar: ai
visibility: public
created: 2025-10-05
updated: 2026-04-10
source_count: 1
confidence: low
tags: [GPU算力, NVIDIA, AI基礎設施, 摩爾定律, Blackwell, Rubin]
links_to: [ai-agent-economy, build-for-models]
linked_from: []
raw_source_path: "notes/04_AI與科技/untitled_1889391063806939944.md"
raw_source_type: getnote
raw_note_id: "1889391063806939944"
---

## 原文摘要

整理了 NVIDIA GPU 從 A100 到 Rubin Ultra 的算力演進路線，說明為何 AI 算力增長遠超摩爾定律。每個世代的架構升級均在 FP8/FP4 推理算力、記憶體頻寬和互連技術上實現數倍跳升，為大規模 LLM 訓練與推理提供基礎設施支撐。

## 關鍵概念

- **超越摩爾定律的算力增長**：架構創新（Tensor Core + 稀疏優化）使 AI 算力以非線性速率攀升 → [[ai-agent-economy]]
- **算力即護城河**：掌握 GPU 算力的程度決定 AI 能力天花板 → [[build-for-models]]
- **記憶體頻寬瓶頸**：從 HBM2e → HBM3 → HBM3e → HBM4e，頻寬從 2 TB/s 提升至理論 8 TB/s+

## GPU 算力比較表（2020-2028）

| GPU（架構，年份） | 峰值算力 | 主要特性 | 世代增長 |
|---|---|---|---|
| A100（Ampere, 2020） | FP16: 312 TFLOPS | 7nm, 80GB HBM2e, TDP 400W | 基準 |
| H100（Hopper, 2022） | FP8: 3.9 PFLOPS | 4nm, 80GB HBM3, TDP 700W | ～3× FP32 |
| B100/B200（Blackwell, 2024） | FP8: ～10 PFLOPS（稀疏）| 多芯片 208B 晶體管, 192GB HBM3e | ～2.5× |
| Rubin（預計 2026） | FP8: ～1.2 EFLOPS（144芯片）| 3nm, 288GB HBM4, NVLink 6 | ～3.3× |
| Rubin Ultra（預計 2027） | FP4: 100 PFLOPS（4芯片封裝）| 1TB HBM4e, NVLink 7 | ～4× |

## 關鍵人物

- NVIDIA（Jensen Huang 主導的 GPU 路線圖）

## 引用金句

- 「Rubin Ultra 算力有望再提升 ～4×，下一代 Feynman 架構（2028）尚未公布」

## Ingest 備註

- ingest 日期：2026-04-10
- 操作者：Cowork session
- visibility: public（公開技術資料整理，無敏感資訊）
- 資料時效：截至 2025 年 10 月的業界估算，Rubin 系列為預測值

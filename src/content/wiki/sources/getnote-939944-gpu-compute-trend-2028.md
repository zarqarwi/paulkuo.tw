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
enriched_at: "2026-04-22"
enriched_by: "haiku-4.5"
summary: "本文系統梳理 NVIDIA GPU 算力從 2020 年 A100 至 2027-2028 年預期的 Rubin Ultra 與 Feynman 架構的演進路線。通過架構創新（Tensor Core 優化、稀疏計算、多芯片互連）與製程工藝進步，AI 算力實現非線性增長，遠超傳統摩爾定律。從 A100 的 FP16 312 TFLOPS，經 H100 的 FP8 3.9 PFLOPS，到 B100/B200 的 FP8 10 PFLOPS（稀疏），再躍升至 Rubin 系列預期的 1.2 EFLOPS 與 Rubin Ultra 的 100 PFLOPS，每世代實現 2.5–4 倍性能躍升。記憶體頻寬從 HBM2e 的 2 TB/s 演進至 HBM4e 理論 8 TB/s+。這種算力增長曲線為大規模 LLM 訓練與推理提供基礎設施支撐，也標誌著 GPU 作為 AI 時代稀缺資源的戰略地位。"
key_points:
  - "架構創新與製程工藝雙軌驅動，使 AI 算力超越摩爾定律實現非線性增長。"
  - "FP8/FP4 低精度推理成為主流，單位成本算力大幅提升，推動邊際效益遞增。"
  - "記憶體與互連技術（HBM3e→HBM4e, NVLink 升級）演進速度追趕計算核心發展。"
  - "GPU 多芯片堆疊與稀疏優化成為突破單晶片瓶頸的關鍵，B200 達 208B 晶體管。"
  - "預測路線圖顯示 2026-2028 年算力仍保持 3-4 倍周期增速，維持 AI 投資吸引力。"
quotes:
  - text: "架構創新（Tensor Core + 稀疏優化）使 AI 算力以非線性速率攀升"
    timestamp: ""
  - text: "掌握 GPU 算力的程度決定 AI 能力天花板"
    timestamp: ""
  - text: "Rubin Ultra 算力有望再提升 ～4×，下一代 Feynman 架構（2028）尚未公布"
    timestamp: ""
  - text: "從 HBM2e → HBM3 → HBM3e → HBM4e，頻寬從 2 TB/s 提升至理論 8 TB/s+"
    timestamp: ""
chapters:
  - title: "演進背景：超越摩爾定律的必然性"
    start: ""
    summary: "傳統摩爾定律放緩，NVIDIA 通過架構創新與製程進步實現 AI 算力非線性增長。"
  - title: "A100 至 H100：從 FP16 到 FP8 的轉折（2020-2022）"
    start: ""
    summary: "A100（7nm, 312 TFLOPS）向 H100（4nm, 3.9 PFLOPS）跨越，低精度推理成為主流。"
  - title: "B100/B200：多芯片堆疊與稀疏優化（2024）"
    start: ""
    summary: "突破單晶片限制，208B 晶體管、192GB HBM3e，FP8 稀疏達 10 PFLOPS。"
  - title: "Rubin 系列預測：EFLOPS 時代到來（2026-2027）"
    start: ""
    summary: "Rubin 達 1.2 EFLOPS（144 芯片），Rubin Ultra（1TB HBM4e）突破 EFLOPS 量級。"
  - title: "記憶體與互連技術的並行演進"
    start: ""
    summary: "HBM 頻寬從 2 TB/s 進化至 8 TB/s+，NVLink 升級支撐多芯片高速互連。"
  - title: "戰略意涵：GPU 算力作為稀缺資源的地位確立"
    start: ""
    summary: "算力增長路線圖確認，GPU 掌握權成為 AI 競賽的核心籌碼與護城河。"
concept_links:
  matched: [gpu-economics, build-for-models]
  candidates:
    - slug_zh: "token-economics"
      title: "Token Economics"
      reason: "本文聚焦 GPU 硬體算力演進，未直接討論 token 作為 AI 推理的基本經濟單位；token-economics 強調的是推理層面的計量與定價模式，而本文主要在硬體基礎設施層面。可作為候選延伸主題（GPU 算力是 token 經濟的基礎設施層），但不是核心論述主軸。"
    - slug_zh: "ai-agent-economy"
      title: "AI Agent 經濟"
      reason: "文中「算力即護城河」段落隱含 AI 代理能力與 GPU 算力的連動關係，但本文核心在硬體路線圖，未深入探討代理經濟體系。可列為背景脈絡，非主軸。"
    - slug_zh: "enterprise-ai-adoption"
      title: "Enterprise AI Adoption"
      reason: "GPU 算力進化為企業大規模 LLM 部署提供基礎，但本文未涉及企業變革管理、組織採納策略等；純屬基礎設施供給面，不涉及需求端組織課題。"
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

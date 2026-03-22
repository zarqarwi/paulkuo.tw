---
title: "把 paulkuo.tw 变成一个自我进化的网站"
subtitle: "当 AI 成为信息入口，你的网站该为 AI 而设计，不只为人。"
description: "从 Karpathy 的 autoresearch 出发，把个人网站改造成 AI 可读取、可测试、可持续优化的知识实体。实现 AI-Ready Continuous Optimization System 的完整过程与反思。"
abstract: |
  Karpathy 的 autoresearch 让 AI agent 自主跑实验、自主迭代，我把同样的精神搬到了自己的网站上。paulkuo.tw 不只是文章展示架，而是一个可以被 AI 持续读取、测试与优化的实验场。这篇记录了我从搭建四层评分系统、发现闭环问题、到加入外部 AI 交叉验证的完整过程——以及为什么我选择让新指标先观察、不急着让它参与决策。
date: 2026-03-22
updated: 2026-03-22
pillar: ai
tags:
  - AI-Ready
  - autoresearch
  - 网站优化
  - 持续优化循环
  - AEO
cover: "/images/covers/ai-ready-continuous-optimization.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine 专用字段 ===
thesis: "可持续的优化不是做很多修改，而是建立一套能区分有效信号与无效波动的研究制度。"
domain_bridge: "AI 自主研究 × 网站架构 × 实验方法论"
confidence: high
content_type: case-study
related_entities:
  - name: Andrej Karpathy
    type: Person
  - name: autoresearch
    type: Framework
  - name: AI-Ready Continuous Optimization
    type: Framework
reading_context: |
  适合对 AI 应用有兴趣、想了解如何把个人网站从静态展示升级为 AI 可理解的知识实体的技术实践者与创作者。不需要 ML 背景，但对网站结构化数据（JSON-LD, llms.txt）有基本了解会更好。
---

看到 Andrej Karpathy 发布 [autoresearch](https://github.com/karpathy/autoresearch) 时，脑子里闪过很多念头。当 AI 可以开始做研究，人类在科研中的位置该怎么调整？AI 可以不断优化与我们的交互，提供更好的"传道授业解惑"服务，我们要怎么应对教育的冲击？如果一个系统的目标、边界、评估与回滚机制都设计得足够清晰，进化可以不依赖直觉与人为修改，而是靠 AI 进入无限优化循环——这样，我们是否就更接近"止于至善"的理想？

autoresearch 带来的不只是方法论上的震撼，它把充满手工操作、直觉判断与零散试错的事情，收敛成了一个可持续循环、可被观测、也可以被回滚的系统。给 AI 一个足够真实但规模可控的实验场，让它自己修改、自己跑、自己看结果，再决定哪些变更值得保留。

然后我就想自己动手试试。从一月起，几乎每天都开新的项目，跟 AI 协作之后，决定用自己的网站做实验。

## 如果 AI 是入口，网站就不只是展示架

我们正进入一个转折点：越来越多的信息交流、协作、搜索、引用、甚至决策前的调研，都先经过 AI。不是搜索引擎，是 AI。

Perplexity 回答问题的时候会引用来源，ChatGPT 的浏览模式会抓取网站结构化数据，Claude 可以通过 llms.txt 理解网站。这意味着什么？意味着一个网站真正的任务，正在从"被人看到"转向"被 AI 正确理解"。不只是 SEO，而是 AEO（Answer Engine Optimization）——也有人叫 GEO（Generative Engine Optimization）。你优化的不是点击率，而是被 AI 正确摘要、正确引用、正确链接的能力。

接受这个前提的话，那 paulkuo.tw 就不只是我的文章展示架，而可以被设计成一个持续被人类测试、被 AI 理解、被 AI 优化的知识实体（knowledge entity），一个活的、进化的数字存在。

所以我就试着做了起来。

## 把 autoresearch 的精神搬到网站上

我不是把 autoresearch 原封不动搬过来。模型训练有 loss function，网站优化需要的是不同的东西。但精神是一样的：定义目标、限定边界、建立评估、设计回滚，然后让循环自己跑。

![AI-Ready Continuous Optimization System 流程图](/images/articles/ai-ready-continuous-optimization-flow.jpg)

我搭建了一套 AI-Ready Continuous Optimization System。流程是这样的：GitHub Actions 触发（push 文章 / 每周一 / 手动）→ mutation agent 根据策略生成修改 → file guard 做白名单检查 → 应用到 production → eval Worker 四层评分 → decision engine 决定 keep 还是 revert → 结果写入 experiments.json。

四层评分分别看：llms.txt 结构（AI 读得懂你的自我介绍吗）、JSON-LD 完整性（结构化数据对不对）、MCP/A2A 协议支持（你有没有为 AI agent 开门）、AI 理解度（Claude 读完你的 llms.txt 之后，能正确回答关于你的问题吗）。

第一轮跑完，分数从 65 拉到 85。系统跑通了。

但问题来了。

## 自己考自己，分数再高也不算数

三轮 e2e 跑下来，agent 每次都选择给文章加 FAQ，eval 每次都显示分数不变，三轮全部 revert。我去查原因，发现 agent 根本不知道分数从哪丢的——因为我没把 eval 的计分逻辑翻译给它看。它就像一个不知道考试范围的学生，只会做自己最拿手的题目。

但更深层的问题不在 agent，在整个循环本身。

我自己定义指标、让 agent 优化、再用同一套 eval 回头打分。这是闭环。分数从 65 到 85 到 90 又怎样？我没办法证明"90 分的网站，外部的 AI 真的更懂我"。system correctness 不等于 outcome correctness。

真正可持续的优化，不是做很多修改，而是建立一套能区分有效信号与无效波动的研究制度。

## 让外部 AI 来考

所以我加了一层外部验证。

做法是：建立 13 题 benchmark（涵盖身份识别、内容理解、跨域关联、时效性、技术特色，还有 3 题反幻觉测试），用 Perplexity 当外部考官。Perplexity 会搜索网络再回答，不是读我喂的 context，而是自己去找。如果它优化前答不出来、优化后答得出来，那就是有意义的 ground truth。

先跑了 10 次 calibration，测量噪声：同一个网站、同一组题目、同一个模型，连续问 10 次，分数的 mean 是 50.63，stddev 是 5.86。这意味着任何小于 ±11.72 的分数变化，都可能只是随机波动，不算真正的改善。

然后设了 GitHub Actions，每天早上 9 点自动跑一次 temporal baseline，结果自动 commit 回 repo。五天之后，我就有跨天的波动数据，可以区分"Perplexity 今天心情好所以分数高"和"网站结构改善所以分数高"。

这整套系统设计成全自动。不用去盯去催，数据自己积累。

## 不急着让新指标主导决策

不过，即使有了外部验证，我也不想一开始就让它决定 keep 还是 revert。

目前 Layer 5a（外部 AI 交叉验证）是 observe-only：每轮都跑，但不影响决策，只记录到 experiment log。我的规划是积累 20 轮以上，观察 false positive 和 false negative 的比率，之后再决定要不要升级成 soft gate（只在强烈负向时阻止 keep），再到 full gate（外部分数成为正式决策条件）。

刚开始做测试，不能让新指标一接进来就改变核心决策。它必须先被观察、被校准、被证明。

Karpathy 给我的启发，不只是"AI 可以自己做研究"，而是[工作范式正在移动的现实](/articles/ai-agents-changing-work)：每个人都有机会用极低成本，建立属于自己的 optimization loop。对研究者来说是模型训练，对企业来说是流程与知识库，对我来说，这次的起点是把我的个人网站变成一个可以被 AI 持续读取、测试、比较与优化的实验。

paulkuo.tw 不只是我的个人网站，也是一个面向未来更可读的自己。不只是我写过什么的展示，而是我如何与 AI 共同构建知识的现场。

想得更远一点，未来，每个人的数字分身（"soul.md"）都会有这样的进化框架吗？

不知道。继续探寻。

也许我想错了！那更棒。

## 系统实际架构

以下是 AI-Ready Continuous Optimization System 的完整流程与四层评分实况：

![AI-Ready Continuous Optimization System 总览](/images/articles/ai-ready-opt-system-overview.png)

![Eval Worker 四层评分实况](/images/articles/ai-ready-opt-eval-scoring.png)

---

*参考资料：[Karpathy autoresearch GitHub](https://github.com/karpathy/autoresearch)*

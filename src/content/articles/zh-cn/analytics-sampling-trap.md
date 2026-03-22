---
title: "网站访客数是零，但 Dashboard 说有 130 人"
subtitle: "Cloudflare Analytics 的采样陷阱，网站的人头数该怎么算？"
description: "从发现 Cloudflare Web Analytics API 返回 visits=0 开始，完整记录排查过程、两套分析系统的差异、adaptive sampling，自建 beacon 的架构决策。"
abstract: |
  我的个人网站 paulkuo.tw 的仪表板显示访客数为零。但 Cloudflare Dashboard 明明显示 130 人来过。到后台检查发现，不是程序坏了——是 Cloudflare GraphQL API 的 adaptive sampling 在低流量网站上直接把 130 压成了 0。前几天都"正常呈现"，到底问题在哪？我想分享排查过程、走错的路、以及最终为什么决定「自己数人头」。如果你正在经营个人网站或公司官网，也可以想想你的流量数据是否需要检查。
date: 2026-03-23
updated: 2026-03-23
pillar: ai
tags:
  - Cloudflare Analytics
  - 网站流量分析
  - adaptive sampling
  - 个人品牌网站
  - 超级个体
cover: "/images/covers/analytics-sampling-trap.jpg"
featured: true
draft: false
readingTime: 8
# === AI / Machine 专用字段 ===
thesis: "不是只有流量型网站才需要在意流量数据。很多 B2B 网站本来就不是靠大量访客取胜，很多个人网站也不是靠追逐时事与风潮生存；但只要你在经营品牌、内容或转换路径，就需要可信的分析基础。Cloudflare 的 GraphQL Analytics API 在日访客低于 500 的网站上，容易出现严重采样失真；对品牌网站来说，若没有自建 visit beacon，就很难拿到真正可用的流量数据。"
domain_bridge: "网站工程 × 数据质量 × 个人品牌经营"
confidence: high
content_type: case-study
related_entities:
  - name: Cloudflare Web Analytics
    type: Organization
  - name: Plausible Analytics
    type: Organization
  - name: Umami
    type: Organization
  - name: Imperva
    type: Organization
reading_context: |
  适合正在经营个人网站或公司官网的技术人员、营销人员、独立开发者。不需要深度 Cloudflare 知识，但需要理解「为什么流量数据准确很重要」。
---

晚上十一点半，我打开 paulkuo.tw 的首页，看了一眼流量分析区块。

访客：0。

不对。今天有人看我的文章，翻译工具也有人在用。昨天的数据已有数百人来访，不可能今天直接归零。我打开 Cloudflare Dashboard 看——Page views 193，Visits 130。

零和 130 不是误差，是两个完全不同的世界。究竟是「没人来」，还是「一百多人来过了」。哪一个是对的，或者都错？

## Cloudflare 的两个世界

如果你的网站放在 Cloudflare 上（全球超过 4,100 万个网站都是），你可能不知道 Cloudflare 其实有两套完全不同的分析系统。

**第一套：Zone Analytics（HTTP Traffic）。** 这是 CDN 层的数据。每一笔经过 Cloudflare 网络的 HTTP request 都会被记录。它能告诉你总请求数、带宽、国家分布、unique visitors（用 IP 去重）。精确，什么都算，包括 Google 的爬虫、ChatGPT 的 crawler、各种监控 bot。

**第二套：Web Analytics（RUM beacon）。** 这是浏览器层的数据。Cloudflare 在你的网页里注入一段 JS beacon，只有真人用浏览器加载页面时才会触发。Bot 不会跑 JavaScript，所以它天然过滤掉了非真人流量。

我在设计流量分析架构时，经过一次迭代，后来选了 Web Analytics 的 GraphQL API 作为主要数据源。理由听起来很合理，它只算真人，更精准。一开始使用 Zone Analytics 这条路，但含有 bot，数字偏高。才刚设定好网站，一天就上千 Visit。

逻辑没问题。但我犯了一个错误：我验证了「这支 API 能给我什么资料字段」，没有验证 Web Analytics（RUM beacon）「给我的数字是不是准的」。

## Adaptive sampling：让 130 变成 0

追查之后，我找到了根因。Cloudflare 的 Web Analytics GraphQL API 用的是一种叫做 Adaptive Bit Rate（ABR）的采样技术。

原理不复杂：Cloudflare 每秒处理超过七亿笔事件。如果每一笔查询都要扫过全部原始资料，系统要支付更多成本。所以它把资料存成多种分辨率——100%、10%、1%。查询的时候，系统根据数据量和复杂度，自动选一个分辨率返回结果。

对高流量网站，这完全没问题。你的日访客如果有十万，10% 采样也是一万笔，统计上准确度很高。

但对低流量网站呢？我的 paulkuo.tw 一天大约 130 个真人访客。API 采样完之后，返回的 visits 都是 100 的整数倍——0、100、200。130 被四舍五入成了 0。

我去翻了过去 30 天的 API 数据，发现有几天 visits = 0，而且所有数值都是 100 的倍数。这不是「今天坏了」，这是从上线第一天就是这样的逻辑。只是我今天第一次拿 API 数据跟 Dashboard 比对。

后来查了 Cloudflare 的文档，他们承认，现在还没办法让用户验证查询结果到底准不准。也就是说，你拿到一个数字，但没有人能告诉你这个数字的误差范围是多少。

## 还有一个更大的数字

当我理清了 Web Analytics 的采样问题，转头去看 Zone Analytics——Unique Visitors 的数字是 1,100。

Web Analytics Dashboard 说 130。Zone Analytics 说 1,100。API 说 0。

三个数字，同一天，同一个网站。

1,100 和 130 的差距——那接近一千个「多出来的访客」就是 bot。我的网站从一开始的设计就是 AI 友善，有 llms.txt、JSON-LD、MCP 支持，都是为 AI 系统设计的。所以 GPTBot、ClaudeBot、Bingbot 这些爬虫很勤劳地来抓内容。Zone Analytics 忠实记录了每一个 IP，不管它是人还是机器。

根据 Imperva 的 2025 年报告，自动化流量在 2024 年首次超过了人类活动，占全球网络流量的 51%。其中恶意 bot 占 37%。Cloudflare 的 2025 年度回顾也显示，AI bot 对 HTML 页面的请求占了 4.2%，Googlebot 一家就占了 4.5%。

所以，我的网站 88% 的 unique IP 是 bot、12% 是真人。听起来很夸张，但在统计上完全合理。今年一月起，很明显有感觉到 "Make something Agent Want"，已经是技术圈内的共识。因此，这就让我重新检视网站只看真人 Visit 的执念。

## 我走错的三条路

在找到目前的方案前，我犯了三个错。

**第一个错：规划时没做技术侦察。** 选 Web Analytics RUM 做主要数据源之前，我没有查 adaptive sampling 的行为限制，没有拿 API 返回值跟 Dashboard 交叉比对。如果当时花五分钟做这件事，整个问题会在规划阶段被发现。

**第二个错：发现问题后仓促修复。** 我直觉地判断「Zone-level API 的采样粒度应该比较好」，仍有「人类中心」的执念，写了修正版推到 GitHub。推完之后才在 Cloudflare 社区发现有人反馈 zone-level API 也有同样的 visits=0 问题。于是 revert。一来一回浪费了时间，还污染了 git history。

**第三个错：把「不含 bot」跟「精确」画等号。** Web Analytics 确实只算真人，但「不含 bot」不代表「数字正确」。采样精度和 bot 过滤是两件完全独立的事。我把它们混在一起看了。

我与 AI Agent 的工程原则是先侦察再动手，但 AI 会疏漏（奇怪，已经写在 skill 了呢），我也会。但人在发现问题的时候，特别容易急着去修，跳过该做的功课。

## 看见完整的观众轮廓

一开始我把 bot 流量当作噪音，想要排除它。但 paulkuo.tw 有 [AI-Ready 的架构设计](/articles/ai-ready-continuous-optimization)——llms.txt 让 AI 系统读懂网站结构、JSON-LD 提供结构化知识、MCP 协议让 AI agent 可以直接操作。所以，让 AI bot 来读内容，不是噪音，也是影响力的一部分。

所以正确的问题变成不是「怎么排除 bot」，而是「怎么看见完整的『阅读观众』」。

我需要两个独立的指标：

- **真人访客**：多少人类读者看了我的文章和工具——这是旧世界衡量社群影响力的核心指标
- **AI/Bot 访客**：多少 AI 系统在读取我的内容——这是 AI-Ready 策略的成效指标

最终的架构也不复杂。真人访客用自建的 visit beacon——页面加载时发一个 POST 到我的 Cloudflare Worker，Worker 用 IP + User-Agent 的匿名 hash 做每日去重。全站访客继续用 Zone Analytics 的精确 IP 去重。两个相减就是 AI/Bot 的量。
![paulkuo.tw 流量分析架构图：自建 beacon（真人）+ Zone Analytics（全量）→ 差值计算 AI/Bot](/images/articles/analytics-sampling-trap-architecture.svg)


三个数字都是自己算出来的，不靠 Cloudflare 的估算。做法跟 Google Analytics、Plausible、Umami 这类网站流量分析工具的原理一样。在网页里埋一段追踪码，自己数人头，每一个都算到。只是我不需要额外装第三方工具，直接跑在网站现有的服务器上就行。

## 你的数据可能会误导你

2025 年，自动化流量首次超过人类活动，占全球网络流量的 51%。AI crawler 的爬取量在同一年增长了超过 15 倍。你的网站不只被人类读，也被机器读。

如果你的网站用的是 Cloudflare Web Analytics 的 free plan，而且日访客在几百以下，仪表板上的 visits 数字，很可能跟我一样，是采样后的估算值，不是精确值。

这不代表 Cloudflare 不好用。它的 CDN、DNS、安全防护在业界顶尖。Web Analytics 的 Dashboard UI 数字是准的。但如果你要用 API 把数据拉到自己的仪表板，在低流量场景下，你需要自己验证一次。拿 API 返回的数字跟 Dashboard 比对，五分钟就能知道答案。

当数据落差过大时，网站经营者可能需要回到更直接的方法，自己建立精确的访问计数机制。这不是因为 Cloudflare 不值得信任，而是因为采样在流量规模还小的时候，先天就容易失准。随着受众规模扩大，采样的精度自然会逐步提升；但也正是在流量仍在增长的阶段，精确数字最不可或缺，因为那正是判断方向与调整策略的关键时刻。

网站经营不能只靠感觉，数据就像健康检查报告。若连最基本的触及人数都无法准确掌握，就如同对自己的体重、体脂与生理指标一无所知，所谓的改善与增长，也就很难建立在清楚而有根据的判断之上。

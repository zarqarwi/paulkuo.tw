---
title: "我做了一个追踪 Claude 用量的 Chrome Extension"
subtitle: "工作到一半被 rate limit 挡下来，所以我做了一只橘虎斑来盯着用量。"
description: "一个同时跑官方用量 API 和即时 token 拦截的 Chrome Extension 开发纪实，从市场调研到三语国际化的完整过程。"
abstract: |
  Claude 重度使用者最怕的就是聊到一半撞 rate limit。市场上有十几个用量追踪工具，但几乎全是 macOS 原生 app、只追踪单一资料来源、没有中文界面。这篇记录我用 Claude 协作开发一个 Chrome Extension 的过程——同时跑官方 API 和即时 token 拦截两条管道，让用量差异可见。从踩坑 isolated world、猜 API 格式、到 icon 迭代三版，完整的开发体感。
date: 2026-03-19
updated: 2026-03-19
pillar: ai
tags:
  - Chrome Extension
  - Claude
  - AI 协作开发
  - 开发纪实
cover: "/images/covers/claude-usage-nyan-chrome-extension.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine 专用栏位 ===
thesis: "同时跑官方用量 API 和即时 token 拦截两条管道，让 Claude 的用量差异可见。"
domain_bridge: "AI 工具开发 × Chrome Extension × 产品设计"
confidence: high
content_type: case-study
related_entities:
  - name: Anthropic
    type: Organization
  - name: Claude
    type: Concept
  - name: Chrome Extension MV3
    type: Framework
reading_context: |
  适合 Claude Pro/Max 使用者、对 AI 工具开发有兴趣的开发者、想了解 Chrome Extension 实作细节的人。非技术读者也能读，技术段落有标注可跳过。
---

工作到一半被 rate limit 挡下来，大概是 Claude 使用者最烦的时刻。

我原本的习惯，是到被挡了才去 Settings 页面看用量，然后才发现额外用量已经 84%、七天用量也过半了。就想，这个数字如果可以在画面上该多好？

所以我做了一个 Chrome Extension 来解决这件事。叫「Claude 用量喵喵」，工具栏上蹲着一只橘虎斑，点一下就知道用多少额度。

## 它做什么

装上之后有三个地方可以看到用量：

工具栏上的橘猫 icon 会显示一个小 badge，每四秒自动轮播切换——五小时 session 用了多少、七天用了多少、额外 credits 剩多少、即时花费多少钱。绿色代表安全，黄色要注意，橘色快到了，红色快爆了。不用点开任何东西，瞄一眼就知道。

点开 popup 会看到完整的用量卡片。上半部是 Anthropic 官方的数字：五小时 session 百分比、七天用量百分比、额外用量的已用跟上限，每一项都有重置倒数。下半部是即时 token 追踪：你刚才那则对话用了多少 input token、多少 output token、花了多少钱，用的是哪个模型，全部列出来。

claude.ai 页面的右下角还有一条半透明的浮动状态条，常驻显示用量摘要。点猫头可以收合。

![Claude 用量喵喵的 popup 界面，显示官方用量和即时 token 追踪](/images/articles/claude-usage-nyan-popup.png)
*popup 点开的完整画面：上半部是官方用量，下半部是即时 token 追踪。*

## 两条管道，看差异

这个工具跟其他追踪器最不同的地方是它同时跑两条资料管道。

第一条是官方的。Extension 每五分钟去呼叫一次 claude.ai 的 usage API，拿回来的数字跟你自己去 Settings 页面看的一模一样。这个数字是权威的，但有延迟——Anthropic 那边的更新不是即时的，有时候你明明已经用了很多，百分比还是不动。

第二条是即时推算的。Extension 会在 claude.ai 的页面里拦截每一次你跟 Claude 对话的 API 呼叫，在 request 送出去的时候估算 input token，在 response streaming 回来的时候累加 output token，再根据模型价格算费用。这个是即时的，但是估算值，跟官方数字会有误差。

两者并排放在一起，你可以自己观察官方的百分比跟你实际烧掉的 token 差多少。做这个工具的目的之一就是让这个差异可见。

## 动手之前先查了一圈

在开始写程式之前，我有先调查市场上现有的工具。

结果是这个小工具已经很多，光我找到的就超过十个。但几乎全部都是 macOS 的原生 app，要下载 .dmg 安装，Windows 跟 Linux 使用者没得选。而且大部分只做官方用量追踪或即时 token 计算其中一个，没有人把两个放在一起。所有界面都是英文，亚洲市场完全没有在地化的选项。

所以我的定位就很明确了：做成 Chrome Extension 让它跨平台、两条管道同时跑、中文优先。后来还加了英文和日文的界面，Chrome 会根据浏览器语言自动切换。

## 开发过程踩到的几个坑（对技术没兴趣可直接省略）

整个开发我是跟 Claude 对话完成的，过程不是一帆风顺。

第一个坑是 API 格式。Anthropic 的 usage API 没有公开文件，我只能猜格式。第一次接上去，popup 喷出一坨 raw JSON。但这坨 JSON 本身就是答案——我看到 five_hour.utilization、seven_day.resets_at 这些栏位名称，马上就知道怎么解析了。所以 "Claude" 故意在 popup 里留了一个 debug 模式：如果解析失败就直接显示原始 JSON，这样未来 API 格式变了也能快速修。

第二个坑比较有趣。Chrome Extension 的 content script 跑在一个叫 isolated world 的隔离环境里，我在里面 patch 了 window.fetch 想拦截 claude.ai 的 API 呼叫，结果什么都拦截不到。花了一点时间才搞清楚：isolated world 的 window 跟页面本身的 window 是不同的物件。解法是用 Chrome MV3 的 world: "MAIN" 设定，把拦截脚本直接注入到页面的 context 里，再透过 CustomEvent 把资料传回 isolated world 的桥接层。一个问题拆成两层解决。

第三个坑是 icon。迭代了三版——第一版太普通，第二版塞进圆形里看不出是猫，第三版我丢了一张橘虎斑的照片当参考，指定要「耳朵往外张开、有 M 字额纹」，才对味。这种事很难用规格描述，给一张参考图比说一百句有用。

## 限制先说清楚

Anthropic 的 usage API 没有公开文件，格式随时可能改。改了这个 Extension 就要跟着更新，没人维护就会坏。即时 token 是估算值，不是精确数字。英文大约四个字元一个 token，中文大约 1.5 个字元，这跟 Anthropic 实际的 tokenizer 有落差。

只追踪 claude.ai 网页版。如果你用的是 Claude Code CLI，那走的是不同的通道，这个 Extension 抓不到。

Extension 需要读取 claude.ai 的 session cookie 来存取 API。所有资料只存在你的浏览器本机，不传到任何外部服务器，完整开源。但装任何 Extension 之前自己判断风险是基本的。

---

安装方式很简单：clone GitHub repo、Chrome 开发者模式、载入资料夹，三步。支援繁中、英文、日文界面。

🔗 https://github.com/zarqarwi/claude-usage-nyan
---
title: "“小龙虾”过气？ “爱马仕”来了：开源智能体进入自进化"
type: source
pillar: startup
visibility: public
created: 2026-04-17
updated: 2026-04-17
source_count: 0
confidence: low
tags: [YouTube, 硅谷101]
links_to: []
linked_from: []
raw_source_type: youtube
raw_source_path: "https://www.youtube.com/watch?v=RP5XRfT71D4"
youtube_id: "RP5XRfT71D4"
youtube_channel: "硅谷101"
youtube_channel_id: "UCKV2yWPB3wn0RTZh3cTD8YA"
youtube_published: "2026-04-16T10:48:30Z"
duration: 179
duration_display: "3 min"
transcript_lang: "zh"
---
## 原文摘要

（待 Cowork session 補充摘要）

## 關鍵概念

- （待整理）

## 逐字稿

[0:00] 朋友们还在捣腾“小龙虾”吗 现在开发者圈 可是都已经用上“爱马仕”了 这里的“爱马仕” 是一个叫Hermes的开源AI Agent 上线仅一个多月 GitHub星标就已经突破8万 过去一周的 增长速度是OpenClaw的三倍 最近 很多开发者已经 开始放弃OpenClaw 转而向Hermes迁移 那么Hermes和OpenClaw 到底有什么区别呢 OpenClaw短板也很明显 比如缺乏持久记忆 无法自主学习新技能
[0:26] 安全机制薄弱 部署成本较高等问题 而Hermes可以说 就是针对这些问题进行了优化 Hermes的定位是 一个会随着你一起成长的智能体 它强调学习循环优先 目标是让Agent自己进化 越用越强 在Skills方面 Hermes的Skills是自动生成的 Agent每完成一次任务 都会形成新的Skills 方便下次复用 而OpenClaw的Skills 是人工写的 在记忆机制方面 Hermes采用的是多层记忆架构
[0:53] 可以跨会话、跨平台 持续记住你的偏好和上下文 而OpenClaw的每个任务 基本都是独立的 在安全机制方面 Hermes是“默认安全” 无需额外复杂配置 大幅降低了使用门槛 而OpenClaw的安全机制 相对薄弱 需要开发者自己加固 最后 在生态和部署层面 Hermes从设计之初 就主打轻量化 一台低配VPS（虚拟专用服务器） 就能实现7×24小时稳定运行 同时支持本地、Docker 云端等多种部署方式
[1:21] 而OpenClaw架构更重 更适合本地或团队部署 总结一下 就是OpenClaw 生态大、技能多 但不会自己学习 记忆弱、安全性一般 依赖社区 来不断补充能力 控制权还是在人 Hermes则是 能自己成长的智能体 自带持久记忆 做完任务 能自动提炼技能 更轻量、更安全 部署简单 成长权在于AI自己 不过 从目前开发者 使用的实际反馈来看 它依然还存在明显的局限 首先 上手门槛比较高 整个系统 完全依赖命令行的操作
[1:51] 没有图形界面 安装配置复杂 Windows环境兼容性也比较差 整体学习成本远高于OpenClaw 其次 是生态和 技能成熟度还有待提升 技能库数量 远不如OpenClaw丰富 虽然主打自动生成技能 但实际效果并不稳定 同时 第三方插件和工具链较少 社区生态还处在早期阶段 此外 自主学习模式 也是一把双刃剑 由于每次请求 包含大量固定的工具定义开销 加上学习循环 会触发额外调用 token消耗整体高于OpenClaw
[2:23] 一旦模型早期 形成错误或者片面的记忆 还会持续影响后续行为 Hermes这两天 还卷入了抄袭风波 它被中国AI团队EvoMap 指控架构级抄袭 EvoMap指出 Hermes的自进化核心系统 与其此前Evolver引擎存在高度相似 且所有公开材料 对EvoMap只字未提 被质疑后 Nous Research今没有做出 明确回应 引发了开源圈 对 “代码洗稿” 与学术诚信的争议 Hermes下一步究竟会如何发展
[2:53] 我们也会持续跟进 关注硅谷101 不要错过最前沿的 科技和商业趋势

## Ingest 備註

- Ingest 日期：2026-04-17
- 操作者：Code session（YouTube ingest pipeline）
- 影片發布日：2026-04-16
- 頻道：硅谷101
- 影片長度：3 分鐘
- 字幕語言：zh（yt-dlp-manual）
- 可用字幕：zh
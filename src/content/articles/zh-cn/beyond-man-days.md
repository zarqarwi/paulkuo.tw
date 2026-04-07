---
title: "人天已死：AI 协作时代，我们需要新的生产力度量衡"
subtitle: "AI Collaboration Portfolio × 五维框架：从衡量出席率到衡量价值创造"
description: "当 40 分钟的认知投入产出 15 人天的工作量，「人天」还能衡量什么？本文提出 AI Collaboration Portfolio 五维框架（Command / Delivery / Leverage / Quality / Influence），搭配三层防伪证据架构，填补个人 AI 生产力度量的空白。"
abstract: |
  所有人都在测 AI 素养，没有人在测个人的 AI 生产力。Anthropic Economic Index 证实 prompt 品质与产出相关性高达 0.92，大学程度任务被 AI 加速 12 倍——但这些洞见停在宏观层级。本文提出 AI Collaboration Portfolio 五维框架，第一次尝试在个人层级、基于绩效、可验证地衡量 AI 协作能力，并用作者自己的数据做完整案例验证。
date: 2026-04-08
updated: 2026-04-08
pillar: ai
tags:
  - AI 生产力
  - 人月神话
  - AI Collaboration Portfolio
  - Anthropic Economic Index
  - 五维框架
  - 超级个体
  - AI 协作
cover: "/images/covers/beyond-man-days.jpg"
featured: true
draft: false
readingTime: 12
# === AI / Machine 专用栏位 ===
thesis: "人天衡量的是时间流逝不是价值创造——AI Collaboration Portfolio 五维框架是第一个在个人层级、基于绩效、可验证地度量 AI 协作生产力的系统。"
domain_bridge: "AI 生产力度量 × 软件工程方法论 × 人力资源评估 × 开源验证"
confidence: high
content_type: essay
related_entities:
  - name: Fred Brooks
    type: Person
  - name: Anthropic Economic Index
    type: Framework
  - name: AI Fluency Framework
    type: Framework
  - name: AI Collaboration Portfolio
    type: Framework
  - name: Paul Kuo
    type: Person
reading_context: |
  适合关心 AI 时代人才评估方式的技术主管、HR、独立开发者，以及想用可验证的方式展示自己 AI 协作能力的知识工作者。
---

> **TL;DR** — 人天衡量的是出席率，不是价值创造。本文提出 AI Collaboration Portfolio 五维框架（Command / Delivery / Leverage / Quality / Influence），搭配自动抓取、结构化自评、AI 校验三层证据架构，填补个人 AI 生产力度量的空白。附作者完整案例验证。→ [试试看工具](https://paulkuo.tw/tools/ai-collab-portfolio/)

## 40 分钟做完 15 人天的工作：人天还能衡量什么？

*当一个人 40 分钟的认知投入，产出了传统 15 人天的工作量——我们到底在衡量什么？*

---

三个 AI 同时跑。一个负责策略分析，一个写代码并部署，一个处理文件和运营任务。操作者花了大约 40 分钟——下指令、看产出、做判断、修方向。结束的时候，桌上摆着一份市场分析报告、一个重构完的数据库、一篇文献综述。

换成传统做法？五个人，三到四个工作天。15 到 20 人天。

但那 40 分钟不是在发呆。那是高密度的认知劳动：把模糊的目标拆解成 AI 能执行的指令、决定哪个 AI 做哪件事、即时拦截错误、把分散的产出整合成一个完整的东西。

所以「人天」在这个场景里到底衡量了什么？它衡量的是时间的流逝，不是价值的创造。当度量衡跟不上现实，我们量到的不是生产力，是出席率。

[Anthropic 在 2026 年 1 月发布的 Economic Index](https://www.anthropic.com/research) 提供了实证基础。他们分析了超过一百万笔 Claude 对话，发现 prompt 品质跟产出品质的相关性高达 0.92。需要大学程度理解力的任务，AI 加速倍率是 12 倍；高中程度的只有 9 倍。

AI 不是均匀地让每个人变强。它是指数级地放大能力差距。

两个人的履历上都写着「熟悉 AI 工具」。一个用 AI 在周末 ship 了一整个全端应用，另一个花了八小时用 ChatGPT 改一封 email。目前，我们没有任何标准化的方式能区分这两个人。

---

## 从人月神话到 AI 协作：为什么注意力时长也不够？

1975 年，电脑科学家 [Fred Brooks](https://en.wikipedia.org/wiki/Fred_Brooks) 出版了[《人月神话》](https://en.wikipedia.org/wiki/The_Mythical_Man-Month)。他的核心洞见：人月是假的。人数和时间不能互换，因为沟通成本会吃掉效率增益。往进度落后的项目加人，只会让它更慢。

Brooks 讲的是人类团队。但 AI 时代从反方向验证了他的论点：AI 把沟通成本归零了。不需要 onboarding，不需要对齐会议，24 小时不间断工作，零 context switch 成本。当协调成本趋近零，并行执行第一次真正变得有效率——但建立在「协调很贵」这个假设上的度量衡，就同时失去了意义。

有人试着用「注意力时长」来取代人天。这个概念把人类在 AI 协作中的认知投入分成四类：启动注意力（把模糊需求转成精准指令）、监督注意力（检查 AI 产出并纠偏）、整合注意力（跨多个 AI 产出做协调）、孵化注意力（无意识的后台思考产生灵感）。

分类很有用，但注意力时长仍然是投入端的指标。它告诉我们你花了多少认知资源，不告诉我们这些资源产出了什么、品质多高、相对传统做法创造了多少价值。

现在的状况是这样：投入端有注意力时长，宏观端有 Anthropic Economic Index（估算 AI 对美国劳动生产力的年增幅约 1.0 个百分点），但个人层级的产出端——做招聘决策的那个层级、自由工作者被评估的那个层级——完全空白。

度量衡的真空不在边缘，在正中央。

---

## 全球 AI 能力框架盘点：为什么没人测个人产出？

这个真空不是因为没人在乎。过去两年，各国政府、国际组织、学术界产出了大量的 AI 能力框架。但它们全部在解决同一个问题：你会不会用 AI？没有一个在问：你用 AI 做出了什么？

Anthropic 跟 Rick Dakan、Joseph Feller 合作开发的 [AI Fluency Framework](https://www.anthropic.com/research)，定义了四个核心能力（4D）：Delegation（委派）、Description（描述）、Discernment（辨识）、Diligence（尽责）。这大概是目前最成熟的能力模型。但它描述的是「好的 AI 协作长什么样子」，不量化「它产出了什么」。

Anthropic 自己的 Economic Index 从另一个角度切入，分析数百万笔真实对话来估算 AI 对劳动生产力的影响。数据极有价值——但它操作在统计总量的层级，不是个人 Portfolio 的层级。

[美国劳工部 2026 年 2 月发布了 AI Literacy Framework](https://www.dol.gov/)。[英国 Turing Institute](https://www.turing.ac.uk/) 在 2025 年底发布了 AI Skills for Business Framework 第三版。[UNESCO](https://www.unesco.org/) 出了学生和教师的 AI 能力框架。学术界有 Collaborative AI Literacy 和 Collaborative AI Metacognition 的量表。

它们的共同特征：测素养（你懂不懂 AI、能不能适当使用、知不知道限制），不测绩效（你用 AI 实际产出了什么、品质多高、效率比传统高多少）。

把现有的框架放到一个 2×2 矩阵上——横轴是「素养 vs 绩效」，纵轴是「个人 vs 宏观」——你会看到左边挤满了人（UNESCO、DOL、Turing、各种学术量表），右上角有 Anthropic Economic Index。右下角——个人层级、基于绩效、可验证——是空的。

所有人都在测 AI 素养。没有人在测个人的 AI 生产力。这篇文章提出一个框架来填这个缺口。跟我之前写的[AI 时代的能力落差](/articles/ai-capability-gap-2026)那篇是同一条线——那篇讲的是落差的存在，这篇讲的是怎么量化它。

---

## AI Collaboration Portfolio 五维模型：衡量什么、怎么量

AI Collaboration Portfolio 是一个五维模型，衡量个人透过 AI 协作实际产出了什么。设计原则：每个维度必须有理论依据、可量化指标、以及来自第三方的可验证数据来源。

### Command 指挥力（25%）

你能不能让 AI 做对的事？

对应 4D Framework 的 Delegation 和 Description，以及注意力理论中的「启动注意力」。Anthropic 发现 prompt 品质跟产出品质相关性 0.92——这可能是 AI 协作效能最关键的单一变量。

量化指标：可复用的 skill / workflow / system prompt 数量、自动化管线数（CI/CD, cron, GitHub Actions）、AI 工具整合广度、多步骤任务拆解的复杂度。

### Delivery 交付力（25%）

AI 协作之后，你实际 ship 了什么？

不是试过什么，是上线了什么。对应 Economic Index 的任务完成率。

量化指标：commit 频率与量、部署中的服务/工具数、发布的内容数、从零到上线的完整项目数、代码品质指标（PR 合并率、issue 解决速度）。

### Leverage 杠杆力（20%）

同样的认知投入，放大了多少倍？

这就是「40 分钟 vs. 15 人天」的核心。直接回答企业最在乎的问题：你加入之后，团队的产能乘数是多少？

量化指标：实际认知投入 vs 传统估算的比值、并行项目数、AI 工具调度数量、自动化覆盖率。

### Quality 品质力（15%）

你的产出经得起检验吗？

AI 能大量生成内容的时代，品质守门人空前重要。对应 4D Framework 的 Discernment，以及 Economic Index 的可靠性调整——他们发现把任务成功率计入后，生产力提升的估算会缩减约三分之一。

量化指标：使用者/流量数、系统 uptime、品质控制机制数（自动测试、查核 SOP、review 流程）、外部引用/分享次数。

### Influence 扩散力（15%）

你的方法有没有被别人学习或采用？

从个人贡献者到组织赋能者的转变。最高杠杆的价值创造形式。

量化指标：开源项目互动数（stars, forks, contributors）、skill / 模板采用次数、教学内容触及人数、方法论被外部引用次数。

### 维度之间的关系

诚实地说：这五个维度不是完全独立的。高品质（Quality）常常是扩散力（Influence）的前因。一条强大的自动化管线（Leverage）本身就是一种交付（Delivery）。维度之间存在因果关系，精确归因有时会模糊。

这是设计特征，不是缺陷。真实的价值创造本来就是多维交织的。财务报表里的营收、毛利、净利也有因果关系，但我们不会因此只看一个数字，因为每个数字揭示了不同面向。五个维度是五个观察镜头，不是五个正交轴。目标是更丰富的观察，不是完美的分解。

---

## 防伪机制：自动抓取、结构化自评、AI 校验

任何能力框架最常被质疑的就是：会不会被刷分？

这个担忧完全正确。Goodhart's Law——当指标变成目标，它就不再是好指标——适用于所有量化系统。问题不是能不能被 gaming，而是 gaming 的成本够不够高。

AI Collaboration Portfolio 用三层证据架构来回应：

**第一层：自动抓取。** 使用者授权后，系统从第三方平台直接拉取数据——GitHub commit 纪录、repo 结构、CI/CD workflow 文件、网站分析、套件下载量、社群指标。这些数据由独立平台记录，使用者无法串改。你的 GitHub 上有几个 commit 就是几个。这层是 Portfolio 的「硬证据」底线。

**第二层：结构化自评。** 无法自动抓取的部分（并行项目数、传统人天估算、AI 工具整合方式），用结构化表单引导填写。每个自评栏位旁边都有一个「证据连结」栏位。有附连结的标记为 *Evidenced*，没附的标记为 *Self-reported*。任何看你 Portfolio 的人都能看到这个标记，自行判断可信度。

**第三层：AI 校验。** 使用者授权 GitHub 后，AI 分析 repo 结构和代码模式，独立建议各维度的分数。AI 建议分数跟使用者自评并列显示。如果你自评 90 分但 AI 建议 50 分，这个差距会被视觉化标记。

三层一起运作：自动数据不能造假、自评有透明的证据标记、AI 提供独立参照。这不是消灭 gaming，是把 gaming 的成本拉高到不划算。

更关键的是，框架的终极防线不在内部验证，在外部现实。Quality 和 Influence 维度要求的证据来自使用者控制范围之外——使用者采用率、社群互动、客户回馈、市场结果。团队内部可以串通刷 Jira 票数，但没办法强迫市场买单，也没办法伪造开源社群的真实采用。

这个框架不是自动判决机。它是鉴识会计系统——一份可被审计的账本，把评估从「比谁的故事说得好」转向「谁的证据链经得起追问」。

---

## 六个最强质疑与回应：从伪造证据到幸存者偏差

我们把这个框架丢进多模型对抗式辩论引擎，跑了三轮压力测试。以下是最有力的六个攻击和我们的回应。

**Q1：AI 可以帮人伪造证据链。**

AI 能伪造地图，但伪造不了走过那条路的记忆。在框架引导的深度面试里，面试官追问的不是「你做了什么」，而是「你怎么做决策的」——为什么放弃那个方法？Token 消耗的权衡怎么考虑？遇到模型幻觉时怎么处理？真正做过的人可以回答三层追问。照脚本演的人，第三层就崩了。

**Q2：Leverage 的基准（人天）是你自己说已经失效的东西，拿它当分母是循环论证。**

Leverage 不应该被解读为一个对照固定基线的静态倍率。它的核心价值是时间维度上的变化率。一个工程师 2024 年用 GPT-4 达到 10 倍杠杆，2026 年用 Claude Opus 4.6 还是 10 倍——这本身就暴露了适应力的停滞。框架测的是成长斜率，不是绝对值。AI 工具在进化，基线在移动（红皇后效应），真正有预测力的是你适应每一次典范转移的速度。

**Q3：为什么不加「适应力」和「伦理力」维度？**

适应力不是独立维度，它是五个维度对时间的微分。一个人的 Command、Delivery、Leverage 分数在 AI 范式转移之间持续提升，他就是高适应力的。同样的逻辑适用于「反思回路」——用 AI 分析和优化自身工作模式的元技能。它表现为五个维度随时间的上升轨迹，不是第六栏的静态分数。伦理是底线约束，不是绩效指标——违反伦理应该直接取消资格，而不是扣 15 分。

**Q4：维度之间有因果关系，无法精确归因。**

承认。见上方「维度之间的关系」。框架追求的是更丰富的观察，不是数学上的正交性。归因模糊的地方，三层证据架构提供原始数据让评估者自行判断——这正是框架的设计意图：它不取代人类判断，它给人类判断更好的材料。

**Q5：框架聚焦个人，但 AI 时代最高价值的贡献往往是共享认知资产。**

这是 v1 的真实局限。一个人建了一套 Prompt 指令库让整个部门都能用、设计了一个让所有人效率翻倍的 workflow——这种网络效应确实无法被个人维度完整捕捉。Influence 维度部分触及，但不够。团队版框架——衡量一个人如何放大系统的产能而不只是自己的——是 v2 最重要的演化方向。

**Q6：作者拿自己当案例是幸存者偏差。**

方法论上完全成立。一个框架的设计者当然会挑对自己有利的证据。回应不是否认偏差，而是让偏差变得结构上不重要：下面案例中的每一项宣称，都可以透过公开 URL、GitHub repo、或第三方分析 API 独立验证。这个案例的价值不是统计上的——它是工程上的。它提供一个完整、可检视、可复制的蓝图，任何人都能用自己的数据跑一遍。把它想成开源释出，不是临床试验。初始版本难免反映创作者的脉络，但它的价值取决于社群是否觉得值得 fork、攻击、改进。

---

## 案例验证：Paul Kuo

为了验证框架的实际可操作性，我拿自己的数据跑了一遍。我是 Paul Kuo，在台湾独立运营的开发者和 BD 顾问，用 AI 协作作为主要工作方式。以下所有数据皆可公开验证。

**Command：L4（Architect）。** 维护 7 套以上的自订 AI workflow 规格（包括 v2.3 的写作规范、多 session 交接协定、社群发布管线），从 12 次生产事故中提炼出可复用的决策规则，同时调度四种以上 AI 模型并设有路由逻辑（例：中文语音用 Qwen、英文用 Groq、其他语言用 Deepgram）。CI/CD 管线包含每日自动评估、排程数据更新、单次 commit 触发四语言内容生成。全部记录在 [github.com/zarqarwi](https://github.com/zarqarwi)。

**Delivery：L4（Architect）。** 产出包括：[paulkuo.tw](https://paulkuo.tw) 上 80 多篇四语言文章、三个已部署的网页工具（AI-Ready Dashboard、Builder's Scorecard、社群动态墙）、一个 55 语言的 Chrome 扩充功能（Claude 用量喵喵）、一套三路语音辨识的即时会议记录系统（Agora Translator）、一个完成定价策略并上架 momo 的电商运营（每日餐桌）。每一项都可以在线上直接看到。

**Leverage：L3-4。** 以上所有东西由一个人建置和维护。Timing App 的时间追踪数据整合在网站的即时仪表板上，提供实际认知投入时数。同时维护 8 个以上活跃项目——横跨软件开发、内容出版、电商、顾问——传统上需要五到八人团队。

**Quality：L3。** GitHub Actions 自动化 CI/CD 部署搭配 pre-commit hooks、两阶段事实查核协定（L1 素材查证 + L2 成稿查证）应用于全部 82 篇文章、AI-Ready 评估系统对自身基础设施的评分为 90/100。Cloudflare 网站分析透过密码保护的仪表板提供独立流量数据。

**Influence：L2。** 这是我最弱的维度——我知道。开源项目存在（claude-usage-nyan、multi-agent-debate-engine）但社群互动有限。社群媒体在 X、Threads、Bluesky 上活跃但尚未规模化。LinkedIn 和 Medium 完全没用。重要的演讲和外部方法论引用几乎为零。

框架的诊断价值在这里就看得到：它不只是验证强项，它用令人不舒服的精确度暴露了弱项在哪里。我的 Command 和 Delivery 很强，Influence 直接告诉我下一步该做什么。

但更关键的观察不是分数本身，是证据的性质。上面每一项宣称都可以透过公开 URL、GitHub repo、或网站分析 API 独立验证。没有任何一项只靠自我宣称。这就是这个框架跟所有问卷式评估的根本差异：证据存在于系统之外。

---

## 不做 AI 生产力度量的代价：能力落差正在隐形扩大

为什么这件事重要？因为不做度量的代价，比做错度量更大。

Anthropic Economic Index 记录了一个 deskilling 效应：AI 优先接管工作中的高技能成分，留下低技能的部分。如果我们无法辨识谁真正擅长 AI 协作，高能力者会被系统性低估，而面试表现好但实际产出差的人会被高估。

生产力差距是真实的、而且在扩大。大学程度任务被 AI 加速 12 倍，高中程度只有 9 倍。这不是随时间慢慢累积的小差距——这是结构性的分歧。而且目前对劳动市场完全不可见，因为没有度量系统能把它显现出来。

三轮辩论压测让几个诚实的局限变得更清楚了：

**个人 vs 系统价值。** 框架衡量个人产出，但 AI 时代最有价值的贡献往往是共享认知资产——整个部门都在用的 Prompt 库、让所有人加速的自动化 workflow。衡量一个人如何放大系统的产能——而不只是自己的——是 v2 最重要的延伸方向。

**反思回路。** AI 协作中最高阶的技能，可能是用 AI 分析和优化自己的工作模式——一种驱动所有维度成长的元认知能力。目前的框架透过分数的时间轨迹间接捕捉，但没有明确衡量。未来版本可以把自我迭代速度作为一级信号。

**跨组织迁移性。** AI 协作发生在极其不同的文化、法律、经济脉络中。集体主义文化可能系统性地压低自评分数。GDPR 限制自动数据抓取。小型组织负担不起 AI 校验的基础设施。一个只在资源充沛的英语系科技公司才能用的框架，不是真正通用的框架。

**公平性与可及性。** 能取得最新 AI 工具的人在这个框架里天然占优势。如果度量系统本身放大了数位落差而不是揭示能力，它就失败了。

这些不是要掩盖的缺陷。它们是下一轮迭代的研究方向。

但一个不完美框架的替代方案，不是一个完美的框架——是根本没有框架。是继续用履历上的关键字和面试时的印象来评估 AI 协作能力，在一个「熟悉 AI 工具」和「能用 AI 一个人做整个团队的事」之间差了一个数量级的世界里。

能被量化的，才能被重视。不能的，就会隐形。

AI Collaboration Portfolio 是第一次尝试，让隐形的变成可见的。它是一张不完美的地图。但替代方案不是一张更好的地图——是蒙着眼睛在新大陆上狂奔。

→ *试试看：[paulkuo.tw/tools/ai-collab-portfolio/](https://paulkuo.tw/tools/ai-collab-portfolio/)*

---

### 参考文献

1. Brooks, F. P. (1975). *[The Mythical Man-Month: Essays on Software Engineering](https://en.wikipedia.org/wiki/The_Mythical_Man-Month)*. Addison-Wesley.
2. Dakan, R. & Feller, J. (2025). "Framework for AI Fluency." Ringling College of Art and Design / University College Cork. Version 1.5.
3. Anthropic. (2026, January). "[Anthropic Economic Index report: Economic primitives](https://www.anthropic.com/research)." anthropic.com/research.
4. Anthropic. (2026, March). "Anthropic Economic Index report: Learning curves." anthropic.com/research.
5. Anthropic. (2026, March). "Estimating AI productivity gains from Claude conversations." anthropic.com/research.
6. Anthropic. (2026, March). "Labor market impacts of AI: A new measure and early evidence." anthropic.com/research.
7. [US Department of Labor](https://www.dol.gov/). (2026, February). "AI Literacy Framework."
8. [Alan Turing Institute](https://www.turing.ac.uk/) / UK DSIT. (2025). "AI Skills for Business Competency Framework." Version 3.
9. [UNESCO](https://www.unesco.org/). (2026). "AI competency framework for students." unesdoc.unesco.org.
10. Schleiger, E. et al. (2025). "Generative AI in Human-AI Collaboration: Validation of the Collaborative AI Literacy and Collaborative AI Metacognition Scales." *Interacting with Computers*. Taylor & Francis.
11. Chee, K.N. et al. (2025). "A Competency Framework for AI Literacy." *British Journal of Educational Technology*. Wiley.

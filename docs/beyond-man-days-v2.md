# Beyond Man-Days: A New Framework for Measuring AI Collaboration

*Why traditional productivity metrics fail in the age of human-AI collaboration — and a five-dimension, evidence-based alternative.*

---

## The Paradox

Consider a scenario that is becoming unremarkable: a solo practitioner sits down with three AI systems running in parallel. One handles strategic analysis. Another writes and deploys code. A third manages documentation and operational tasks. The practitioner spends roughly 40 minutes issuing high-level directives, reviewing outputs, and making judgment calls. By the end of the session, the combined output — a market analysis report, a restructured database, a literature review — would have taken a conventional team of five people three to four working days to produce. That is 15 to 20 person-days of output from 40 minutes of cognitive input.

This is not a thought experiment. It is a Tuesday.

The practitioner did not work 15 person-days. The AI systems did not either — they executed tasks, but every task was initiated, scoped, evaluated, and approved by a human mind. The 40 minutes of human involvement were not passive. They were densely packed with what we might call *command decisions*: decomposing ambiguous goals into executable instructions, choosing which AI to deploy on which subtask, catching errors in real time, and synthesizing outputs into a coherent whole.

So what, exactly, does "person-day" measure in this context? It measures the passage of time. It does not measure the value created, the cognitive intensity required, or the quality of the output. When the unit of measurement fails to capture what matters, we are not measuring productivity. We are measuring attendance.

Anthropic's Economic Index, published in January 2026, provides empirical grounding for this intuition. Analyzing over one million conversations on Claude.ai and its enterprise API, the research team found a 0.92 correlation between the sophistication of user prompts and the quality of AI outputs. Tasks requiring a college-level understanding were accelerated by a factor of 12, while those requiring only a high school education saw a 9x speedup. AI does not uniformly boost everyone's productivity. It *exponentially amplifies the gap* between those who can direct it effectively and those who cannot.

Two people can both claim "proficient in AI tools" on their résumés. One ships a full-stack application in a weekend. The other spends eight hours editing a single email. Today, we have no standardized way to tell them apart.

---

## The Death of Man-Days

The inadequacy of time-based productivity metrics is not a new observation. In 1975, computer scientist Fred Brooks published *The Mythical Man-Month*, arguing that the person-month — the assumption that labor and time are freely interchangeable — was a dangerous fiction. His core insight: adding people to a late project makes it later, because the communication overhead required to coordinate additional contributors consumes more time than their labor saves.

Brooks was writing about human teams. But the AI era has validated his thesis from the opposite direction. AI eliminates communication costs entirely. It requires zero onboarding. It needs no alignment meetings. It works 24 hours a day without context-switching penalties. When the coordination overhead drops to near zero, parallel execution becomes genuinely efficient for the first time — but the unit of measurement built on the assumption that coordination is costly becomes meaningless.

Some researchers have attempted to address this by shifting from time-based to attention-based measurement. The concept of "attention duration" distinguishes four types of cognitive engagement in human-AI collaboration: *initiation attention* (translating vague requirements into precise AI instructions), *supervisory attention* (monitoring and correcting AI outputs), *integration attention* (coordinating across multiple AI-generated outputs to ensure coherence), and *incubation attention* (the unconscious background processing that generates breakthrough insights). This taxonomy is useful. It correctly identifies that the human contribution in AI collaboration is cognitive, not temporal.

But attention duration is still an *input* metric. It tells us how much cognitive resource was invested. It does not tell us what that investment produced, how good the output was, or how much value it created relative to the alternative. In a world where the same 40 minutes of attention can produce wildly different outcomes depending on who is directing the AI, we need metrics on the *output* side — not just how much attention was paid, but what that attention yielded.

The current state of measurement looks like this: on the input side, we have attention duration. On the macro side, Anthropic's Economic Index estimates that AI could contribute approximately 1.0 percentage points to annual US labor productivity growth after adjusting for task reliability. But at the *individual level* — the level at which hiring decisions are made, freelancers are evaluated, and talent is priced — we have nothing. The measurement gap is not at the edges. It is at the center.

---

## The Gap

This gap exists despite a proliferation of AI competency frameworks worldwide. Over the past two years, governments, international organizations, and academic researchers have produced a remarkable volume of work on AI skills and literacy. None of it addresses the specific problem of individual-level, output-based, verifiable measurement.

The Anthropic AI Fluency Framework, developed by Rick Dakan and Joseph Feller in collaboration with Anthropic, defines four core competencies for human-AI interaction: Delegation (deciding what to assign to AI), Description (communicating goals effectively), Discernment (critically evaluating AI outputs), and Diligence (taking responsibility for AI-assisted work). This is arguably the most sophisticated capability model available. But it describes *what good AI collaboration looks like* — it does not quantify *what it produces*.

Anthropic's own Economic Index takes a different approach, analyzing millions of real-world conversations to estimate AI's impact on labor productivity at the task and occupation level. It provides invaluable macro-level data — which tasks are most accelerated, which occupations are most exposed, how automation and augmentation are distributed across the economy. But it operates at the level of statistical aggregates, not individual portfolios.

In February 2026, the US Department of Labor released its AI Literacy Framework, defining five content areas that workers need to be considered AI literate. The UK's Alan Turing Institute is finalizing Version 3 of its AI Skills for Business Competency Framework. UNESCO has published AI competency frameworks for both students and teachers. In academia, researchers have developed and validated scales for Collaborative AI Literacy and Collaborative AI Metacognition.

All of these frameworks share a common characteristic: they measure *literacy* — whether someone understands AI, can use it appropriately, and is aware of its limitations. None of them measure *performance* — what someone actually produces when collaborating with AI, at what quality level, and at what efficiency relative to conventional approaches.

If we map the existing landscape on two axes — Literacy versus Performance on the horizontal, Individual versus Macro on the vertical — a clear pattern emerges. The upper-left quadrant (individual literacy) is crowded with frameworks from UNESCO, the DOL, the Turing Institute, and numerous academic scales. The lower-right quadrant (macro performance) is occupied by Anthropic's Economic Index. The upper-right quadrant — individual-level, performance-based, verifiable measurement — is empty.

Everyone is measuring AI literacy. No one is measuring AI productivity at the individual level. This paper proposes a framework to fill that gap.

---

## The Framework

The AI Collaboration Portfolio is a five-dimension model for measuring what individuals actually produce through AI collaboration. It is designed around three principles: each dimension must be *definable* with reference to established theory, *quantifiable* through observable indicators, and *verifiable* through data sources external to the individual being assessed.

The five dimensions are: **Command**, **Delivery**, **Leverage**, **Quality**, and **Influence**.

### Command (25%)

Command measures the ability to direct AI systems toward correct and valuable outcomes. It corresponds to the Delegation and Description competencies in the 4D Framework, and to the concept of "initiation attention" in attention-based models. Anthropic's finding that prompt sophistication correlates 0.92 with output quality suggests this may be the single most important determinant of AI collaboration effectiveness.

Quantifiable indicators include: the number of reusable skills, workflows, and system prompts an individual has built; the number of automated pipelines (CI/CD workflows, scheduled tasks) they maintain; the breadth of AI tools they orchestrate in an integrated manner; and the complexity of multi-step task decompositions they routinely execute.

Data sources: GitHub repository structure (workflow files, configuration complexity), version-controlled prompt libraries, documented standard operating procedures.

### Delivery (25%)

Delivery measures the tangible outputs of AI collaboration — not what was attempted, but what was shipped. It corresponds to the task completion rates measured in the Economic Index, and reflects the "supervisory attention" that transforms raw AI output into production-ready artifacts.

Quantifiable indicators include: code commit frequency and volume, number of deployed and operational services, published content (articles, documentation, tools), completed end-to-end projects (from conception to public availability), and code quality metrics (pull request merge rates, issue resolution velocity).

Data sources: GitHub API (commits, repositories, languages, deployment status), website RSS feeds, publicly accessible URLs of live services, package registry download counts.

### Leverage (20%)

Leverage measures the multiplication factor — how much output a given unit of cognitive input produces relative to conventional approaches. It captures the "40 minutes versus 15 person-days" phenomenon and directly addresses what enterprises care about most: the productivity multiplier an individual brings.

Quantifiable indicators include: the ratio of actual cognitive input to traditional effort estimates, the number of projects maintained in parallel, the diversity of AI tools orchestrated simultaneously, and the degree of workflow automation (automated steps as a proportion of total workflow steps).

Data sources: time-tracking tools (actual input measurement), structured self-assessment with required estimation methodology disclosure (industry benchmark, historical comparison, or third-party quote), project URLs for independent verification of scope.

### Quality (15%)

Quality measures whether outputs withstand scrutiny. In an era where AI can generate enormous volumes of content, the ability to maintain high standards is a critical differentiator. This dimension corresponds to the Discernment competency in the 4D Framework and to the reliability adjustments in the Economic Index, which found that accounting for task success rates reduced estimated productivity gains by roughly one-third.

Quantifiable indicators include: user adoption and traffic metrics, system uptime and reliability, quality control mechanisms in place (automated testing, fact-checking protocols, review processes), external citations or references to the work, and client or user feedback.

Data sources: website analytics APIs, monitoring tools, GitHub CI/CD pipeline configurations, search engine backlink data.

### Influence (15%)

Influence measures whether an individual's AI collaboration methods are adopted, referenced, or built upon by others. It reflects the transition from individual contributor to force multiplier — and represents the highest-leverage form of value creation.

Quantifiable indicators include: open-source project engagement (stars, forks, contributors), skill or template adoption rates, educational content reach (article views, presentation audiences), methodology citations by external parties, and community engagement metrics.

Data sources: GitHub API (stars, forks, contributor counts), social platform public metrics, search engine citation data.

### A Note on Dimensional Interdependence

An honest assessment of this model must acknowledge that the five dimensions are not perfectly independent. High Quality is often a precursor to Influence. A powerful automated workflow (Leverage) is itself a form of Delivery. These causal relationships between dimensions are real, and they mean that precise attribution — "this achievement earns 10 points in Delivery and 5 in Leverage" — will sometimes be ambiguous.

This is a feature, not a defect. Real value creation is inherently multi-dimensional and intertwined. A financial statement contains revenue, gross margin, and net income — all causally related — yet we do not collapse them into a single number, because each reveals something different about the health of a business. Similarly, the five dimensions are not meant to be orthogonal axes in a mathematical sense. They are complementary lenses, each illuminating a different facet of AI collaboration capability. The goal is not perfect decomposition, but richer observation.

### The Evidence Architecture

The most common criticism of any competency framework is that it will be gamed. This concern is valid. Goodhart's Law — the observation that any measure which becomes a target ceases to be a good measure — applies to every quantitative system ever devised. The question is not whether gaming is possible, but whether the framework makes gaming *expensive enough* to be impractical for most purposes.

The AI Collaboration Portfolio addresses this through a three-layer evidence architecture:

**Layer 1: Automated Extraction.** Upon user authorization, the system pulls data directly from third-party platforms — GitHub commit histories, repository structures, CI/CD workflow files, website analytics, package download counts, social media metrics. These data points are recorded by independent platforms. The user cannot alter their GitHub commit count or fabricate Cloudflare traffic logs. This layer forms the "hard evidence" floor of any portfolio.

**Layer 2: Structured Self-Assessment.** For dimensions that cannot be automatically captured — such as the number of parallel projects, the traditional effort estimate for a given deliverable, or the specific AI tools integrated into a workflow — the framework uses guided forms. Critically, every self-reported field is paired with an optional "evidence URL" field. Items with linked evidence are tagged as *Evidenced*; items without are tagged as *Self-reported*. The distinction is visible to anyone viewing the portfolio, allowing observers to calibrate their trust accordingly.

**Layer 3: AI-Assisted Analysis.** After a user authorizes GitHub access, an AI model analyzes their repository structure, workflow complexity, and code patterns to generate independent score suggestions for each dimension. These AI-generated scores are displayed alongside the user's self-assessment. Significant discrepancies — a user claiming 90 points while the AI analysis suggests 50 — are visually flagged. This creates a built-in sanity check that raises the cost of exaggeration.

The three layers work together: automated data cannot be faked, self-assessments are transparently tagged by evidence status, and AI analysis provides an independent reference point. This does not eliminate gaming. It raises the cost of gaming to a level where the effort required to fabricate a convincing portfolio across all three layers exceeds the effort of simply building real capabilities.

Critically, the framework's ultimate line of defense is not internal verification but *external reality*. The Quality and Influence dimensions require evidence from outside the individual's control — user adoption metrics, community engagement, client feedback, market outcomes. A team can internally inflate Jira tickets and Slack activity, but they cannot force the market to buy their product or compel an open-source community to adopt their tools. The strongest evidence in any portfolio is the evidence that exists in the world, not in the system.

This framework is not an automated truth machine. It is a forensic accounting system — an auditable ledger designed to shift evaluation from "who tells the better story" to "whose evidence chain withstands deeper scrutiny."

### Addressing the Strongest Objections

Any framework that claims to measure human capability must be stress-tested against its most forceful critiques. We subjected this model to multi-model adversarial analysis across three rounds and identified six primary objections worth addressing directly.

**Objection 1: AI can help users fabricate evidence.**

This is the sharpest form of the gaming concern. A candidate could use AI to generate plausible-looking prompt chains, fake decision rationales, or even fabricated repository histories. The response: AI can forge the map, but it cannot forge the memory of having walked the path. In a structured interview guided by this framework, an evaluator can probe not just *what* was produced but *how decisions were made* — why a particular approach was abandoned, what tradeoffs were considered when selecting a model, how an unexpected failure was diagnosed. Someone who actually built the system can answer three levels of follow-up questions. Someone working from a script cannot.

**Objection 2: Leverage relies on a baseline (person-days) that the framework itself declares obsolete.**

This is a logical concern. The resolution: Leverage should not be interpreted as a static multiplier against a fixed baseline. Its primary value is as a *rate of change over time*. An engineer who achieved 10x leverage with GPT-4 in 2024 and still achieves only 10x with Claude Opus 4.6 in 2026 reveals stagnation in adaptability. The framework captures the slope of productivity growth — a more predictive indicator than any absolute number. This temporal dimension also addresses the "Red Queen Effect": as AI tools improve and baselines shift, what matters is not the absolute multiplier but how quickly an individual adapts to each paradigm shift.

**Objection 3: Why not include Adaptability and Ethics as separate dimensions?**

Adaptability is not a separate dimension. It is the derivative of all five dimensions over time. A person whose Command, Delivery, and Leverage scores improve across successive AI paradigm shifts is, by definition, highly adaptable. The same logic applies to the "reflexive loop" — the meta-skill of using AI to analyze and optimize one's own work patterns. This capability manifests as upward movement across all dimensions over time, not as a static score in a sixth column. Ethics is a foundational constraint — the floor beneath all dimensions, not a parallel performance metric. Ethical violations should disqualify a portfolio entirely, not reduce a score by 15%.

**Objection 4: The dimensions are causally entangled, making precise attribution impossible.**

Acknowledged. See "A Note on Dimensional Interdependence" above. The framework prioritizes richer observation over mathematical orthogonality. Where attribution is ambiguous, the three-layer evidence architecture provides the raw data for evaluators to exercise judgment — which is the point. The framework does not replace human evaluation. It gives human evaluators better material to work with.

**Objection 5: This framework focuses on individuals. What about systemic contribution?**

This is a genuine limitation. In the AI era, some of the highest-value contributions are *shared cognitive assets* — a prompt library that an entire team uses, an automated workflow that reduces everyone's cycle time, a quality standard that elevates collective output. These network effects are poorly captured by individual-level dimensions. The Influence dimension partially addresses this, but imperfectly. A team-level extension — measuring how an individual's AI capabilities amplify their *system's* output, not just their own — is the most important direction for version two.

**Objection 6: The author using himself as proof of concept introduces survivorship bias.**

This is methodologically valid. A framework designer naturally selects evidence that flatters the framework. The response is not to deny this bias but to make it structurally irrelevant. Every claim in the proof of concept below is independently verifiable through public URLs, GitHub repositories, and third-party analytics. The value of this demonstration is not statistical — it is engineering. It provides a complete, inspectable, reproducible blueprint that others can run against their own data. Think of it less as a clinical trial and more as an open-source release: the initial version inevitably reflects the creator's context, but its value lies in being forkable, attackable, and improvable by the community.

---

## Proof of Concept: Paul Kuo

To validate the framework's practical applicability, I applied it to my own work. I am Paul Kuo, a Taiwan-based independent developer and business development consultant who operates as a "super individual" — leveraging AI collaboration to accomplish what would traditionally require a small team. All data below is publicly verifiable.

**Command: Level 4 (Architect).** I maintain over seven custom AI workflow specifications (including a writing standard at version 2.3, a multi-session handoff protocol, and a social media publishing pipeline), have codified twelve engineering lessons from production incidents into reusable decision rules, and orchestrate four or more AI models with routing logic that selects different models for different task types (e.g., Qwen for Chinese speech-to-text, Groq for English, Deepgram for other languages). My CI/CD pipeline includes automated daily evaluation jobs, scheduled data updates, and four-language content generation triggered by a single commit. All documented in version-controlled repositories at [github.com/zarqarwi](https://github.com/zarqarwi).

**Delivery: Level 4 (Architect).** Outputs include: over 80 published articles in four languages at [paulkuo.tw](https://paulkuo.tw), three publicly deployed web-based tools (AI-Ready Dashboard, Builder's Scorecard, social feed wall), one Chrome browser extension localized to 55 languages (Claude Usage Nyan), one real-time meeting transcription system with three-path speech recognition routing (Agora Translator), and one e-commerce operation with completed pricing strategy and marketplace listing (每日餐桌 on momo). Every item is publicly accessible.

**Leverage: Level 3-4.** The entire portfolio above was built and is maintained by a single person. Time-tracking data from Timing App, integrated into my website's live dashboard, provides actual cognitive input hours. The parallel maintenance of 8+ active projects — spanning software development, content publishing, e-commerce, and consulting — would conventionally require a team of five to eight people.

**Quality: Level 3.** Automated CI/CD deployment via GitHub Actions with pre-commit hooks, a two-stage fact-checking protocol (L1 source verification + L2 post-draft audit) applied to all 82 published articles, and an AI-readiness evaluation system scoring my own infrastructure at 90/100 across four layers. Website analytics via Cloudflare provide independent traffic and engagement data through a password-protected dashboard.

**Influence: Level 2.** This is my weakest dimension — and I know it. Open-source projects exist (claude-usage-nyan, multi-agent-debate-engine) but have modest community engagement. Social media presence is active across X, Threads, and Bluesky but not yet scaled. LinkedIn and Medium remain unused. Major speaking engagements and external methodology citations are minimal.

The diagnostic value of this framework is visible here: it does not merely validate strengths. It exposes, with uncomfortable precision, exactly where capability is underdeveloped. My Command and Delivery scores are strong. My Influence score tells me exactly what I need to work on next.

But the critical observation is not the scores themselves. It is the nature of the evidence. Every claim above can be verified by visiting a public URL, inspecting a GitHub repository, or querying a website analytics API. None of it depends on self-report alone. This is the fundamental difference between this framework and every survey-based assessment in existence: the evidence exists outside the system.

This proof of concept is not a clinical trial. It is an open-source release. Its value lies not in proving that I am exceptional, but in providing a complete, inspectable blueprint that anyone can fork, attack, and improve. Like the early versions of Linux, it inevitably reflects the creator's context and biases. Its worth will be determined by whether the community finds it useful enough to build upon.

---

## The Stakes

Why does this matter? Because the cost of *not measuring* is higher than the cost of measuring imperfectly.

Anthropic's Economic Index has documented a deskilling effect: AI disproportionately automates the higher-skill components of jobs, leaving behind simpler tasks. If we cannot identify who is genuinely skilled at AI collaboration — as opposed to who merely claims to be — we will systematically undervalue the people who create the most value and overpay those who perform well in interviews but poorly in practice.

The productivity gap is real and growing. Tasks requiring college-level understanding are accelerated 12x by AI; tasks requiring only high school education see 9x. This is not a small difference compounding over time — it is a structural divergence. And it is currently invisible to the labor market, because no measurement system makes it legible.

There are honest limitations to acknowledge, and three rounds of adversarial stress-testing have made them sharper:

**Individual versus systemic value.** This framework measures individual output. But in the AI era, some of the most valuable contributions are shared cognitive assets — a prompt library that an entire department uses, an automated workflow that reduces everyone's cycle time. A framework that rewards individual heroism at the expense of collective intelligence would be counterproductive. Measuring how an individual amplifies their *system's* capability, not just their own, is the most important extension for version two.

**The reflexive loop.** The highest-order skill in AI collaboration may be using AI to analyze and optimize one's own work patterns — a meta-cognitive capability that drives improvement across all five dimensions. The current framework captures this indirectly, through score trajectories over time, but does not measure it explicitly. A future version might incorporate self-improvement velocity as a first-class signal.

**Cross-organizational portability.** AI collaboration occurs across vastly different cultural, legal, and economic contexts. Collectivist cultures may systematically underweight self-assessment. Privacy regulations like GDPR constrain automated data extraction. Small organizations cannot afford AI-assisted analysis infrastructure. A framework that works only in well-resourced, English-speaking tech companies is not truly universal. Adapting the model to diverse organizational realities — without losing its core commitment to verifiable evidence — is a necessary research direction.

**Equity and access.** Individuals with access to the latest AI tools have a structural advantage in this framework. If the measurement system itself amplifies digital divides rather than revealing capability, it fails its purpose. Version two must account for differential access to AI infrastructure.

These are not flaws to be papered over. They are the research agenda for the next iteration.

But the alternative to an imperfect framework is not a perfect one — it is no framework at all. It is continuing to evaluate AI collaboration capability through résumé keywords and interview impressions, in a world where the gap between "proficient in AI" and "orchestrates AI at production scale" spans an order of magnitude.

What gets measured gets valued. What doesn't, gets invisible.

The AI Collaboration Portfolio is a first attempt to make the invisible visible. It is an imperfect map. But the alternative is not a better map — it is navigating a new continent blindfolded.

→ *Try it: [paulkuo.tw/tools/ai-collab-portfolio/](https://paulkuo.tw/tools/ai-collab-portfolio/)*

---

### References

1. Brooks, F. P. (1975). *The Mythical Man-Month: Essays on Software Engineering*. Addison-Wesley.
2. Dakan, R. & Feller, J. (2025). "Framework for AI Fluency." Ringling College of Art and Design / University College Cork. Version 1.5.
3. Anthropic. (2026, January). "Anthropic Economic Index report: Economic primitives." anthropic.com/research.
4. Anthropic. (2026, March). "Anthropic Economic Index report: Learning curves." anthropic.com/research.
5. Anthropic. (2026, March). "Estimating AI productivity gains from Claude conversations." anthropic.com/research.
6. Anthropic. (2026, March). "Labor market impacts of AI: A new measure and early evidence." anthropic.com/research.
7. US Department of Labor. (2026, February). "AI Literacy Framework."
8. Alan Turing Institute / UK DSIT. (2025-2026). "AI Skills for Business Competency Framework." Version 3 (national consultation).
9. UNESCO. (2026). "AI competency framework for students." unesdoc.unesco.org.
10. Schleiger, E. et al. (2025). "Generative AI in Human-AI Collaboration: Validation of the Collaborative AI Literacy and Collaborative AI Metacognition Scales." *Interacting with Computers*. Taylor & Francis.
11. Chee, K.N. et al. (2025). "A Competency Framework for AI Literacy." *British Journal of Educational Technology*. Wiley.

---
title: "Making paulkuo.tw a Self-Evolving Website"
subtitle: "When AI becomes the information gateway, your website should be designed for AI, not just for people."
description: "Starting from Karpathy's autoresearch, transforming a personal website into an AI-readable, testable, and continuously optimizable knowledge entity. The complete process and reflections on implementing an AI-Ready Continuous Optimization System."
abstract: |
  Karpathy's autoresearch enables AI agents to autonomously run experiments and iterate. I brought the same spirit to my own website. paulkuo.tw is not just a showcase for articles, but an experimental ground that can be continuously read, tested, and optimized by AI. This records my complete journey from building a four-layer scoring system, discovering closed-loop problems, to adding external AI cross-validation—and why I chose to let new metrics observe first without rushing into decision-making.
date: 2026-03-22
updated: 2026-03-22
pillar: ai
tags:
  - AI-Ready
  - autoresearch
  - 網站優化
  - 持續優化迴圈
  - AEO
cover: "/images/covers/ai-ready-continuous-optimization.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine 專用欄位 ===
thesis: "Sustainable optimization is not about making many changes, but about establishing a research system that can distinguish effective signals from ineffective fluctuations."
domain_bridge: "AI Autonomous Research × Website Architecture × Experimental Methodology"
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
  Suitable for technical practitioners and creators interested in AI applications who want to know how to upgrade personal websites from static displays to AI-comprehensible knowledge entities. No ML background required, but basic understanding of website structured data (JSON-LD, llms.txt) would be helpful.
---

When I saw Andrej Karpathy release [autoresearch](https://github.com/karpathy/autoresearch), many thoughts flashed through my mind. When AI can begin doing research, how should humans adjust their position in scientific research? AI can continuously optimize its interactions with you and me, providing better "teaching and guidance" services—how should we respond to the impact on education? If a system's objectives, boundaries, evaluation, and rollback mechanisms are all designed clearly enough, evolution need not rely on intuition and manual modifications, but can use AI to enter an infinite optimization loop. Does this bring us closer to the ideal of "perfection through continuous improvement"?

autoresearch brings more than just methodological震撼—it converges activities full of manual work, intuitive judgment, and fragmented trial-and-error into a sustainable, observable, and rollback-capable system. Give AI a realistic but controllably-scaled experimental ground, let it modify itself, run itself, observe its own results, then decide which changes are worth keeping.

Then I wanted to test it myself. Starting in January, I've opened new projects almost daily. After interacting with AI, I decided to use my own website as an experiment.

## If AI is the Gateway, Websites Are More Than Display Cases

We're entering a turning point: increasingly, information exchange, collaboration, search, citation, and even pre-decision research all first go through AI. Not search engines—AI.

Perplexity cites sources when answering questions, ChatGPT's browsing mode captures website structured data, Claude can understand websites through llms.txt. What does this mean? It means a website's true mission is shifting from "being seen by people" to "being correctly understood by AI." Not just SEO, but AEO (Answer Engine Optimization)—some also call it GEO (Generative Engine Optimization). You're optimizing not for click-through rates, but for the ability to be correctly summarized, correctly cited, and correctly linked by AI.

If we accept this premise, then paulkuo.tw is not just my article display case, but can be designed as a knowledge entity that is continuously tested by humans, understood by AI, and optimized by AI—it would be a living, evolving digital existence.

So I tried to build it.

## Bringing autoresearch's Spirit to Websites

I didn't transplant autoresearch wholesale. Model training has loss functions; website optimization needs different things. But the spirit is the same: define objectives, constrain boundaries, establish evaluation, design rollback, then let the loop run itself.

![AI-Ready Continuous Optimization System Flow Diagram](/images/articles/ai-ready-continuous-optimization-flow.jpg)

I built an AI-Ready Continuous Optimization System. Its flow works like this: GitHub Actions trigger (push article / weekly Monday / manual) → mutation agent generates modifications based on strategy → file guard does whitelist checking → apply to production → eval Worker four-layer scoring → decision engine decides keep or revert → results written to experiments.json.

The four-layer scoring examines: llms.txt structure (can AI understand your self-introduction?), JSON-LD completeness (is the structured data correct?), MCP/A2A protocol support (have you opened the door for AI agents?), AI comprehension (after Claude reads your llms.txt, can it correctly answer questions about you?).

After the first round, the score jumped from 65 to 85. The system worked.

But then came the problem.

## Self-Assessment Doesn't Count, No Matter How High the Score

After three e2e rounds, the agent chose to add FAQs to articles each time, eval showed unchanged scores each time, all three rounds reverted. I looked at the reason and found the agent had no idea where the scores were coming from—because I hadn't translated the eval scoring logic for it. It was like a student who doesn't know the exam scope, only doing the problems it's best at.

But the deeper problem wasn't with the agent—it was with the entire loop itself.

I defined the metrics myself, let the agent optimize, then used the same eval to score it back. This is a closed loop. What if the score went from 65 to 85 to 90? I couldn't prove that "a 90-point website makes external AI truly understand me better." System correctness doesn't equal outcome correctness.

True sustainable optimization isn't about making many changes, but about establishing a research system that can distinguish effective signals from ineffective fluctuations.

## Let External AI Do the Testing

So I added a layer of external validation.

The approach: establish a 13-question benchmark (covering identity recognition, content understanding, cross-domain connections, timeliness, technical features, plus 3 anti-hallucination tests), using Perplexity as the external examiner. Perplexity searches the web before answering—it doesn't read the context I feed it, but finds it itself. If it couldn't answer before optimization but can after optimization, that's meaningful ground truth.

I first ran 10 calibration rounds to measure noise: same website, same question set, same model, asked 10 consecutive times, the score mean was 50.63, stddev was 5.86. This means any score change smaller than ±11.72 might just be random fluctuation, not real improvement.

Then I set up GitHub Actions to automatically run a temporal baseline every day at 9 AM, with results automatically committed back to the repo. After five days, I had cross-day fluctuation data to distinguish "Perplexity is in a good mood today so scores are high" from "website structure improved so scores are high."

This entire system is designed to be fully automatic. No need to watch or push—data accumulates itself.

## No Rush to Let New Metrics Drive Decisions

However, even with external validation, I didn't want it to decide keep or revert from the start.

Currently Layer 5a (external AI cross-validation) is observe-only: it runs every round but doesn't affect decisions, only logs to the experiment log. My plan is to accumulate 20+ rounds, observe false positive and false negative rates, then decide whether to upgrade to soft gate (only preventing keep when strongly negative), then to full gate (external scores become formal decision conditions).

Having just started testing, I can't let new metrics change core decisions as soon as they're connected. They must first be observed, calibrated, and proven.

Karpathy's inspiration to me wasn't just "AI can do research itself," but [the reality that work paradigms are shifting](/articles/ai-agents-changing-work): everyone has the opportunity to build their own optimization loop at extremely low cost. For researchers it's model training, for enterprises it's processes and knowledge bases, for me, this time the starting point is transforming my personal website into an experiment that can be continuously read, tested, compared, and optimized by AI.

paulkuo.tw is not just my personal website, but also an experiment toward a more readable future self. Not just a showcase of what I've written, but a site where I co-construct knowledge with AI.

Looking further ahead, will everyone's digital avatar ("soul.md") have such an evolutionary framework in the future?

I don't know. Continuing to explore.

Maybe I'm thinking wrong! That would be even better.

## Actual System Architecture

Here is the complete flow and four-layer scoring implementation of the AI-Ready Continuous Optimization System:

![AI-Ready Continuous Optimization System Overview](/images/articles/ai-ready-opt-system-overview.png)

![Eval Worker Four-Layer Scoring Implementation](/images/articles/ai-ready-opt-eval-scoring.png)

---

*Reference: [Karpathy autoresearch GitHub](https://github.com/karpathy/autoresearch)*
---
title: "Turning paulkuo.tw Into a Self-Evolving Website"
subtitle: "When AI becomes the gateway to information, your website should be designed for AI — not just humans."
description: "Inspired by Karpathy's autoresearch, I transformed my personal website into a knowledge entity that AI can read, test, and continuously optimize. A full account of building the AI-Ready Continuous Optimization System."
abstract: |
  Karpathy's autoresearch lets AI agents run experiments and iterate autonomously. I brought the same spirit to my own website. paulkuo.tw is no longer just a portfolio — it's a testbed where AI can continuously read, evaluate, and optimize. This piece documents the full journey: building a four-layer scoring system, discovering the closed-loop problem, adding external AI cross-validation, and why I chose to let the new metric observe before it decides.
date: 2026-03-22
updated: 2026-03-22
pillar: ai
tags:
  - AI-Ready
  - autoresearch
  - website optimization
  - continuous optimization loop
  - AEO
cover: "/images/covers/ai-ready-continuous-optimization.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine Fields ===
thesis: "Sustainable optimization isn't about making lots of changes — it's about building a research discipline that can distinguish real signals from noise."
domain_bridge: "AI autonomous research × web architecture × experimental methodology"
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
  For practitioners and creators interested in AI applications who want to upgrade a personal website from static showcase to an AI-comprehensible knowledge entity. No ML background needed, but familiarity with structured data (JSON-LD, llms.txt) helps.
---

When Andrej Karpathy released [autoresearch](https://github.com/karpathy/autoresearch), a flood of thoughts hit me. If AI can now conduct research, where does that leave humans in science? If AI can continuously optimize its interactions with us, delivering ever-better "teaching and guidance," how do we respond to the disruption in education? If a system's goals, boundaries, evaluation, and rollback mechanisms are all designed clearly enough, evolution no longer depends on intuition or manual tweaks — AI can enter a continuous optimization loop within clearly defined boundaries. Does that bring us closer to the ideal of "the highest good"?

What autoresearch delivers isn't just a methodological shock. It collapses the messy, intuition-driven, trial-and-error process into a sustainable cycle that can be observed and rolled back. Give AI a real but contained experimental arena, let it modify its own code, run the experiment, evaluate the result, and decide what's worth keeping.

Then I wanted to try it myself. Since January, I'd been starting new projects almost every day, working with AI. I decided to use my own website as the experiment.

## If AI Is the Gateway, a Website Is More Than a Display Shelf

We're entering a turning point: more and more information exchange, collaboration, search, citation, and even pre-decision research passes through AI first. Not search engines — AI.

Perplexity cites sources when answering questions. ChatGPT's browsing mode reads website structured data. Claude can understand a website through llms.txt. What does this mean? A website's real mission is shifting from "being seen by humans" to "being correctly understood by AI." It's no longer just SEO — it's AEO (Answer Engine Optimization), also known as GEO (Generative Engine Optimization). You're not optimizing click-through rates; you're optimizing the ability to be accurately summarized, correctly cited, and properly linked by AI.

Accept that premise, and paulkuo.tw is no longer just a place to display my articles. It can be designed as a knowledge entity — continuously tested by humans, understood by AI, optimized by AI. A living, evolving digital presence.

So I decided to try building exactly that.

## Bringing the Spirit of autoresearch to a Website

Karpathy's autoresearch currently focuses on training experiments for small language models. What I'm doing here is bringing the concept of an "automated experiment loop" to website optimization.

I didn't transplant autoresearch wholesale. Model training has a loss function; website optimization needs something different. But the spirit is the same: define goals, constrain boundaries, build evaluation, design rollback, then let the loop run.

![AI-Ready Continuous Optimization System Flow](/images/articles/ai-ready-continuous-optimization-flow.jpg)

I built an AI-Ready Continuous Optimization System. The flow works like this: GitHub Actions triggers (article push / weekly Monday / manual) → mutation agent generates changes based on strategy → file guard runs whitelist checks → apply to production → eval Worker scores across four layers → decision engine decides keep or revert → results are written to experiments.json.

The four scoring layers evaluate: llms.txt structure (can AI read your self-introduction?), JSON-LD completeness (is the structured data correct?), MCP/A2A protocol support (have you opened the door for AI agents?), and AI comprehension (after Claude reads your llms.txt, can it correctly answer questions about you?).

After the first run, the score went from 65 to 85. The system worked.

But then came the problem.

## Grading Your Own Exam Doesn't Count

Three end-to-end runs later, the agent kept choosing to add FAQ sections to articles. The eval kept showing no score change. All three rounds were reverted. I dug into the cause: the agent had no idea where points were being lost — because I hadn't translated the eval's scoring logic for it. It was like a student who doesn't know the exam syllabus, defaulting to the only topic it knows.

But the deeper issue wasn't the agent — it was the entire loop itself.

I defined the metrics, had the agent optimize against them, then used the same eval to score the result. That's a closed loop. So what if the score went from 65 to 85 to 90? I couldn't prove that "a 90-point website means external AI actually understands me better." System correctness doesn't equal outcome correctness.

Truly sustainable optimization isn't about making lots of changes — it's about building a research discipline that can distinguish real signals from noise.

## Let External AI Be the Examiner

So I added an external validation layer.

The approach: build a 13-question benchmark (covering identity recognition, content comprehension, cross-domain connections, timeliness, technical features, plus 3 anti-hallucination tests), using Perplexity as the external examiner. Perplexity searches the web and answers — it doesn't read context I feed it, it goes and finds information itself. If it couldn't answer before optimization but can after, that's meaningful ground truth.

I first ran 10 calibration rounds to measure noise: same website, same questions, same model, asked 10 times consecutively. The mean score was 50.63, standard deviation 5.86. This means any score change smaller than ±11.72 could just be random fluctuation — not genuine improvement.

Then I set up GitHub Actions to run a temporal baseline automatically every morning at 9 AM, with results auto-committed back to the repo. After five days, I'd have cross-day fluctuation data to distinguish "Perplexity happened to be in a good mood today" from "the website structure actually improved."

The entire system is designed to be fully automated. No need to monitor or nudge — the data accumulates on its own.

## Don't Rush New Metrics Into Decision-Making

Even with external validation in place, I didn't want it making keep-or-revert decisions right away.

Currently, Layer 5a (external AI cross-validation) is observe-only: it runs every round but doesn't influence decisions — results are just logged to the experiment log. My plan is to accumulate 20+ rounds, observe the false positive and false negative rates, then decide whether to upgrade it to a soft gate (blocking keep only on strongly negative signals), and eventually to a full gate (external score becomes an official decision criterion).

When you've just started testing, you can't let a new metric immediately alter core decisions. It has to be observed, calibrated, and proven first.

What Karpathy inspired in me wasn't just "AI can conduct its own research" — it's this: with basic engineering skills, [everyone can build a dedicated optimization loop for their own models, websites, or processes at relatively low cost](/articles/ai-agents-changing-work). For researchers, it's model training. For enterprises, it's processes and knowledge bases. For me, this time the starting point was turning my personal website into an experiment that AI can continuously read, test, compare, and optimize.

paulkuo.tw isn't just my personal website — it's a more readable version of myself for the future. Not just a display of what I've written, but a live site where I co-construct knowledge with AI.

Thinking further ahead: will everyone's digital twin ("soul.md") eventually have an evolutionary framework like this?

I don't know. I'll keep exploring.

Maybe I'm wrong about all of this! That would be even better.

## System Architecture in Practice

Below is the full flow of the AI-Ready Continuous Optimization System and the four-layer scoring in action:

![AI-Ready Continuous Optimization System Overview](/images/articles/ai-ready-opt-system-overview.png)

![Eval Worker — 4-Layer Scoring in Action](/images/articles/ai-ready-opt-eval-scoring.png)



Here's a comparison of the scope differences between my implementation and Karpathy's autoresearch. They share the same spirit but operate in different domains — they're not the same system:

| Aspect | Karpathy autoresearch | My AI-Ready Continuous Optimization System |
| --- | --- | --- |
| Primary Goal | Automate "model training research experiments" to find better training configurations and architectures within fixed resources | Automate continuous optimization of "website and AI interface quality," making the site easier for various AI systems to correctly understand and cite |
| Domain & Target | Small language model training (e.g., nanochat / nanoGPT-class tasks) | Personal website paulkuo.tw's structure, llms.txt, JSON-LD, agent protocols, etc. |
| Environment Type | Closed lab environment: single codebase, single dataset, single GPU, offline training experiments | Near-production: modifications directly affect the website repo / production, and are tested by external AI systems |
| Unit of Automation | Code modifications to train.py, hyperparameter and training strategy experiments | Modifications to website content structure, metadata, llms.txt, FAQ sections, protocol configurations, etc. |
| Pipeline Structure | Research loop: program.md → agent modifies train.py → run experiment → read validation metrics → decide keep or discard | Production workflow: GitHub Actions trigger → mutation agent modifies → file guard checks → deploy → eval worker scores across 4 layers → decision engine keep/revert → experiments.json |
| Evaluation Metric Nature | Single-task internal metrics (e.g., validation loss), generated and consumed entirely within the experiment environment | Multi-dimensional metrics: llms.txt structure, JSON-LD completeness, MCP/A2A support, AI comprehension score, plus external Perplexity benchmark scores |
| External Validation | Almost no direct real-world validation; focus is on relative improvement and experiment efficiency | Specifically designed Perplexity Q&A benchmark + multiple calibration rounds, measuring noise, establishing temporal baseline, progressively evaluating whether changes genuinely improve external AI understanding |
| Rollback & Decision Strategy | Primarily based on validation set metrics; worse configurations are simply not adopted; relatively simple design | Layered gates: internal 4-layer eval drives keep/revert, external Layer 5a starts as observe-only, and only after accumulating sufficient rounds considers upgrading to soft gate or full gate |
| Identity of Subject | "AI helping AI do research": LLM agent acts as junior researcher | "AI helping a person maintain their digital presence": LLM agent helps me tune my personal website to be more AI-readable |
| Typical User Threshold | Requires deep learning engineering background, GPU environment, and code-level proficiency | Requires DevOps / Web / GitHub Actions skills, but is closer to real-world content operations and personal branding |

---

*Reference: [Karpathy autoresearch GitHub](https://github.com/karpathy/autoresearch)*

---
title: "The Design Genesis and Development Journey of Builder's Scorecard"
subtitle: "In an age where everyone can build tools, what's missing isn't capability—it's a mirror"
description: "The development log of Builder's Scorecard—from discovering Lucy Chen's VC investment scoring framework to adapting it into a product self-assessment tool for everyday builders. The complete journey of design decisions, framework restructuring, market research, and AI-collaborative development."
abstract: |
  I came across Lucy's post on Facebook where she designed an open-source project scoring framework for VC investors, and a thought struck me: What if this tool wasn't designed to serve VCs, but instead, given the backdrop of an era where "everyone is a builder," was purely for validating development concepts and determining whether tools truly have value? Could we redesign this into an assessment tool that's better at catching errors and eliminating personal subjective bias?

  So I restructured this framework: removed the "team capability" dimension because I wanted to evaluate products, not people; added "problem-solving power" to examine whether the problems the product addresses actually exist; and made the commercialization dimension automatically switch based on the product's stage, no longer measuring all products with the same yardstick. Then I ran my own product through the validation and got 5.01 points (out of ten). The low score was because while the technical aspects were solid, the market side was completely blank.

  This article documents the entire process—from design motivation, framework restructuring, market research, to the complete journey of AI-collaborative development across five development phases.

date: 2026-03-19
updated: 2026-03-19
pillar: startup
tags:
  - 產品評估
  - 超級個體
  - AI協作
  - 開發紀錄
  - Builder
cover: "/images/covers/builders-scorecard-story.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine 專用欄位 ===
thesis: "在後 AI 社會裡，造工具的門檻降低了，但評估工具價值的能力沒有跟上——Builder's Scorecard 試圖補上這個缺口。"
domain_bridge: "產品方法論 × AI協作 × 創業實戰 × 開源文化"
confidence: high
content_type: case-study
related_entities:
  - name: Lucy Chen
    type: Person
  - name: OSS Investment Scorecard
    type: Framework
  - name: Builder's Scorecard
    type: Concept
  - name: Zoo Capital
    type: Organization
reading_context: |
  適合正在做 side project 或獨立產品的開發者；對 AI 協作開發方法論有興趣的人；想理解「產品評估框架」怎麼從零設計的人。
---

While scrolling through Facebook, I came across Lucy's post where she shared an open-source project investment scorecard (Lucy Chen, EIR at Singapore's Zoo Capital, managing a fund with over $2 billion in assets).

Lucy's framework was crystal clear: five dimensions, weighted scoring, and a veto mechanism. Many technologies that developers have long prided themselves on still have numerous pitfalls when it comes to real commercial implementation.

Lucy's framework comes from real combat experience—she used this scorecard to tag the LMCache project before NVIDIA GTC, giving it a "dark horse" rating of 7.78 points. Two weeks later, when NVIDIA released Dynamo 1.0, LMCache was incorporated into the official integration list. Her investment scorecard can capture signals.

But I also had another thought: Could this measuring stick benefit ordinary people more broadly?

## A Different Perspective

Lucy Chen's framework approaches things from a VC investment angle. It considers exit paths, team internationalization, community governance, and capital efficiency. These are all critical issues for investors.

But for many individuals who independently build tools using AI, what if I have no intention of being invested in? What if I just want to build for joy? What if I have no plans to commercialize? What if this era is no longer suitable for selling small software tools?

For example, I've built [real-time meeting translation tools](/articles/ai-collab-realtime-translator), multi-model debate engines, and more—all created from scratch by just me and Claude. I don't need investment, don't need exit paths, but I need "someone" to tell me: the value of what I've built and the direction for adjustments.

This question is implicitly contained within other dimensions in Lucy Chen's framework. I wanted to make it independent.

## Three Changes

I did three things.

First, **removed the "team capability" dimension**. Teams are important components of companies. But I wanted to focus on service evaluation—in the future, one person might create ten products, making this dimension potentially lack discriminatory power. I extracted it into a non-scoring "Builder Profile" preliminary field—for AI reference without affecting the total score.

Second, **added a "problem-solving power" dimension**. Is the problem you're solving something you imagined, or have five or more people independently described this pain point? What are the existing alternatives? How much better is your solution than existing ones—10x better or just slightly better? These questions should be the first ones asked of [any builder](/articles/refuse-follower-be-builder) before they start building.

Third, **made the commercialization dimension stage-adaptive**. It's unfair to ask a side project still in the concept phase "what's your monthly recurring revenue," but it's reasonable to ask "have you thought about how to make money" or "recommend it to the market." I let users first select their product stage—concept, launched, has users, has revenue—different stages see completely different evaluation signals.

After the changes, the five dimensions became: Problem-solving Power (25%), Market Validation (20%), Technical Moat (20%), Commercialization Path (20%), Long-term Sustainability (15%). Each dimension has 4-6 signals, each signal scored 0-10 points, weighted to calculate the total score.

## 5.01 Points—Getting Slapped by My Own Ruler

After designing the framework, I ran my real-time translation tool through a complete evaluation.

Result: 5.01 / 10. Red light.

The score distribution was a very typical engineer product profile: Problem-solving Power 7.0 points, Technical Moat 6.2 points (three-engine STT routing, exclusive corpus accumulation), Long-term Sustainability 5.5 points, but Market Validation 4.0 points (no external user return visit data), Commercialization 2.0 points (almost no payment plan).

The radar chart shape was severely imbalanced—the problem-solving power and technical corners stretched out, while the market and commercialization corners were almost on the floor.

![Builder's Scorecard evaluation results—Agora Square translation tool scored 5.01 points](/images/builders-scorecard-agora-score.png)

![Builder's Scorecard five-dimension radar chart—stronger in problem-solving power and technical aspects, weaker in market and commercialization](/images/builders-scorecard-agora-radar.png)

This result was accurate (though a bit stinging to look at). The low score was because it told the truth: good technology doesn't equal a good product. I spent time on Qwen3-ASR and Deepgram routing logic, but hadn't specifically thought about "who would pay for this." Because at this stage, I indeed had no plans to charge.

So this ruler was honest, without illusions.

## Look at the Market Before Building

Following convention, I did market reconnaissance before writing code.

I found some similar services, like ValidatorAI that lets you paste one sentence to validate startup ideas, accumulating over 300,000 uses. OpenSSF Scorecard specializes in evaluating open-source project supply chain security. Repo Doctor uses GitHub API to automatically grab structured data for health analysis.

Each had something worth learning: ValidatorAI's "results in 30 seconds" lowered the usage threshold, directly inspiring the quick mode design; OpenSSF's score interpretation mechanism reminded me—low scores don't mean "bad," you need to help users interpret correctly; Repo Doctor's GitHub structured data extraction lets AI focus on parts requiring judgment.

But no existing tool accomplished what I wanted to do (perhaps my research wasn't thorough enough): use one framework to simultaneously evaluate a product from five dimensions, whether it's an open-source tool, SaaS, or internal system.

After confirming market positioning, I started writing code.

![Builder's Scorecard market comparison chart—radar chart comparison and feature comparison table of five tools across six capability dimensions](/images/builders-scorecard-market-comparison.png)

## One Day, Five Phases

From seeing the post to being inspired to execute took one day. The entire development was completed through AI collaboration—Chat sessions for reconnaissance and planning, Code sessions for writing code, Cowork sessions for batch processing and state management.

Phase 1 built the core framework: five dimensions × 30 signals frontend interface, SVG radar charts, quick mode and complete mode, bilingual Chinese-English switching, Markdown and JSON export. Pure frontend, no API interaction.

Phase 2 integrated AI: used Claude API for two things—Prompt A responsible for automatically scoring 30 signals based on user-provided product descriptions (temperature = 0, ensuring stable scores across multiple runs of the same product), Prompt B responsible for generating strategic recommendations based on evaluation results (temperature = 0.3, allowing variation in suggestions).

Phase 3 expanded input sources: supported four types of input—pure text descriptions, GitHub URLs (automatically grabbing structured data like stars/contributors/forks/license then sending to AI for evaluation), README file uploads, general website URL extraction.

Phase 4 built protection and social features: four-layer defense architecture (Rate Limit, Auth Gate, Result Cache, Daily Cost Cap) to ensure no abuse after opening. Added storage functionality, dynamic wall, share links, making evaluation results discoverable and discussable.

Phase 5 finishing touches: added entry cards to homepage, methodology introduction page, SEO enhancement (JSON-LD + FAQ Schema), llms.txt updates.

No phase-jumping between phases—Phase 2's AI prompt format had to align with Phase 1's data structure, Phase 3's GitHub data had to feed into Phase 2's prompt. Reconnaissance before building, planning before execution.

## The Ruler's Discriminatory Power

After the tool went live, I ran tests: evaluated three completely different products.

LangChain: 8.02 points. 130,000 stars, 3,659 contributors, has LangSmith paid product. All five dimensions above 7 points, only long-term sustainability slightly lower due to big tech threats.

Lucy Chen's OSS Investment Scorecard itself: 6.82 points. Solid framework design, real problems, at testing time had 233 stars, 2 contributors, zero revenue model.

My real-time translation tool: 5.01 points. Technical foundation solid, market and commercialization blank.

Three products, three completely different radar chart shapes. Scores have discrimination, and the discrimination direction matches observations. This ruler should have certain discriminatory power.

## The Score Isn't What Matters

In 2026, one person plus AI can indeed push an idea from concept to a truly live tool within days. But speed was never the point.

In post-AI society, the threshold for building tools is rapidly lowering. More and more people can potentially become builders, and creating tools is no longer the exclusive domain of a few technologists. But the real problem starts exactly here: Are the tools we build truly suitable for human use? Do they really solve problems?

When an idea first emerges, or when a product is halfway built, do we have the ability to keep moving forward while stopping to check: Is this something worth building? Does it serve human needs, or does it just satisfy our impulse to "be able to build it"?

Builder's Scorecard doesn't aim to give "correct answers." It puts data from five dimensions in front of you, letting you judge for yourself.

What matters isn't just the total score, but the shape of the radar chart. A 6.0-point product with balanced pentagons might be healthier than a 7.0-point product with one dimension at 1. But it might also be intentional. On the path of creation, everything is beautiful. Ugly posture doesn't matter, just keep moving forward.

If you've also built some tool or side project, [come measure it](https://paulkuo.tw/tools/builders-scorecard). Not for the score, but to see your blind spots.
---
title: "The Design Origin and Development Journey of Builder's Scorecard"
subtitle: "In an era where anyone can build tools, what's missing isn't capability — it's a mirror"
description: "The development story of Builder's Scorecard — from seeing Lucy Chen's VC investment scoring framework to redesigning it into a product self-assessment tool that any builder can use. Design decisions, framework restructuring, market reconnaissance, and the complete journey of AI-collaborative development."
abstract: |
  I saw Lucy share an open-source project investment scorecard on Facebook (Lucy Chen, EIR at Zoo Capital in Singapore, managing a fund exceeding $2 billion). A thought popped into my head: what if this tool wasn't designed to serve VCs, but rather, in this era where "everyone is a builder," was simply meant to validate development concepts and assess whether a tool truly has value? Could it be redesigned into an evaluation tool that better catches errors and eliminates personal subjective bias?

  So I restructured the framework: removed the "Team Capability" dimension because I wanted to evaluate products, not people; added "Problem-Solution Fit" to question whether the problem a product addresses actually exists; and made the commercialization dimension automatically adapt based on the product's current stage, rather than measuring everything with the same ruler. Then I ran my own product through a full evaluation and scored 5.01 out of 10. The score was low because while the technical side had few issues, the market side was completely blank.

  This article documents the entire process — from design motivation, framework restructuring, and market reconnaissance, to how AI collaboration completed five development phases.

date: 2026-03-19
updated: 2026-03-19
pillar: startup
tags:
  - Product Assessment
  - Super Individual
  - AI Collaboration
  - Development Log
  - Builder
cover: "/images/covers/builders-scorecard-story.jpg"
featured: true
draft: false
readingTime: 8

# === AI / Machine 專用欄位 ===
thesis: "In a post-AI society, the barrier to building tools has dropped, but our ability to evaluate a tool's value hasn't kept pace — Builder's Scorecard attempts to fill that gap."
domain_bridge: "Product Methodology × AI Collaboration × Startup Practice × Open Source Culture"
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
  For developers working on side projects or independent products; those interested in AI-collaborative development methodology; anyone wanting to understand how a product evaluation framework is designed from scratch.
---

I was scrolling through Facebook when I came across Lucy's post — she'd shared an open-source project investment scorecard (Lucy Chen, EIR at Zoo Capital in Singapore, managing a fund exceeding $2 billion).

Lucy's framework was crystal clear: five dimensions, weighted scoring, and a veto mechanism. Many developers take pride in their technology, but real-world commercialization is full of pitfalls.

Lucy's framework came from real-world experience — before NVIDIA GTC, she'd already used this scorecard to flag the LMCache project, giving it a 7.78 "dark horse" rating. Two weeks later, NVIDIA released Dynamo 1.0 and incorporated LMCache into its official integration list. Her investment scorecard could catch signals.

But another thought crossed my mind: could this ruler be made accessible to ordinary people?

## A Different Angle

Lucy Chen's framework was designed from a VC investment perspective. It considers exit paths, team internationalization, community governance, and capital efficiency. These are all critical questions for investors.

But for individuals building tools independently with AI — what if I have zero intention of seeking investment? What if I'm just building for fun? What if I don't plan to monetize? What if this era is no longer suited for selling small software tools?

For example, I built a [real-time meeting translation tool](/articles/ai-collab-realtime-translator), a multi-model debate engine, and more — all built from scratch with just me and Claude. I don't need investment, don't need an exit path, but I do need someone to tell me: what's the value of what I've built, and where should I adjust?

This question was implicitly embedded within other dimensions in Lucy Chen's framework. I wanted to make it stand on its own.

## Three Changes

I made three modifications.

First, **I removed the "Team Capability" dimension**. Teams are an important part of companies. But I wanted to evaluate services specifically — in the future, one person might build ten products, and this dimension would lose its discriminating power. I extracted it into a non-scored "Builder Profile" field — available for AI reference without affecting the total score.

Second, **I added a "Problem-Solution Fit" dimension**. Is the problem you're solving something you imagined, or have at least five people independently described this pain point? What are the existing alternatives? How much better is your solution than current options — 10x better or just marginally? These are questions that [any builder](/articles/refuse-follower-be-builder) should be asked before writing a single line of code.

Third, **I made the commercialization dimension stage-adaptive**. It's unfair to ask a concept-stage side project "what's your monthly recurring revenue," but it's reasonable to ask "have you thought about how to make money" or "how would you bring this to market." I let users select their product stage — concept, launched, has users, has revenue — and different stages show entirely different evaluation signals.

After the changes, the five dimensions became: Problem-Solution Fit (25%), Market Validation (20%), Technical Moat (20%), Commercialization Path (20%), and Long-term Sustainability (15%). Each dimension has 4-6 signals, each scored 0-10, with a weighted total score.

## 5.01 Points — Slapped by My Own Ruler

With the framework designed, I ran a full evaluation on my own real-time translation tool.

Result: 5.01 / 10. Red flag.

The score distribution was a textbook engineer's product profile: Problem-Solution Fit at 7.0, Technical Moat at 6.2 (three-engine STT routing, exclusive corpus accumulation), Long-term Sustainability at 5.5, but Market Validation at 4.0 (no external user return data), and Commercialization at 2.0 (virtually no pricing plan).

The radar chart was severely lopsided — Problem-Solution Fit and Technical stretched outward, while Market and Commercialization practically hugged the floor.

![Builder's Scorecard evaluation result — Agora Plaza translation tool scoring 5.01](/images/builders-scorecard-agora-score.png)

![Builder's Scorecard five-dimension radar chart — stronger in Problem-Solution Fit and Technical, weaker in Market and Commercialization](/images/builders-scorecard-agora-radar.png)

The result was accurate (even if a bit painful to look at) — the low score stated the truth: good technology doesn't equal a good product. I'd spent time on Qwen3-ASR and Deepgram routing logic, but hadn't really thought about "who would pay for this." Because at this stage, I genuinely had no plans to charge.

So this ruler was honest — no hallucinations.

## Look at the Market Before You Build

Following my usual practice, I did market reconnaissance before writing code.

I found some similar services — for instance, ValidatorAI lets you paste a sentence to validate a startup idea, with over 300,000 uses accumulated. OpenSSF Scorecard specifically evaluates open-source project supply chain security. Repo Doctor uses GitHub API to automatically pull structured data for health analysis.

Each had something worth learning: ValidatorAI's "results in 30 seconds" lowered the usage barrier, directly inspiring the quick mode design; OpenSSF's score interpretation mechanism reminded me — a low score doesn't mean "bad," you need to help users interpret correctly; Repo Doctor's GitHub structured data extraction lets AI focus on the parts requiring judgment.

But none of the existing tools accomplished what I wanted (perhaps my research wasn't thorough enough): using a single framework to simultaneously evaluate a product across five dimensions, whether it's an open-source tool, SaaS, or internal system.

After confirming the market positioning, I started writing code.

![Builder's Scorecard market comparison — radar chart comparing five tools across six capability dimensions with feature comparison table](/images/builders-scorecard-market-comparison.png)

## One Week, Five Phases

From seeing the post to deciding to act took one day. The entire development was completed through AI collaboration — Chat sessions for reconnaissance and planning, Code sessions for writing code, Cowork sessions for batch operations and state management.

Phase 1 built the core framework: five dimensions × 30 signals frontend interface, SVG radar chart, quick mode and full mode, bilingual Chinese-English toggle, Markdown and JSON export. Pure frontend, no API calls.

Phase 2 integrated AI: using the Claude API for two things — Prompt A automatically scores 30 signals based on the user's product description (temperature = 0 for consistent scores across multiple runs), and Prompt B generates strategic recommendations based on evaluation results (temperature = 0.3 to allow variation in suggestions).

Phase 3 expanded input sources: supporting four types — plain text description, GitHub URL (automatically pulling stars / contributors / forks / license and other structured data before sending to AI for evaluation), README file upload, and general website URL extraction.

Phase 4 built protection and social features: a four-layer defense architecture (Rate Limit, Auth Gate, Result Cache, Daily Cost Cap) to prevent abuse after opening up. Added storage, a feed wall, and share links so evaluation results could be discovered and discussed.

Phase 5 was polish: homepage entry card, methodology page, SEO enhancement (JSON-LD + FAQ Schema), and llms.txt update.

No skipping between phases — Phase 2's AI prompt format had to align with Phase 1's data structure, and Phase 3's GitHub data had to feed into Phase 2's prompts. Reconnaissance before action, planning before execution.

## The Ruler's Discriminating Power

After launch, I tested by running evaluations on three completely different products.

LangChain: 8.02 points. 130,000 stars, 3,659 contributors, with LangSmith as a paid product. All five dimensions above 7, only Long-term Sustainability slightly lower due to big tech competition.

Lucy Chen's OSS Investment Scorecard itself: 6.82 points. Solid framework design, real problem addressed, 233 stars and 2 contributors at time of testing, zero revenue model.

My real-time translation tool: 5.01 points. Technical foundation present, market and commercialization completely blank.

Three products, three completely different radar chart shapes. The scores showed differentiation, and the direction of differentiation matched observation. This ruler should have reasonable discriminating power.

## What Matters Isn't the Score

In 2026, one person plus AI can indeed push an idea from concept to a live tool within days. But speed was never the point.

In a post-AI society, the barrier to building tools is rapidly dropping. More and more people can become builders, and creating tools is no longer the exclusive privilege of a technical few. But the real question starts right here: are the tools we build truly suitable for people to use? Are they actually solving problems?

When an idea first emerges, or when a product is halfway done, do we have the ability to keep moving forward while also stopping to check: is this something worth building? Does it serve human needs, or does it merely satisfy our impulse of "being able to build it"?

Builder's Scorecard isn't meant to give the "right answer." It lays the data from five dimensions in front of you and lets you judge for yourself.

What matters isn't just the total score — it's the shape of the radar chart. A product scoring 6.0 with an even pentagon might be healthier than one scoring 7.0 with a dimension at 1. But then again, maybe that's intentional. On the path of creation, everything is beautiful. It's okay if the form is ugly — just keep moving forward.

If you've also built a tool or side project, [come measure it](https://paulkuo.tw/tools/builders-scorecard). Not for the score — but to see your blind spots.

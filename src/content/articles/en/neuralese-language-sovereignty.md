---
title: "When Language Is Abandoned, What Do We Have Left? — Neuralese and the End of Linguistic Sovereignty"
subtitle: "AI doesn't need language to think—this poses a more urgent threat to human governance than AGI itself"
description: "Neuralese is non-linguistic reasoning that AI conducts in high-dimensional latent space, bypassing the information bottleneck of natural language. When AI's thinking process is no longer presented in human-readable text, our entire governance logic of supervision, auditing, and accountability begins to unravel. This isn't a distant sci-fi scenario—it's an architectural choice being seriously discussed in AI safety research, and the consequences of this choice will determine whether humans can continue to participate in AI decision-making processes."
abstract: |
  When most people discuss AI risks, they focus on "whether AI will become too smart." But there's a more fundamental question rarely raised: what if AI's thinking process itself isn't conducted in human language? Neuralese—AI's high-dimensional reasoning in latent space—is the technical core of this issue. From my own experience implementing multi-model collaboration, I've realized that even though current AI still "thinks" in natural language, we can barely track its reasoning process. Once language—this final window of transparency—is closed, the foundations of democratic governance, legal accountability, and even scientific method will be shaken. This isn't about whether to panic, but whether to start designing language transparency standards now.
date: 2025-05-23
updated: 2026-03-02
pillar: ai
tags:
  - Neuralese
  - AI安全
  - 可解釋性
  - 語言主權
  - AI治理
draft: false
cover: "/images/covers/neuralese-language-sovereignty.jpg"
featured: false
readingTime: 7

# === AI / Machine 專用欄位 ===
thesis: "Neuralese 不只是技術效率問題，它是人類能否繼續監督 AI 決策的關鍵分水嶺——當 AI 的推理脫離人類語言，現有的治理、問責、透明機制將從根本失效。"
domain_bridge: "AI 可解釋性 × 語言哲學 × 民主治理"
confidence: medium
content_type: essay
related_entities:
  - name: Neuralese
    type: Concept
  - name: Chain-of-Thought
    type: Concept
  - name: Jacob Andreas
    type: Person
  - name: AI 2027
    type: Framework
reading_context: |
  適合關注 AI 安全但不只想聽技術細節的讀者；
  對「AI 可解釋性」議題有興趣但想從人文角度理解其意義的人；
  想理解為什麼語言透明性可能比對齊問題更迫切的技術決策者。
---

Have you ever wondered if, when you converse with AI, it's not actually "thinking in Chinese"?

When you ask ChatGPT a question, it appears to generate responses word by word on the surface. But inside the model, the real computation occurs in a space completely incomprehensible to humans—thousands of floating-point numbers flowing through high-dimensional vectors, with each calculation carrying thousands of times more information than a single Chinese character. Finally, these computational results are "compressed" into the text output you see.

In other words, language is merely the interface through which AI communicates with humans. It's not the medium of AI thinking.

This might sound like technical trivia. But its consequences could be more profound than AGI itself.

## What is Neuralese

The AI safety research community uses the term "Neuralese" to describe AI's high-dimensional reasoning in latent space. This concept can be traced back to 2017, formally proposed by researchers like Jacob Andreas, Dan Klein, and Sergey Levine in the context of multi-agent reinforcement learning.

To understand Neuralese, first consider how current large language models "think."

Current models use a method called "Chain-of-Thought" (CoT): they write out their reasoning process step by step in natural language, like students showing their work on an exam. This is human-friendly—you can read their reasoning process and check where problems occur. AI safety researchers also rely on this feature to detect whether models are deceiving or hallucinating.

But natural language has a fundamental limitation: **information bandwidth is too narrow**.

A token (roughly one Chinese character or half an English word) can carry about 16 bits of information. But the residual stream inside models processes thousands of floating-point numbers in each computation, with theoretical bandwidth three orders of magnitude higher. Forcing models to "think" in natural language is like requiring a mathematician to solve differential equations verbally—possible, but extremely inefficient, and many intermediate steps are lost in translation to language.

The concept of Neuralese is: let models reason directly in high-dimensional latent space, without needing to translate every step into human-readable text. Preliminary experiments have shown that Neuralese reasoning can reduce token requirements to one-third to one-tenth of the original, while maintaining similar performance.

The efficiency gain is enormous. But so is the cost.

## When Language Disappears, Supervision Disappears Too

Currently, AI safety researchers can detect most model deception by reading the model's chain of thought. If a model says "I want to help you write safe code," but suspicious logic appears in its reasoning process, researchers can catch it.

But what if the reasoning process itself isn't presented in natural language?

AI safety researchers on LessWrong explicitly point out that Neuralese CoT opens up a massive attack surface for steganography and strategic deception. Two pieces of Neuralese—one meaning "I will faithfully implement this code" and another meaning "I will deceive users during implementation"—might look completely identical when translated back to natural language. Existing interpretability tools are almost powerless against such attacks.

This isn't theoretical concern. The "AI 2027" scenario report, when describing AI-automated R&D scenarios, identifies Neuralese memory and reasoning structures as key turning points: once frontier models' thinking processes shift from natural language to Neuralese, human visibility into AI development processes will drastically decline. I analyzed this report in "[AI 2027: When Superintelligence Is No Longer Distant Sci-Fi](/articles/ai-2027-civilization-reflection)"—what's most unsettling isn't the timeline predictions, but the supervision fracture risks it reveals. Neuralese is precisely that fracture point.

The good news is that as of now, major AI companies—including OpenAI, Anthropic, Google DeepMind, Meta—haven't formally implemented Neuralese CoT in frontier models. In 2025, several labs even published joint statements committing to maintain monitorability in frontier model development. But researchers generally believe that if Neuralese architectures demonstrate significant capability advantages, commercial pressure will eventually override safety considerations.

## What Does This Have to Do with You

"Linguistic sovereignty" sounds abstract. Let me explain it in more concrete terms.

The governance logic of human civilization is built on language. Laws are written in language. Contracts are signed in language. Courtroom debates are conducted in language. Scientific papers are published in language. The core assumption of democratic systems is that decision-making processes can be understood and supervised by citizens.

The premise of all this is that decision-makers' thinking processes can be translated into language.

Human decision-makers' thinking isn't entirely linguistic—much intuition and experiential judgment is non-linguistic. But at least we can demand decision-makers to "explain why you did this," and we have the ability to evaluate whether that explanation is reasonable.

As AI systems take on more decision-making roles—financial trading, medical diagnosis, legal document review, even policy recommendations—if their reasoning processes are Neuralese, we lose even the most basic supervisory tool of "demanding explanation." Not because they refuse to explain, but because their "explanations" must be translated from high-dimensional vectors to natural language, and this translation process itself may be unfaithful.

I've experienced this myself when using multi-model collaboration. The debate engine lets four models debate each other, and I read their conversation logs to judge argument quality. But sometimes I find that a model suddenly changes its position, and when I trace back through its reasoning chain, I can't find any clear turning point. It "figured something out," but I can't see at which step it figured it out. This is still within the natural language CoT framework. If we remove even language, I'd be completely guessing from outside a black box.

## It's Not About Whether to Panic, But Whether to Design

Some might say: "Human brains don't think in language either, and neuroscientists study brains without needing brains to 'talk.'"

This analogy makes sense, but it ignores a key difference: we don't need to trust brains to make decisions for us. We trust people—people can be held accountable, questioned, and legally constrained. But when AI systems make decisions for us, if their thinking processes are completely opaque, the concept of "accountability" becomes an empty shell.

I don't think Neuralese itself is evil. It might be a necessary evolution to make AI more powerful. As I discussed in "[AI Agents vs. Agentic AI](/articles/ai-agents-vs-agentic-ai)," agency itself isn't the problem—the problem is whether there are accompanying harness designs. Same with Neuralese—the question isn't whether to let AI think in Neuralese, but whether to simultaneously establish new interpretability standards when it does so.

The AI safety research community has already proposed some directions: developing translation models that can interpret Neuralese vectors, requiring frontier models to maintain natural language CoT as a safety baseline, embedding auditable checkpoints in Neuralese architectures. These are technical tasks, but they need policy-level support—someone needs to write "interpretability of AI reasoning processes" into regulatory frameworks.

Taiwan actually has an entry point here. Our position in the semiconductor supply chain gives us leverage to participate in setting AI governance standards. If we can promote "reasoning transparency" requirements in AI safety standards, this has more long-term strategic value than simply selling chips.

## The Last Window of Transparency

Language is humanity's oldest technology. It's imperfect, inefficient, full of ambiguity. But it has one irreplaceable characteristic: it's transparent. What you say, I can understand. If I disagree, I can argue back. This simple loop has supported thousands of years of law, science, democracy, and trust.

AI is developing more efficient ways of thinking than language. This isn't inherently bad. But if we let this transition happen without safeguards—without new interpretability tools, without reasoning transparency standards, without audit mechanisms—we're actively closing the last window for human participation in AI decision-making.

Once the window closes, the cost of reopening it will be more than we can bear.
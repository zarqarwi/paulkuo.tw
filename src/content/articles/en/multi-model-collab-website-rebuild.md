---
title: "Multi-Model Implementation: Claude and Gemini Join Forces to Reconstruct a Website for Human and AI Reading"
description: "Through multi-model cognitive collaboration between Claude and Gemini, reconstructing the typographic order, semantic structure, and machine readability of a personal website. Implementing WebMCP standards to evolve the site from passive display to an AI Agent-accessible knowledge node."
abstract: "This article documents the complete practice of reconstructing the personal website paulkuo.tw using a dual-model cognitive collaboration framework with Claude and Gemini. The core methodology involves Claude handling output and architecture, Gemini providing questioning and verification, while the author defines requirements and order standards, forming a centaur-mode workflow. Concrete outcomes include: semantic HTML structure (article/section/aside), JSON-LD @graph structured data, llms.txt AI site documentation, four-language automatic translation pipeline, and machine-readable knowledge nodes compliant with WebMCP standards. This is not merely technical reconstruction, but an answer to 'What role should personal websites play in the AI era'—transitioning from passive display to structured knowledge infrastructure callable by AI Agents."
date: 2026-02-22
pillar: ai
tags: ["多模型協作", "WebMCP", "人機協作", "Claude", "Gemini", "語意化HTML", "知識管理"]
draft: false
readingTime: 4
---

Recently, I finally completed my personal website. I've owned the domain name for years but left it idle. Thanks to rapid AI development, I didn't hand-code every line, nor did I entrust my expectations to those "one-click generation" tools—because the faster they generate, the more bugs appear. Looking good doesn't mean the information has order.

I used desktop Claude while simultaneously running Gemini Pro, letting these two leading non-human intelligences cross-collaborate and mutually verify as we built the system together. This isn't about "opening multiple chat windows," but rather the concrete practice of what I've been exploring—multi-model cognitive collaboration frameworks: Claude handles output and architecture, Gemini handles questioning and verification; I'm responsible for defining requirements, logical boundaries, tone, style, and order standards. Through implementation, establishing centaur-mode workflows.

## Why Go Through All This Trouble?

Because AI (or any tool) claiming "one-click generation" often gives us visual efficiency while stripping away the nuance and real needs of application scenarios. When I examine those high-efficiency webpage products, I don't see "completion" but disorder behind efficiency: loose English typography spacing forced onto Chinese square characters makes text look like scattered sand—messy and tasteless.

Good collaborative systems (like the human body and all organisms) must deliver resources to the right places; good thought carriers must allow meaning to be accurately read. So for this website construction, I defined three objectives: reconstructing order, improving readability, and establishing callable knowledge structures.

## First Layer: Reclaiming Chinese Characters' "Weight" and "Cohesion"

Typography isn't decoration—it's the physical interface of thought. Chinese reading rhythm differs completely from English. English relies on letter spacing and word boundaries for natural segmentation; Chinese depends on character density, line spacing rhythm, and punctuation breathing to create understanding gradients. Using default Western typography makes Chinese feel light and scattered, causing readers' attention to leak through the gaps in every line.

Therefore, I required the AI to set aside "default aesthetics," return to language itself, and redefine typography rules specific to Traditional Chinese—for example, using `text-justify: inter-ideograph` for alignment that better suits Chinese characteristics, more restrained character spacing and paragraph rhythm to "gather" text, returning content from "flighty webpage feel" to "quiet magazine column tranquility."

Making readers feel comfortable, making design templates a visual structure that encourages slow, contemplative reading.

## Second Layer: Writing for Humans and AI Agents

**Machine-readable Authority**

Future internet traffic will largely be first read, summarized, and then retold to humans by AI Agents (like Gemini, Perplexity, and other systems with retrieval and summarization capabilities). If the webpage foundation is chaotic—unclear heading hierarchies, misused semantic tags, content structure cobbled together just for layout—then AI reads it like garbled code. It can "recognize words" but cannot "understand meaning," making reliable citation and attribution even harder.

So I had Claude and Gemini mutually verify each other, using Google's upcoming WebMCP standard to add two things to the website:

1. **Rigorous semantic HTML structure**—putting "paragraphs, sections, quotes, annotations" in their proper places
2. **JSON-LD structured data**—clearly explaining articles, authors, topics, timelines, and related content in machine-parseable ways

This isn't about pleasing search engines, but building longer-term capability: when future AI tries to understand "who continuously explores the intersection of circular economy and AI," it can precisely parse out—this is a knowledge base with context, methodology, and thought systems, not fragmented information farming.

## Third Layer: Implementing WebMCP, Making Thought Callable "Nodes"

Evolving intelligence won't stop at text but will "incarnate"—connecting with real-world actions, retrieval, and decision processes. I implemented WebMCP (Web Model Context Protocol), advancing the website from passive display billboard to something more like "interactive knowledge system": I encapsulated article retrieval as callable tool interfaces, making "reading" not just human eye scanning but also something AI agents can directly call, query, locate, and return more reliably.

This signifies an emerging paradigm shift: from "human reading" toward "human-machine co-reading"—when your AI assistant visits websites, it no longer needs to guess DOM, scrape screens, simulate clicks, but can understand and retrieve perspectives in structured ways.

## Conclusion: Multi-Model Collaboration as "Order Engineering"

Through deep AI interaction during the New Year period, this was a field experiment in "multi-model cognitive collaboration." We're entering an era about to be flooded by AI content, redefining content economics. Facing this structural anxiety, rejecting AI is useless; blindly following single AI is equally ineffective.

The better approach is to personally engage, actually explore, ensuring we always maintain mastery over "defining order": utilizing multiple perspectives of non-human intelligence to collide, question, and verify each other, then determining values, tone, and direction.

Technology can accelerate output, but order determines how far civilization can go.

---

*Note: Google launched WebMCP (Web Model Context Protocol) preview in Chrome 146 in February 2026, dubbed by the industry as "the Schema.org moment for Web actions." Past SEO provided AI with "nouns" (who I am, what the article is); WebMCP provides AI with "verbs" (help me search articles, help me contact the author). With WebMCP, AI agents no longer need to "screenshot webpages, find buttons, simulate clicks" like blind people feeling an elephant, but can directly call specialized tools on websites.*
---
title: "Multi-Model Implementation: Claude and Gemini Collaborate to Rebuild a Website for Both Human and AI Readability"
description: "Through cognitive collaboration between Claude and Gemini, rebuilding the typography order, semantic structure, and machine readability of a personal website. Introducing WebMCP standards to evolve the site from passive display into a knowledge node callable by AI agents."
abstract: "This article documents the complete practice of rebuilding the personal website paulkuo.tw using a dual-model cognitive collaboration framework between Claude and Gemini. The core methodology involves Claude handling output and architecture, Gemini providing questioning and validation, while the author defines requirements and order standards, forming a centaur-mode workflow. Concrete results include: semantic HTML structure (article/section/aside), JSON-LD @graph structured data, llms.txt AI site documentation, four-language automatic translation pipeline, and machine-readable knowledge nodes compliant with WebMCP standards. This is not merely technical reconstruction, but an answer to 'what role should personal websites play in the AI era'—transforming from passive display to structured knowledge infrastructure callable by AI agents."
date: 2026-02-22
pillar: ai
tags: ["多模型協作", "WebMCP", "人機協作", "Claude", "Gemini", "語意化HTML", "知識管理"]
draft: false
readingTime: 6
---

Recently, I finally completed my personal website. I had purchased the domain name years ago but left it dormant. Thanks to the rapid development of AI, I didn't hand-code every line, nor did I entrust my expectations to those "one-click generation" tools—because the faster they generate, the more bugs they produce. Looking pretty doesn't mean the information has order.

I used desktop Claude while simultaneously running Gemini Pro, allowing these two top-tier non-human intelligences to cross-collaborate and mutually proofread as we built the system together. This isn't "opening multiple chat windows," but the concrete practice of what I've been exploring—a multi-model cognitive collaboration framework: Claude handles output and architecture, Gemini handles questioning and validation; I handle defining requirements, logical boundaries, tone and style, and order standards. Through implementation, establishing a centaur-mode workflow.

## Why Go to Such Great Lengths?

Because AI (or any tools) that claim "one-click generation" often give us visual efficiency while stripping away the nuance and real needs of application scenarios. When I examine those high-efficiency web products, I don't see "completion," but disorder behind the efficiency: loose English typography spacing forced onto Chinese square characters, text like scattered sand, appearing chaotic and tasteless.

A good collaborative system (like the human body and all living organisms) must deliver resources to the right places; a good vehicle for thought must allow meaning to be accurately read. So for this website build, I defined it as three things: rebuilding order, enhancing readability, and establishing callable knowledge structures.

## First Layer: Reclaiming the "Weight" and "Cohesion" of Chinese Characters

Typography isn't decoration—it's the physical interface of thought. Chinese reading rhythm is completely different from English. English relies on letter spacing and word boundaries for natural segmentation; Chinese relies on character density, line spacing rhythm, and punctuation breathing to create slopes of understanding. If we use default Western typography, Chinese becomes light and scattered, and readers' attention flows away through the gaps in every line.

Therefore, I asked AI to first set aside "default aesthetics" and return to the language itself, redefining typography rules specific to Traditional Chinese. For example, using `text-justify: inter-ideograph` to make line alignment more suited to Chinese characteristics, more restrained character spacing and paragraph rhythm to "gather" the text, bringing content back from "frivolous web feel" to "the quiet feeling of print columns."

Making readers feel comfortable, making design templates a visual structure that encourages people to slow down and read.

## Second Layer: Writing for Humans and AI Agents

**Machine-readable Authority**

A high percentage of future internet traffic will first be read, summarized, and then retold to humans by AI agents (like systems such as Gemini and Perplexity with retrieval and summarization capabilities). If the webpage foundation is a mess—unclear heading hierarchies, misused semantic tags, content structure just stacked for layout—then AI reads it like garbled code. It can "recognize words" but cannot "understand meaning," making it even harder to establish reliable citation and attribution.

So I had Claude and Gemini mutually proofread, using Google's upcoming WebMCP standard to add two things to the website:

1. **Rigorous semantic HTML structure**—putting "paragraphs, sections, quotes, annotations" back where they belong
2. **JSON-LD structured data**—clearly expressing articles, authors, topics, timelines, and related content in machine-parseable ways

This isn't to please search engines, but to establish a more long-term capability: when future AI tries to understand "who is continuously exploring the intersection of circular economy and AI," it can precisely parse out—this is a knowledge base with context, methodology, and ideological framework, not fragmented information farms.

## Third Layer: Introducing WebMCP, Making Thoughts Callable "Nodes"

Evolving intelligence won't stop at text but will become "incarnate"—connecting with real-world actions, retrieval, and decision-making processes. I introduced WebMCP (Web Model Context Protocol), advancing the website from a passive display board to something more like "an interactive knowledge system": I encapsulated article retrieval into callable tool interfaces, making "reading" not just eye scanning but also directly callable, queryable, locatable, and returnable by AI agents in more reliable ways.

This signifies an emerging paradigm shift: from "human reading" toward "human-machine co-reading"—when your AI assistant visits a website, it no longer needs to guess DOM, scrape screens, or simulate clicks, but can understand and obtain perspectives in structured ways.

## Conclusion: Multi-Model Collaboration is "Order Engineering"

Through deep interaction with AI during the New Year period, this was a field experiment in "multi-model cognitive collaboration." We're entering an era about to be flooded by AI content and where the content economy will be redefined. Facing this structural anxiety, rejecting AI is useless; blindly following a single AI is equally ineffective.

A better approach is to get involved yourself, actually explore, and ensure you always maintain mastery over "defining order": utilize multiple perspectives of non-human intelligence to collide, question, and proofread each other, then determine values, tone, and direction.

Technology can accelerate output, but order determines how far civilization can go.

---

*Note: In February 2026, Google released a preview of WebMCP (Web Model Context Protocol) in Chrome 146, called the "Schema.org moment for web actions" by the industry. Past SEO provided AI with "nouns" (who I am, what the article is); WebMCP provides AI with "verbs" (help me search articles, help me contact the author). With WebMCP, AI agents no longer need to "screenshot pages, find buttons, simulate clicks" like blind people feeling an elephant, but can directly call specialized tools on websites.*
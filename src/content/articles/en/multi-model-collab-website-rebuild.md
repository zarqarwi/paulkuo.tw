---
title: "Multi-Model Implementation: Claude and Gemini in Partnership to Rebuild a Website That's Readable by Both Humans and AI"
description: "Through multi-model cognitive collaboration between Claude and Gemini, rebuilding the typographical order, semantic structure, and machine readability of a personal website. Implementing WebMCP standards to evolve the site from passive display to a knowledge node callable by AI Agents."
abstract: "This article documents the complete practice of rebuilding the personal website paulkuo.tw using a dual-model cognitive collaboration framework between Claude and Gemini. The core methodology assigns Claude responsibility for output and architecture, Gemini for questioning and validation, while the author defines requirements and order standards, forming a centaur-mode workflow. Concrete achievements include: semantic HTML structure (article/section/aside), JSON-LD @graph structured data, llms.txt AI site documentation, four-language automatic translation pipeline, and WebMCP-compliant machine-readable knowledge nodes. This is not merely technical refactoring, but an answer to 'What role should personal websites play in the AI era'—transforming from passive display to structured knowledge infrastructure callable by AI Agents."
date: 2026-02-22
pillar: ai
tags: ["多模型協作", "WebMCP", "人機協作", "Claude", "Gemini", "語意化HTML", "知識管理"]
draft: false
cover: "/images/covers/multi-model-collab-website-rebuild.jpg"
readingTime: 4
---

Recently, I finally completed my personal website. I had purchased the domain name years ago but left it idle. Thanks to the rapid development of AI, I didn't hand-code every line, nor did I entrust my expectations to those "one-click generation" tools—because the faster the generation, the more bugs emerge. Looking beautiful doesn't mean the information has order.

I used desktop Claude while simultaneously running Gemini Pro, having these two leading non-human intelligences cross-collaborate, mutually proofread, and build the system together with me. This isn't "opening multiple chat windows," but the concrete practice of what I've been exploring—a multi-model cognitive collaboration framework: Claude handles output and architecture, Gemini handles questioning and validation; I handle defining requirements, logical boundaries, tone, and order standards. Through implementation, establishing a centaur-mode workflow.

## Why Go to Such Great Lengths?

Because AI tools (or any tools) claiming "one-click generation" often give us visual efficiency while stripping away the nuance and real needs of application scenarios. When I examined those high-efficiency webpage products, what I saw wasn't "completion," but disorder behind efficiency: loose English typography character spacing forced onto Chinese square characters, text scattered like sand, appearing chaotic and tasteless.

Good collaborative systems (like the human body and all living organisms) must get resources to the right places; good vessels for thought must allow meaning to be accurately read. So in building this website, I defined three objectives: rebuild order, enhance readability, and establish a callable knowledge structure.

## First Layer: Reclaiming the "Weight" and "Cohesion" of Chinese Characters

Typography isn't decoration—it's the physical interface of thought. The reading rhythm of Chinese is completely different from English. English relies on letter spacing and word boundaries for natural word segmentation; Chinese depends on character density, line spacing rhythm, and punctuation breathing to create gradients of understanding. Using default Western typography makes Chinese feel light and scattered, causing readers' attention to leak away in the gaps between lines.

Therefore, I asked AI to first abandon "default aesthetics" and return to language itself, redefining typographical rules specific to Traditional Chinese—for example, using `text-justify: inter-ideograph` for line alignment more suitable to Chinese characteristics, more restrained character spacing and paragraph rhythm to "gather" the text, returning content from "frivolous webpage feeling" to "the quiet dignity of print columns."

Making readers feel comfortable, making design templates into visual structures that encourage people to slow down and read.

## Second Layer: Writing for Humans and AI Agents

**Machine-readable Authority**

A significant proportion of future web traffic will first be read, summarized, and then relayed to humans by AI Agents (like Gemini, Perplexity—systems with retrieval and summarization capabilities). If the webpage foundation is chaotic—unclear heading hierarchies, misused semantic tags, content structure cobbled together just for layout—then AI reading it is like looking at garbled code. It can "recognize characters" but cannot "understand meaning," making reliable citation and attribution even more difficult.

So I had Claude and Gemini mutually proofread, using Google's upcoming WebMCP standard to add two things to the website:

1. **Rigorous semantic HTML structure**—putting "paragraphs, sections, quotes, annotations" back where they belong
2. **JSON-LD structured data**—clearly expressing articles, authors, topics, timelines, and related content in machine-parseable ways

This isn't to please search engines, but to establish a more long-term capability: when future AI tries to understand "who is continuously exploring the intersection of circular economy and AI," it can precisely parse that this is a knowledge base with context, methodology, and thought system—not fragmented information farming.

## Third Layer: Introducing WebMCP to Make Thoughts "Callable Nodes"

Evolving intelligence won't remain in text but will become "incarnate"—connecting with real-world actions, retrieval, and decision processes. I introduced WebMCP (Web Model Context Protocol) to advance the website from a passive display billboard to something more like an "interactive knowledge system": I encapsulated article retrieval into callable tool interfaces, making "reading" not just human eye scanning, but something AI agents can directly call, query, locate, and return in more reliable ways.

This signals a paradigm shift taking shape: from "human reading" toward "human-machine co-reading"—when your AI assistant visits a website, it no longer needs to guess DOM, scrape screens, and simulate clicks, but can understand and obtain perspectives in structured ways.

## Conclusion: Multi-Model Collaboration as "Order Engineering"

Through deep AI interaction during the New Year period, this was a field experiment in "multi-model cognitive collaboration." We're entering an era about to be flooded with AI content, redefining the content economy. Facing this structural anxiety, rejecting AI is useless; blindly following single AI is equally ineffective.

The better approach is to personally engage, actually explore, ensuring we always maintain mastery of "defining order": utilizing multiple perspectives of non-human intelligence to collide, question, and proofread each other, then determining values, tone, and direction.

Technology can accelerate output, but order determines how far civilization can go.

---

*Note: Google launched the WebMCP (Web Model Context Protocol) preview in Chrome 146 in February 2026, called by the industry the "Schema.org moment for Web actions." Past SEO provided AI with "nouns" (who I am, what the article is); WebMCP provides AI with "verbs" (help me search articles, help me contact the author). With WebMCP, AI agents no longer need to "screenshot webpages, find buttons, simulate clicks" like blind people feeling an elephant, but can directly call dedicated tools on websites.*
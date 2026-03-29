---
title: "Knowledge Management Relies on Pipelines, Not Self-Discipline"
subtitle: "Clipping 50 articles daily but never revisiting them—the problem isn't you, it's the system."
description: "A hands-on record of building a fully automated knowledge pipeline with APIs, cron scheduling, and AI Skills. From Get Notes collection, daily sync, three-tier classification engine to AI real-time queries—how one person can make fragmented knowledge automatically find its place."
abstract: |
  Every day I clip dozens of articles on my phone, save podcast notes, and dump meeting transcriptions into folders—then never open them again. This isn't laziness; it's a system design problem. After getting the Get Seed recording card and integrating it with Get Notes, I found the daily information flow even more overwhelming. Fortunately, Get Notes has an API. Through their OpenAPI, a Python script, crontab scheduling, and a Cowork Skill, I automated the entire knowledge pipeline from collection to classification to querying. This isn't about recommending apps—it's sharing my current knowledge pipeline toolkit. The pipeline will continue to evolve and optimize.
date: 2026-03-29
updated: 2026-03-29
pillar: ai
tags:
  - 知識管理
  - 自動化
  - API
  - AI Skill
  - 管線思維
cover: "/images/covers/knowledge-pipeline-not-discipline.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine 專用欄位 ===
thesis: "知識管理的瓶頸不是收集，而是分類與取用。用 API + cron + AI Skill 建立自動管線，比靠自律維持手動整理習慣可靠一百倍。"
domain_bridge: "知識管理 × 軟體工程管線思維 × AI 人機協作"
confidence: high
content_type: case-study
related_entities:
  - name: Get筆記
    type: Product
  - name: Claude
    type: Technology
  - name: Cowork Skill
    type: Framework
  - name: crontab
    type: Technology
reading_context: |
  適合每天大量閱讀但苦於知識散落各處的知識工作者。不需要程式背景，但對「自動化」和「系統思維」有興趣的人會特別有共鳴。如果你用過 Notion、Obsidian、Readwise 但最後都放棄了，這篇寫的就是你的痛點。
---

I counted—just in the first two weeks of March, I saved nearly two hundred items in Get Notes. Articles, podcast summaries, course notes from DeDao App, meeting transcription records. When saving them, I always thought "I'll definitely read this later."

Then what? Nothing.

Opening the app, everything was crammed on the same timeline—course notes mixed with grocery lists. That in-depth article about AI Agent architecture I saved three weeks ago had been buried under twenty other items, lost somewhere in the digital void.

This scenario must sound familiar. Friends around me face the same struggle: they build beautiful databases, maintain them for three days, then never touch them again. Users of other tools also suffer—just agonizing over which plugins to use and how to design tags exhausts all their organizational energy.

The problem is clear: collection isn't hard, organization is. And organization is difficult because we treat it as a habit that requires "self-discipline" to maintain.

But self-discipline is the world's most unreliable resource.

## A Different Approach: What If Organization Doesn't Require Human Involvement?

One insight from [the engineering capacity one person plus AI can achieve](/articles/super-individual-case-study) is: any process requiring continuous manual human intervention will eventually collapse. Not due to lack of self-discipline, but because the maintenance cost of manual processes scales linearly with data volume, while our attention doesn't grow exponentially.

Software engineering has a concept called pipeline—data flows from A to B to C, each stage automatically triggering the next, requiring no human oversight. CI/CD is a pipeline, ETL is a pipeline, even your home dishwasher is a kind of pipeline: dirty dishes go in, clean dishes come out, you don't need to stand there washing each one.

Could knowledge management become a pipeline too? I don't know—let's try building one and see.

## Four Stages: Collection → Sync → Classification → Usage

The entire pipeline breaks down into four stages. (For the complete picture, check out this [interactive flowchart](/knowledge-pipeline-flowchart.html).)

**Collection** happens on mobile. Get Notes serves as my unified entry point: see a good article, save it; hear something insightful in a podcast, save it; DeDao App course notes sync automatically without manual intervention; drop meeting recordings in, AI automatically transcribes and summarizes. The key to this layer is "single entry point." Everything goes into Get Notes, no fragmentation.

**Sync to local machine** via a Python script. Get Notes has an OpenAPI, so I wrote `sync_notes.py`, with crontab set to run automatically every night at 23:00. It only pulls new notes (incremental sync), converts them to Markdown format and stores them in the local `notes/` folder. When I wake up, yesterday's saved items are already quietly waiting on my computer.

**Automatic classification**—this is the most thoughtful part of the entire pipeline, and what I'm most proud of.

**Usage**—classified notes can be searched via full-text search or queried in natural language through Cowork Skill. "Help me find that article about lobsters," and it searches the API, returning results. No need to remember filenames or which folder things are in.

## Three-Tier Classification Engine: Helping Every Note Automatically Find Its Home

The classification engine uses a three-tier fallback architecture. Each note runs from top to bottom, stopping at the first tier that matches.

The first tier is **recording card detection**. Get Notes recording notes come with a "recording card note" tag. When the script detects this tag, it routes to the meeting recording folder. Inside, notes are further sorted by keywords into eight project subfolders—SDTI ones, CircleFlow ones, investor meetings—each finding its proper place.

The second tier is **course series detection**—my most satisfying design. DeDao App course articles hide a `courseArticleId` parameter in their URLs. All articles from the same course share the same courseArticleId. My script parses this ID and matches it against a dynamic registry called `_course_registry.json`.

The brilliance of this registry is its auto-expansion capability. When the script encounters a previously unknown courseArticleId, it doesn't freeze—it automatically creates a new folder, registers this course in the registry, and begins filing. Next time it encounters other articles from the same course, it knows where to send them.

I don't need to modify code every time I start a new course. The system recognizes new courses by itself.

The third tier is **keyword classification**—the most basic but most reliable fallback strategy. The script scans note titles plus the first 300 characters of content, matching against a keyword library to sort into corresponding topic folders: AI & Technology, Healthcare, Investment & Finance, Personal Growth, Life Miscellany... Notes that don't match any category go to "Others"—at least they don't vanish into the void.

The three-tier priority order is crucial: recording cards are most certain (explicit tags), course series are moderately certain (structured IDs), keywords are fuzzy matching but broadest coverage. Every note has a destination.

## Why Not Manual Tagging?

During pipeline construction, I repeatedly tried manual tagging. Conclusion: it doesn't work.

Not technically—it doesn't work from a human nature perspective. When you save an article, your mind thinks "this is useful," not "which layer of which tag system should this go in?" Requiring users to make classification decisions at the moment of collection also consumes cognitive resources.

The second problem is tag drift. The tag system you design in January feels wrong by March, but you can't go back and retag hundreds of notes from the previous two months. Tag system maintenance cost scales with content volume, and it's retroactive—changing rules once means reprocessing all historical data.

The advantage of automatic classification: when rules change, just re-run the script. The cost for one hundred notes equals that for ten thousand.

## From "Organization" to "Retrieval"

After building the pipeline, what changed my workflow wasn't just faster "organization"—"retrieval" also became more user-friendly. I can directly access data in Claude's interface and output the content I need.

Previously, saved items were as good as unsaved because they were inconvenient to find. Now I can directly say in Cowork "Have I saved any articles about circular economy recently?" The Skill searches the API and lists matching notes with summaries. I can say "Help me check where I left off in Wan Weigang's course," and it reads the progress index in `_series_meta.json`.

Knowledge management's goal isn't "storing well"—it's "being able to use." The pipeline solves not just organization problems but bridges the gap between collection and usage.

This follows the same logic as [making paulkuo.tw AI-Ready through continuous optimization](/articles/ai-ready-continuous-optimization): don't make people adapt to systems, make systems adapt to people. Leave website optimization to automatic loops, knowledge organization to automatic pipelines. Reserve human energy for tasks that truly require judgment.

## One Pipeline, One Attitude

Looking back, this pipeline isn't technically complex. A Python script, a crontab schedule, a JSON registry, a Cowork Skill. No machine learning, no vector databases, no sophisticated NLP.

But it solved a problem that had been troubling me.

Previously, whenever I saw knowledge management articles, I'd be drawn to that "building a second brain" narrative, then spend a weekend building Notion templates, designing tag systems, writing usage guidelines—only to return to square one two weeks later. Not because the tools were bad, but because that approach fundamentally bets against human nature: it bets you'll have energy to manually organize every day. But I can't possibly have sufficient focus every day.

Pipeline thinking doesn't bet on human nature. It bets on API stability, cron punctuality, and program logic correctness. The reliability of these three things exceeds any person's self-discipline.

If you're also anxious about knowledge management, my suggestion isn't to find better apps or prettier templates. Instead, collaborate with AI, abandon traditional SOPs, and ask yourself: in your process, which steps don't actually need you? Which can be delegated? Hand over the steps that don't need you to pipelines and AI. Keep "reading, thinking, connecting, creating" for yourself.

I think that's what knowledge management should look like. Of course, this is my personal version—you can develop your own.
---

## Pipeline Output Examples

- [AI Lobster Decameron](/lobster-decameron-en) — A structured overview of ten livestream conversations by Kuaidao Qingyi, co-founder of Dedao App, synced and organized through the knowledge pipeline.

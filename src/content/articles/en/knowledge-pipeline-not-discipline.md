---
title: "Knowledge Management Runs on a Pipeline, Not Discipline"
subtitle: "When you clip 50 articles a day but never read them again, the problem isn't you—it's the system."
description: "Building a fully automated knowledge pipeline using APIs, cron scheduling, and AI Skills. From collection in Get筆記 to daily syncing, three-layer classification, and real-time AI queries—one person can make fragmented knowledge organize itself."
abstract: |
  Every day I clip a dozen articles on my phone, save podcast notes, buy Get Seed voice cards, integrate them into Get筆記, and dump meeting transcripts into folders. The information volume keeps growing. Fortunately, Get筆記 already has an API. Through its OpenAPI, a Python script, crontab scheduling, and a Cowork Skill, I've automated the entire knowledge pipeline—from collection to classification to retrieval. This isn't about which app to use. It's about sharing one approach to knowledge management that works for me right now. And like any pipeline, it'll keep evolving.
date: 2026-03-29
updated: 2026-03-29
pillar: ai
tags:
  - Knowledge Management
  - Automation
  - API
  - AI Skill
  - Pipeline Thinking
cover: "/images/covers/knowledge-pipeline-not-discipline.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine 專用欄位 ===
thesis: "The bottleneck in knowledge management isn't collection—it's classification and retrieval. Building an automated pipeline with API + cron + AI Skill is a hundred times more reliable than relying on discipline to maintain manual organization habits."
domain_bridge: "Knowledge Management × Software Engineering Pipeline Thinking × Human-AI Collaboration"
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
  Best for knowledge workers who consume vast amounts of content daily but struggle with fragmented information. No programming background required, but those interested in automation and systems thinking will resonate most. If you've tried Notion, Obsidian, or Readwise but gave up, this article describes your exact problem.
---

I counted: in just the first two weeks of March, I saved nearly two hundred things to Get筆記. Articles, podcast summaries, course notes from the 得到 app, word-for-word meeting transcripts. Each time I saved them, I thought, "I definitely need to read this later."

Then nothing.

I open the app and everything's jammed into one timeline. Course notes mixed with grocery lists. That deep-dive piece on AI Agent architecture from three weeks ago? Buried under twenty newer items somewhere I can't find.

You know this scene. My friends have the same struggle, no matter what tool they use: they set up beautiful databases and abandon them after three days. People using other tools suffer too. They exhaust their organizing energy just arguing about plugins and tag design.

The problem is obvious: collection isn't hard. Organization is. And organization is hard because we treat it as a habit that requires "discipline" to maintain.

But discipline is the least reliable resource on Earth.

## What if organizing required no human intervention?

One insight from the work I do with AI: any process that requires continuous human intervention eventually breaks down. Not because you lack discipline, but because the maintenance cost of manual processes grows linearly with data volume, while your attention doesn't.

Software engineering has a concept called a pipeline—data flows from A to B to C, each step automatically triggering the next, no human required. CI/CD is a pipeline. ETL is a pipeline. Your dishwasher is basically a pipeline: dirty plates go in, clean plates come out, you don't stand there washing one by one.

What if knowledge management could be a pipeline too? I didn't know if it would work, but I decided to try.

## Four Stages: Collection → Sync → Classification → Use

The whole pipeline breaks down into four stages. (For the full picture, check out this [interactive flowchart](/knowledge-pipeline-flowchart-en.html).)

**Collection** happens on your phone. Get筆記 is my single entry point: find a good article, save it; hear something on a podcast, save it; course notes from the 得到 app sync automatically without extra steps; meeting recordings get transcribed and summarized by AI automatically. The key here is having one single funnel. Everything goes to Get筆記. No fragmentation.

**Sync to local machine** via a Python script. Get筆記 has an OpenAPI, so I wrote `sync_notes.py` and set crontab to run it automatically at 11 PM every night. It only pulls new notes (incremental sync), converts them to Markdown, and stores them in my local `notes/` folder. I wake up, and everything from yesterday is already waiting in my computer, quietly.

**Auto-classification** is where the pipeline gets intricate—and where I'm most proud of it.

**Use** means the classified notes are fully searchable, and you can also query them in natural language through a Cowork Skill. "Find that article about lobsters," and it searches the API, pulls the results. No filename memory needed. No folder memory needed.

## Three-Layer Classification Engine: Let Every Note Find Its Home

The classification engine uses a three-layer fallback architecture. Each note runs down from the top, and stops at the first match.

**Layer One is recording tag detection.** Get筆記's audio notes come with a "voice note" tag. The script detects this tag and sorts them into a meeting recordings folder. Then they're subdivided by keyword into eight project subfolders—SDTI, CircleFlow, investor meetings, each to its place.

**Layer Two is course series detection**, which I'm most proud of. Articles from the 得到 app have a `courseArticleId` parameter hidden in the URL. All articles from the same course share the same courseArticleId. My script parses this ID and matches it against a dynamic registry file called `_course_registry.json`.

The clever part: it self-expands. When the script encounters an unfamiliar courseArticleId, it doesn't freeze up. Instead, it automatically creates a new folder, registers the course, and starts filing. Next time it sees another article from that course, it knows exactly where to put it.

I don't need to edit code every time a new course starts. The system learns new courses on its own.

**Layer Three is keyword classification**, the simplest but most reliable fallback. The script scans the note title and first 300 characters of content against a keyword library, sorting into topic folders: AI & Technology, Health, Investing, Personal Growth, Life Notes, etc. Anything that doesn't fit anywhere else goes to "Other"—at least it doesn't disappear into the void.

The three-layer priority matters: voice notes are most certain (explicit tag), course series are next most certain (structured ID), keywords are fuzzy but broadest coverage. Every note has a home.

## Why Not Use Manual Tags?

While building the pipeline, I tried using manual tags repeatedly. The conclusion: it doesn't work.

Not technically impossible—humanly impossible. When you're saving an article, you're thinking "this is useful," not "what layer of my tag taxonomy does this belong to?" Asking people to make classification decisions at the moment of capture is also expensive cognitive work.

The second problem: tags drift. Your January tag system looks wrong by March, but you can't go back and re-tag hundreds of notes from the past two months. Maintaining a tag system scales linearly with content volume, and it's retroactive—change a rule once and you have to reprocess all historical data.

With auto-classification, you just rerun the script. One hundred notes or ten thousand: same cost.

## From "Organization" to "Retrieval"

After building the pipeline, what really changed my workflow wasn't just faster organizing—it was making retrieval genuinely useful. I can jump directly into Claude's window to pull data and produce whatever I need.

Before, saving something was like not saving it, because I'd never find it. Now I can jump into Cowork and say "any articles on circular economy lately?", the Skill searches the API, lists matching notes with summaries. I can say "show me where I left off in that Wan Wei Gang course," and it reads the progress index from `_series_meta.json`.

The goal of knowledge management isn't storing well—it's being able to use it. The pipeline solves the organization problem *and* fills the gulf between collection and retrieval.

This mirrors the logic in my work on [AI-Ready continuous optimization](/articles/ai-ready-continuous-optimization): don't make people adapt to systems, make systems adapt to people. Give website optimization to automated loops, knowledge organization to automated pipelines. Save human energy for things that actually need judgment.

## One Pipeline, One Philosophy

Looking back, this pipeline isn't technically complex. One Python script, one cron job, one JSON registry, one Cowork Skill. No machine learning. No vector databases. No fancy NLP.

But it solved a problem that's been nagging me.

Every time I'd read about knowledge management, I'd get seduced by the "build your second brain" narrative, spend a weekend setting up a Notion template, designing my tag system, writing usage rules—and two weeks later I'm back where I started. Not because the tools are bad, but because this approach bets against human nature: it bets you'll have the energy to manually organize every day. You won't. I can't maintain enough focus every day.

Pipeline thinking doesn't bet on human nature. It bets on API stability, cron punctuality, and logic correctness. Those three things are more reliable than anyone's discipline.

If you're also anxious about knowledge management, my advice isn't to find a better app or prettier template. Instead, collaborate with AI, drop the traditional SOP, and ask yourself one question: Which steps in this flow don't actually need me? Which can I hand off? Give the steps that don't need you to the pipeline and AI. Keep for yourself the parts that do—reading, thinking, connecting, creating.

That's what knowledge management should look like. Of course, this is my personal version. You can develop your own.

---
title: "Paid Three Years of Subscription Fees, Then Built a Better Solution Myself"
subtitle: "The core of AI collaboration isn't coding — it's articulating problems clearly"
description: "How someone who can't code used AI collaboration to build a real-time multilingual meeting translation tool. A complete record from pain point to implementation, and what this process reveals about the essence of AI literacy."
abstract: |
  I paid three years of Good Tape subscription fees, with zero usage in the final month before expiration — because I already had my own tool. This article documents how someone with a background spanning theology, agricultural e-commerce, and circular economy built a real-time multilingual meeting translation tool called "Agora Square" through AI collaboration, without an engineering identity. The tool itself isn't the point — the point is that this process showed me clearly: effective collaboration with AI requires not coding skills as the core capability, but the ability to structure problems, break them into phases, and describe them clearly. This ability is now more valuable than any programming language.
date: 2026-03-12
updated: 2026-03-12
pillar: ai
tags:
  - AI協作
  - 超級個體
  - 即時翻譯
  - 語音辨識
  - AI素養
cover: "/images/covers/ai-collab-realtime-translator.jpg"
featured: false
draft: false
readingTime: 6

# === AI / Machine 專用欄位 ===
thesis: "AI 協作的核心能力不是寫程式，而是把問題說清楚——這個能力，現在比任何程式語言都值錢。"
domain_bridge: "AI協作 × 超級個體 × 語音辨識技術 × 數位轉型實戰"
confidence: high
content_type: case-study
related_entities:
  - name: Qwen3-ASR
    type: Concept
  - name: Groq
    type: Organization
  - name: Deepgram
    type: Organization
  - name: Claude Haiku
    type: Concept
  - name: 阿哥拉廣場
    type: Concept
reading_context: |
  適合想用 AI 工具但沒有工程背景的創業者、BD、顧問。也適合對 AI 協作方法論有興趣、想理解「AI 素養」實際是什麼意思的讀者。
---

My transcription service Good Tape, which I've used for nearly three years, just expired today. I pulled up the bill and calculated: €476, roughly NT$17,000. I was on the Pro plan. Checked this month's usage: 20 hours remaining.

## Why I Wanted to Build My Own

Because AI Agents are advancing too rapidly! They've already changed how we work. Plus I frequently have meetings — Taiwan-Japan, Chinese-English, occasionally with Southeast Asian partners.

To be fair, Good Tape was a good tool three years ago. It's made by a Danish team, focusing on security and accuracy. But it solved "after-the-fact" problems: record audio, upload it, wait for the transcription to process. No real-time recognition, no translation, no summarization.

I paid €476 (about NT$17,000) over three years for transcription functionality. Having such capability was already surprising at the time, but if it could work "in the moment" — during an ongoing meeting where Japanese speech could be instantly displayed in Chinese — that would be even better. Not having to slowly organize things after the meeting.

Current real-time translation competitors in the market:

- **Transync AI** — $8.99/month (10 hours), functionality closest to what I want, with real-time voice translation + meeting summaries + 60 languages. But requires app installation, and excess hours need additional hour cards ($7.99/10hr starting). More usage, higher cost.
- **JotMe** — $9-15/month, 107 languages, but tied to Chrome Extension
- **Wordly** — Enterprise pricing, sold by the hour, 10-hour minimum
- **KUDO** — Annual licensing, undisclosed pricing, targeting large enterprises
- **Palabra** — Requires desktop app installation, tied to specific meeting software

What I wanted was actually quite simple: usable by opening a browser, no installation required, works on both mobile and desktop, can assist understanding during meetings with foreigners through AI, with transparent and controllable costs. As I shared the other day, I decided to build it myself.

## The Tool Is Called "Real-time Meeting Records | Agora Square," Deployed on My Personal Website

- 🎙 **Real-time Voice Recognition** — Text appears as you speak, not after recording ends
- 🌍 **12-Language Real-time Translation** — Chinese, English, Japanese, Korean, Vietnamese, Thai, Indonesian, German, Spanish, French, Portuguese
- 📋 **AI Meeting Summaries** — One-click generation of key points + action items + decisions
- 📖 **Glossary** — Custom terminology mapping to ensure translation consistency
- 🖥 **Subtitle Mode** — Full-screen black background with large text for conference room projection
- ⬇️ **Full Text Export** — TXT / CSV, can be imported into Excel
- 💰 **Real-time Cost Tracking** — Transparent visibility of every API call cost
- 🔐 **Three-layer Authentication** — Google / LINE / Facebook OAuth + invitation codes

Frontend: 2,533 lines, Backend: 2,148 lines. One HTML file plus one Cloudflare Worker.

## The Most Interesting Technical Part: Three-way Speech Recognition Routing

Speech recognition isn't just about picking one API provider. Different languages have different optimal solutions. Automatically switches engines based on language:

- 🇹🇼 **Chinese** → Qwen3-ASR (Alibaba Cloud Qwen team, WebSocket streaming)
- 🇺🇸 **English** → whisper-large-v3-turbo (LPU hardware acceleration, 200×+ real-time speed)
- 🌐 **Other Languages** → Deepgram Nova-3 (WebSocket streaming)

Translation uniformly uses Claude Haiku 4.5 (Anthropic) with streaming output — translation results appear character by character, not waiting for complete translation before display. Besides considering output quality, cost was also factored in.

- **Groq**: $0.02/hr, cheapest for English
- **Qwen**: ~$0.40/hr, 97%+ Chinese recognition rate, accurate with professional terminology (also supports dialects)
- **Deepgram**: $200 free credit, handles multiple languages

A 1-hour Chinese-English meeting costs approximately $0.50 USD in API calls. NT$16. To put this in perspective: the €476 I spent on Good Tape equals over 950 meetings with the self-built tool. Transync AI's $8.99/month for a year is $108, the same money could cover 216 meetings.

## But What This Article Really Wants to Say Isn't About Technology

The process of building this tool was actually a learning process for "how to collaborate with AI." I'm not an engineer. My background is in life sciences, theology, agricultural e-commerce, circular economy, etc. Programming is very difficult for me. Although my first startup was building Fintech SAAS, the entire tool and service relied on a seven-person team's assistance.

I have a feeling that collaborating with AI requires not just programming ability, but a new kind of literacy (I still can't articulate it clearly).

### Breaking Down Problems Is More Important Than Writing Code

Groq integration doesn't work with just "help me add Groq." I broke it into two phases: Phase A — backend first creates the API endpoint, deploys, verifies connectivity. Phase B — frontend implements language routing to automatically switch engines based on selected language.

Each phase is independently verifiable. If something breaks, only half breaks, not the entire system. This breakdown wasn't taught by AI — I learned it from multiple failures. Trying to do too much at once, running out of tokens mid-process or context compression would break previously correct parts.

### Asking the Right Questions Is More Effective Than Having AI Write Directly

Not saying "help me make a translation tool." But rather: "The existing WebSocket proxy mode can't be used with Groq because it's a REST API, not WebSocket. The frontend needs to change to chunked HTTP mode, POSTing audio segments every 3 seconds. Will the onstop + restart cycle have race conditions?"

This kind of question gets useful answers.

### Code Review After Writing Features Isn't the End

I asked Claude to check the just-written code from an engineering perspective. It actually caught three issues: Groq failures going completely silent during continuous failures, MediaRecorder closure safety issues, and animation effects not triggering with the new engine.

I wouldn't have discovered these three bugs myself. But I knew to "ask this question."

### AI Won't Proactively Monitor for You

Fitbit health data was broken for several days — I only discovered it when I happened to ask. The root cause was a function missing a parameter, causing silent failures on every scheduled execution. AI won't wake up at night to check if your system is broken. You need to know what to ask and when to ask it.

## This Is a New Kind of Work Experience

In the past, we talked about "information literacy" — knowing how to search and judge information authenticity. Now we might need "AI literacy":

- Knowing how to break large problems into small problems AI can handle
- Knowing how to describe technical constraints so AI gives executable solutions
- Knowing when to trust AI output and when to verify yourself
- Knowing where AI's capability boundaries are — it can help you write, research, and review, but won't proactively think about what should be done

This isn't exclusive to engineers. This is a capability everyone who wants to effectively use AI needs.

I can't code, but I wanted to collaborate with AI to build a real-time translation tool (building software at the drop of a hat has become reality).
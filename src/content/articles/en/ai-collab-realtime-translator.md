---
title: "Paid for Three Years of Subscription, Then Built My Own Better Solution: A Solo × AI Real-Time Meeting Translation Development Story"
subtitle: "The core of AI collaboration isn't coding—it's articulating problems clearly"
description: "A non-programmer using AI collaboration to create a real-time multilingual meeting translation tool. A complete record from pain point to implementation, and what this process reveals about the essence of AI literacy."
abstract: |
  I paid for three years of Good Tape subscription, with zero usage in the final month before expiration—because I already had my own tool. This article documents how someone with a background spanning theology, agricultural e-commerce, and circular economy, without an engineering identity, used AI collaboration to create "Agora Square," a real-time multilingual meeting translation tool. The tool itself isn't the point—the point is that this process made me realize: effective AI collaboration requires not coding skills, but the ability to structure problems, break them into phases, and describe them clearly—a capability that's now more valuable than any programming language.
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

My Good Tape transcription service that I've used for nearly three years just expired today. Pulling out the bills to calculate: €476, roughly NT$17,000. I was on the Pro plan. Checking this month's usage: still 20 hours remaining.

## Why I Wanted to Build My Own

Because AI Agents are advancing too rapidly! They've already transformed work patterns. Plus, I frequently have meetings—Taiwan-Japan, Chinese-English, occasionally with Southeast Asian partners.

To be fair, Good Tape was a good tool three years ago. This Danish team's product emphasized security and accuracy. But it solved "post-meeting" problems: record audio, upload, wait for transcription completion. No real-time recognition, no translation, no summarization.

Over three years, I paid €476 (roughly NT$17,000) for transcription functionality. Having such capability was already impressive then, but if it could work "in the moment"—during ongoing meetings, instantly seeing Chinese when the other party speaks Japanese—that would be even better. Not slowly organizing afterwards.

Current real-time translation competitors in the market:

- **Transync AI** — $8.99/month (10 hours), features closest to what I need, with real-time voice translation + meeting summaries + 60 languages. But requires app installation, and additional hour packages beyond the limit ($7.99/10hr starting). More usage = higher cost.
- **JotMe** — $9-15/month, 107 languages, but tied to Chrome Extension
- **Wordly** — Enterprise pricing, buy by hour, minimum 10 hours
- **KUDO** — Annual licensing, undisclosed pricing, targeting large enterprises
- **Palabra** — Requires desktop app installation, tied to specific meeting software

What I wanted was actually simple: open browser and use, no installations, works on phone and computer, can assist with understanding during meetings with foreigners through AI, with transparent and controllable costs. As I shared the day before yesterday, I decided to build it myself.

## The Tool is Called "Real-Time Meeting Record | Agora Square," Deployed on My Personal Website

- 🎙 **Real-Time Voice Recognition** — Text appears as you speak, not after recording
- 🌍 **12-Language Real-Time Translation** — Chinese, English, Japanese, Korean, Vietnamese, Thai, Indonesian, German, Spanish, French, Portuguese
- 📋 **AI Meeting Summary** — One-click generation of key points + action items + decisions
- 📖 **Glossary** — Custom terminology mapping for consistent translation
- 🖥 **Subtitle Mode** — Full-screen black background with large text for conference room projection
- ⬇️ **Full Export** — TXT / CSV, importable to Excel
- 💰 **Real-Time Cost Tracking** — Transparent visibility of each API call cost
- 🔐 **Three-Layer Authentication** — Google / LINE / Facebook OAuth + invitation codes

Frontend: 2,533 lines, Backend: 2,148 lines. One HTML file plus one Cloudflare Worker.

## Most Interesting Technical Aspect: Three-Way Speech Recognition Routing

Speech recognition isn't just picking one API provider. Different languages have different optimal solutions. Automatic engine switching based on language:

![Three-Way Speech Recognition Routing Architecture](/images/articles/ai-collab-realtime-translator-stt-routing.png)

- 🇹🇼 **Chinese** → Qwen3-ASR (Alibaba Cloud Qwen team, WebSocket streaming)
- 🇺🇸 **English** → whisper-large-v3-turbo (LPU hardware acceleration, 200×+ real-time speed)
- 🌐 **Other Languages** → Deepgram Nova-3 (WebSocket streaming)

Translation unified with Claude Haiku 4.5 (Anthropic), using streaming output—translation results appear character by character, not waiting for complete translation. Besides considering output quality, cost was also factored in.

- **Groq**: $0.02/hr, cheapest for English
- **Qwen**: ~$0.40/hr, 97%+ Chinese recognition accuracy, precise with technical terms (dialect support too)
- **Deepgram**: $200 free credit, handles multilingual

A 1-hour Chinese-English meeting costs approximately $0.50 USD in API calls. NT$16. Converting: my €476 spent on Good Tape equals over 950 meetings with the self-built tool. Transync AI's $8.99/month for a year is $108, same money covers 216 meetings.

## But This Article's Real Point Isn't About Technology

The process of building this tool was actually a learning process of "how to collaborate with AI." I'm not an engineer. My background spans life sciences, theology, agricultural e-commerce, circular economy, etc. Programming is very challenging for me. Although my first startup was a Fintech SAAS, the entire tool and service relied on a seven-person team's assistance.

I have a feeling that collaborating with AI requires more than just programming ability—it should be a new type of literacy (I can't articulate it clearly yet).

### Problem Decomposition More Important Than Writing Code

Groq integration isn't accomplished by simply saying "help me add Groq." I broke it into two phases: Phase A—backend first creates API endpoint, deploys, verifies connectivity. Phase B—frontend implements language routing, automatically switching engines based on selected language.

Each phase is independently verifiable. If something breaks, only half breaks, not everything. This breakdown wasn't taught by AI—I learned from multiple failures that trying to do too much at once leads to token exhaustion or context compression, breaking previously correct parts.

### Asking Right Questions More Effective Than Having AI Write Directly

Not saying "help me make a translation tool." But rather: "The existing WebSocket proxy mode won't work with Groq because it's REST API, not WebSocket. Frontend needs to change to chunked HTTP mode, POSTing 3-second audio segments. Will the onstop + restart cycle have race conditions?"

This type of question yields useful answers.

### Completion Isn't the End—Code Review Needed

I asked Claude to check the just-written code from an engineering perspective. It actually caught three issues: Groq continuous failures being completely silent, MediaRecorder closure security problems, animation effects not triggering on new engines.

I wouldn't have discovered these three bugs myself. But I knew to "ask this question."

### AI Won't Proactively Monitor for You

Fitbit health data was broken for several days—I only discovered it by chance inquiry. Root cause was a function missing one parameter, every scheduled execution failing silently. AI won't wake up at midnight to check if your system is broken. You need to know what to ask and when to ask.

## This is a New Work Sensation

Previously we talked about "information literacy"—knowing how to search and judge information authenticity. Now we might need "AI literacy":

- Knowing how to break big problems into AI-manageable small problems
- Knowing how to describe technical constraints for AI to provide executable solutions
- Knowing when to trust AI output and when to verify yourself
- Knowing AI's capability boundaries—it can help you write, search, review, but won't proactively think about what you should do

This isn't engineers' exclusive domain. This is the capability everyone who wants to leverage AI effectively needs.

I can't write code, but I wanted to collaborate with AI to create a real-time translation tool (casually building software has become reality).
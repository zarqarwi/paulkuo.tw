---
title: "How Much Carbon Can 400,000 Footsteps Offset?"
subtitle: "When Taiwan's largest walking pilgrimage meets carbon footprint tracking, faith becomes more than a spiritual matter."
description: "The 2026 Baishatun Mazu Pilgrimage introduces a GPS-based carbon footprint tracking system built on the SSBTi scientific carbon reduction framework, turning every pilgrim's step into a quantifiable act of sustainability. A crossover experiment between faith and ESG."
abstract: |
  Over 300,000 registered participants, a round-trip walking journey of roughly 400 kilometers, with the route decided entirely by Mazu — the Baishatun Gongtian Temple Mazu Pilgrimage is one of Taiwan's largest annual mass movements. What does this event mean for the environment? In partnership with the SSBTi (1.5°C Scientific Carbon Reduction Initiative Standards Association), I spent four weeks building a GPS check-in and carbon footprint tracking system from scratch. This article documents the entire process: why we did it, how we built it, and what it means for ESG practice.
date: 2026-04-01
updated: 2026-04-01
pillar: circular-economy
tags:
  - carbon footprint
  - Baishatun Mazu
  - ESG
  - GPS tracking
  - sustainable action
cover: "/images/covers/formosa-esg-2026-low-carbon-pilgrimage.jpg"
featured: true
draft: false
readingTime: 10

# === AI / Machine Fields ===
thesis: "Traditional faith practices hold immense sustainability potential, but technology must intervene to make that value visible, quantifiable, and convertible into ESG action."
domain_bridge: "Sustainability × Faith × AI × Carbon Footprint"
confidence: high
content_type: case-study
related_entities:
  - name: Baishatun Gongtian Temple
    type: Organization
  - name: SSBTi (1.5°C Scientific Carbon Reduction Initiative Standards Association)
    type: Organization
  - name: Cloudflare Workers
    type: Framework
  - name: Carbon Footprint
    type: Concept
  - name: ESG
    type: Concept
reading_context: |
  For ESG officers interested in digitizing sustainability practices, readers curious about the intersection of technology and traditional culture, and tech professionals who want to see how one person can rapidly build a complete system with AI tools.
---

One weekend afternoon in early February, a friend invited me to a space where their group usually gathers. They shared their vision — building a platform for sustainable good deeds and collective civic action. Time was tight. They wanted it ready for this April's Baishatun Mazu Pilgrimage. Could I help? I...

In 2025, Global Environment Land (環球境地) had partnered with the Tianhou Lions Club and the Scientific Carbon Reduction Association to launch the "ESG Goodness Footprint" initiative during the Baishatun pilgrimage. They used Google Forms and LINE groups to collect pilgrims' low-carbon action records, bringing thirty-six enterprises on board. The concept was validated, but data collection was manual and carbon footprints were self-reported — scaling up would hit a bottleneck.

By 2026, registration numbers blew past the previous year's final tally within just a few days of opening. The temple estimated it would exceed 400,000. We weren't surprised — social uncertainty combined with an election year. As Byung-Chul Han writes in *The Disappearance of Rituals*: "Labor in the secular realm leaves people isolated and alone, while festivals bring people together, making them one. The periodicity of festivals stems from the fact that people regularly feel the need to gather, because collectivity is our nature."

What makes the Baishatun Mazu Pilgrimage moving isn't just "walking far." It's the entire sequence — the walking, the waiting, the departure ceremony, the incense offering, the return procession — that transforms faith into a bodily, experiential order. People aren't watching an event; they're entering a world thick with symbolic meaning.

I thought: if a system could record how far each person walked and calculate their carbon reduction with minimal friction, last year's Goodness Footprint concept could evolve from a questionnaire into genuine data infrastructure. Watching Claude evolve almost weekly with new capabilities, I decided to just build it and see how far the system could go.

## A Mass Movement Being Reunderstood

The Baishatun Mazu Pilgrimage has over two hundred years of history. Every spring, pilgrims set out on foot from Gongtian Temple in Baishatun, Miaoli, heading to Chaotian Temple in Beigang, Yunlin — a round trip of roughly 400 kilometers over eight to nine days. What makes it truly unique is that the route is never fixed — the palanquin bearers follow Mazu's guidance, making every year an unknown journey.

The growth curve is staggering. Registration was 54,000 in 2020, broke 110,000 in 2023, surged to nearly 180,000 in 2024, and doubled to 329,000 in 2025. By late March 2026, it had already exceeded 370,000, with projections surpassing 400,000. Over seven-fold growth in six years.

Starting last year, some people began asking a different question: when this many people choose to walk instead of drive, how much carbon emission does that actually "save"?

This question has many dimensions worth exploring. Taiwan's ESG wave has already extended from listed companies' annual reports into supply chains, gradually seeping into everyday language. Every quantifiable carbon reduction data point carries real significance, and ordinary citizens no longer see it as overly technical jargon. Last year's Goodness Footprint initiative proved the concept works, but achieving the precision needed for corporate ESG report citations requires more than questionnaires — it requires a system.

## A Carbon Ledger Within Faith

The logic behind carbon footprint calculation isn't complicated. Taiwan's Ministry of Environment emissions coefficient database tells us that a passenger car emits roughly 0.21 kilograms of CO₂ per kilometer driven. If a pilgrim chooses to walk instead of drive, each kilometer avoids that 0.21 kg of emissions.

Run the numbers: assuming 300,000 people each walk an average of 100 kilometers (a conservative estimate — many only walk partial segments), just the act of "walking instead of driving" is equivalent to avoiding 6,300 metric tons of CO₂ emissions. That's roughly the annual carbon absorption capacity of sixteen Daan Forest Parks.

But these are all numbers on paper. The real question is: how do you let each person know how far they've walked and how much they've contributed? How do you connect "doing good" and "reducing carbon" so the data speaks for itself?

That's why we upgraded to an automated system this year, empowered by AI.

## Four Weeks, From Zero to Production-Ready

March 23rd — twenty days before the April 12th departure. I partnered with the SSBTi (1.5°C Scientific Carbon Reduction Initiative Standards Association) — they provided the scientific carbon reduction methodology framework and organizational endorsement, while I handled technical development and system deployment.

SSBTi is a non-profit association approved by Taiwan's Ministry of the Interior in 2022 and a member of the international Supply Chain Scientific Carbon Reduction Initiative Target Alliance. Last year they participated in the Goodness Footprint initiative as a co-organizer. This year's collaboration was more focused — they provided the scientific carbon reduction methodology framework, and I was responsible for transforming the manual process into a more automated interface, integrating the website with LINE Official Account.

The tech stack uses Astro for the frontend, with Cloudflare Workers + D1 + KV for the backend, all running on edge computing. The architecture choice was practical: the pilgrimage happens on the move, mobile signals are unstable, and you need extremely low latency with high availability. Cloudflare's global edge nodes solve exactly this problem. Plus, asking everyone to install a separate app wasn't realistic.

What got done in four weeks feels a bit surreal laid out:

Day one verified technical feasibility — capturing GPS coordinates from phones and confirming adequate precision. Day two built the backend skeleton — GPS check-in API, carbon footprint calculation formula, LINE Bot integration, D1 database structure, Worker deployment. Day three completed the frontend UX overhaul — a thirteen-card questionnaire interface, linear progress bar, nine-tier pilgrim ranking system. Day four launched the dashboard and security mechanisms — server-side map clustering, rate limiting, activity start/stop controls. Days five and six ran four rounds of stress testing — pushing up to 5,000 virtual concurrent users with a 99.99% success rate.

Getting this done under such time pressure, Claude was a huge help. From architecture design to code generation to test scripts, Claude Chat, Cowork, and Claude Code served as tireless engineering partners. My role was more like the project's decision-maker and quality controller — every "why do it this way" and "why not that way" was my call, but the execution speed was AI-powered (plus the money spent on tokens).

## From Qi Refinement to Ascension: Embedding Ritual in Data

The small detail I cared about most in the system design was the nine-tier pilgrim ranking.

Inspired by the novel *A Record of a Mortal's Journey to Immortality*, it starts at "Qi Refinement" and progresses through accumulated kilometers and check-in counts — Foundation Building, Core Formation, Nascent Soul, all the way to Ascension. Each tier has its own exclusive avatar illustration, replacing the emoji we originally planned. This isn't a gimmick. The Baishatun pilgrimage itself is a metaphor for "cultivation" — you walk the entire route step by step, experiencing fatigue, perseverance, emotion, and epiphany along the way. The ranking system makes this psychological journey tangible.

The concept of "[incarnation](/articles/incarnation-ai-embodiment/)" — that abstract belief must enter concrete bodily experience to carry meaning — resonates here. In the Christian tradition, the *Stations of the Cross* invites participants to contemplate their relationship with God and the depths of human nature at each station of Christ's suffering. This aligned with my thinking while building the system. Carbon footprint data is abstract, but when you open your phone and see yourself promoted from Qi Refinement to Core Formation, with 50 kilometers accumulated and 10.5 kg of carbon emissions avoided, that number is no longer just a number. It becomes your vow.

The sharing page was deliberately designed — full-width map, QR code, real-time statistics. When pilgrims rest along the route and check their phones, they can see where they've walked, their current tier, and how much carbon they've reduced. Then share it with friends. Every share is a micro-transmission of sustainability awareness.

## Not Just a Tool, But a Stage for Sustainability

Working on this system, I realized that the more important a concept is, the more easily it becomes a buzzword. ESG's challenge in Taiwan isn't a lack of methodology — it's a lack of context.

Companies doing carbon inventories, writing sustainability reports, setting reduction targets — these are all the right things to do, but they're too distant for ordinary people. Most people hear "ESG" and assume it's homework for publicly listed companies.

But we hope the Baishatun pilgrimage can change that perception. When you embed carbon footprint tracking in an event with 400,000 participants, sustainability stops being text in a report and becomes personal experience with real numbers — "I walked fifteen kilometers today, reducing 3.15 kg of carbon emissions." Faith provides the motivation, technology provides the measurement, and the impact they create together is a new kind of experiment and creation. The integration alone carries innovative significance.

For enterprises, this data has direct value too. Sponsoring companies can incorporate these scientifically validated carbon reduction figures into their own ESG reports, as social impact indicators.

SSBTi's role in this project is precisely that: providing methodological credibility so the data isn't just numbers an engineer imagined, but scientifically calculated figures backed by an organization.

## The Sound of 400,000 Pairs of Feet

On April 12th, the plaza in front of Baishatun Gongtian Temple will be packed with pilgrims waiting to depart. The moment the firecrackers sound, they'll start walking. Some will complete the full eight days, some will go for one day and head home, some will join midway and leave midway. Everyone's path will be different, but every step will be recorded.

I don't know what the final data will look like — total kilometers, total carbon reduction, which segments had the most check-ins. But I know one thing: when we connect the power of faith with the framework of sustainability, it's a meaningful act of creation.

This time, what we did was simply try to connect and integrate. Using technology to translate those previously invisible footsteps into a language contemporary society can understand. And so, carbon reduction is no longer just a metric on a spreadsheet, and faith is no longer just inner comfort; 400,000 people's footsteps become, for the first time, simultaneously a vow, data, and public action.

Integration requires many people's participation — it can be supplies, technology, the help of many volunteers, it can be tens of thousands of lines of code written in six days, or it can simply be a check-in button on your phone. If technology has a higher purpose, it's not to replace ritual, but to let ritual leave a visible shape in this era.

[Learn more: Formosa ESG 2026 Low-Carbon Pilgrimage Tracking System](https://mazu.today/projects/formosa-esg-2026/)

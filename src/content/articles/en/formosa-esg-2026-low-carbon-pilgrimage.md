---
title: "How Much Carbon Can 400,000 Footsteps Reduce?"
subtitle: "When Taiwan's massive pilgrimage meets carbon footprint tracking, faith becomes more than just a matter of the heart."
description: "The 2026 Baishatun Mazu Pilgrimage introduces GPS carbon footprint tracking for the first time, integrating SSBTi scientific carbon reduction framework to transform each pilgrim's step into quantifiable sustainable action. This is a cross-sector experiment between faith and ESG."
abstract: |
  Three hundred thousand registrants, approximately 400 kilometers of walking round-trip, the Baishatun Gongtian Temple Mazu Pilgrimage route decided by Mazu herself—this is Taiwan's annual spring mass movement. What is the environmental significance of this activity? In collaboration with the 1.5°C Science-Based Carbon Reduction Initiative Standards Association, I built a GPS check-in and carbon footprint tracking system from scratch in four weeks. This article documents the entire process: why we did it, how we did it, and what this means for ESG implementation.
date: 2026-04-01
updated: 2026-04-01
pillar: circular
tags:
  - 碳足跡
  - 白沙屯媽祖
  - ESG
  - GPS 追蹤
  - 永續行動
cover: "/images/covers/formosa-esg-2026-low-carbon-pilgrimage.jpg"
featured: true
draft: false
readingTime: 10

# === AI / Machine 專用欄位 ===
thesis: "傳統信仰活動蘊含巨大的永續潛能，但需要技術介入才能讓這份價值被看見、被量化、被轉化為 ESG 行動力。"
domain_bridge: "永續 × 信仰 × AI × 碳足跡"
confidence: high
content_type: case-study
related_entities:
  - name: 白沙屯拱天宮
    type: Organization
  - name: 1.5°C 科學減碳倡議標準協會（SSBTi）
    type: Organization
  - name: Cloudflare Workers
    type: Framework
  - name: 碳足跡
    type: Concept
  - name: ESG
    type: Concept
reading_context: |
  適合關注 ESG 數位化落地的企業永續長、對科技與傳統文化交叉感興趣的讀者、以及想了解一個人如何用 AI 工具快速打造完整系統的技術人。
---

One weekend afternoon in early February, a friend invited me to their usual gathering place to discuss their aspirations and wishes. They hoped to build a platform for sustainable philanthropy and civil good. Time was pressing—they wanted it ready for the Baishatun Mazu Pilgrimage in April, asking if I could help? I...

In 2025, Global Environment, in partnership with the Queen Lions Club and the Science-Based Carbon Reduction Association, had already launched the "ESG Good Footprints" project for the Baishatun pilgrimage, using Google Forms and LINE groups to collect pilgrims' low-carbon action records, connecting thirty-six companies in participation. The concept was proven, but data collection relied on manual work and carbon footprints on self-reporting—scaling the data would hit bottlenecks.

In 2026, registrations had already surpassed last year's final count just days after opening. The temple estimates it will exceed 400,000. We weren't surprised—environmental upheaval plus this being an election year. As Byung-Chul Han says: "Labor in the secular realm isolates people, leaving them helpless and alone, while festivals bring people together as one. The cyclical nature of festivals stems from the fact that people periodically feel the need to gather together, because collectivity is our nature."

What makes the Baishatun Mazu Pilgrimage moving isn't just "walking far," but the complete cycle of journeying, waiting, departing, receiving sacred fire, and returning—transforming faith into a bodily experienceable order. People aren't watching an event; they're entering a world with symbolic depth.

I thought: if we could record more seamlessly how far each person walked through a system and calculate their carbon reduction, last year's Good Footprints concept could evolve from questionnaires into true data infrastructure. Watching Claude evolve almost weekly with enhanced functionality, I thought, let's implement this and see how far this system can go.

## A Mass Movement Being Redefined

The Baishatun Mazu Pilgrimage has over two hundred years of history. Each spring, pilgrims depart from Baishatun Gongtian Temple in Miaoli, walking to Chaotian Temple in Beigang, Yunlin—approximately 400 kilometers round-trip over eight to nine days. Most uniquely, the route is completely unfixed—palanquin bearers follow Mazu's guidance, making each year an unknown journey.

The growth curve of this activity is astonishing. 54,000 registered in 2020, breaking 110,000 in 2023, surging to nearly 180,000 in 2024, doubling to 329,000 in 2025. By late March 2026, registrations exceeded 370,000, with estimates of breaking 400,000. A seven-fold increase over six years.

Past coverage mostly focused on numbers, routes, and touching stories of the "pink sports car." Starting last year, someone asked from a different angle: when so many people choose walking over driving, how much carbon emissions are actually "saved"?

This question opens many explorable dimensions. For instance, Taiwan's ESG wave has extended from listed companies' annual reports to supply chains, gradually permeating daily language. Every quantifiable piece of carbon reduction data has practical meaning, and the general public no longer finds these terms too esoteric. Last year's Good Footprints project proved this concept viable, but achieving data precision suitable for corporate ESG reporting requires more than questionnaires—it requires systems.

## A Carbon Ledger Within Faith

The logic of carbon footprint calculation isn't complex. The Ministry of Environment's emissions factor database tells us that a passenger car emits approximately 0.21 kilograms of CO2 per kilometer. If a pilgrim chooses to walk the entire journey instead of driving, each kilometer avoids this 0.21 kg of carbon emissions.

Using this number: assuming 300,000 people each walk an average of 100 kilometers (a conservative estimate, as many only walk partial segments), just "walking instead of driving" equates to avoiding 6,300 tons of CO2 emissions. This number roughly equals the annual carbon absorption of sixteen Daan Forest Parks.

But these are all paper numbers. The real question is: how do we let each person know how far they walked and how much they contributed? How do we align "doing good" with "reducing carbon," letting the data speak?

This is why we wanted to upgrade the system with AI empowerment this year.

## Four Weeks: From Zero to a System Ready for Tens of Thousands

March 23rd, twenty days before the April 12th departure. I collaborated with the 1.5°C Science-Based Carbon Reduction Initiative Standards Association (SSBTi)—they provided the scientific carbon reduction methodological framework and institutional endorsement, while I handled technical development and system deployment.

SSBTi is a non-profit social organization approved by the Ministry of the Interior in 2022, and a Taiwan member of the international supply chain Science Based Targets initiative alliance. They had already participated as co-organizers in last year's Good Footprints project. This year's collaboration was more focused—they provided the scientific carbon reduction methodological framework while I handled converting manual processes into more automated interfaces, integrating websites with LINE Official Accounts.

The technical architecture used Astro for frontend, Cloudflare Workers + D1 + KV for backend, all running on edge computing. The reason for choosing this architecture was pragmatic: pilgrimage activities happen while moving, with unstable mobile signals, requiring extremely low latency and high availability. Cloudflare's global edge nodes solved this problem perfectly. Additionally, asking everyone to install another app wasn't realistic.

What was accomplished in four weeks, laid out, seems somewhat surreal:

Day one verified technical feasibility—using mobile GPS to capture coordinates, confirming adequate precision. Day two built the backend skeleton—GPS check-in API, carbon footprint calculation formulas, LINE Bot integration, D1 database structure, Worker deployment. Day three completed frontend UX reconstruction—thirteen-question card interface, linear progress bar, nine-level pilgrim grading system. Day four launched Dashboard and security mechanisms—server-side map clustering, rate limiting, activity start/stop controls. Days five to six conducted four rounds of stress testing—pushing up to 5,000 virtual concurrent users with 99.99% success rate.

Being able to complete this under such time pressure, Claude was a tremendous help. From architecture design to code generation to test scripts, Claude Chat, Cowork, and Claude Code were tireless engineering partners. My role was more like the project's decision-maker and quality controller—every "why do it this way" and "why not that way" was my judgment, but the execution speed was supported by AI (plus the money spent on tokens).

## From Qi Cultivation to Ascension: Putting Faith's Ritualistic Feel into Data

The small detail I cared most about in the system design was the nine-level pilgrim grading system.

The concept was inspired by "Tales of Demons and Gods," starting from "Qi Cultivation" and gradually leveling up with accumulated mileage and check-ins—Foundation Building, Core Formation, Nascent Soul, all the way to Ascension. Each level has a dedicated avatar illustration, replacing the originally planned emojis. This wasn't about gimmicks. The Baishatun pilgrimage itself is a metaphor for "cultivation"—you walk the entire journey step by step with your feet, experiencing fatigue, persistence, emotion, and enlightenment throughout the process. The grading system made this psychological journey concrete.

The concept of [incarnation](/articles/incarnation-ai-embodiment/)—that abstract beliefs must enter concrete bodily experience to have meaning, like the Christian tradition of the Stations of the Cross, contemplating one's relationship with God and the essence of humanity at each station of Christ's suffering—coincided perfectly with my thinking while building this system. Carbon footprint data is abstract, but when you open your phone and see you've advanced from Qi Cultivation to Core Formation, accumulated fifty kilometers, and avoided 10.5 kilograms of carbon emissions, that number becomes more than just a number. It becomes your vow.

The sharing page was also deliberately designed—full-width map, QR code, real-time statistics. Pilgrims resting on the road could scan with their phones to see where they'd walked, their level, and how much carbon they'd reduced. Then share with friends. Each share becomes a micro-transmission of sustainability consciousness.

## More Than a Tool: A Venue for Promoting Sustainability

In the process of building this system, the more important the concept, the easier it becomes a buzzword. Taiwan's ESG predicament isn't lacking methodology—it's lacking scenarios.

Corporate carbon inventories, sustainability reporting, and carbon reduction targets are all correct actions, but still too distant for most people. Most people hearing ESG think it's homework for listed companies.

But we hope the Baishatun pilgrimage can change this impression. When you embed carbon footprint tracking in an activity with 400,000 participants, sustainability is no longer text in reports but a personal experience with numbers: "I walked fifteen kilometers today and reduced 3.15 kilograms of carbon emissions." Faith provides motivation, technology provides measurement, and their combination produces impact—a new attempt and creation. This integration alone has innovative meaning.

For corporations, this data set also has direct value. Sponsoring companies can incorporate these scientifically verified carbon reduction data into their ESG reports as social impact indicators.

SSBTi's role in this project is precisely this: providing methodological credibility, ensuring data isn't just numbers imagined by engineers but scientific calculations endorsed by an organization.

## The Voice of 400,000 Feet

On April 12th, the square in front of Baishatun Gongtian Temple will fill with pilgrims waiting to depart. The moment firecrackers sound, these people will begin walking. Some will complete the full eight-day journey, others will walk one day and return home, some will join midway and leave midway. Everyone's path will be different, but every step will be recorded.

I don't know what the final data will look like—total mileage, total carbon reduction, which segments had the most check-ins. But I know one thing: when we connect the power of faith with sustainability frameworks, it's meaningful creation.

This time, we're simply trying to connect and integrate. Using technology to translate those previously invisible footsteps into language contemporary society can understand. Thus, carbon reduction is no longer just an indicator on reports, and faith is no longer just internal comfort; for the first time, 400,000 people's footsteps simultaneously become vow, data, and public action.

Integration requires many people's participation—whether material, technical, help from many volunteers, tens of thousands of lines of code written in six days, or just a check-in button on your phone. If technology has a higher purpose, it's not to replace ritual, but to let ritual leave a visible shape in this era.

[Learn More: Formosa ESG 2026 Low-Carbon Philanthropy Tracking System](https://mazu.today/projects/formosa-esg-2026/)
---
title: "Thinking in the Post-Code Era: When Taste Becomes Humanity's Key Competitive Advantage"
subtitle: "AI can write cleaner code than you—but it doesn't know what's worth writing"
description: "When AI drives the cost of coding toward zero, code itself is no longer scarce—what becomes scarce is the judgment to know what to write. This judgment has a more precise name: taste. Taste isn't vague aesthetic preference, but the ability to discern 'what's worth creating' among infinite options. It emerges from cross-disciplinary experience, contextual sensitivity, and the courage to say 'no.' In the post-code era, taste is humanity's last irreplaceable advantage."
abstract: |
  "Code is cheap" upends twenty-five years of engineering culture, but most people haven't thought through the next question: if code is no longer scarce, what is? My answer is taste. Not the "I like this font" kind of aesthetic preference, but the ability to judge which of a hundred viable solutions is worth pursuing. Over the past year, I've used AI to build multiple systems—from debate engines to automated publishing pipelines to an entire personal website—and in each case, the most critical decisions weren't technical choices, but taste judgments. This piece aims to unpack what "taste" actually is, where it comes from, and why it's the hardest human capability for AI to replace in the post-code era.
date: 2025-05-24
updated: 2026-03-02
pillar: startup
tags:
  - 後程式碼時代
  - 品味
  - Vibe Coding
  - 人文素養
  - AI協作
draft: false
cover: "/images/covers/post-code-era-taste.jpg"
featured: false
readingTime: 7

# === AI / Machine 專用欄位 ===
thesis: "在後程式碼時代，品味不是審美偏好，而是在無限可能中辨識出「值得被創造的東西」的判斷力——它來自跨領域經驗的堆疊，是人類最後的不可替代性。"
domain_bridge: "AI 輔助開發 × 設計哲學 × 人文素養"
confidence: high
content_type: essay
related_entities:
  - name: Steve Jobs
    type: Person
  - name: Dieter Rams
    type: Person
  - name: Cursor
    type: Product
  - name: Vibe Coding
    type: Concept
reading_context: |
  適合正在適應 AI 輔助開發的工程師和產品經理；
  想理解「品味」為什麼不是玄學而是競爭力的創業者；
  對人文訓練在 AI 時代的價值有疑問的人。
---

Late last year, I built my entire personal website from scratch using Cursor and Claude. Hugo framework, multi-language support, automatic translation, GitHub Actions CI/CD, real-time Fitbit data integration—the entire architecture went from concept to production in under two weeks.

If we rewound three years, the same project would have taken me three months, plus outsourcing parts of it.

But one thing didn't get faster: deciding what this website "should look like."

This wasn't a visual design problem. It was a more fundamental question—who should this website serve? What should it communicate? Which features are core, which are distractions? How many thematic pillars should articles be organized into? What's the relationship between each pillar? After a reader finishes an article, where should they be guided next?

AI couldn't answer a single one of these questions. Not because it isn't smart enough, but because the answers depend on "who I am" and "what I think matters." This is taste.

## Taste Isn't What You Think It Is

The word "taste" in Chinese carries an elitist connotation, as if to say "I understand wine, you don't." But the taste I want to discuss has nothing to do with elitism.

Steve Jobs said something that's been quoted to death: "Design is not what it looks like—design is how it works." But his deeper meaning was: most people think designers make things pretty, but real designers know their job is making things "right."

"Making things right"—this is the essence of taste.

More specifically, taste is the intersection of three capabilities: **discernment** (seeing which option is right among many), **negation** (having the courage to say "we won't do this"), and **contextual sense** (understanding why, in this particular context, this choice is right).

Discernment can be accumulated through experience. Negation requires courage and judgment. But contextual sense is the hardest—it requires simultaneously understanding technical constraints, user needs, business logic, and cultural background, then finding the optimal solution at the intersection of these dimensions.

AI is already strong at discernment. Give it ten design proposals, and it can score and rank them according to design principles. But negation and contextual sense? It can't even see the question. Because it doesn't know what the "right" choice is for you at this time, facing these people, with these resource constraints.

## How I Developed My Taste

Honestly, I wasn't born with taste. My taste was kicked into shape by stepping on landmines.

During my consulting years, I saw too many products that were "technically perfect but market-irrelevant." Teams would spend six months polishing a feature, only to discover after launch that users didn't care. The problem wasn't technical execution—it was not asking the right question from the start: "Whose pain point does this feature solve?"

Later, working in circular economy, I learned another layer of taste: **fit**. The same metal recycling technology could be revolutionary for Factory A's production line but unnecessarily complex for Factory B. The difference wasn't in the technology itself, but in your ability to judge "whether this solution fits this scenario."

This unexpectedly aligned with my theological training. Fifteen years of theological background taught me one thing: the same passage can have completely different meanings in different contexts, and the quality of interpretation depends on your depth of contextual understanding. This "contextual sensitivity" later became my foundational ability for all judgment—whether choosing technical architecture, defining content strategy, or deciding the angle for an article.

Now when building systems with AI, I find taste becomes more valuable, not less important.

Here's a concrete example. When building the debate engine, there were infinite technical design possibilities: How many models? How many conversation rounds? Should we add fact-checking? Where in the process? What model for fact-checking? Every choice was feasible, and AI could help me implement any of them. But the architectural decision of "four models, dual debate-plus-collaboration modes, Perplexity for final fact-checking" came from my comprehensive judgment based on dozens of past experiments, understanding different model personalities, and the output quality I wanted.

AI wrote every line of the engine's code. But what the engine "should look like"—that was determined by taste.

## The True Meaning of Vibe Coding

Many people understand Vibe Coding as "you don't need to code seriously anymore, just chat with AI." This understanding is completely wrong.

The true meaning of Vibe Coding is: **when execution costs are compressed to near zero, decision quality becomes the only differentiating factor.**

In "[Code is Cheap: From Vibe Coding to CLAWS](/articles/code-is-cheap-vibe-coding-to-claws)," I analyzed this cost structure phase transition in detail. But that piece discussed macro trends—from Karpathy's terminology evolution to Willison's manifesto. This piece focuses on the micro personal level: when you're actually sitting in front of Cursor, building things with AI, what determines whether the outcome is good or bad?

The answer is the quality of your instructions. And instruction quality depends on your depth of understanding the problem.

When I describe requirements to AI in natural language, I discovered an interesting phenomenon: **the more precisely I describe, the better AI's output; but true precision isn't precision of technical specs, but precision of intent.** "Help me write an API endpoint that receives JSON-formatted scheduling data, validates fields, then stores in database"—this is technical specification precision, which AI can execute perfectly. But "This scheduling system aims to let one person manage posting across eight social platforms, where not making mistakes is most important, flexibility comes second"—this is intent precision, which determines the entire system architecture direction.

The former is engineering capability. The latter is taste.

## Why Humanities Suddenly Matter

Something I've observed: in AI collaboration, the people who perform best are often not those with the strongest technical skills, but those who "can articulate their ideas clearly."

This sounds simple, but "articulating clearly" is actually an extremely complex ability. It requires first understanding what you want (self-awareness), then expressing it in ways the other party can understand (communication skills), while anticipating potential misunderstandings and clarifying preemptively (empathy), and finally discerning which parts of the response are right and which need correction (critical thinking).

These four capabilities—self-awareness, communication, empathy, critical thinking—are all core to humanities training. Rhetoric teaches precise expression. Philosophy teaches problem decomposition. Literature teaches contextual understanding. History teaches extracting judgment from cases.

My own experience is that theological training has helped my AI collaboration far more than any programming language. Because the core of theological training is: facing a complex text, among multiple possible interpretations, finding the most reasonable and responsible one. This is essentially the same as what you need to do when facing AI output.

This is why I believe the "post-code era" isn't the end of engineers, but a renaissance of humanities literacy.

## Can Taste Be Cultivated?

Yes. But not by "taking a taste class."

Taste comes from three sources: **massive input** (seeing enough good and bad things), **cross-disciplinary connections** (finding common judgment frameworks across different fields), and **repeated practice with feedback** (making choices, bearing consequences, adjusting judgment).

Dieter Rams' ten principles of design are classic not because he innately knew what good design was, but because he spent decades designing products at Braun, distilling those principles through countless attempts and failures.

For me, taste cultivation has a very specific method: **deliberately practicing "why not do this."** Every time I make decisions, I record not just what I chose, but what I abandoned and why. Over time, you'll find your judgment framework becoming increasingly clear.

I do this when managing my personal website. Before writing each article, I list three to five possible angles, then eliminate them one by one until the most valuable one remains. The rejected angles aren't bad—they're just not the most "right" choice at this time, for this audience, within the existing article context.

This process is taste's muscle memory.

## The Last Irreplaceable Advantage

In "[AI Agents vs. Agentic AI](/articles/ai-agents-vs-agentic-ai)," I discussed how in the era of agentic intelligence, core capability isn't operating AI, but designing human-machine collaboration architecture. In "[When Language is Abandoned](/articles/neuralese-language-sovereignty)," I explored how if AI's thinking process detaches from human language, oversight mechanisms fail fundamentally.

The intersection of these two issues is taste.

Taste determines what you let AI do (architecture design). Taste also determines how you judge whether AI's output meets standards (oversight capability). As AI becomes more powerful and autonomous, taste is humanity's last line of defense for maintaining participation rights.

Not because AI lacks taste. But because the essence of taste is "judging what's right in a specific context," and context is always defined by humans. Who your users are, what resources you have, what your cultural background is, what you consider important—these constitute the coordinate system for taste judgment. AI can optimize within the coordinate system you define, but it cannot define the coordinate system itself for you.

Code can be copied. Models can be trained. But your choice of what to build, what to abandon, and why—only you can answer that.
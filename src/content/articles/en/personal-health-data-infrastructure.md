---
title: Personal Health Data Infrastructure: From 10 Years of Apple Health to AI-Driven Cross-Analysis
description: We don't lack data—we lack infrastructure. This article documents how I exported over 10 years and 3 million health data points from iPhone and Apple Watch, combined with real-time Fitbit MCP integration and Claude AI, to build my own Personal Health Infrastructure and discover what no single device will ever tell you.
date: 2026-02-21
pillar: ai
readingTime: 6
---

## Personal Health Data Infrastructure

### From 10 Years of Apple Health to AI-Driven Cross-Analysis

Ten years ago, I didn't deliberately start a health program. I just kept my phone in my pocket, wore my watch on my wrist, and the days passed by.

Until recently, when I exported all data from my iPhone Health app for the first time. After decompression, it was a 1.3GB XML file. Ten years, over 3 million records—steps, heart rate, sleep, workout tracks, autonomic nervous system indicators. A history co-written by body and time, spanning my entrepreneurship, transformation, leaving comfort zones, and starting anew.

In that moment I realized: we don't lack data—we lack infrastructure.

---

### Why Build a Custom Analysis System?

Mainstream wearable devices each have closed ecosystems and proprietary algorithms, creating two fundamental problems.

**First is data silos.** Apple Health has its interpretation logic, Fitbit has its algorithms. I wear both devices simultaneously, and they're highly consistent on total sleep duration for the same night (only 2 minutes difference), but they differ by 21 minutes on deep sleep interpretation and 15 minutes on REM. Who to trust? The answer is: trust none completely, only cross-reference to see trends.

**Second is missing dimensions.** Phone apps focus on showing you "today" and "this week," they're not good at long-term trend analysis spanning three to five years, and even less capable of cross-correlating declining activity levels, deteriorating HRV, and accumulating sleep debt. Yet the relationships between these metrics are often the most important signals.

To see the full picture requires not another wearable device, but your own analytical infrastructure.

---

### Ten Years of Digital Footprints

Since August 2015, my iPhone has continuously recorded my activities. After Apple Watch joined in 2016, heart rate and sleep began being measured more precisely. Starting in 2023, Fitbit became the second wearable device, providing another independent measurement baseline.

Ten years of accumulation: 279,537 step records, 231,300 walking and running distance records, over 1.13 million heart rate records, 29,532 sleep records. For exercise, 1,420 runs, 435 bike rides, 19 swims, leaving 966 GPS workout tracks.

Starting September 2023, Apple Watch began recording deeper metrics—7,710 HRV (Heart Rate Variability) records, 753 resting heart rate records, 9,837 blood oxygen saturation records, 439 wrist temperature records, 122 VO2Max records. These are the truly valuable data from wearables: not step counts, but the operational state of the autonomic nervous system.

Numbers alone have no emotion. But when annual distributions are laid out, many things become clear.

---

### Technical Architecture: Three Data Pipelines

#### Real-time Pipeline: Fitbit → MCP → Claude

Through Anthropic's MCP (Model Context Protocol), Fitbit API connects directly to Claude Desktop.

**How it works:** I can directly tell Claude "analyze my stress load from the past week," and Claude calls the Fitbit API through MCP, retrieving sleep (including all stage durations), heart rate time series, activity summaries and other raw JSON for real-time analysis. What I get is raw data returned by the API, not summaries already translated by the app.

**Technical point:** OAuth 2.0 authentication, automatic token refresh. Runs entirely locally, data doesn't pass through third-party servers.

#### Deep Pipeline: Apple Health → XML → Structured Analysis

Apple doesn't provide Health API for personal use; the only export option is manual export from iPhone.

**Processing flow:** Use Python to stream-parse the 1.3GB XML (not attempting to load all at once), first build data type index, then extract various indicators into separate JSONs—sleep, HRV, resting heart rate, blood oxygen, etc., finally create daily and monthly aggregations.

**Pain point solved:** Apple's sleep divides into Core/Deep/REM three stages, Fitbit divides into Light/Deep/REM. Apple's Core roughly corresponds to Fitbit's Light, but algorithmic determination standards differ. During processing, only align trend directions, don't compare absolute values.

#### Automation Pipeline: CI/CD Continuous Deployment

Crontab on Mac executes update scripts every 10 minutes, pulls real-time data through Fitbit OAuth API, git push triggers GitHub Actions auto-build, Cloudflare Pages deployment. Health dashboard always stays current, from data generation to website updates, entirely without human intervention.

This isn't showing off. I don't want to occasionally look at charts. I want it to become long-running infrastructure.

---

### What the Data Really Says

When ten years of curves overlay, numbers are more honest than feelings.

#### Rise and Fall of Exercise Volume: From Daily Triathlon to Zero

In 2018, I began participating in triathlon events, at least one per year. I also joined "Daily Triathlon"—a self-discipline community where you pick one activity from swimming, cycling, or running to execute daily. I most often chose running, lowest barrier to entry, just put on shoes and go.

Starting this had two reasons. One was personal: being a role model for my son, letting him see how his father manages his own body and discipline. The other was learned from entrepreneurial experience—health is the hardware that carries all decision-making and execution capability. Almost every excellent CEO I know has regular exercise habits, even enjoys challenging extreme sports. Not because they "have time," but because they understand: the body's recovery cycles cannot be compressed.

Annual GPS track distribution records this journey: 93 tracks in 2021, 340 in 2022, 294 in 2023, 200 in 2024, 39 in 2025. 2022 had exercise records almost every day, the most thorough year of Daily Triathlon execution.

In subsequent years, work transformation, increased responsibilities, changed life structure. I didn't realize I was abandoning recovery cycles. When exercise got squeezed out of the schedule, data showed the body immediately began "debt accumulation."

#### Sleep Debt: 33 Consecutive Months Below Target

Combining Fitbit (May 2023-February 2026, 883 nights) and Apple Watch (September 2023-December 2025, 537 nights) records: 33 months, not a single month's average reached the recommended 7 hours. Overall average about 5 hours 50 minutes.

One hour less per day over three years equals over a thousand hours of sleep debt.

The trend is more concerning: 2023-2024 around 6 hours up and down, 2025 dropped to 5 hours 41 minutes, Q2 bottomed at 5 hours 16 minutes. Sleep efficiency slid from 83% to 74%. Not just sleeping less—lying down longer, but actual sleep percentage getting lower and lower. Body resting, nervous system still running.

#### HRV and Resting Heart Rate: The Most Honest Indicators

HRV declined from 42ms in 2023 to 31ms in mid-2025, a drop of over 25%. Meanwhile resting heart rate rose from 60 bpm to 72 bpm. Both lines simultaneously point to the same thing: autonomic nervous system chronically under stress.

This isn't emotional judgment, it's physiological signals. And this is Apple Watch-exclusive data—if only looking at Fitbit, I'd never know. This is precisely the value of cross-device analysis: warnings that single apps won't proactively surface become impossible to hide under multi-dimensional comparison.

---

### Lessons Learned: Data Pipeline Fragility

In this analysis, I discovered weight data completely broke after 2022. The reason was utterly mundane: the smart scale broke, and I never replaced it.

This is a typical data lesson—**hardware failure is the biggest threat to personal data infrastructure.** Once data breaks, physical changes during that period become a permanent black hole. Not unwillingness to record, but once broken, never reconnected.

Similar fragility appears in Apple Health export: this is a manually-triggered process, if not regularly exported, latest data only exists in the iPhone, unable to be analyzed externally.

Recognizing this fragility is the first step in building sustainable infrastructure.

---

### Practical Device Pairing Recommendations

26 months of dual-device overlap data led me to a set of principles: use Fitbit for total sleep duration (high coverage, 25-31 nights per month), reference Apple Watch for REM sleep (accelerometer detects micro-movements more precisely), only look at deep sleep trends not absolute values (indicator with biggest algorithmic difference between devices). HRV, resting heart rate, blood oxygen are Apple Watch's unique leading indicators.

Fitbit is the main daily tracking workhorse, Apple Watch is deep health assessment support. They complement, not replace each other.

---

### Next Steps: From Observation to Intervention

This system's next phase isn't adding charts, but three things: AI anomaly detection (when HRV stays below baseline for three consecutive days, Claude proactively sends intervention recommendations), lifestyle annotation (recording before-and-after comparisons of intervention behaviors), and more data source integration (Oura Ring temperature, smart blood pressure monitor, body composition scale—each additional pipeline adds another layer to cross-analysis dimensions).

Evolving from "looking at data" to "using data to drive behavioral change"—this is the true value of Personal Health Infrastructure.

---

### Conclusion

Ten years of data proved two things.

First, the body has always been sending signals. Declining HRV, rising resting heart rate, collapsing sleep efficiency, exercise volume reaching zero—these signals scattered across different devices all looked "within range" in their respective apps. It was the self-built analytical infrastructure that converged them into an undeniable trend.

Second, I was once capable. 1,420 runs, 435 bike rides, one triathlon per year—2022's 340 GPS tracks prove Daily Triathlon was feasible. Decline isn't destiny, it's structure.

Health shouldn't just be "how many steps today." It should be a personal system that can be verified, corrected, and continuously optimized.

Ten years of data isn't for nostalgia, but to remind myself—once trends are clearly seen, there's no reason to pretend not to see them anymore.

---

*The health data analysis dashboard from this article can be viewed at [paulkuo.tw/health](/health).*

*Technical details: Fitbit MCP setup, Apple Health XML parsing processes, Chart.js visualization, CI/CD automation pipelines, etc., welcome to contact for discussion.*
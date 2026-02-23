---
title: Personal Health Data Infrastructure：From 10 Years of Apple Health to AI-Driven Cross-Analysis
description: We don't lack data—we lack infrastructure. This article documents how I exported over 10 years and 3 million health data points from iPhone and Apple Watch, combined with real-time Fitbit MCP integration and Claude AI, to build my own Personal Health Infrastructure, revealing insights that no single device would ever tell you.
date: 2026-02-21
pillar: ai
cover: "/images/covers/personal-health-data-infrastructure.jpg"
readingTime: 6
---

## Personal Health Data Infrastructure

### From 10 Years of Apple Health to AI-Driven Cross-Analysis

Ten years ago, I didn't deliberately start a health program. I just put my phone in my pocket, wore my watch on my wrist, and days passed by.

Until recently, when I exported all data from my iPhone's Health app for the first time. After decompression, it was a 1.3GB XML file. Ten years, over 3 million records—steps, heart rate, sleep, workout routes, autonomic nervous system indicators. A history co-authored by body and time, spanning my entrepreneurship, transformation, leaving comfort zones, and starting anew.

At that moment I realized: we don't lack data—we lack infrastructure.

---

### Why Build a Custom Analysis System?

Mainstream wearable devices each have closed ecosystems and proprietary algorithms, creating two fundamental problems.

**First is data silos.** Apple Health has its interpretation logic, Fitbit has its algorithms. I wear both devices simultaneously, and they're highly consistent on total sleep duration for the same night (only 2 minutes difference), but their deep sleep readings differ by 21 minutes, REM by 15 minutes. Who to trust? The answer is: don't fully trust either—only cross-reference for trends.

**Second is dimensional gaps.** Phone apps focus on showing you "today" and "this week," not good at long-term trend analysis across three to five years, and unable to perform multi-dimensional cross-analysis between declining activity levels, deteriorating HRV, and accumulating sleep debt. Yet the correlations between these metrics are often the most important signals.

To see the full picture requires not another wearable device, but your own analytical infrastructure.

---

### Ten Years of Digital Footprints

Since August 2015, my iPhone has continuously recorded my activities. After Apple Watch joined in 2016, heart rate and sleep began being measured more precisely. From 2023, Fitbit became the second wearable device, providing another independent measurement baseline.

Accumulated over ten years: 279,537 step records, 231,300 walking and running distance records, over 1.13 million heart rate records, 29,532 sleep records. For workouts, 1,420 runs, 435 bike rides, 19 swims, leaving 966 GPS workout tracks.

Starting September 2023, Apple Watch began recording deeper metrics—7,710 HRV records, 753 resting heart rate records, 9,837 blood oxygen saturation records, 439 wrist temperature records, 122 VO2Max records. These are the truly valuable data from wearable devices: not step counts, but the operational state of the autonomic nervous system.

Numbers alone have no emotion. But when annual distributions are laid out, many things become clear.

---

### Technical Architecture: Three Data Pipelines

#### Real-time Pipeline: Fitbit → MCP → Claude

Through Anthropic's MCP (Model Context Protocol), Fitbit API connects directly to Claude Desktop.

**How it works:** I can directly tell Claude "analyze my stress load from the past week," and Claude calls the Fitbit API through MCP, retrieving sleep (including all stage durations), heart rate time series, activity summaries and other raw JSON for real-time analysis. What I get is raw data returned by the API, not summaries already translated by the app.

**Technical details:** OAuth 2.0 authentication with automatic token refresh. Runs entirely locally with no data passing through third-party servers.

#### Deep Analysis Pipeline: Apple Health → XML → Structured Analysis

Apple doesn't provide Health API for personal use—the only export is manual export from iPhone.

**Processing flow:** Use Python to stream-parse the 1.3GB XML (not attempting to load all at once), first build data type indexes, then extract various metrics into separate JSONs—sleep, HRV, resting heart rate, blood oxygen, etc., finally create daily and monthly aggregations.

**Pain point solved:** Apple's sleep has Core/Deep/REM three stages, Fitbit has Light/Deep/REM. Apple's Core roughly corresponds to Fitbit's Light, but algorithmic determination standards differ. During processing, only align trend directions, don't compare absolute values.

#### Automated Pipeline: CI/CD Continuous Deployment

Mac's crontab runs update scripts every 10 minutes, pulling real-time data through Fitbit OAuth API, git push triggers GitHub Actions auto-build, Cloudflare Pages deploys. The health dashboard always stays current—from data generation to website updates, fully automated with no manual intervention.

This isn't showing off tech skills. I don't want to occasionally look at charts. I want it to become long-term operational infrastructure.

---

### What the Data Really Says

When ten years of curves overlay, numbers are more honest than feelings.

#### Rise and Fall of Exercise: From Daily Triathlon to Zero

In 2018, I started participating in triathlon events, at least one per year. I also joined "Daily Tri"—a self-discipline community executing one of swimming, cycling, or running daily. I most often chose running—lowest barrier, just put on shoes and go.

Starting this had two reasons. One personal: being a role model for my son, showing him how a father manages his own body and discipline. Another from entrepreneurial experience—health is the hardware that carries all decision-making and execution capabilities. Almost all excellent CEOs I know have regular exercise habits, even enjoying extreme sports challenges. Not because they "have time," but because they understand: the body's recovery cycles cannot be compressed.

GPS track annual distributions recorded this journey: 93 tracks in 2021, 340 in 2022, 294 in 2023, 200 in 2024, 39 in 2025. 2022 had workout records almost daily—the most thorough year of Daily Tri execution.

In subsequent years, career transitions, increased responsibilities, lifestyle structure changes. I wasn't conscious I was abandoning recovery cycles. When exercise was squeezed out of the schedule, data showed the body immediately began "accumulating debt."

#### Sleep Debt: 33 Consecutive Months Below Target

Combining Fitbit (May 2023-Feb 2026, 883 nights) and Apple Watch (Sep 2023-Dec 2025, 537 nights) records: 33 months, not a single month's average reached the recommended 7 hours. Overall average about 5 hours 50 minutes.

One hour less per day means over a thousand hours of sleep debt in three years.

The trend is more concerning: around 6 hours in 2023-2024, dropping to 5 hours 41 minutes in 2025, bottoming at 5 hours 16 minutes in Q2. Sleep efficiency slid from 83% to 74%. Not just sleeping less—lying down longer, but actual sleep proportion increasingly lower. Body resting, nervous system still running.

#### HRV and Resting Heart Rate: The Most Honest Indicators

HRV declined from 42ms in 2023 to 31ms in mid-2025, over 25% drop. Meanwhile resting heart rate rose from 60 bpm to 72 bpm. Both lines simultaneously point to the same thing: autonomic nervous system chronically under stress.

This isn't emotional judgment—it's physiological signals. And this is Apple Watch-exclusive data—if only looking at Fitbit, I'd never know. This is precisely the value of cross-device analysis: warnings that single apps won't proactively surface become undeniable under multi-dimensional comparison.

---

### Lessons Learned: Data Pipeline Fragility

In this analysis, I discovered weight data completely interrupted after 2022. The reason was utterly mundane: the smart scale broke, and I never replaced it.

This is a typical data lesson—**hardware failure is the biggest threat to personal data infrastructure.** Once data breaks, body changes during that period become permanent black holes. Not unwillingness to record, but once broken, never reconnected.

Similar fragility appears in Apple Health exports: this is a manually triggered process. Without regular exports, latest data only exists in the iPhone, unable to be externally analyzed.

Recognizing this fragility is the first step in building sustainable infrastructure.

---

### Practical Device Pairing Recommendations

26 months of dual-device overlap data led me to a set of principles: use Fitbit for total sleep duration (high coverage, 25-31 nights monthly), reference Apple Watch for REM sleep (accelerometer more precise for micro-movement detection), only look at deep sleep trends not absolute values (biggest algorithmic difference between devices). HRV, resting heart rate, blood oxygen are Apple Watch's exclusive leading indicators.

Fitbit is the workhorse for daily tracking, Apple Watch is auxiliary for deep health assessment. They complement, not replace each other.

---

### Next Steps: From Observation to Intervention

The next stage of this system isn't adding charts, but three things: AI anomaly detection (when HRV stays below baseline for three consecutive days, Claude proactively sends intervention suggestions), lifestyle annotation (recording before-and-after comparisons of intervention behaviors), and more data source integration (Oura Ring temperature, smart blood pressure monitor, body fat scale—each additional pipeline adds another layer to cross-analysis dimensions).

Evolving from "viewing data" to "using data to drive behavior change"—this is the true value of Personal Health Infrastructure.

---

### Conclusion

Ten years of data proved two things.

First, the body has always been sending signals. HRV decline, resting heart rate increase, sleep efficiency collapse, exercise volume to zero—these signals scattered across different devices all looked "within range" in their respective apps. It was the self-built analytical infrastructure that converged them into an undeniable trend.

Second, I once could do it. 1,420 runs, 435 bike rides, one triathlon annually—2022's 340 GPS tracks prove Daily Tri was feasible. Decline isn't destiny—it's structure.

Health shouldn't just be "how many steps today." It should be a personal system that can be verified, corrected, and continuously optimized.

Ten years of data isn't for nostalgia, but to remind myself—once trends are clear, there's no reason to pretend not to see them anymore.

---

*The health data analysis dashboard from this article can be viewed at [paulkuo.tw/health](/health).*

*Technical details: Fitbit MCP setup, Apple Health XML parsing process, Chart.js visualization, CI/CD automation pipelines—welcome to contact for discussion.*
# Chrome Web Store — 商店描述

## Short description (≤132 characters)

**English:**
Track Claude usage in real time — session quota, token count, cost. Open source, no data collected.

**繁中：**
即時追蹤 Claude 用量 — 對話配額、token 計數、費用估算。開源、不收集任何資料。

---

## Detailed description — English

Track your Claude usage so you never hit the rate limit by surprise.

Claude Usage Nyan sits in your toolbar as a small orange cat. Glance at the badge to see your quota status — green is safe, yellow means watch out, orange is getting close, red is almost full. No clicking needed.

Click the popup for the full picture:
• Official usage data from Anthropic: 5-hour session percentage, 7-day usage, additional credits consumed, each with a reset countdown.
• Real-time token tracking: input tokens, output tokens, estimated cost, and which model was used — updated as you chat.

A floating status bar in the bottom-right corner of claude.ai keeps your usage visible while you work. Click the cat to collapse it.

Two data pipelines run simultaneously:
1. Official — calls claude.ai's usage API every few minutes, returning the same numbers you'd see in Settings.
2. Real-time estimation — intercepts API calls on the page and accumulates token counts as responses stream back.

Privacy first:
• No data is collected or sent to any third party.
• All data stays on your device (chrome.storage.local).
• Network requests go only to claude.ai.
• Fully open source — review every line of code on GitHub.

Supports 55 languages. Built in Taiwan.

---

## Detailed description — 繁中

追蹤 Claude 用量，不再意外撞到 rate limit。

Claude 用量喵喵是一隻住在你工具列裡的橘貓。瞄一眼 badge 就知道用量狀態 — 綠色安全、黃色注意、橘色快滿、紅色即將用完。不用點開任何東西。

點開 popup 看完整資訊：
• 官方用量：5 小時區間百分比、7 天用量、額外額度消耗，每項都有重置倒數。
• 即時 token 追蹤：輸入 token、輸出 token、預估費用、使用哪個模型 — 隨對話即時更新。

claude.ai 頁面右下角的浮動狀態條，讓你工作時隨時掌握用量。點貓頭收合。

兩條資料管道同時運行：
1. 官方管道 — 每幾分鐘呼叫 claude.ai 的用量 API，數字和設定頁面一致。
2. 即時估算 — 攔截頁面上的 API 呼叫，在回應串流時累計 token 計數。

隱私優先：
• 不收集、不傳送任何資料給第三方。
• 所有資料存在你的裝置本機（chrome.storage.local）。
• 網路請求僅向 claude.ai 發送。
• 完整開源 — 每行程式碼都在 GitHub 上。

支援 55 種語言。台灣製造。

---

## Category suggestion

**Developer Tools** (primary) or **Productivity**

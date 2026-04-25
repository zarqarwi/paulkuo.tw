---
title: Code Handoff — wiki-youtube ingest 改為本機 cron 觸發
date: 2026-04-25
session_type: code
issue: zarqarwi/paulkuo.tw#186
priority: P1（連兩天阻塞）
model_recommendation: Sonnet (Effort: medium)
---

# Code Handoff — wiki-youtube ingest 改為本機 cron

## TL;DR

`wiki-daily-pipeline` 的 Step 2 在 Cowork 端跑不動（CF MCP 無 KV key 操作）。
Paul 已決定 (2026-04-25) 拆出去走本機 wrangler。腳本本體 `scripts/wiki-youtube-ingest.cjs` 已存在且完整，這次工作是「設排程 + 寫 log 橋接 Cowork」，不動腳本核心邏輯。

## 三件事

### 1. 加 `--write-log` 旗標到 wiki-youtube-ingest.cjs

在現有腳本尾段加一個 wrapper，記錄當日結果到 worklogs：

```js
// scripts/wiki-youtube-ingest.cjs 在 main() 結束後
if (options.writeLog) {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const logPath = path.join(PROJECT_ROOT, 'worklogs', `wiki-youtube-daily-${today}.md`);
  const summary = `# Wiki YouTube Ingest — ${today}\n\n- 新增: ${written} 支\n- 失敗: ${failed} 支\n- KV pending 剩餘: ${remaining} 筆\n- 觸發來源: 本機 cron / launchd\n`;
  fs.writeFileSync(logPath, summary, 'utf-8');
}
```

`written` / `failed` / `remaining` 變數在 `pullPending()` 裡已有計數，需要 return 出來給 main 用。

### 2. 寫 launchd plist（macOS 推薦）

`~/Library/LaunchAgents/tw.paulkuo.wiki-youtube.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>tw.paulkuo.wiki-youtube</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-lc</string>
        <string>cd /path/to/paulkuo.tw && /usr/local/bin/node scripts/wiki-youtube-ingest.cjs --write-log && git add worklogs/wiki-youtube-daily-*.md src/content/wiki/sources/ && git commit -m "[wiki-youtube] daily $(date +%F)" && git push</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key><integer>9</integer>
        <key>Minute</key><integer>50</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/wiki-youtube.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/wiki-youtube.err</string>
</dict>
</plist>
```

載入：`launchctl load ~/Library/LaunchAgents/tw.paulkuo.wiki-youtube.plist`

時間設 09:50（在 Cowork wiki-daily 10:02 之前），讓當日 Cowork 報告能讀到 log。

### 3. 跑一次驗證

```bash
node scripts/wiki-youtube-ingest.cjs --write-log
cat worklogs/wiki-youtube-daily-2026-04-25.md
```

確認：
- 即使 KV 是空的，log 還是寫得出 `新增: 0 / 失敗: 0 / 剩餘: 0`
- commit + push 成功

## 影響範圍

| 檔案 | 變動 |
|------|------|
| `scripts/wiki-youtube-ingest.cjs` | 加 `--write-log` 模式（小修） |
| 本機 `~/Library/LaunchAgents/tw.paulkuo.wiki-youtube.plist` | 新增 |
| `wiki-daily-pipeline` Cowork 排程 SKILL.md | **Paul 手動更新**（移除 Step 2，加讀本機 log） |
| Issue #157 儀表板 Scheduled Tasks 表 | 加一列 wiki-youtube-local |

## 不動的東西

- `scripts/wiki-youtube-ingest.cjs` 核心 (yt-dlp / Whisper / KV 操作) — 已經能跑
- `data/youtube-channels.json` 和 KV `youtube:channels` seed 流程
- Worker `/api/wiki/youtube-ingest` 端點

## 跨專案影響

只影響 paulkuo.tw 專案內部。但會改變 wiki-daily 流程的「資料源結構」：
- **改之前**：Cowork 一條龍 (clips + youtube + scanner + report)
- **改之後**：本機 cron 跑 youtube → push log；Cowork 跑 (clips + scanner + report，讀本機 log 補 youtube 數字)

下個 [WIKI] Cowork session 開場必須先 `git pull`，才能讀到當日 youtube log。

## 驗收條件（同 #186）

- [x] Issue #186 已開
- [ ] `--write-log` 加好，本機跑通
- [ ] launchd plist 載入、首次手動觸發成功
- [ ] 隔日 09:50 自動跑一次，10:02 Cowork session 能讀到 log
- [ ] Paul 手動更新 Cowork 端 SKILL prompt

## 模型建議

**Sonnet (Effort: medium)** — 工作分散但每塊都不深：腳本小修 + plist 寫一份 + 整合測試。Opus 用不上。

## 相關

- Issue: zarqarwi/paulkuo.tw#186
- Wiki 儀表板: #157
- 本日報告: worklogs/wiki-daily-2026-04-25.md
- 昨日報告: worklogs/wiki-daily-2026-04-24.md
- 腳本本體: scripts/wiki-youtube-ingest.cjs

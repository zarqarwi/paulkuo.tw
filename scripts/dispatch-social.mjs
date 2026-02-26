/**
 * dispatch-social.mjs — 讀取已審核的摘要，送 OneUp 排程
 *
 * 由 workflow_dispatch 手動觸發（Paul 審核完摘要後）
 * 讀取 data/social-logs/{slug}-*.json，送 OneUp 排程
 *
 * Usage: node scripts/dispatch-social.mjs <slug>
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PLATFORM_IDS, MANUAL_PLATFORMS, CHAR_LIMITS } from './platform-config.mjs';
import { logCost } from './cost-tracker.mjs';

const ONEUP_API_BASE = 'https://www.oneupapp.io/api';

// ── 找到最新的 social-log ────────────────────────────
function findLatestLog(slug) {
  const logDir = 'data/social-logs';
  if (!existsSync(logDir)) throw new Error(`Log dir not found: ${logDir}`);

  const files = readdirSync(logDir)
    .filter(f => f.startsWith(`${slug}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) throw new Error(`No social-log found for slug: ${slug}`);
  return join(logDir, files[0]);
}

// ── OneUp 排程 ───────────────────────────────────────
async function schedulePost(content, platformIds, scheduledTime, imageUrl) {
  const endpoint = imageUrl ? 'scheduleimagepost' : 'scheduletextpost';
  const params = new URLSearchParams({
    apiKey: process.env.ONEUP_API_KEY,
    category_id: process.env.ONEUP_CATEGORY_ID || '171342',
    social_network_id: JSON.stringify(platformIds),
    scheduled_date_time: scheduledTime,
    content,
  });
  if (imageUrl) params.append('image_url', imageUrl);

  const resp = await fetch(`${ONEUP_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return { status: resp.status, data: await resp.json() };
}

// ── 排程時間 ─────────────────────────────────────────
function getScheduledTime(offsetMinutes = 60) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  now.setMinutes(Math.ceil(now.getMinutes() / 10) * 10, 0, 0);
  return now.toISOString().replace('T', ' ').slice(0, 16);
}

// ── 主程式 ───────────────────────────────────────────
async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('❌ Usage: node dispatch-social.mjs <slug>');
    process.exit(1);
  }

  console.log(`\n🚀 Dispatching social posts for: ${slug}\n`);

  // 1. 讀取存檔
  const logFile = findLatestLog(slug);
  const logData = JSON.parse(readFileSync(logFile, 'utf-8'));

  if (logData.status === 'dispatched') {
    console.log(`⚠️  Already dispatched at ${logData.dispatched_at}. Aborting to prevent duplicates.`);
    return;
  }

  const { summaries, imageUrl, title, url } = logData;
  console.log(`   Title: ${title}`);
  console.log(`   Image: ${imageUrl}`);

  // 2. 排程到各平台
  const scheduledTime = getScheduledTime(60);
  let successCount = 0;
  let failCount = 0;
  const results = [];

  const autoPlatforms = Object.entries(PLATFORM_IDS)
    .filter(([code]) => !MANUAL_PLATFORMS.has(code));

  for (const [code, id] of autoPlatforms) {
    const content = summaries[code] || summaries.X || logData.description || '';
    const truncated = content.slice(0, CHAR_LIMITS[code] || 5000);

    try {
      const { status, data } = await schedulePost(truncated, [id], scheduledTime, imageUrl);
      if (status === 200) {
        console.log(`   ✅ ${code}: scheduled for ${scheduledTime}`);
        successCount++;
        results.push(`✅ ${code}`);
      } else {
        console.log(`   ❌ ${code}: HTTP ${status} — ${JSON.stringify(data)}`);
        failCount++;
        results.push(`❌ ${code}: ${status}`);
      }
    } catch (e) {
      console.log(`   ❌ ${code}: ${e.message}`);
      failCount++;
      results.push(`❌ ${code}: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. 更新 log 狀態
  logData.status = 'dispatched';
  logData.dispatched_at = new Date().toISOString();
  logData.scheduled_time = scheduledTime;
  logData.results = results;
  writeFileSync(logFile, JSON.stringify(logData, null, 2));

  // 4. 更新 published-slugs.json
  const slugsFile = 'data/published-slugs.json';
  mkdirSync('data', { recursive: true });
  let slugs = [];
  try { slugs = JSON.parse(readFileSync(slugsFile, 'utf-8')); } catch {}
  if (!slugs.includes(slug)) {
    slugs.push(slug);
    writeFileSync(slugsFile, JSON.stringify(slugs, null, 2));
  }

  // 5. 輸出結果
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📢 排程完成: ${title}`);
  console.log(`⏰ 排程時間: ${scheduledTime}`);
  console.log(`📊 結果: ${successCount} 成功 / ${failCount} 失敗`);
  console.log(results.join(' | '));
  console.log(`⚠️  FB、IG 需手動發佈`);
  console.log('─'.repeat(50));
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

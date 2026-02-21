/**
 * fetch-feed.mjs — Build time 從 Google Sheets 拉 feed_published 資料
 * 產出 src/data/feed.json 供 Astro 讀取
 * 
 * 需要環境變數：
 *   GOOGLE_SERVICE_ACCOUNT_JSON — service account JSON 的完整內容（CI 用）
 *   或本機自動偵測 ~/Desktop/02_參考資料/google-service-account.json
 */
import { google } from 'googleapis';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ZvMp-kcRntX99Gglwp5jb-EquV0V0yBvucX69d-_aMs';
const RANGE = 'feed_published!A2:F100';
const OUTPUT = join(__dirname, '..', 'src', 'data', 'feed.json');

const PLATFORM_COLORS = {
  '𝕏 X': 'var(--accent-ai)',
  'in LinkedIn': '#0A66C2',
  '📘 Facebook': 'var(--accent-faith)',
  '◉ Threads': 'var(--accent-life)',
  '🔴 Reddit': '#FF4500',
  '▶ YouTube': '#FF0000',
  '🦋 Bluesky': '#0085FF',
  '📷 Instagram': '#E4405F',
};

async function main() {
  let credentials;

  // CI: 從環境變數讀
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else {
    // 本機: 讀檔案
    const localPath = join(homedir(), 'Desktop', '02_參考資料', 'google-service-account.json');
    if (existsSync(localPath)) {
      credentials = JSON.parse(readFileSync(localPath, 'utf-8'));
    } else {
      console.warn('⚠️  No Google credentials found, using fallback feed.json');
      process.exit(0);
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];
  
  // 欄位: Platform, Content, DateTime, ImageURL, Category, PostTitle
  const feed = rows
    .filter(r => r[0] && r[1] && r[2])
    .map(r => ({
      platform: r[0],
      content: r[1].substring(0, 500),
      datetime: r[2],
      imageUrl: r[3] || '',
      category: r[4] || '',
      postTitle: r[5] || '',
      color: PLATFORM_COLORS[r[0]] || 'var(--text-secondary)',
    }))
    .sort((a, b) => b.datetime.localeCompare(a.datetime))
    .slice(0, 12); // 最多 12 則

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(feed, null, 2), 'utf-8');
  console.log(`✅ Feed: ${feed.length} items → ${OUTPUT}`);
}

main().catch(err => {
  console.error('❌ fetch-feed failed:', err.message);
  // 不要讓 build 失敗，用空 feed
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, '[]', 'utf-8');
});

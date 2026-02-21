/**
 * fetch-feed.mjs — 從 Google Sheets feed_published 拉社群動態
 * 
 * 本機執行: node scripts/fetch-feed.mjs
 * CI 執行:  GOOGLE_SERVICE_ACCOUNT_JSON 環境變數自動讀取
 * 
 * 輸出: src/data/feed.json
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'src', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'feed.json');

const SHEET_ID = '1ZvMp-kcRntX99Gglwp5jb-EquV0V0yBvucX69d-_aMs';
const SHEET_NAME = 'feed_published';
const MAX_ITEMS = 12; // 首頁最多顯示幾則

// Platform color mapping
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

/**
 * Google Sheets API via service account JWT auth
 */
async function getAccessToken(credentials) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // Dynamic import for jose (JWT signing)
  // In CI we install it; locally it should be available
  const { SignJWT, importPKCS8 } = await import('jose');
  
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  const jwt = await new SignJWT(claim)
    .setProtectedHeader(header)
    .sign(privateKey);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function fetchSheetData(accessToken) {
  const range = encodeURIComponent(`${SHEET_NAME}!A2:F`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Sheets API error: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.values || [];
}

function parseRows(rows) {
  // Columns: Platform, Content, DateTime, ImageURL, Category, PostTitle
  const items = rows
    .filter(row => row[0] && row[1]) // must have platform + content
    .map(row => ({
      platform: row[0]?.trim() || '',
      content: (row[1]?.trim() || '').slice(0, 500), // truncate for display
      datetime: row[2]?.trim() || '',
      imageUrl: row[3]?.trim() || '',
      category: row[4]?.trim() || '',
      postTitle: row[5]?.trim() || '',
      color: PLATFORM_COLORS[row[0]?.trim()] || 'var(--text-secondary)',
    }));

  // Sort by datetime desc, take latest MAX_ITEMS
  items.sort((a, b) => {
    if (!a.datetime) return 1;
    if (!b.datetime) return -1;
    return b.datetime.localeCompare(a.datetime);
  });

  // Deduplicate: keep only the latest post per platform
  const seen = new Map();
  const deduped = [];
  for (const item of items) {
    if (!seen.has(item.platform)) {
      seen.set(item.platform, true);
      deduped.push(item);
    }
  }

  return deduped.slice(0, MAX_ITEMS);
}

function formatDateTime(dtStr) {
  // "2026-02-19 15:10" → "2026.02.19 15:10"
  if (!dtStr) return '';
  return dtStr.replace(/-/g, '.').replace(' ', ' ');
}

async function main() {
  console.log('📡 Fetching social feed from Google Sheets...');

  // Load credentials
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    let raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    // Fix escaped newlines in private_key (common GitHub Secrets issue)
    credentials = JSON.parse(raw);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    console.log('  Using env GOOGLE_SERVICE_ACCOUNT_JSON');
    console.log(`  Service account: ${credentials.client_email}`);
  } else {
    // Local: read from file
    const localPath = join(process.env.HOME || '', 'Desktop/02_參考資料/google-service-account.json');
    if (!existsSync(localPath)) {
      console.error(`❌ No credentials found at ${localPath}`);
      console.log('  Falling back to empty feed.');
      mkdirSync(OUTPUT_DIR, { recursive: true });
      writeFileSync(OUTPUT_FILE, JSON.stringify({ items: [], updatedAt: new Date().toISOString() }, null, 2));
      return;
    }
    credentials = JSON.parse(readFileSync(localPath, 'utf-8'));
    console.log(`  Using local credentials: ${localPath}`);
  }

  console.log(`  private_key starts with: ${credentials.private_key?.substring(0, 30)}...`);
  console.log(`  private_key has real newlines: ${credentials.private_key?.includes('\n')}`);
  console.log(`  private_key has literal \\n: ${credentials.private_key?.includes('\\n')}`);

  let token;
  try {
    token = await getAccessToken(credentials);
    console.log('  Token obtained successfully');
  } catch (tokenErr) {
    console.error('  Token error:', tokenErr.message);
    throw tokenErr;
  }
  const rows = await fetchSheetData(token);
  console.log(`  Raw rows: ${rows.length}`);

  const items = parseRows(rows).map(item => ({
    ...item,
    displayDate: formatDateTime(item.datetime),
  }));

  console.log(`  Feed items: ${items.length}`);
  items.forEach(i => console.log(`    ${i.platform} — ${i.displayDate}`));

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const output = {
    items,
    updatedAt: new Date().toISOString(),
  };

  // If fetch returned 0 items but we have existing data, keep the old data
  if (items.length === 0 && existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
      if (existing.items && existing.items.length > 0) {
        console.log(`⚠️  Fetch returned 0 items but existing feed.json has ${existing.items.length} — keeping existing`);
        return;
      }
    } catch (_) {}
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ Written to ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('❌ Feed fetch failed:', err.message);
  console.error('Stack:', err.stack);
  // Don't overwrite existing feed.json — keep the committed version as fallback
  if (existsSync(OUTPUT_FILE)) {
    console.log('⚠️  Keeping existing feed.json as fallback');
  } else {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(OUTPUT_FILE, JSON.stringify({ items: [], updatedAt: new Date().toISOString() }, null, 2));
    console.log('⚠️  No existing feed.json — wrote empty fallback');
  }
  process.exit(0); // Don't fail CI
});

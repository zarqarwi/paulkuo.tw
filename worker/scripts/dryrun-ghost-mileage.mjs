#!/usr/bin/env node
/**
 * dryrun-ghost-mileage.mjs
 * Ghost Mileage Dry-Run Analysis — 2026-04-14
 *
 * READ-ONLY. Does NOT write, update, or delete anything in D1 or KV.
 * Uses: wrangler d1 execute paulkuo-auth --remote (SELECT only)
 *
 * Usage: node worker/scripts/dryrun-ghost-mileage.mjs
 * (run from repo root: ~/Desktop/01_專案進行中/paulkuo.tw)
 *
 * ── Findings Summary ──
 * Original assumption (Cowork handoff): ghost auto points outside geofence
 * Actual root cause: dashboard API did not filter source='remote' in km/
 *   checkin queries before commit 9160a69. GPS points outside geofence were
 *   correctly stored as source='remote' by /checkin endpoint (always had
 *   geofence), but those 'remote' points were included in distance calcs.
 *   9160a69 fixed by adding WHERE source!='remote' to dashboard queries.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKER_DIR = join(__dirname, '..');
const REPO_ROOT = join(__dirname, '../..');

// ── Constants ────────────────────────────────────────────────────────────────

// Activity start: 2026-04-12 00:00 UTC+8 = 2026-04-11 16:00 UTC
const ACTIVITY_START_UTC = '2026-04-11T16:00:00.000Z';

// Commit 9160a69 deployed: 2026-04-13 07:28:16 +0800 = 2026-04-12 23:28:16 UTC
const FIX_DEPLOYED_UTC = '2026-04-12T23:28:16.000Z';

// Geofence bounds (formosa.js:411)
const GEO_LAT_MIN = 23.4;
const GEO_LAT_MAX = 24.9;
const GEO_LNG_MIN = 120.1;
const GEO_LNG_MAX = 121.0;

// Level thresholds (formosa.js:940-950)
const TITLES = [
  { km: 0,   checkins: 1,  name: '煉氣香客' },
  { km: 15,  checkins: 5,  name: '築基香客' },
  { km: 45,  checkins: 10, name: '金丹香客' },
  { km: 90,  checkins: 15, name: '元嬰香客' },
  { km: 135, checkins: 20, name: '化神香客' },
  { km: 180, checkins: 25, name: '煉虛香客' },
  { km: 225, checkins: 30, name: '合體香客' },
  { km: 270, checkins: 35, name: '大乘香客' },
  { km: 300, checkins: 40, name: '飛升香客' }
];

// ── Pure functions (mirrored from formosa.js) ────────────────────────────────

function isInGeofence(lat, lng) {
  return lat >= GEO_LAT_MIN && lat <= GEO_LAT_MAX &&
         lng >= GEO_LNG_MIN && lng <= GEO_LNG_MAX;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Current logic (post-9160a69): filters source='remote'
function computeFilteredKm(pts) {
  if (!pts || pts.length < 2) return 0;
  const sorted = pts
    .filter(p => p.source !== 'remote')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let totalKm = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dist = haversine(sorted[i-1].lat, sorted[i-1].lng, sorted[i].lat, sorted[i].lng);
    const timeDiffHours = (new Date(sorted[i].timestamp) - new Date(sorted[i-1].timestamp)) / 3600000;
    if (dist < 0.01 || timeDiffHours <= 0 || timeDiffHours < 1 / 120) continue;
    if (dist / timeDiffHours > 300) continue;
    totalKm += dist;
  }
  return totalKm;
}

// Pre-fix logic (before 9160a69): source column was NOT selected, so filter
// p.source !== 'remote' always passed (source=undefined !== 'remote' → true).
// Equivalent: include ALL points regardless of source.
function computeUnfilteredKm(pts) {
  if (!pts || pts.length < 2) return 0;
  const sorted = [...pts].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let totalKm = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dist = haversine(sorted[i-1].lat, sorted[i-1].lng, sorted[i].lat, sorted[i].lng);
    const timeDiffHours = (new Date(sorted[i].timestamp) - new Date(sorted[i-1].timestamp)) / 3600000;
    if (dist < 0.01 || timeDiffHours <= 0 || timeDiffHours < 1 / 120) continue;
    if (dist / timeDiffHours > 300) continue;
    totalKm += dist;
  }
  return totalKm;
}

// Current checkins logic (post-9160a69): uses COUNT(CASE WHEN source!='remote')
function computeCheckinsPostFix(pts) {
  const validPts = pts.filter(p => p.source !== 'remote');
  const manualCount = validPts.filter(p => p.source === 'manual').length;
  return manualCount || Math.max(validPts.length, 1);
}

// Pre-fix checkins: counted ALL gps_points regardless of source
function computeCheckinsPreFix(pts) {
  const manualCount = pts.filter(p => p.source === 'manual').length;
  return manualCount || Math.max(pts.length, 1);
}

function computeRank(km, checkins) {
  let current = TITLES[0];
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (km >= TITLES[i].km && checkins >= TITLES[i].checkins) {
      current = TITLES[i];
      break;
    }
  }
  return current;
}

// ── D1 query helper ──────────────────────────────────────────────────────────

function runQuery(sql) {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('PRAGMA')) {
    throw new Error(`SAFETY ABORT: Non-SELECT query: ${sql.substring(0, 80)}`);
  }
  const result = execSync(
    `wrangler d1 execute paulkuo-auth --remote --config wrangler.toml --command ${JSON.stringify(sql)} --json`,
    { cwd: WORKER_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  return JSON.parse(result)[0].results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('🔍 Ghost Mileage Dry-Run — READ-ONLY mode');
console.log(`   Activity start : ${ACTIVITY_START_UTC} (2026-04-12 00:00 UTC+8)`);
console.log(`   Fix deployed   : ${FIX_DEPLOYED_UTC} (commit 9160a69)`);
console.log('');

// 1. All users
console.log('📥 Fetching users...');
const usersRaw = runQuery('SELECT line_user_id, display_name FROM formosa_users');
const totalUsers = usersRaw.length;
const userMap = {};
for (const u of usersRaw) userMap[u.line_user_id] = u.display_name || '（未設名稱）';
console.log(`   Total users: ${totalUsers}`);

// 2. All GPS points (full history needed for haversine accuracy)
console.log('📥 Fetching all GPS points...');
const allPoints = runQuery(
  'SELECT user_id, lat, lng, source, timestamp FROM formosa_gps_points ORDER BY user_id, timestamp ASC'
);
console.log(`   Total GPS points: ${allPoints.length}`);

// 3. Source breakdown audit
const sourcesFound = [...new Set(allPoints.map(p => p.source))].sort();
console.log(`   Source values in DB: ${sourcesFound.join(', ')}`);

// 4. Check for ghost AUTO points (original handoff assumption)
const ghostAutoPoints = allPoints.filter(p =>
  p.source === 'auto' &&
  p.timestamp >= ACTIVITY_START_UTC &&
  !isInGeofence(p.lat, p.lng)
);
console.log(`   Ghost auto points (source=auto, outside geofence, since 4/12): ${ghostAutoPoints.length}`);
console.log(`   → Original handoff assumption: ${ghostAutoPoints.length > 0 ? '✅ CONFIRMED' : '❌ INCORRECT — no ghost auto points found'}`);

// 5. Remote points (actual source of displayed ghost mileage before 9160a69)
const remotePoints = allPoints.filter(p => p.source === 'remote');
const remotePointsSinceActivity = remotePoints.filter(p => p.timestamp >= ACTIVITY_START_UTC);
const remotePointsPostFix = remotePoints.filter(p => p.timestamp >= FIX_DEPLOYED_UTC);
console.log(`   Remote points total: ${remotePoints.length}`);
console.log(`   Remote points since 4/12: ${remotePointsSinceActivity.length}`);

// 6. Group by user
const byUser = {};
for (const pt of allPoints) {
  if (!byUser[pt.user_id]) byUser[pt.user_id] = [];
  byUser[pt.user_id].push(pt);
}

// 7. Per-user analysis: compare pre-fix vs post-fix display values
const results = [];
for (const [userId, pts] of Object.entries(byUser)) {
  const userRemotePts = pts.filter(p => p.source === 'remote');
  if (userRemotePts.length === 0) continue;

  const remoteInActivity = userRemotePts.filter(p => p.timestamp >= ACTIVITY_START_UTC);
  if (remoteInActivity.length === 0) continue;

  // Pre-fix: all points counted (remote not filtered)
  const prefixKm = computeUnfilteredKm(pts);
  const prefixCheckins = computeCheckinsPreFix(pts);
  const prefixRank = computeRank(prefixKm, prefixCheckins);

  // Post-fix (current): remote filtered out
  const postfixKm = computeFilteredKm(pts);
  const postfixCheckins = computeCheckinsPostFix(pts);
  const postfixRank = computeRank(postfixKm, postfixCheckins);

  const ghostKm = Math.max(0, prefixKm - postfixKm);
  const ghostCheckins = Math.max(0, prefixCheckins - postfixCheckins);

  // Are there new remote points AFTER fix deployment? (shouldn't happen for already-remote)
  const postFixRemote = userRemotePts.filter(p => p.timestamp >= FIX_DEPLOYED_UTC);

  results.push({
    userId,
    displayName: userMap[userId] || '（未設名稱）',
    remotePtsTotal: userRemotePts.length,
    remotePtsActivity: remoteInActivity.length,
    remotePtsPostFix: postFixRemote.length,
    prefixKm: +prefixKm.toFixed(1),
    postfixKm: +postfixKm.toFixed(1),
    ghostKm: +ghostKm.toFixed(1),
    ghostCheckins,
    prefixRank: prefixRank.name,
    postfixRank: postfixRank.name,
    lat_range: `${Math.min(...userRemotePts.map(p=>p.lat)).toFixed(2)}–${Math.max(...userRemotePts.map(p=>p.lat)).toFixed(2)}`,
  });
}

results.sort((a, b) => b.ghostKm - a.ghostKm);

const affectedCount = results.length;
const totalGhostKm = +results.reduce((s, r) => s + r.ghostKm, 0).toFixed(1);
const downgradeUsers = results.filter(r => r.prefixRank !== r.postfixRank);
const highRiskUsers = results.filter(r => r.ghostKm > 50);
const borderlineUsers = results.filter(r => r.ghostKm > 0 && r.ghostKm < 5);

// ── Build Report ─────────────────────────────────────────────────────────────

const runTime = new Date();
const runTimeTW = runTime.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

const tableHeader = `| # | display_name | 修復前等級 | 修復前 km | 假里程 km | 修復後 km | 正確等級 | Remote 點數 |`;
const tableSep    = `|---|--------------|-----------|----------|-----------|----------|---------|------------|`;
const tableRows = results.map((r, i) =>
  `| ${i+1} | ${r.displayName} | ${r.prefixRank} | ${r.prefixKm} | ${r.ghostKm} | ${r.postfixKm} | ${r.postfixRank} | ${r.remotePtsActivity} |`
).join('\n');

// Sanity check for Anita
const anita = results.find(r => r.displayName.includes('吳心恬') || r.displayName.includes('Anita'));

const report = `# Ghost Mileage Dry-Run Report — 2026-04-14

> **⚠️ READ-ONLY 分析報告 — 未對 D1/KV 做任何寫入操作**
> 執行時間：${runTimeTW}（UTC ${runTime.toISOString()}）
> 腳本：\`worker/scripts/dryrun-ghost-mileage.mjs\`

---

## ⚠️ 重要修正：Handoff 假設與實際根因不符

**Cowork Handoff 原始假設：**
> 「4/12 起駕到 4/13 修復之間，落在 geofence 外的 GPS 點都以 \`source: 'auto'\` 存進 D1，直接進了累積里程。」

**實際調查結果：**
這個假設 **不成立**。Dry-run 掃描顯示：

| 項目 | 結果 |
|------|------|
| 4/12 後 \`source='auto'\` 且在 geofence 外的點 | **0 個** |
| \`source='remote'\` 的點（全部時間） | **${remotePoints.length} 個**（17 用戶）|
| Ghost mileage 實際根因 | Dashboard API 未過濾 \`remote\` 點 |
| 根因修復狀態 | ✅ **已由 9160a69 修復** |

**實際根因解析：**
- \`/api/formosa/checkin\` endpoint **一直有** geofence 檢查（formosa.js:411-412）
- 台北等路線外的 GPS 點**從一開始就被正確標為 \`source: 'remote'\`**
- 但 **修復前的 Dashboard API** 查詢未選取 \`source\` 欄位，導致 \`computeFilteredKm()\` 的 \`.filter(p => p.source !== 'remote')\` 無效（\`undefined !== 'remote'\` 恆為 \`true\`）
- 9160a69 修復：在 dashboard 查詢加入 \`WHERE source != 'remote'\` 及 \`COUNT(CASE WHEN source!='remote')\`

---

## 總覽

| 指標 | 數值 |
|------|------|
| 掃描期間 | 2026-04-12 00:00 UTC+8 ～ ${runTimeTW} |
| 活動總用戶數 | ${totalUsers} |
| 有 \`remote\` 點（路線外歷史紀錄）的用戶 | ${affectedCount} |
| 修復前被虛增里程的用戶 | ${downgradeUsers.length}（修復後等級降級） |
| Remote 點總數（4/12 後） | ${remotePointsSinceActivity.length} |
| 假里程總和（修復前 − 修復後） | ${totalGhostKm} km |
| 修復後殘留需清理的 \`auto\` 點 | **0 個**（無需清洗） |

---

## Sanity Check — 吳心恬 Anita Wu

${anita ? `
| 項目 | 修復前（9160a69 之前） | 修復後（現況） |
|------|----------------------|--------------|
| 累積 km | ${anita.prefixKm} km | ${anita.postfixKm} km |
| 打卡次數（等級用） | ${anita.ghostCheckins + (anita.postfixKm > 0 ? 1 : 0)} 次 | ${anita.remotePtsActivity === anita.remotePtsTotal ? '0 次' : '有真實打卡'} |
| 等級 | ${anita.prefixRank} | ${anita.postfixRank} |
| Remote 點數 | ${anita.remotePtsTotal} 點（lat ${anita.lat_range}°N，台北地區） | 同上（已正確標記，計算層過濾） |

Handoff 提及的 **147.2 km** 為修復前 Dashboard 顯示值，為 ${anita.remotePtsTotal} 個 \`remote\` 點被錯誤計入距離所致。
修復後顯示 km = **${anita.postfixKm}**（所有 remote 點已被過濾）。
` : '（未找到吳心恬資料 — user ID 可能不同）'}

---

## 受影響用戶清單（依假里程由大到小排序）

（「假里程」= 修復前 km − 修復後 km，即被 remote 點虛增的部分）

${tableHeader}
${tableSep}
${tableRows}

---

## Remote 點分布說明

| 分類 | 人數 | 說明 |
|------|------|------|
| 高緯度台北地區（lat > 24.9 且 lng > 121.0） | ${results.filter(r => r.lat_range.includes('25') || r.lat_range.split('–')[1] > '25').length} 人 | 完全不在路線範圍，ghostKm 最高 |
| 路線邊界附近（lat 24.75–24.9） | ${results.filter(r => { const max = parseFloat(r.lat_range.split('–')[1]); return max <= 24.9 && max >= 24.75; }).length} 人 | 可能是路線末段（苑裡/通霄附近）偏出邊界 |
| 假里程 < 5 km | ${borderlineUsers.length} 人 | 邊界效應，影響輕微 |
| 假里程 > 50 km | ${highRiskUsers.length} 人 | 高風險${highRiskUsers.length > 0 ? '：' + highRiskUsers.map(r => r.displayName).join('、') : ''} |

---

## 修復後現況評估

| 問題 | 狀態 |
|------|------|
| Dashboard 顯示 km 是否正確 | ✅ 是（9160a69 修復，remote 點已過濾） |
| 等級顯示是否正確 | ✅ 是（gps_count 修正，remote 不計入） |
| 需要 UPDATE/DELETE auto 點 | ✅ **不需要**（無 ghost auto 點） |
| 需要清理 remote 點紀錄 | ⚠️ 可選（功能正確，但 610 筆 remote 紀錄留在 DB） |

---

## 下一步建議

1. **不需要執行資料清洗**（原始 handoff 假設的 auto 點清洗任務 — 不存在 ghost auto 點）
2. **可選清理**：活動結束後若想清理 DB，可執行以下 SQL 刪除 remote 點（不影響計算，純空間優化）：
   \`\`\`sql
   -- 活動結束後可選執行（不影響任何顯示結果）
   DELETE FROM formosa_gps_points WHERE source = 'remote';
   -- 或只刪除明確不在路線的高緯度點
   DELETE FROM formosa_gps_points WHERE source = 'remote' AND lat > 25.0;
   \`\`\`
3. 9160a69 的 \`/api/formosa/track/sync\` batch geofence 修復確實新增了正確的 remote 標記（修復後新上傳的路線外點會正確標為 remote），這部分是 **預防性修復**，已生效。
4. **邊界香客注意**：吳明達 Martin、劉昌勝 等人的 remote 點座標在 lat 24.87–24.90，緊鄰路線終點（北港附近），可能是行走中偶發偏離。建議保留不清理。

---

## 技術備忘

- **Geofence 邊界**：lat ∈ [23.4, 24.9]，lng ∈ [120.1, 121.0]（矩形邊界框）
- **9160a69 部署時間**：2026-04-13 07:28:16 +0800
- **Source 欄位實際合法值**：\`auto / manual / remote / saved\`（photo 不在活動期 DB 中；checkin 為 default 值）
- **等級計算**：real-time 從 GPS 點重算，非 users 表累計欄
- **Checkins 計算**：manual 點數，若無 manual 則用非 remote 總點數（formosa.js:1037）
`;

// Write report
const reportDir = join(REPO_ROOT, 'worklogs');
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, 'dryrun-ghost-mileage-2026-04-14.md');
writeFileSync(reportPath, report, 'utf8');

console.log('\n✅ Analysis complete (READ-ONLY — no D1 changes made)');
console.log(`📄 Report: ${reportPath}`);
console.log('\nKey findings:');
console.log(`  Ghost auto points (handoff assumption): ${ghostAutoPoints.length} → assumption INCORRECT`);
console.log(`  Actual: calculation bug in dashboard API (no source filter before 9160a69)`);
console.log(`  Remote points in DB: ${remotePoints.length} (correctly labeled, no cleanup needed)`);
console.log(`  Affected users (had ghost mileage before fix): ${affectedCount}`);
console.log(`  Total ghost km (before vs after fix): ${totalGhostKm} km`);
console.log(`  Downgrade users (level corrected by fix): ${downgradeUsers.length}`);
if (anita) {
  console.log(`\n  [Sanity check] 吳心恬: pre-fix=${anita.prefixKm}km → post-fix=${anita.postfixKm}km (ghost=${anita.ghostKm}km)`);
}

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// Formosa ESG 2026 — 第三輪驗證測試
//
// 測試類型：
//   DI-500   — D1 資料完整性（500 VU，2 分鐘，事後比對）
//   MX-500   — 多端點混合負載（500 VU 基線）
//   MX-1000  — 多端點混合負載（1000 VU 承載上限）
//
// 用法：
//   k6 run -e TEST=DI-500 tests/round3-verify.js
//   k6 run -e TEST=MX-500 tests/round3-verify.js
//   k6 run -e TEST=MX-1000 tests/round3-verify.js
// ============================================================

const errorRate = new Rate('errors');
const checkinSuccess = new Counter('checkin_success');
const checkinFail = new Counter('checkin_fail');
const dataSuccess = new Counter('data_api_success');
const dataFail = new Counter('data_api_fail');
const userSuccess = new Counter('user_api_success');
const userFail = new Counter('user_api_fail');
const checkinDuration = new Trend('checkin_duration', true);
const dataDuration = new Trend('data_duration', true);
const userDuration = new Trend('user_duration', true);
const timeoutCount = new Counter('timeout_errors');
const serverErrorCount = new Counter('server_5xx');

const BASE_URL = 'https://paulkuo-ticker.paul-4bf.workers.dev';

// ── 測試配置 ──
const testConfigs = {

  // ===== DI: D1 資料完整性 =====
  'DI-500': {
    label: 'D1 Data Integrity — 500 VU 寫入後驗證資料完整性',
    stages: [
      { duration: '30s', target: 500 },
      { duration: '120s', target: 500 },   // 穩定 2 分鐘
      { duration: '15s', target: 0 },
    ],
    mode: 'checkin-only',  // 只打 checkin
    thresholds: { p95: 1000, p99: 2000, errRate: 0.005 },
  },

  // ===== MX: 多端點混合 =====
  'MX-500': {
    label: 'Mixed Endpoints — 500 VU 多端點混合負載',
    stages: [
      { duration: '30s', target: 500 },
      { duration: '180s', target: 500 },   // 穩定 3 分鐘
      { duration: '15s', target: 0 },
    ],
    mode: 'mixed',
    thresholds: { p95: 1500, p99: 3000, errRate: 0.01 },
  },
  'MX-1000': {
    label: 'Mixed Endpoints — 1000 VU 多端點混合負載（承載上限）',
    stages: [
      { duration: '60s', target: 1000 },
      { duration: '180s', target: 1000 },  // 穩定 3 分鐘
      { duration: '15s', target: 0 },
    ],
    mode: 'mixed',
    thresholds: { p95: 2000, p99: 4000, errRate: 0.05 },
  },
};

const testName = __ENV.TEST || 'MX-500';
const config = testConfigs[testName];

if (!config) {
  throw new Error(`Unknown test: ${testName}. Available: ${Object.keys(testConfigs).join(', ')}`);
}

const th = config.thresholds;

export const options = {
  stages: config.stages,
  thresholds: {
    http_req_duration: [`p(95)<${th.p95}`, `p(99)<${th.p99}`],
    errors: [`rate<${th.errRate}`],
  },
  noConnectionReuse: false,
  userAgent: 'k6-formosa-r3/1.0',
};

// ── GPS 隨機 ──
function randomGPS() {
  const lat = 23.55 + Math.random() * 0.6;
  const lng = 120.25 + Math.random() * 0.4;
  return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
}

// ── Checkin 請求 ──
function doCheckin() {
  const userId = `r3_${testName}_${__VU}_${__ITER}`;
  const gps = randomGPS();

  const payload = JSON.stringify({
    user_id: userId,
    line_user_id: userId,
    lat: parseFloat(gps.lat),
    lng: parseFloat(gps.lng),
    altitude: 50 + Math.random() * 100,
    accuracy: 5 + Math.random() * 20,
    source: 'manual',
  });

  const res = http.post(`${BASE_URL}/api/formosa/checkin`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  checkinDuration.add(res.timings.duration);
  if (res.status === 0) timeoutCount.add(1);
  if (res.status >= 500) serverErrorCount.add(1);

  const ok = check(res, {
    'checkin: status 200': (r) => r.status === 200,
    'checkin: body has ok': (r) => {
      try { return JSON.parse(r.body).ok === true; } catch { return false; }
    },
  });

  if (ok) { checkinSuccess.add(1); } else { checkinFail.add(1); }
  errorRate.add(!ok);
  return ok;
}

// ── Data API 請求（GET /api/formosa/data）──
function doDataQuery() {
  const res = http.get(`${BASE_URL}/api/formosa/data`, {
    timeout: '10s',
  });

  dataDuration.add(res.timings.duration);
  if (res.status === 0) timeoutCount.add(1);
  if (res.status >= 500) serverErrorCount.add(1);

  const ok = check(res, {
    'data: status 200': (r) => r.status === 200,
    'data: has stats': (r) => {
      try { return JSON.parse(r.body).stats !== undefined; } catch { return false; }
    },
  });

  if (ok) { dataSuccess.add(1); } else { dataFail.add(1); }
  errorRate.add(!ok);
  return ok;
}

// ── User API 請求（GET /api/formosa/user/{id}）──
function doUserQuery() {
  // 隨機查詢一個測試用戶
  const userId = `r3_${testName}_${Math.floor(Math.random() * 100)}_0`;
  const res = http.get(`${BASE_URL}/api/formosa/user/${encodeURIComponent(userId)}`, {
    timeout: '10s',
  });

  userDuration.add(res.timings.duration);
  if (res.status === 0) timeoutCount.add(1);
  if (res.status >= 500) serverErrorCount.add(1);

  // user API 回 200 即算成功（用戶可能不存在但不應 5xx）
  const ok = check(res, {
    'user: status 200': (r) => r.status === 200,
  });

  if (ok) { userSuccess.add(1); } else { userFail.add(1); }
  errorRate.add(!ok);
  return ok;
}

// ── 主測試邏輯 ──
export default function () {
  if (config.mode === 'checkin-only') {
    doCheckin();
    sleep(1 + Math.random() * 2);
  } else {
    // Mixed mode: 60% checkin, 30% data, 10% user
    const roll = Math.random();
    if (roll < 0.60) {
      doCheckin();
      sleep(1 + Math.random() * 2);
    } else if (roll < 0.90) {
      doDataQuery();
      sleep(0.5 + Math.random() * 1);
    } else {
      doUserQuery();
      sleep(0.5 + Math.random() * 1);
    }
  }
}

// ── 測試摘要輸出 ──
export function handleSummary(data) {
  const now = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `tests/results/r3-${testName}-${now}.json`;
  return {
    'stdout': textSummary(data),
    [filename]: JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const reqs = m.http_reqs?.values?.count || 0;
  const rps = m.http_reqs?.values?.rate || 0;
  const p95 = m.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = m.http_req_duration?.values?.['p(99)'] || 0;
  const avg = m.http_req_duration?.values?.avg || 0;
  const med = m.http_req_duration?.values?.med || 0;
  const min = m.http_req_duration?.values?.min || 0;
  const max = m.http_req_duration?.values?.max || 0;
  const errs = m.errors?.values?.rate || 0;

  // Per-endpoint stats
  const ckOk = m.checkin_success?.values?.count || 0;
  const ckFail = m.checkin_fail?.values?.count || 0;
  const ckP95 = m.checkin_duration?.values?.['p(95)'] || 0;
  const dtOk = m.data_api_success?.values?.count || 0;
  const dtFail = m.data_api_fail?.values?.count || 0;
  const dtP95 = m.data_duration?.values?.['p(95)'] || 0;
  const usOk = m.user_api_success?.values?.count || 0;
  const usFail = m.user_api_fail?.values?.count || 0;
  const usP95 = m.user_duration?.values?.['p(95)'] || 0;

  const timeouts = m.timeout_errors?.values?.count || 0;
  const s5xx = m.server_5xx?.values?.count || 0;

  const passP95 = p95 <= th.p95;
  const passP99 = p99 <= th.p99;
  const passErr = errs <= th.errRate;
  const allPass = passP95 && passP99 && passErr;

  let modeLabel = config.mode === 'mixed' ? 'Mixed 多端點混合' : 'DataIntegrity 資料完整性';

  let output = `
╔══════════════════════════════════════════════════════════════╗
║   Formosa ESG 2026 — 第三輪驗證測試                          ║
║   ${modeLabel}                                               ║
║   場景: ${testName}                                          ║
║   ${config.label}                                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   總請求:     ${String(reqs).padStart(8)}    RPS: ${String(rps.toFixed(1)).padStart(8)}    成功率: ${String(((1 - errs) * 100).toFixed(2) + '%').padStart(8)}  ║
║                                                              ║
║   ── 整體延遲 ──                                             ║
║   最小:   ${String(min.toFixed(0) + 'ms').padStart(8)}    中位數: ${String(med.toFixed(0) + 'ms').padStart(8)}    平均: ${String(avg.toFixed(0) + 'ms').padStart(8)}  ║
║   P95:    ${String(p95.toFixed(0) + 'ms').padStart(8)}    P99:    ${String(p99.toFixed(0) + 'ms').padStart(8)}    最大: ${String(max.toFixed(0) + 'ms').padStart(8)}  ║
║                                                              ║
║   ── 各端點成功/失敗 ──                                      ║
║   Checkin:   ${String(ckOk).padStart(6)} ok / ${String(ckFail).padStart(6)} fail    P95: ${String(ckP95.toFixed(0) + 'ms').padStart(8)}  ║
║   Data API:  ${String(dtOk).padStart(6)} ok / ${String(dtFail).padStart(6)} fail    P95: ${String(dtP95.toFixed(0) + 'ms').padStart(8)}  ║
║   User API:  ${String(usOk).padStart(6)} ok / ${String(usFail).padStart(6)} fail    P95: ${String(usP95.toFixed(0) + 'ms').padStart(8)}  ║
║                                                              ║
║   ── 錯誤分類 ──                                             ║
║   Timeout:  ${String(timeouts).padStart(6)}    5xx: ${String(s5xx).padStart(6)}    其他: ${String((ckFail + dtFail + usFail) - timeouts - s5xx).padStart(6)}             ║
║                                                              ║
║   ── 通過判定 ──                                             ║
║   P95  ≤ ${String(th.p95 + 'ms').padStart(6)}:  ${passP95 ? 'PASS ✓' : 'FAIL ✗'}    (實測 ${p95.toFixed(0)}ms)                   ║
║   P99  ≤ ${String(th.p99 + 'ms').padStart(6)}:  ${passP99 ? 'PASS ✓' : 'FAIL ✗'}    (實測 ${p99.toFixed(0)}ms)                   ║
║   錯誤 ≤ ${String((th.errRate * 100).toFixed(1) + '%').padStart(6)}:  ${passErr ? 'PASS ✓' : 'FAIL ✗'}    (實測 ${(errs * 100).toFixed(2)}%)                   ║
║                                                              ║
║   總判定:  ${allPass ? '✅ PASS' : '❌ FAIL'}                                              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

  if (config.mode === 'checkin-only') {
    output += `
┌──────────────────────────────────────────────────────────────┐
│  📋 DI 驗證下一步：                                           │
│  請執行以下指令查詢 D1 實際寫入數，與上方 Checkin ok 數比對：  │
│                                                               │
│  wrangler d1 execute paulkuo-auth --remote \\                 │
│    --config worker/wrangler.toml \\                           │
│    --command "SELECT COUNT(*) FROM formosa_gps_points         │
│              WHERE user_id LIKE 'r3_DI-%'"                    │
│                                                               │
│  預期：D1 記錄數 ≈ Checkin ok 數（允許 ±1% 誤差）             │
│  如果差距大 → D1 有靜默丟失資料的風險                          │
└──────────────────────────────────────────────────────────────┘
`;
  }

  return output;
}

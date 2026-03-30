import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// Formosa ESG 2026 — 第四輪真實場景驗證測試
//
// 測試類型：
//   CF-800   — D1 持續寫入耐久性（800 VU，10 分鐘，驗證累積延遲與丟失率）
//   RW-300   — 真實場景混合負載（300 VU，含 think time，10 分鐘）
//   RW-500   — 真實場景混合負載（500 VU，含 think time，15 分鐘）
//
// 與 R3 差異：
//   - 加入真實 think time（GPS 定位 3-10s、LIFF 載入 2-5s）
//   - 測試時間拉長到 10-15 分鐘（模擬一個打卡高峰段）
//   - 端點比例更貼近真實：60% checkin + 30% data + 10% user
//   - CF-800 專測 D1 在持續寫入下的累積效應
//
// 用法：
//   k6 run -e TEST=CF-800 tests/round4-realworld.js
//   k6 run -e TEST=RW-300 tests/round4-realworld.js
//   k6 run -e TEST=RW-500 tests/round4-realworld.js
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
const rateLimitCount = new Counter('rate_limited_429');

const BASE_URL = 'https://paulkuo-ticker.paul-4bf.workers.dev';

// ── 測試配置 ──
const testConfigs = {

  // ===== CF: D1 持續寫入耐久性 =====
  'CF-800': {
    label: 'D1 Sustained Write — 800 VU 持續寫入 10 分鐘，驗證累積延遲與丟失率',
    stages: [
      { duration: '60s', target: 800 },    // 1 分鐘 ramp up
      { duration: '600s', target: 800 },   // 10 分鐘穩定寫入
      { duration: '30s', target: 0 },      // 30 秒 ramp down
    ],
    mode: 'checkin-only',
    prefix: 'r4_CF',
    thresholds: { p95: 1500, p99: 3000, errRate: 0.01 },
  },

  // ===== RW: 真實場景混合（保守） =====
  'RW-300': {
    label: 'Real-World Mixed — 300 VU 含 think time，10 分鐘高峰段模擬',
    stages: [
      { duration: '60s', target: 100 },    // 慢慢起來
      { duration: '60s', target: 300 },    // 2 分鐘到頂
      { duration: '480s', target: 300 },   // 8 分鐘穩定
      { duration: '30s', target: 0 },
    ],
    mode: 'realworld',
    prefix: 'r4_RW3',
    thresholds: { p95: 1200, p99: 2500, errRate: 0.005 },
  },

  // ===== RW: 真實場景混合（極限） =====
  'RW-500': {
    label: 'Real-World Mixed — 500 VU 含 think time，15 分鐘高峰段模擬',
    stages: [
      { duration: '60s', target: 150 },
      { duration: '60s', target: 500 },
      { duration: '780s', target: 500 },   // 13 分鐘穩定
      { duration: '60s', target: 0 },
    ],
    mode: 'realworld',
    prefix: 'r4_RW5',
    thresholds: { p95: 1500, p99: 3000, errRate: 0.01 },
  },
};

const testName = __ENV.TEST || 'RW-300';
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
  userAgent: 'k6-formosa-r4/1.0',
};

// ── 白沙屯繞境路線 GPS 模擬（苗栗通霄→彰化北斗，沿海線） ──
const ROUTE_POINTS = [
  { lat: 24.4900, lng: 120.6850 },  // 白沙屯拱天宮（起點）
  { lat: 24.4500, lng: 120.6700 },  // 通霄鎮
  { lat: 24.3800, lng: 120.6300 },  // 苑裡
  { lat: 24.3200, lng: 120.6100 },  // 大甲
  { lat: 24.2600, lng: 120.5800 },  // 清水
  { lat: 24.2000, lng: 120.5500 },  // 沙鹿
  { lat: 24.1400, lng: 120.5200 },  // 龍井
  { lat: 24.0800, lng: 120.4800 },  // 大肚
  { lat: 24.0200, lng: 120.4500 },  // 彰化市
  { lat: 23.9600, lng: 120.4200 },  // 花壇
  { lat: 23.8800, lng: 120.4000 },  // 員林
  { lat: 23.8000, lng: 120.3800 },  // 北斗（媽祖駐駕點）
];

function simulateGPS() {
  // 根據 VU iteration 模擬沿路線行進，加隨機偏移（±200m）
  const idx = __ITER % ROUTE_POINTS.length;
  const base = ROUTE_POINTS[idx];
  const jitter = 0.002; // ~200m
  return {
    lat: (base.lat + (Math.random() - 0.5) * jitter).toFixed(6),
    lng: (base.lng + (Math.random() - 0.5) * jitter).toFixed(6),
  };
}

// ── Checkin 請求 ──
function doCheckin() {
  const userId = `${config.prefix}_${__VU}_${__ITER}`;
  const gps = simulateGPS();

  const payload = JSON.stringify({
    user_id: userId,
    line_user_id: userId,
    lat: parseFloat(gps.lat),
    lng: parseFloat(gps.lng),
    altitude: 10 + Math.random() * 80,
    accuracy: 5 + Math.random() * 25,
    source: 'manual',
  });

  const res = http.post(`${BASE_URL}/api/formosa/checkin`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s',
  });

  checkinDuration.add(res.timings.duration);
  if (res.status === 0) timeoutCount.add(1);
  if (res.status >= 500) serverErrorCount.add(1);
  if (res.status === 429) rateLimitCount.add(1);

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

// ── Data API 請求 ──
function doDataQuery() {
  const res = http.get(`${BASE_URL}/api/formosa/data`, {
    timeout: '15s',
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

// ── User API 請求 ──
function doUserQuery() {
  const userId = `${config.prefix}_${Math.floor(Math.random() * 200)}_0`;
  const res = http.get(`${BASE_URL}/api/formosa/user/${encodeURIComponent(userId)}`, {
    timeout: '15s',
  });

  userDuration.add(res.timings.duration);
  if (res.status === 0) timeoutCount.add(1);
  if (res.status >= 500) serverErrorCount.add(1);

  const ok = check(res, {
    'user: status 200': (r) => r.status === 200,
  });

  if (ok) { userSuccess.add(1); } else { userFail.add(1); }
  errorRate.add(!ok);
  return ok;
}

// ── 真實場景 think time（模擬使用者行為延遲） ──
function realisticThinkTime(action) {
  if (action === 'checkin') {
    // GPS 定位等待 3-10 秒 + UI 操作 1-3 秒
    sleep(4 + Math.random() * 9);
  } else if (action === 'data') {
    // Dashboard 瀏覽 2-5 秒
    sleep(2 + Math.random() * 3);
  } else {
    // User query 頁面載入 1-3 秒
    sleep(1 + Math.random() * 2);
  }
}

// ── 主測試邏輯 ──
export default function () {
  if (config.mode === 'checkin-only') {
    // CF 模式：純 checkin，短 think time（模擬快速連續打卡）
    doCheckin();
    sleep(1 + Math.random() * 2);
  } else {
    // RW 模式：真實使用模式 + think time
    const roll = Math.random();
    if (roll < 0.60) {
      doCheckin();
      realisticThinkTime('checkin');
    } else if (roll < 0.90) {
      doDataQuery();
      realisticThinkTime('data');
    } else {
      doUserQuery();
      realisticThinkTime('user');
    }
  }
}

// ── 測試摘要輸出 ──
export function handleSummary(data) {
  const now = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `tests/results/r4-${testName}-${now}.json`;
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
  const r429 = m.rate_limited_429?.values?.count || 0;

  const passP95 = p95 <= th.p95;
  const passP99 = p99 <= th.p99;
  const passErr = errs <= th.errRate;
  const allPass = passP95 && passP99 && passErr;

  const duration = config.stages.reduce((sum, s) => {
    const secs = parseInt(s.duration);
    return sum + secs;
  }, 0);
  const durationMin = (duration / 60).toFixed(1);

  let modeLabel = config.mode === 'realworld' ? 'RealWorld 真實場景混合' : 'CronFlush D1 持續寫入';

  let output = `
╔══════════════════════════════════════════════════════════════╗
║   Formosa ESG 2026 — 第四輪真實場景驗證                      ║
║   ${modeLabel.padEnd(48)}║
║   場景: ${testName.padEnd(52)}║
║   ${config.label.substring(0, 56).padEnd(56)}║
║   測試時長: ${durationMin} 分鐘                                        ║
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
║   Timeout:  ${String(timeouts).padStart(6)}    5xx: ${String(s5xx).padStart(6)}    429: ${String(r429).padStart(6)}    其他: ${String(Math.max(0, (ckFail + dtFail + usFail) - timeouts - s5xx - r429)).padStart(6)}  ║
║                                                              ║
║   ── 通過判定 ──                                             ║
║   P95  <= ${String(th.p95 + 'ms').padStart(6)}:  ${passP95 ? 'PASS' : 'FAIL'}    (實測 ${p95.toFixed(0)}ms)                      ║
║   P99  <= ${String(th.p99 + 'ms').padStart(6)}:  ${passP99 ? 'PASS' : 'FAIL'}    (實測 ${p99.toFixed(0)}ms)                      ║
║   錯誤 <= ${String((th.errRate * 100).toFixed(1) + '%').padStart(6)}:  ${passErr ? 'PASS' : 'FAIL'}    (實測 ${(errs * 100).toFixed(2)}%)                      ║
║                                                              ║
║   總判定:  ${allPass ? 'PASS' : 'FAIL'}                                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

  if (config.mode === 'checkin-only') {
    output += `
┌──────────────────────────────────────────────────────────────┐
│  D1 資料完整性驗證：                                           │
│  請執行以下指令查詢 D1 實際寫入數，與上方 Checkin ok 數比對：  │
│                                                               │
│  wrangler d1 execute paulkuo-auth --remote \\                 │
│    --config worker/wrangler.toml \\                           │
│    --command "SELECT COUNT(*) as cnt                          │
│              FROM formosa_gps_points                          │
│              WHERE user_id LIKE '${config.prefix}_%'"         │
│                                                               │
│  預期：D1 記錄數 = Checkin ok 數（允許 ±1% 誤差）             │
│  10 分鐘持續寫入 → 觀察是否有累積延遲/丟失                    │
└──────────────────────────────────────────────────────────────┘
`;
  }

  return output;
}

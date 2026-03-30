import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// Formosa ESG 2026 — 第二輪壓力測試（行為導向）
//
// 測試類型：
//   Baseline  — 穩態基線（B-300 / B-500 / B-800）
//   Steady    — 持續承載上限（ST-1000 / ST-1200）
//   Burst     — 事件型尖峰（BR-3000 / BR-5000）
//   Wave      — 真實世界波浪（WV-3Cycle）
//   Recovery  — 爆量後復原（RC-AfterBurst）
//
// 用法：
//   k6 run -e TEST=B-300 tests/round2-test.js
//   k6 run -e TEST=ST-1000 tests/round2-test.js
//   k6 run -e TEST=BR-3000 tests/round2-test.js
//   k6 run -e TEST=WV-3Cycle tests/round2-test.js
//   k6 run -e TEST=RC-AfterBurst tests/round2-test.js
// ============================================================

const errorRate = new Rate('errors');
const checkinDuration = new Trend('checkin_duration', true);
const checkinSuccess = new Counter('checkin_success');
const checkinFail = new Counter('checkin_fail');
const timeoutCount = new Counter('timeout_errors');
const serverErrorCount = new Counter('server_5xx');

const BASE_URL = 'https://paulkuo-ticker.paul-4bf.workers.dev';

// ── 測試場景定義 ──
const testConfigs = {

  // ===== BASELINE: 穩態基線 =====
  'B-300': {
    label: 'Baseline 300 VU — 穩態甜蜜點下限',
    stages: [
      { duration: '60s', target: 300 },    // 1 分鐘升到位
      { duration: '600s', target: 300 },   // 穩定 10 分鐘
      { duration: '30s', target: 0 },      // 冷卻
    ],
    thresholds: { p95: 1000, p99: 2000, errRate: 0.005 },  // 成功率 ≥ 99.5%
  },
  'B-500': {
    label: 'Baseline 500 VU — 已知穩定點',
    stages: [
      { duration: '60s', target: 500 },
      { duration: '600s', target: 500 },
      { duration: '30s', target: 0 },
    ],
    thresholds: { p95: 1000, p99: 2000, errRate: 0.005 },
  },
  'B-800': {
    label: 'Baseline 800 VU — 穩態上限探索',
    stages: [
      { duration: '120s', target: 800 },   // 2 分鐘升到位
      { duration: '600s', target: 800 },
      { duration: '30s', target: 0 },
    ],
    thresholds: { p95: 1000, p99: 2000, errRate: 0.005 },
  },

  // ===== STEADY: 持續承載上限 =====
  'ST-1000': {
    label: 'Steady 1000 VU — 持續承載測試',
    stages: [
      { duration: '120s', target: 1000 },  // 2 分鐘爬升
      { duration: '300s', target: 1000 },  // 穩定 5 分鐘
      { duration: '30s', target: 0 },
    ],
    thresholds: { p95: 1500, p99: 3000, errRate: 0.03 },  // 成功率 ≥ 97%
  },
  'ST-1200': {
    label: 'Steady 1200 VU — 中等負載上限',
    stages: [
      { duration: '120s', target: 1200 },
      { duration: '300s', target: 1200 },
      { duration: '30s', target: 0 },
    ],
    thresholds: { p95: 1500, p99: 3000, errRate: 0.03 },
  },

  // ===== BURST: 事件型尖峰 =====
  'BR-3000': {
    label: 'Burst 3000 VU — 起駕瞬間',
    stages: [
      { duration: '10s', target: 100 },    // 微暖機
      { duration: '10s', target: 3000 },   // 10 秒衝頂
      { duration: '30s', target: 3000 },   // 維持 30 秒
      { duration: '30s', target: 300 },    // 快速回落
      { duration: '90s', target: 300 },    // 觀察恢復（60-120 秒）
      { duration: '10s', target: 0 },
    ],
    thresholds: { p95: 2000, p99: 5000, errRate: 0.10 },  // 成功率 ≥ 90%
  },
  'BR-5000': {
    label: 'Burst 5000 VU — 媒體導流 / 推播瞬間',
    stages: [
      { duration: '10s', target: 100 },
      { duration: '10s', target: 5000 },
      { duration: '30s', target: 5000 },
      { duration: '30s', target: 300 },
      { duration: '90s', target: 300 },
      { duration: '10s', target: 0 },
    ],
    thresholds: { p95: 2000, p99: 5000, errRate: 0.10 },
  },

  // ===== WAVE: 真實世界波浪 =====
  'WV-3Cycle': {
    label: 'Wave 3 Cycle — 多波段間歇衝擊（途經各廟宇）',
    stages: [
      // 第一波：起駕
      { duration: '15s', target: 1000 },
      { duration: '10s', target: 3000 },
      { duration: '40s', target: 3000 },
      { duration: '15s', target: 300 },
      // 低谷（行進中）
      { duration: '30s', target: 300 },
      // 第二波：經過大廟
      { duration: '10s', target: 1200 },
      { duration: '10s', target: 3500 },
      { duration: '40s', target: 3500 },
      { duration: '15s', target: 300 },
      // 低谷
      { duration: '30s', target: 300 },
      // 第三波：駐駕
      { duration: '10s', target: 1500 },
      { duration: '10s', target: 3000 },
      { duration: '40s', target: 3000 },
      { duration: '30s', target: 0 },
    ],
    thresholds: { p95: 2500, p99: 5000, errRate: 0.12 },  // 每波不能越來越差
  },

  // ===== RECOVERY: 爆量後復原 =====
  'RC-AfterBurst': {
    label: 'Recovery — 爆量後復原能力',
    stages: [
      // Phase 1: 先打一波 BR-3000（原 5000 因客戶端瓶頸降級）
      { duration: '10s', target: 100 },
      { duration: '10s', target: 3000 },
      { duration: '30s', target: 3000 },
      { duration: '15s', target: 0 },
      // Phase 2: 等 60 秒後跑 B-500
      { duration: '60s', target: 0 },      // 冷靜期
      { duration: '15s', target: 500 },
      { duration: '120s', target: 500 },   // Recovery baseline 2 分鐘
      // Phase 3: 再降到 B-300 觀察
      { duration: '15s', target: 300 },
      { duration: '120s', target: 300 },   // 3 分鐘 baseline
      { duration: '15s', target: 0 },
    ],
    thresholds: { p95: 1500, p99: 3000, errRate: 0.01 },  // Recovery 期間 ≥ 99%
  },
};

const testName = __ENV.TEST || 'B-500';
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
  userAgent: 'k6-formosa-r2/1.0',
};

// ── 白沙屯↔北港路線隨機 GPS ──
function randomGPS() {
  const lat = 23.55 + Math.random() * 0.6;
  const lng = 120.25 + Math.random() * 0.4;
  return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
}

// ── 主測試邏輯 ──
export default function () {
  const userId = `r2_${testName}_${__VU}_${__ITER}`;
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

  // 追蹤錯誤類型
  if (res.status === 0) timeoutCount.add(1);       // timeout / connection error
  if (res.status >= 500) serverErrorCount.add(1);   // 5xx

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has ok': (r) => {
      try { return JSON.parse(r.body).ok === true; } catch { return false; }
    },
  });

  if (success) {
    checkinSuccess.add(1);
  } else {
    checkinFail.add(1);
  }
  errorRate.add(!success);

  // Baseline/Steady: 真實用戶打卡間隔 1-3 秒
  // Burst/Wave: 極短間隔
  if (testName.startsWith('B-') || testName.startsWith('ST-') || testName.startsWith('RC-')) {
    sleep(1 + Math.random() * 2);
  } else {
    sleep(Math.random() * 0.5);
  }
}

// ── 測試摘要輸出 ──
export function handleSummary(data) {
  const now = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `tests/results/r2-${testName}-${now}.json`;
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
  const ok = m.checkin_success?.values?.count || 0;
  const fail = m.checkin_fail?.values?.count || 0;
  const timeouts = m.timeout_errors?.values?.count || 0;
  const s5xx = m.server_5xx?.values?.count || 0;

  // 判定類型
  let typeLabel = 'Unknown';
  if (testName.startsWith('B-')) typeLabel = 'Baseline 穩態基線';
  else if (testName.startsWith('ST-')) typeLabel = 'Steady 持續承載';
  else if (testName.startsWith('BR-')) typeLabel = 'Burst 事件型尖峰';
  else if (testName.startsWith('WV-')) typeLabel = 'Wave 波浪流量';
  else if (testName.startsWith('RC-')) typeLabel = 'Recovery 爆量後復原';

  const passP95 = p95 <= th.p95;
  const passP99 = p99 <= th.p99;
  const passErr = errs <= th.errRate;
  const allPass = passP95 && passP99 && passErr;

  return `
╔══════════════════════════════════════════════════════════════╗
║   Formosa ESG 2026 — 第二輪壓力測試                          ║
║   ${typeLabel}                                               ║
║   場景: ${testName}                                          ║
║   ${config.label}                                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   總請求:     ${String(reqs).padStart(8)}    成功: ${String(ok).padStart(8)}    失敗: ${String(fail).padStart(8)}  ║
║   RPS:        ${String(rps.toFixed(1)).padStart(8)}    成功率: ${String(((1 - errs) * 100).toFixed(2) + '%').padStart(8)}                    ║
║                                                              ║
║   ── 延遲分布 ──                                             ║
║   最小:   ${String(min.toFixed(0) + 'ms').padStart(8)}    中位數: ${String(med.toFixed(0) + 'ms').padStart(8)}    平均: ${String(avg.toFixed(0) + 'ms').padStart(8)}  ║
║   P95:    ${String(p95.toFixed(0) + 'ms').padStart(8)}    P99:    ${String(p99.toFixed(0) + 'ms').padStart(8)}    最大: ${String(max.toFixed(0) + 'ms').padStart(8)}  ║
║                                                              ║
║   ── 錯誤分類 ──                                             ║
║   Timeout:  ${String(timeouts).padStart(6)}    5xx: ${String(s5xx).padStart(6)}    其他: ${String(fail - timeouts - s5xx).padStart(6)}             ║
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
}

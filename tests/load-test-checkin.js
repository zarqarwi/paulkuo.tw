import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// Formosa ESG 2026 — 容量測試（Capacity Test）
// 目的：驗證 KV 緩衝架構在持續負載下的吞吐量與資料完整性
// 用法：k6 run -e STAGE=10k tests/load-test-checkin.js
// ============================================================

const errorRate = new Rate('errors');
const checkinDuration = new Trend('checkin_duration', true);
const checkinSuccess = new Counter('checkin_success');
const checkinFail = new Counter('checkin_fail');

const BASE_URL = 'https://paulkuo-ticker.paul-4bf.workers.dev';

// ── 容量測試場景（MacBook Air 單機可執行） ──
const stages = {
  // C-10K: ~10,000 請求，峰值 500 VU，~3 分鐘
  '10k': [
    { duration: '30s', target: 200 },    // 暖機
    { duration: '30s', target: 500 },    // 爬升到峰值
    { duration: '90s', target: 500 },    // 穩定峰值（主要測試區段）
    { duration: '30s', target: 0 },      // 冷卻
  ],
  // C-50K: ~50,000 請求，峰值 1000 VU，~8 分鐘
  '50k': [
    { duration: '30s', target: 300 },    // 暖機
    { duration: '30s', target: 700 },    // 爬升
    { duration: '30s', target: 1000 },   // 到達峰值
    { duration: '300s', target: 1000 },  // 穩定峰值 5 分鐘
    { duration: '30s', target: 500 },    // 逐步降載
    { duration: '30s', target: 0 },      // 冷卻
  ],
  // C-100K: ~100,000 請求，峰值 1500 VU，~12 分鐘
  '100k': [
    { duration: '30s', target: 500 },    // 暖機
    { duration: '30s', target: 1000 },   // 爬升
    { duration: '30s', target: 1500 },   // 到達峰值
    { duration: '480s', target: 1500 },  // 穩定峰值 8 分鐘
    { duration: '30s', target: 800 },    // 逐步降載
    { duration: '30s', target: 0 },      // 冷卻
  ],
};

// ── 通過標準 ──
const thresholdMap = {
  '10k':  { p95: 1000, errRate: 0.05 },   // P95 < 1s, 錯誤率 < 5%
  '50k':  { p95: 1500, errRate: 0.08 },   // P95 < 1.5s, 錯誤率 < 8%
  '100k': { p95: 2000, errRate: 0.10 },   // P95 < 2s, 錯誤率 < 10%
};

const stage = __ENV.STAGE || '10k';
const th = thresholdMap[stage] || thresholdMap['10k'];

export const options = {
  stages: stages[stage],
  thresholds: {
    http_req_duration: [`p(95)<${th.p95}`],
    errors: [`rate<${th.errRate}`],
  },
  noConnectionReuse: false,
  userAgent: 'k6-formosa-loadtest/2.0',
};

// ── 白沙屯↔北港路線隨機 GPS ──
function randomGPS() {
  const lat = 23.55 + Math.random() * 0.6;
  const lng = 120.25 + Math.random() * 0.4;
  return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
}

// ── 主測試邏輯 ──
export default function () {
  const userId = `loadtest_user_${__VU}_${__ITER}`;
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

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has ok': (r) => {
      try { return JSON.parse(r.body).ok === true; } catch { return false; }
    },
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (success) {
    checkinSuccess.add(1);
  } else {
    checkinFail.add(1);
  }
  errorRate.add(!success);

  // 模擬真實用戶行為：打卡間隔 1-3 秒
  sleep(1 + Math.random() * 2);
}

// ── 測試摘要輸出 ──
export function handleSummary(data) {
  const now = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return {
    'stdout': textSummary(data),
    [`tests/results/capacity-${stage}-${now}.json`]: JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const reqs = m.http_reqs?.values?.count || 0;
  const rps = m.http_reqs?.values?.rate || 0;
  const p95 = m.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = m.http_req_duration?.values?.['p(99)'] || 0;
  const avg = m.http_req_duration?.values?.avg || 0;
  const errs = m.errors?.values?.rate || 0;
  const ok = m.checkin_success?.values?.count || 0;
  const fail = m.checkin_fail?.values?.count || 0;

  return `
╔════════════════════════════════════════════════════════╗
║   Formosa ESG 2026 — 容量測試報告                      ║
║   場景: C-${stage.toUpperCase()}                                         ║
╠════════════════════════════════════════════════════════╣
║ 總請求數:    ${String(reqs).padStart(10)}                            ║
║ 成功數:      ${String(ok).padStart(10)}                            ║
║ 失敗數:      ${String(fail).padStart(10)}                            ║
║ RPS:         ${String(rps.toFixed(1)).padStart(10)}                            ║
║ 平均延遲:    ${String(avg.toFixed(0) + 'ms').padStart(10)}                            ║
║ P95 延遲:    ${String(p95.toFixed(0) + 'ms').padStart(10)}  (標準: <${th.p95}ms)       ║
║ P99 延遲:    ${String(p99.toFixed(0) + 'ms').padStart(10)}                            ║
║ 錯誤率:      ${String((errs * 100).toFixed(2) + '%').padStart(10)}  (標準: <${(th.errRate * 100)}%)         ║
╠════════════════════════════════════════════════════════╣
║ ⏳ 請等待 2 分鐘後執行資料完整性驗證                    ║
║ 驗證指令：見測試說明文件                                ║
╚════════════════════════════════════════════════════════╝
`;
}

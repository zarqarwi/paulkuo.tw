import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================
// Formosa ESG 2026 — 瞬間尖峰測試（Spike Test）
// 目的：模擬起駕瞬間數千人同時打卡的場景
// 用法：k6 run -e SPIKE=burst tests/spike-test-checkin.js
// ============================================================

const errorRate = new Rate('errors');
const checkinDuration = new Trend('checkin_duration', true);
const checkinSuccess = new Counter('checkin_success');
const checkinFail = new Counter('checkin_fail');

const BASE_URL = 'https://paulkuo-ticker.paul-4bf.workers.dev';

// ── 尖峰測試場景 ──
const spikeConfigs = {
  // S-BURST：起駕瞬間，10 秒內從 0 爆到 2500 人
  'burst': [
    { duration: '10s', target: 50 },      // 微暖機（避免 TCP 建連風暴）
    { duration: '10s', target: 2500 },    // 10 秒爆升到 2500 VU ← 核心測試
    { duration: '60s', target: 2500 },    // 維持尖峰 60 秒
    { duration: '30s', target: 500 },     // 快速回落
    { duration: '60s', target: 500 },     // 穩定低流量（觀察恢復力）
    { duration: '20s', target: 0 },       // 冷卻
  ],
  // S-WAVE：多波段間歇爆量（途中多次停駕再起駕）
  'wave': [
    // 第一波
    { duration: '10s', target: 100 },
    { duration: '10s', target: 2000 },
    { duration: '40s', target: 2000 },
    { duration: '15s', target: 200 },
    // 低谷
    { duration: '30s', target: 200 },
    // 第二波
    { duration: '10s', target: 1800 },
    { duration: '40s', target: 1800 },
    { duration: '15s', target: 200 },
    // 低谷
    { duration: '30s', target: 200 },
    // 第三波（最猛）
    { duration: '10s', target: 2200 },
    { duration: '40s', target: 2200 },
    { duration: '20s', target: 0 },
  ],
  // S-EXTREME：極端壓力，找系統斷裂點（探索性測試）
  'extreme': [
    { duration: '5s', target: 100 },
    { duration: '5s', target: 3000 },     // 5 秒內到 3000 VU
    { duration: '90s', target: 3000 },    // 維持 90 秒
    { duration: '15s', target: 0 },
  ],
};

// ── 通過標準（尖峰測試比容量測試寬鬆） ──
const thresholdMap = {
  'burst':   { p95: 3000, errRate: 0.15 },  // P95 < 3s, 錯誤率 < 15%
  'wave':    { p95: 3000, errRate: 0.15 },
  'extreme': { p95: 5000, errRate: 0.30 },  // 探索性，標準更寬
};

const spike = __ENV.SPIKE || 'burst';
const th = thresholdMap[spike] || thresholdMap['burst'];

export const options = {
  stages: spikeConfigs[spike],
  thresholds: {
    http_req_duration: [`p(95)<${th.p95}`],
    errors: [`rate<${th.errRate}`],
  },
  noConnectionReuse: false,
  userAgent: 'k6-formosa-spiketest/1.0',
};

// ── 白沙屯↔北港路線隨機 GPS ──
function randomGPS() {
  const lat = 23.55 + Math.random() * 0.6;
  const lng = 120.25 + Math.random() * 0.4;
  return { lat: lat.toFixed(6), lng: lng.toFixed(6) };
}

// ── 主測試邏輯（尖峰時間隔更短） ──
export default function () {
  const userId = `spike_${spike}_${__VU}_${__ITER}`;
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
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (success) {
    checkinSuccess.add(1);
  } else {
    checkinFail.add(1);
  }
  errorRate.add(!success);

  // 尖峰時人們幾乎同時按打卡，間隔極短
  sleep(Math.random() * 0.5);
}

// ── 測試摘要輸出 ──
export function handleSummary(data) {
  const now = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return {
    'stdout': textSummary(data),
    [`tests/results/spike-${spike}-${now}.json`]: JSON.stringify(data, null, 2),
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

  const spikeLabel = { burst: '起駕瞬間爆量', wave: '多波段間歇', extreme: '極端壓力' };

  return `
╔════════════════════════════════════════════════════════╗
║   Formosa ESG 2026 — 尖峰測試報告                      ║
║   場景: S-${spike.toUpperCase()} (${spikeLabel[spike] || spike})${' '.repeat(Math.max(0, 28 - spike.length - (spikeLabel[spike]||'').length))}║
╠════════════════════════════════════════════════════════╣
║ 總請求數:    ${String(reqs).padStart(10)}                            ║
║ 成功數:      ${String(ok).padStart(10)}                            ║
║ 失敗數:      ${String(fail).padStart(10)}                            ║
║ RPS:         ${String(rps.toFixed(1)).padStart(10)}                            ║
║ 平均延遲:    ${String(avg.toFixed(0) + 'ms').padStart(10)}                            ║
║ P95 延遲:    ${String(p95.toFixed(0) + 'ms').padStart(10)}  (標準: <${th.p95}ms)       ║
║ P99 延遲:    ${String(p99.toFixed(0) + 'ms').padStart(10)}                            ║
║ 錯誤率:      ${String((errs * 100).toFixed(2) + '%').padStart(10)}  (標準: <${(th.errRate * 100)}%)       ║
╠════════════════════════════════════════════════════════╣
║ ⏳ 測試完成後等 2 分鐘再驗證 D1 資料完整性              ║
╚════════════════════════════════════════════════════════╝
`;
}

import { FITBIT_CLIENT_ID, CACHE_TTL_SEC } from './config.js';

export async function refreshToken(kv, env) {
  const tokenJson = await kv.get('fitbit_token'); if (!tokenJson) throw new Error('No token in KV');
  const token = JSON.parse(tokenJson); if (!env.FITBIT_CLIENT_SECRET) throw new Error('FITBIT_CLIENT_SECRET not configured');
  const res = await fetch('https://api.fitbit.com/oauth2/token', { method: 'POST', headers: { 'Authorization': `Basic ${btoa(`${FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=refresh_token&refresh_token=${token.refresh_token}` });
  const newToken = await res.json(); if (!newToken.access_token) throw new Error(`Refresh failed: ${JSON.stringify(newToken).slice(0, 200)}`);
  const stored = { access_token: newToken.access_token, refresh_token: newToken.refresh_token, expires_at: Date.now() + (newToken.expires_in || 28800) * 1000, refreshed_at: new Date().toISOString() };
  await kv.put('fitbit_token', JSON.stringify(stored)); console.log(`Token refreshed, expires in ${newToken.expires_in}s`); return stored;
}

async function fitbitGet(path, token) { const res = await fetch(`https://api.fitbit.com${path}`, { headers: { 'Authorization': `Bearer ${token.access_token}` } }); if (res.status === 401) throw new Error('TOKEN_EXPIRED'); return res.json(); }

async function getToken(kv, env) {
  let tokenJson = await kv.get('fitbit_token'); if (!tokenJson) throw new Error('No Fitbit token configured');
  let token = JSON.parse(tokenJson);
  if (token.expires_at - Date.now() < 2 * 3600 * 1000) { try { token = await refreshToken(kv, env); } catch (e) { console.error('Proactive refresh failed:', e.message); } }
  return token;
}

export async function fetchFitbitData(kv, env) {
  const cacheJson = await kv.get('fitbit_cache');
  if (cacheJson) { const cache = JSON.parse(cacheJson); if (Date.now() - cache.cached_at < CACHE_TTL_SEC * 1000) return { ...cache.data, _cached: true, _age_sec: Math.round((Date.now() - cache.cached_at) / 1000) }; }
  let token = await getToken(kv, env);
  const twNow = new Date(Date.now() + 8 * 60 * 60 * 1000); const today = twNow.toISOString().slice(0, 10); const weekStart = new Date(twNow.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  let summary, stepsData;
  try { [summary, stepsData] = await Promise.all([fitbitGet(`/1/user/-/activities/date/${today}.json`, token), fitbitGet(`/1/user/-/activities/steps/date/${weekStart}/${today}.json`, token)]); }
  catch (e) { if (e.message === 'TOKEN_EXPIRED') { token = await refreshToken(kv, env); [summary, stepsData] = await Promise.all([fitbitGet(`/1/user/-/activities/date/${today}.json`, token), fitbitGet(`/1/user/-/activities/steps/date/${weekStart}/${today}.json`, token)]); } else throw e; }
  const s = summary.summary || {}, goals = summary.goals || {}; const dist = (s.distances || []).find(d => d.activity === 'total')?.distance || 0;
  const data = { updated: new Date().toISOString(), source: 'cloudflare-worker', token_status: 'active', today: { steps: s.steps || 0, goal: goals.steps || 10000, distance_km: Math.round(dist * 100) / 100, calories: s.activityCalories || 0, resting_hr: s.restingHeartRate || 0 }, week: (stepsData['activities-steps'] || []).map(d => ({ date: d.dateTime, steps: parseInt(d.value, 10) })) };
  await kv.put('fitbit_cache', JSON.stringify({ data, cached_at: Date.now() })); return data;
}

export async function fetchSleepData(kv, params, env) {
  let token = await getToken(kv, env); const { year, month } = params;
  if (month) {
    const [y, m] = month.split('-').map(Number); const start = `${y}-${String(m).padStart(2,'0')}-01`; const end = `${y}-${String(m).padStart(2,'0')}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}`;
    let data; try { data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token); } catch (e) { if (e.message === 'TOKEN_EXPIRED') { token = await refreshToken(kv, env); data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token); } else throw e; }
    const daily = {}; for (const log of (data.sleep || [])) { if (!log.isMainSleep) continue; const d = log.dateOfSleep; if (!daily[d]) daily[d] = { date: d, duration_min: 0, deep_min: 0, light_min: 0, rem_min: 0, wake_min: 0, efficiency: 0, start: '', end: '' }; daily[d].duration_min += Math.round((log.duration || 0) / 60000); daily[d].efficiency = log.efficiency || 0; daily[d].start = log.startTime || ''; daily[d].end = log.endTime || ''; const stages = log.levels?.summary || {}; daily[d].deep_min += stages.deep?.minutes || 0; daily[d].light_min += stages.light?.minutes || 0; daily[d].rem_min += stages.rem?.minutes || 0; daily[d].wake_min += stages.wake?.minutes || 0; }
    const days = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)); const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, d) => s + d[key], 0) / arr.length) : 0;
    return { month, days_tracked: days.length, avg_duration_min: avg(days, 'duration_min'), avg_deep_min: avg(days, 'deep_min'), avg_rem_min: avg(days, 'rem_min'), avg_light_min: avg(days, 'light_min'), avg_wake_min: avg(days, 'wake_min'), avg_efficiency: avg(days, 'efficiency'), daily: days };
  }
  if (year) {
    const y = parseInt(year); const chunks = [[`${y}-01-01`,`${y}-03-31`],[`${y}-04-01`,`${y}-06-30`],[`${y}-07-01`,`${y}-09-30`],[`${y}-10-01`,`${y}-12-31`]]; const allLogs = [];
    for (const [start, end] of chunks) { try { const data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token); if (data.sleep) allLogs.push(...data.sleep); } catch (e) { if (e.message === 'TOKEN_EXPIRED') { token = await refreshToken(kv, env); const data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token); if (data.sleep) allLogs.push(...data.sleep); } else console.error(`Sleep chunk failed:`, e.message); } }
    const months = {}; for (const log of allLogs) { if (!log.isMainSleep) continue; const m = log.dateOfSleep.slice(0, 7); if (!months[m]) months[m] = { month: m, days: 0, total_min: 0, deep_min: 0, light_min: 0, rem_min: 0, wake_min: 0, efficiency_sum: 0 }; months[m].days++; months[m].total_min += Math.round((log.duration || 0) / 60000); const stages = log.levels?.summary || {}; months[m].deep_min += stages.deep?.minutes || 0; months[m].light_min += stages.light?.minutes || 0; months[m].rem_min += stages.rem?.minutes || 0; months[m].wake_min += stages.wake?.minutes || 0; months[m].efficiency_sum += log.efficiency || 0; }
    const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({ month: m.month, days_tracked: m.days, avg_duration_min: m.days ? Math.round(m.total_min / m.days) : 0, avg_deep_min: m.days ? Math.round(m.deep_min / m.days) : 0, avg_rem_min: m.days ? Math.round(m.rem_min / m.days) : 0, avg_light_min: m.days ? Math.round(m.light_min / m.days) : 0, avg_wake_min: m.days ? Math.round(m.wake_min / m.days) : 0, avg_efficiency: m.days ? Math.round(m.efficiency_sum / m.days) : 0 }));
    const totalDays = monthly.reduce((s, m) => s + m.days_tracked, 0); const avgAll = (key) => totalDays ? Math.round(monthly.reduce((s, m) => s + m[key] * m.days_tracked, 0) / totalDays) : 0;
    return { year: y, total_days_tracked: totalDays, yearly_avg_duration_min: avgAll('avg_duration_min'), yearly_avg_deep_min: avgAll('avg_deep_min'), yearly_avg_rem_min: avgAll('avg_rem_min'), yearly_avg_efficiency: avgAll('avg_efficiency'), monthly };
  }
  throw new Error('Missing parameter: use ?year=2025 or ?month=2025-03');
}

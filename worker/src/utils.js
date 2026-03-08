import { ALLOWED_ORIGINS } from './config.js';

export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

export function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

const rateLimitMap = new Map();
export function checkRateLimit(ip, limit) {
  const now = Date.now();
  const key = ip + '_' + Math.floor(now / 60000);
  if (rateLimitMap.size > 1000) rateLimitMap.clear();
  const count = rateLimitMap.get(key) || 0;
  if (count >= limit) return false;
  rateLimitMap.set(key, count + 1);
  return true;
}

export function twISOString(date) {
  const d = date || new Date();
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().replace('Z', '+08:00');
}

export function twDateStr(date) {
  const d = date || new Date();
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function nanoid(size = 21) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] & 63];
  return id;
}

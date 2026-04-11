import { jsonResponse, corsHeaders } from './utils.js';

/**
 * Verify Bearer token for governance API
 * Returns true if authorized, false otherwise
 */
function isAuthorized(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  // GOVERNANCE_TOKEN secret set in Cloudflare Dashboard
  return token === env.GOVERNANCE_TOKEN;
}

function unauthorized(request) {
  return jsonResponse({ error: 'Unauthorized' }, 401, request);
}

/**
 * GET /api/governance/summary
 * Returns aggregate summary across all projects + automation stats
 */
export async function handleGovernanceSummary(request, env) {
  if (!isAuthorized(request, env)) return unauthorized(request);

  const data = await env.TICKER_KV.get('gov:summary');
  if (!data) return jsonResponse({ error: 'Summary not available. Run governance-kv-seed.cjs first.' }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

/**
 * GET /api/governance/projects
 * Returns full project registry
 */
export async function handleGovernanceProjects(request, env) {
  if (!isAuthorized(request, env)) return unauthorized(request);

  const data = await env.TICKER_KV.get('gov:projects');
  if (!data) return jsonResponse({ error: 'Projects not available. Run governance-kv-seed.cjs first.' }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

/**
 * GET /api/governance/metrics/:project_id
 * Returns metrics history for a single project (date descending)
 */
export async function handleGovernanceMetrics(request, env, projectId) {
  if (!isAuthorized(request, env)) return unauthorized(request);

  if (!projectId || projectId.includes('/') || !/^[a-z0-9\-]+$/.test(projectId)) {
    return jsonResponse({ error: 'Invalid project_id' }, 400, request);
  }

  const data = await env.TICKER_KV.get(`gov:metrics:${projectId}`);
  if (!data) return jsonResponse({ error: `No metrics found for project: ${projectId}` }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

/**
 * GET /api/governance/automation
 * Returns automation registry
 */
export async function handleGovernanceAutomation(request, env) {
  if (!isAuthorized(request, env)) return unauthorized(request);

  const data = await env.TICKER_KV.get('gov:automation');
  if (!data) return jsonResponse({ error: 'Automation registry not available. Run governance-kv-seed.cjs first.' }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

/**
 * GET /api/governance/audit
 * Returns cross-project audit results + trend
 */
export async function handleGovernanceAudit(request, env) {
  if (!isAuthorized(request, env)) return unauthorized(request);
  const data = await env.TICKER_KV.get('gov:audit');
  if (!data) return jsonResponse({ error: 'Audit data not available. Run scanner + kv-seed first.' }, 404, request);
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

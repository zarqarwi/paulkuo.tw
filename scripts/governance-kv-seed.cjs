#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const GOVERNANCE_DIR = path.join(PROJECT_ROOT, 'worklogs', 'governance');
const METRICS_DIR = path.join(PROJECT_ROOT, 'worklogs', 'metrics');
const NAMESPACE_ID = 'c066a2fd7942494c8ead37cc518b191b';

/**
 * Upload a single KV key using wrangler CLI
 */
function uploadToKV(key, value) {
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
  const tmpFile = path.join(require('os').tmpdir(), `gov-kv-seed-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, jsonStr, 'utf-8');

  const cmd = `npx wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}'`;

  try {
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' });
    fs.unlinkSync(tmpFile);
    console.log(`  ✓ ${key} (${Math.round(jsonStr.length / 1024 * 10) / 10}KB)`);
  } catch (err) {
    fs.unlinkSync(tmpFile);
    console.error(`  ✗ Failed to upload ${key}: ${err.stderr || err.message}`);
    process.exit(1);
  }
}

/**
 * Load all metrics for a project, sorted by date descending
 */
function loadProjectMetrics(projectId) {
  const dir = path.join(METRICS_DIR, projectId);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse();
  const metrics = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    metrics.push(data);
  }

  return metrics;
}

/**
 * Calculate summary for a single project from its metrics array
 */
function calcProjectSummary(project, metrics) {
  if (metrics.length === 0) {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      last_activity: project.started,
      total_commits: 0,
      total_deploys: 0,
      total_files_changed: 0,
      health: 'red',
    };
  }

  const total_commits = metrics.reduce((s, m) => s + (m.outputs?.commits || 0), 0);
  const total_deploys = metrics.reduce((s, m) => s + (m.outputs?.deploys || 0), 0);
  const total_files_changed = metrics.reduce((s, m) => s + (m.outputs?.files_changed || 0), 0);

  // Most recent date (metrics are sorted desc)
  const last_activity = metrics[0].date;

  const days = Math.floor((Date.now() - new Date(last_activity).getTime()) / 86400000);
  const health = days <= 7 ? 'green' : days <= 14 ? 'yellow' : 'red';

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    last_activity,
    total_commits,
    total_deploys,
    total_files_changed,
    health,
  };
}

/**
 * Build gov:audit payload from audit-results/ directory
 */
function buildAuditPayload(governanceDir) {
  const auditDir = path.join(governanceDir, 'audit-results');
  const lastScanPath = path.join(governanceDir, 'last-scan.json');
  const empty = { recent: [], trend: { dates: [], missing_tags: [], missing_smoke_tests: [] }, scanner_health: { last_success: null, is_healthy: false } };

  if (!fs.existsSync(auditDir)) return empty;

  const files = fs.readdirSync(auditDir)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
    .sort()
    .reverse()
    .slice(0, 7);

  if (files.length === 0) return empty;

  const recent = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(auditDir, f), 'utf-8'));
      return {
        date: data.date,
        total_flagged: data.summary?.total_flagged || 0,
        missing_tags: data.summary?.missing_tags || 0,
        missing_smoke_tests: data.summary?.missing_smoke_tests || 0,
      };
    } catch { return null; }
  }).filter(Boolean);

  // trend arrays（oldest to newest for chart display）
  const ordered = [...recent].reverse();
  const trend = {
    dates: ordered.map(r => r.date),
    missing_tags: ordered.map(r => r.missing_tags),
    missing_smoke_tests: ordered.map(r => r.missing_smoke_tests),
  };

  let scanner_health = { last_success: null, is_healthy: false };
  if (fs.existsSync(lastScanPath)) {
    try {
      const ls = JSON.parse(fs.readFileSync(lastScanPath, 'utf-8'));
      const hoursSince = (Date.now() - new Date(ls.last_success).getTime()) / 3600000;
      scanner_health = { last_success: ls.last_success, is_healthy: hoursSince < 48 };
    } catch { /* non-fatal */ }
  }

  return { recent, trend, scanner_health };
}

/**
 * Main seeding logic
 */
async function seed() {
  console.log('=== Governance KV Seeder ===\n');

  // 1. gov:projects
  console.log('1. gov:projects');
  const projectsPath = path.join(GOVERNANCE_DIR, 'projects.json');
  if (!fs.existsSync(projectsPath)) { console.error('  ✗ projects.json not found'); process.exit(1); }
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
  uploadToKV('gov:projects', projectsData);

  // 2. gov:automation
  console.log('2. gov:automation');
  const automationPath = path.join(GOVERNANCE_DIR, 'automation-registry.json');
  if (!fs.existsSync(automationPath)) { console.error('  ✗ automation-registry.json not found'); process.exit(1); }
  const automationData = JSON.parse(fs.readFileSync(automationPath, 'utf-8'));
  uploadToKV('gov:automation', automationData);

  // 3. gov:metrics:{project_id} — per-project
  console.log('3. gov:metrics:{project_id}');
  const projects = projectsData.projects;
  let totalMetricsEntries = 0;

  for (const project of projects) {
    const metrics = loadProjectMetrics(project.id);
    totalMetricsEntries += metrics.length;
    const payload = { project_id: project.id, metrics };
    uploadToKV(`gov:metrics:${project.id}`, payload);
  }

  // 4. gov:summary — aggregate
  console.log('4. gov:summary');

  // Automation coverage rate
  const activeTasks = automationData.tasks.filter(t => t.status === 'active').length;
  const manualCount = automationData.manual_recurring.length;
  const coverage_rate = activeTasks / (activeTasks + manualCount);
  const candidates = automationData.manual_recurring
    .filter(t => t.automation_candidate)
    .map(t => t.id);

  const projectSummaries = projects.map(project => {
    const metrics = loadProjectMetrics(project.id);
    return calcProjectSummary(project, metrics);
  });

  // Audit summary snippet for gov:summary
  const auditDir = path.join(GOVERNANCE_DIR, 'audit-results');
  const lastScanPath = path.join(GOVERNANCE_DIR, 'last-scan.json');
  let auditSummaryField = { last_scan: null, scanner_healthy: false, open_issues: 0, trend_7d_avg: 0 };

  if (fs.existsSync(auditDir)) {
    const auditFiles = fs.readdirSync(auditDir)
      .filter(f => f.endsWith('.json') && f !== 'index.json')
      .sort()
      .reverse()
      .slice(0, 7);
    if (auditFiles.length > 0) {
      const latestFile = auditFiles[0];
      const latestData = JSON.parse(fs.readFileSync(path.join(auditDir, latestFile), 'utf-8'));
      const openIssues = (latestData.summary?.missing_tags || 0) + (latestData.summary?.missing_smoke_tests || 0);
      const totalFlaggedArr = auditFiles.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(auditDir, f), 'utf-8')).summary?.total_flagged || 0; } catch { return 0; }
      });
      const trend7dAvg = Math.round((totalFlaggedArr.reduce((a, b) => a + b, 0) / totalFlaggedArr.length) * 10) / 10;

      let scannerHealthy = false;
      if (fs.existsSync(lastScanPath)) {
        const lastScan = JSON.parse(fs.readFileSync(lastScanPath, 'utf-8'));
        const hoursSince = (Date.now() - new Date(lastScan.last_success).getTime()) / 3600000;
        scannerHealthy = hoursSince < 48;
      }

      auditSummaryField = {
        last_scan: latestData.date,
        scanner_healthy: scannerHealthy,
        open_issues: openIssues,
        trend_7d_avg: trend7dAvg,
      };
    }
  }

  const summary = {
    projects: projectSummaries,
    automation: {
      coverage_rate: Math.round(coverage_rate * 1000) / 1000,
      automated_count: activeTasks,
      manual_count: manualCount,
      candidates,
    },
    audit: auditSummaryField,
    total_metrics_entries: totalMetricsEntries,
    last_updated: new Date().toISOString(),
  };
  uploadToKV('gov:summary', summary);

  // 5. gov:audit — 稽核結果（最近 7 天）
  console.log('5. gov:audit');
  const auditPayload = buildAuditPayload(GOVERNANCE_DIR);
  uploadToKV('gov:audit', auditPayload);

  console.log(`\n=== Seed Complete ===`);
  console.log(`Projects: ${projects.length}, Metrics entries: ${totalMetricsEntries}`);
  console.log(`Automation coverage: ${Math.round(coverage_rate * 100)}%`);
}

seed().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

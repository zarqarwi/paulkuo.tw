#!/usr/bin/env node
/**
 * cross-project-scanner.cjs
 * L3 跨專案影響掃描器 — 每日 10:30 由 Cowork scheduled task 觸發
 *
 * 輸入：
 *   - docs/shared-files.json（共用檔案清單，唯一事實來源）
 *   - worklogs/governance/projects.json（專案清單）
 *   - 近 3 天 git log
 *
 * 輸出：
 *   - worklogs/governance/audit-results/{YYYY-MM-DD}.json（結構化稽核結果）
 *   - worklogs/governance/last-scan.json（心跳）
 *   - worklogs/PENDING.md（如有 missing_smoke_tests，追加一行）
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const SHARED_FILES_PATH = path.join(PROJECT_ROOT, 'docs', 'shared-files.json');
const PROJECTS_PATH = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'projects.json');
const AUDIT_DIR = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'audit-results');
const LAST_SCAN_PATH = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'last-scan.json');
const PENDING_PATH = path.join(PROJECT_ROOT, 'worklogs', 'PENDING.md');
const WORKLOGS_DIR = path.join(PROJECT_ROOT, 'worklogs');

const today = new Date().toISOString().slice(0, 10);
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

function run() {
  // ── 1. 讀取 shared-files.json，建立 lookup map ──────────────────
  let sharedFilesData;
  try {
    sharedFilesData = JSON.parse(fs.readFileSync(SHARED_FILES_PATH, 'utf-8'));
  } catch (e) {
    console.error('[scanner] 讀取 shared-files.json 失敗：', e.message);
    process.exit(0);
  }

  // 建立 { filepath → { risk, affects } } map
  // shared-files.json 結構：{ critical: [...], shared_modules: [...], ai_ready_auto: [...] }
  const lookupMap = {};
  const riskCategories = ['critical', 'shared_modules', 'ai_ready_auto'];
  for (const risk of riskCategories) {
    const entries = sharedFilesData[risk];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (entry.file) {
        lookupMap[entry.file] = { risk, affects: entry.affects || [] };
      }
    }
  }
  console.log(`[scanner] Loaded ${Object.keys(lookupMap).length} shared files`);

  // ── 2. 讀取 projects.json ────────────────────────────────────────
  let projectsData;
  try {
    projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf-8'));
  } catch (e) {
    console.error('[scanner] 讀取 projects.json 失敗：', e.message);
    process.exit(0);
  }
  const projectMap = {};
  for (const p of (projectsData.projects || [])) {
    projectMap[p.id] = p.name;
  }

  // ── 3. 跑 git log 取近 3 天 commits ────────────────────────────
  let rawLog;
  try {
    rawLog = execSync(
      `git log --name-only --since="${threeDaysAgo}" --pretty=format:"%h|%s|%ad" --date=short`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8', stdio: 'pipe' }
    );
  } catch (e) {
    console.error('[scanner] git log 失敗：', e.message);
    process.exit(0);
  }

  // ── 4. 解析 git log ──────────────────────────────────────────────
  // 格式：每個 commit 由 "hash|message|date" 標頭行 + 若干 changed files 組成
  const commits = [];
  let current = null;
  for (const line of rawLog.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      // 空行表示 commit 結束，儲存並重置
      if (current) { commits.push(current); current = null; }
      continue;
    }
    if (trimmed.includes('|')) {
      // 可能是 hash|message|date 行
      const parts = trimmed.split('|');
      if (parts.length >= 3 && /^[0-9a-f]{7,}$/.test(parts[0])) {
        if (current) commits.push(current);
        current = { hash: parts[0], message: parts.slice(1, -1).join('|'), date: parts[parts.length - 1], files: [] };
        continue;
      }
    }
    // 普通行 = 檔案路徑
    if (current && trimmed && !trimmed.startsWith('commit ')) {
      current.files.push(trimmed);
    }
  }
  if (current) commits.push(current);
  console.log(`[scanner] 解析 ${commits.length} 個 commits（since ${threeDaysAgo}）`);

  // ── 5. 比對 shared files，找出 flagged commits ──────────────────
  const flagged = [];
  for (const commit of commits) {
    const hitFiles = [];
    const hitAffects = new Set();
    let maxRisk = null;

    for (const f of commit.files) {
      if (lookupMap[f]) {
        hitFiles.push(f);
        const { risk, affects } = lookupMap[f];
        for (const a of affects) hitAffects.add(a);
        // risk priority: critical > shared_modules > ai_ready_auto
        if (!maxRisk || riskCategories.indexOf(risk) < riskCategories.indexOf(maxRisk)) {
          maxRisk = risk;
        }
      }
    }
    if (hitFiles.length === 0) continue;

    // 解析 affects：'*' 展開為全部專案 id
    let affectedProjects = [...hitAffects];
    if (affectedProjects.includes('*')) {
      affectedProjects = Object.keys(projectMap);
    }

    // 檢查 tag
    const has_tag = /\[影響:/.test(commit.message);

    // 檢查 smoke test：同日 worklog 是否包含 "Smoke Test" 區塊
    const has_smoke_test = checkSmokeTest(commit.date);

    flagged.push({
      hash: commit.hash,
      message: commit.message,
      date: commit.date,
      shared_files: hitFiles,
      affected_projects: affectedProjects,
      risk_level: maxRisk,
      has_tag,
      has_smoke_test,
    });
  }

  // ── 6. 彙總 summary ────────────────────────────────────────────
  const missing_tags = flagged.filter(f => !f.has_tag).length;

  // 讀 skip list（供 summary 計算與 PENDING.md 去重共用）
  const SKIP_LIST_PATH = path.join(PROJECT_ROOT, 'worklogs', 'governance', 'smoke-skip.json');
  function loadSkipSet() {
    try {
      if (!fs.existsSync(SKIP_LIST_PATH)) return new Set();
      const data = JSON.parse(fs.readFileSync(SKIP_LIST_PATH, 'utf-8'));
      return new Set(Object.keys(data.entries || {}));
    } catch (e) {
      console.error('[scanner] smoke-skip.json 解析失敗（忽略）：', e.message);
      return new Set();
    }
  }
  const skipSet = loadSkipSet();
  const missing_smoke_tests = flagged.filter(f => !f.has_smoke_test && !skipSet.has(f.hash)).length;
  const by_risk_level = {};
  for (const risk of riskCategories) {
    by_risk_level[risk] = flagged.filter(f => f.risk_level === risk).length;
  }

  const result = {
    $schema: 'audit-result-v1',
    date: today,
    scan_range: `${threeDaysAgo} ~ ${today}`,
    total_commits_scanned: commits.length,
    flagged,
    summary: {
      total_flagged: flagged.length,
      missing_tags,
      missing_smoke_tests,
      by_risk_level,
    },
  };

  console.log(`[scanner] 結果：${flagged.length} flagged，${missing_tags} missing tags，${missing_smoke_tests} missing smoke tests`);

  // ── 7. 寫出 audit-results/{date}.json ──────────────────────────
  try {
    if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });
    fs.writeFileSync(path.join(AUDIT_DIR, `${today}.json`), JSON.stringify(result, null, 2), 'utf-8');
    console.log(`[scanner] ✓ 寫入 audit-results/${today}.json`);
  } catch (e) {
    console.error('[scanner] 寫入 audit-results 失敗：', e.message);
    process.exit(0);
  }

  // ── 8. 更新 last-scan.json ─────────────────────────────────────
  try {
    fs.writeFileSync(LAST_SCAN_PATH, JSON.stringify({
      last_success: new Date().toISOString(),
      commits_scanned: commits.length,
      flagged_count: flagged.length,
    }, null, 2), 'utf-8');
    console.log('[scanner] ✓ 更新 last-scan.json');
  } catch (e) {
    console.error('[scanner] 寫入 last-scan.json 失敗：', e.message);
    process.exit(0);
  }

  // ── 9. 追加 PENDING.md（如有 missing_smoke_tests，hash 級別去重）──
  if (missing_smoke_tests > 0) {
    try {
      // 讀 PENDING.md 已存在的 commit hash（7-8 字元十六進位）
      let existingHashes = new Set();
      const pendingExists = fs.existsSync(PENDING_PATH);
      if (pendingExists) {
        const existing = fs.readFileSync(PENDING_PATH, 'utf-8');
        const matches = [...existing.matchAll(/\b([0-9a-f]{7,8})\b/g)];
        existingHashes = new Set(matches.map(m => m[1]));
      }

      // 過濾：缺 smoke test & 不在 skip list & hash 不在 PENDING.md
      const newCandidates = flagged.filter(f =>
        !f.has_smoke_test &&
        !skipSet.has(f.hash) &&
        !existingHashes.has(f.hash)
      );

      if (newCandidates.length === 0) {
        console.log('[scanner] 無新的 missing smoke test（已在 PENDING.md 或 skip list）');
      } else {
        const missingItems = newCandidates
          .map(f => `${f.hash}（${f.affected_projects.slice(0, 3).join(', ')}）`)
          .join(', ');
        const pendingLine = `- [ ] 🟡 跨專案 smoke test 缺漏：${missingItems} → Code (auto-scanner ${today})\n`;

        if (pendingExists) {
          fs.appendFileSync(PENDING_PATH, pendingLine, 'utf-8');
          console.log(`[scanner] ✓ 追加 PENDING.md（${newCandidates.length} 個新 commit）`);
        } else {
          fs.writeFileSync(PENDING_PATH, `## 待 Code 執行\n${pendingLine}`, 'utf-8');
          console.log('[scanner] ✓ 建立 PENDING.md');
        }
      }
    } catch (e) {
      console.error('[scanner] 寫入 PENDING.md 失敗：', e.message);
      // non-fatal
    }
  }

  console.log('[scanner] 完成 ✅');
}

/**
 * 檢查指定日期的 worklog 是否包含 Smoke Test 區塊
 */
function checkSmokeTest(date) {
  try {
    const worklogPath = path.join(WORKLOGS_DIR, `worklog-${date}.md`);
    if (!fs.existsSync(worklogPath)) return false;
    const content = fs.readFileSync(worklogPath, 'utf-8');
    return content.includes('Smoke Test');
  } catch {
    return false;
  }
}

// graceful exit on uncaught errors
process.on('uncaughtException', (e) => {
  console.error('[scanner] uncaughtException:', e.message);
  process.exit(0);
});

run();

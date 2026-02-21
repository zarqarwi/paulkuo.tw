/**
 * cost-tracker.mjs — API 費用追蹤模組
 * 
 * 所有腳本共用，把每次 API 呼叫的費用寫入 data/costs.jsonl
 * Dashboard 讀這個檔案做視覺化
 */

import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const COST_FILE = join(process.cwd(), 'data', 'costs.jsonl');

// 各 API 的單價估算（USD）
export const PRICING = {
  // Anthropic Claude Sonnet
  'claude-sonnet': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  // OpenAI GPT-4o  
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10.0 / 1_000_000 },
  // DALL-E 3
  'dall-e-3': { perCall: 0.04 },
  // Gemini 2.5 Pro
  'gemini-2.5-pro': { input: 1.25 / 1_000_000, output: 10.0 / 1_000_000 },
  // Grok-3
  'grok-3': { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  // Perplexity
  'perplexity': { perCall: 0.005 },
  // freeimage (free)
  'freeimage': { perCall: 0 },
  // OneUp (included in plan)
  'oneup': { perCall: 0 },
};

/**
 * 記錄一筆 API 費用
 * @param {object} entry
 * @param {string} entry.service - 服務名稱 (anthropic/openai/gemini/xai/perplexity)
 * @param {string} entry.model - 模型名稱
 * @param {string} entry.action - 動作 (translate/summary/debate/image/factcheck)
 * @param {string} entry.source - 呼叫來源 (publish-social/translate/debate-to-article/debate-engine)
 * @param {number} [entry.inputTokens] - 輸入 token 數
 * @param {number} [entry.outputTokens] - 輸出 token 數
 * @param {number} [entry.costUSD] - 直接指定費用（USD），如果不用 token 計算
 * @param {string} [entry.note] - 備註
 */
export function logCost(entry) {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });

  const model = entry.model || 'unknown';
  const pricing = PRICING[model] || {};
  
  let costUSD = entry.costUSD || 0;
  if (!costUSD && pricing.perCall) {
    costUSD = pricing.perCall;
  }
  if (!costUSD && entry.inputTokens && pricing.input) {
    costUSD = (entry.inputTokens * pricing.input) + (entry.outputTokens || 0) * (pricing.output || 0);
  }

  const record = {
    timestamp: new Date().toISOString(),
    service: entry.service,
    model,
    action: entry.action,
    source: entry.source,
    inputTokens: entry.inputTokens || 0,
    outputTokens: entry.outputTokens || 0,
    costUSD: Math.round(costUSD * 1_000_000) / 1_000_000, // 6 decimal places
    costTWD: Math.round(costUSD * 32.5 * 100) / 100, // approx TWD
    note: entry.note || '',
  };

  appendFileSync(COST_FILE, JSON.stringify(record) + '\n');
  return record;
}

/**
 * 讀取所有費用記錄
 */
export function readCosts() {
  if (!existsSync(COST_FILE)) return [];
  return readFileSync(COST_FILE, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

/**
 * 產出費用摘要
 */
export function costSummary(costs = null) {
  const records = costs || readCosts();
  
  const byService = {};
  const bySource = {};
  const byDay = {};
  let total = 0;

  for (const r of records) {
    byService[r.service] = (byService[r.service] || 0) + r.costUSD;
    bySource[r.source] = (bySource[r.source] || 0) + r.costUSD;
    const day = r.timestamp.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + r.costUSD;
    total += r.costUSD;
  }

  return { total, totalTWD: Math.round(total * 32.5 * 100) / 100, byService, bySource, byDay, recordCount: records.length };
}

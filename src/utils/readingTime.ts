/**
 * 自動計算閱讀時間
 * 中文：400 字/分鐘
 * 英文：200 words/分鐘
 */
export function calcReadingTime(text: string): number {
  // Remove frontmatter
  const body = text.replace(/^---[\s\S]*?---/, '').trim();
  
  // Count CJK characters
  const cjkChars = (body.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  
  // Count non-CJK words (English, etc.)
  const nonCjk = body.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const words = nonCjk.split(/\s+/).filter(w => w.length > 0).length;
  
  // Calculate minutes
  const cjkMinutes = cjkChars / 400;
  const wordMinutes = words / 200;
  const total = cjkMinutes + wordMinutes;
  
  return Math.max(1, Math.round(total));
}

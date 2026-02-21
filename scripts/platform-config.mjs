/**
 * platform-config.mjs — 社群平台統一設定
 * 
 * oneup_post.py 和 publish-social.mjs 共用的平台 ID
 * 修改帳號只需改這一份
 */

export const PLATFORM_IDS = {
  FB: '26970717712518471',
  X: 'zarqarwi_twitter',
  LI: 'urn:li:person:wrlK3lGrJP',
  YT: 'UCm7xvpaPwk4w1dNdhnz6O5g',
  TH: '26024801023795076',
  BS: 'did:plc:vag6mnwt2upj3ftlberu73la',
  RD: 'Constant-Variety1656',
  IG: 'zarqarwi_insta',
};

// 這些平台 OneUp 無法自動發佈，需手動
export const MANUAL_PLATFORMS = new Set(['FB', 'IG']);

export const CHAR_LIMITS = {
  X: 280, TH: 500, BS: 300, LI: 3000, YT: 5000,
  FB: 10000, RD: 40000, IG: 2200,
};

export const DEFAULT_REDDIT_SUBREDDIT = 'u_Constant-Variety1656';

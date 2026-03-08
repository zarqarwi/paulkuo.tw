export const FITBIT_CLIENT_ID = '23V2BH';
export const CACHE_TTL_SEC = 300;
export const STOCK_SYMBOL = '436A.T';
export const STOCK_NAME = 'CyberSolutions';
export const STOCK_CACHE_TRADING = 600;
export const STOCK_CACHE_CLOSED = 3600;
export const ALLOWED_ORIGINS = ['https://paulkuo.tw', 'http://localhost:4321', 'http://localhost:3000'];
export const GOOGLE_CLIENT_ID = '220236417478-a3b13lfa6e4q1100bdmdhuc07o97cc1c.apps.googleusercontent.com';
export const GOOGLE_REDIRECT_URI = 'https://api.paulkuo.tw/auth/google/callback';
export const GOOGLE_SCOPES = 'openid email profile';
export const LINE_CHANNEL_ID = '2009342944';
export const LINE_REDIRECT_URI = 'https://api.paulkuo.tw/auth/line/callback';
export const LINE_SCOPES = 'profile openid email';
export const FB_APP_ID = '1625606208779447';
export const FB_REDIRECT_URI = 'https://api.paulkuo.tw/auth/facebook/callback';
export const FB_SCOPES = 'public_profile,email';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
export const SITE_URL = 'https://paulkuo.tw';
export const INVITE_BUDGET_SEC = 7200;
export const PRICING = {
  'whisper-1': { perMinute: 0.006 },
  'claude-haiku-4-5-20251001': { inputPerMTok: 1.00, outputPerMTok: 5.00 },
  'whisper-large-v3-turbo': { perHour: 0.04 },
};
export const TNAMES = {
  'ja': '日本語', 'zh-TW': '繁體中文', 'en': 'English', 'zh-CN': '简体中文', 'ko': '한국어',
  'vi': 'Tiếng Việt', 'th': 'ภาษาไทย', 'id': 'Bahasa Indonesia',
  'de': 'Deutsch', 'es': 'Español', 'fr': 'Français',
};
export const STT_RATE_LIMIT = 20;
export const TRANSLATE_RATE_LIMIT = 30;
export const GROQ_STT_RATE_LIMIT = 30;
export const GOOGLE_STT_RATE_LIMIT = 30;
export const TICKER_CACHE_TTL = 300;
export const FEED_CACHE_TTL = 60;
export const GOOGLE_STT_PROJECT = 'gen-lang-client-0807419728';
export const GOOGLE_STT_LOCATION = 'us';
export const LINKEDIN_API_VERSION = '202501';

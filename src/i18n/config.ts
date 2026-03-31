/**
 * Formosa ESG 2026 — i18n Configuration
 *
 * 支援語言：zh-Hant（預設）、en、ja、zh-Hans
 * URL 結構：/ (zh-Hant) | /en/ | /ja/ | /zh-cn/
 */

export const SUPPORTED_LOCALES = ['zh-Hant', 'en', 'ja', 'zh-Hans'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: Locale = 'zh-Hant';

/** URL path prefix for each locale (empty string = default, no prefix) */
export const LOCALE_PREFIX: Record<Locale, string> = {
  'zh-Hant': '',
  'en': '/en',
  'ja': '/ja',
  'zh-Hans': '/zh-cn',
};

/** Display label for the language switcher */
export const LOCALE_LABEL: Record<Locale, string> = {
  'zh-Hant': '繁',
  'en': 'EN',
  'ja': '日',
  'zh-Hans': '简',
};

/** HTML lang attribute value */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  'zh-Hant': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
  'zh-Hans': 'zh-Hans',
};

/** hreflang value (used in <link rel="alternate">) */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  'zh-Hant': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
  'zh-Hans': 'zh-Hans',
};

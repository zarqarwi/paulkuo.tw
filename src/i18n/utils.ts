/**
 * Formosa ESG 2026 — i18n Utility Functions
 *
 * 使用方式：
 *   import { t, getLangFromURL } from '@/i18n/utils';
 *   const lang = getLangFromURL(Astro.url);
 *   t(lang, 'nav.checkin')  // → "打卡" or "Check-in"
 */

import type { Locale } from './config';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_PREFIX } from './config';
import { zhHant } from './translations/zh-Hant';
import { en } from './translations/en';
import { ja } from './translations/ja';
import { zhHans } from './translations/zh-Hans';

// All translation dictionaries, keyed by locale
const dictionaries: Record<Locale, typeof zhHant> = {
  'zh-Hant': zhHant,
  'en': en,
  'ja': ja,
  'zh-Hans': zhHans,
};

/**
 * Translate a key for the given locale.
 * Falls back to zh-Hant if the key is missing in the target locale.
 *
 * Supports nested keys with dot notation: t('en', 'levels.1.name')
 */
export function t(locale: Locale, key: string): string {
  const value = getNestedValue(dictionaries[locale], key);
  if (value !== undefined) return value;

  // Fallback to default locale
  if (locale !== DEFAULT_LOCALE) {
    const fallback = getNestedValue(dictionaries[DEFAULT_LOCALE], key);
    if (fallback !== undefined) return fallback;
  }

  // Key not found anywhere — return key itself for debugging
  console.warn(`[i18n] Missing key: "${key}" for locale "${locale}"`);
  return key;
}

/**
 * Get the current locale from a URL path.
 * /en/projects/... → 'en'
 * /ja/projects/... → 'ja'
 * /zh-cn/projects/... → 'zh-Hans'
 * /projects/... → 'zh-Hant'
 */
export function getLangFromURL(url: URL): Locale {
  const path = url.pathname;

  // Check each non-default locale prefix
  for (const locale of SUPPORTED_LOCALES) {
    const prefix = LOCALE_PREFIX[locale];
    if (prefix && path.startsWith(prefix + '/')) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Build language switch links for the current page.
 * Returns an array of { locale, label, href, hreflang, isCurrent }.
 */
export function getLangSwitchLinks(currentPath: string, currentLocale: Locale) {
  // Strip current locale prefix to get the "base" path
  const currentPrefix = LOCALE_PREFIX[currentLocale];
  const basePath = currentPrefix
    ? currentPath.replace(new RegExp(`^${currentPrefix}`), '')
    : currentPath;

  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: locale === 'zh-Hant' ? '繁' : locale === 'en' ? 'EN' : locale === 'ja' ? '日' : '简',
    href: LOCALE_PREFIX[locale] + basePath,
    hreflang: locale,
    isCurrent: locale === currentLocale,
  }));
}

// ── Internal helpers ──

function getNestedValue(obj: any, key: string): string | undefined {
  const keys = key.split('.');
  let current = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return typeof current === 'string' ? current : undefined;
}

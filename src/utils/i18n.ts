/**
 * Shared i18n utilities for BaseLayout and layout components.
 * Centralises language detection, hreflang generation, and lang-switch link building.
 */

const LANG_MAP: Record<string, string> = {
  '/en/': 'en',
  '/ja/': 'ja',
  '/zh-cn/': 'zh-CN',
};

/** Pages that only exist in zh-Hant (no translated versions). */
const ZH_ONLY_PREFIXES = ['/dashboard', '/health', '/search', '/tags', '/tags-graph'];

/* ------------------------------------------------------------------ */

/** Detect the current language from a URL pathname. */
export function getLangFromPath(pathname: string): string {
  return (
    Object.entries(LANG_MAP).find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'zh-Hant'
  );
}

/** Return the lang-prefix string used in internal links. */
export function getLangPrefix(currentLang: string): string {
  if (currentLang === 'en') return '/en';
  if (currentLang === 'ja') return '/ja';
  if (currentLang === 'zh-CN') return '/zh-cn';
  return '';
}

/** Strip the lang prefix from a pathname to get the base path. */
export function getBasePath(pathname: string): string {
  return pathname.replace(/^\/(en|ja|zh-cn)\//, '/');
}

/** Build hreflang alternate links for `<head>`. */
export function getHreflangs(basePath: string): { lang: string; href: string }[] {
  const isZhOnly = ZH_ONLY_PREFIXES.some(
    (p) => basePath === p || basePath.startsWith(p + '/'),
  );

  if (isZhOnly) {
    return [
      { lang: 'zh-TW', href: `https://paulkuo.tw${basePath}` },
      { lang: 'x-default', href: `https://paulkuo.tw${basePath}` },
    ];
  }

  return [
    { lang: 'zh-TW', href: `https://paulkuo.tw${basePath}` },
    { lang: 'en', href: `https://paulkuo.tw/en${basePath}` },
    { lang: 'ja', href: `https://paulkuo.tw/ja${basePath}` },
    { lang: 'zh-CN', href: `https://paulkuo.tw/zh-cn${basePath}` },
    { lang: 'x-default', href: `https://paulkuo.tw${basePath}` },
  ];
}

/** Build lang-switcher link map for NavBar. */
export function getLangSwitchLinks(basePath: string): Record<string, string> {
  const isHome = basePath === '/' || basePath === '';
  return {
    'zh-Hant': isHome ? '/' : basePath,
    en: isHome ? '/?lang=en' : `/en${basePath}`,
    ja: isHome ? '/?lang=ja' : `/ja${basePath}`,
    'zh-CN': isHome ? '/?lang=zh-CN' : `/zh-cn${basePath}`,
  };
}

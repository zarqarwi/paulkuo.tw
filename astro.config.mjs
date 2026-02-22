// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://paulkuo.tw',
  output: 'static',
  vite: {
    ssr: {
      external: ['sharp'],
    },
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'zh-Hant',
        locales: {
          'zh-Hant': 'zh-Hant',
          en: 'en',
          ja: 'ja',
          'zh-CN': 'zh-CN',
        },
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});

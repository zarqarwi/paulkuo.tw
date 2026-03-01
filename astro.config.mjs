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
      serialize(item) {
        // Homepage — highest priority
        if (item.url === 'https://paulkuo.tw/' || item.url === 'https://paulkuo.tw') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Article pages — high priority
        else if (item.url.includes('/articles/')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        }
        // Blog listing, tags, search
        else if (item.url.includes('/blog') || item.url.includes('/tags') || item.url.includes('/search')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // About, projects
        else if (item.url.includes('/about') || item.url.includes('/projects')) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        // Dashboard, health — lower priority (dynamic data, not core content)
        else if (item.url.includes('/dashboard') || item.url.includes('/health')) {
          item.priority = 0.3;
          item.changefreq = 'daily';
        }
        return item;
      },
    }),
  ],
});

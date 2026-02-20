import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://paulkuo.tw',
  output: 'static',
  build: {
    format: 'directory'
  },
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en', 'ja', 'zh-CN'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light'
    }
  }
});

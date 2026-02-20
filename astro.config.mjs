// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://paulkuo.tw',
  output: 'static',
  build: {
    format: 'directory',
  },
});

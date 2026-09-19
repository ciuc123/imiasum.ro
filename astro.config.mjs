import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://imiasum.ro',
  integrations: [sitemap()],
  vite: {
    server: {
      // Enable polling-based file watching to improve reliability on Windows
      watch: {
        usePolling: true,
        interval: 100
      }
    }
  }
});
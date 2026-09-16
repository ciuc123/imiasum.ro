import { defineConfig } from 'astro/config';
import rss from '@astrojs/rss';
export default defineConfig({site:'https://imiasum.ro',integrations:[rss()]});
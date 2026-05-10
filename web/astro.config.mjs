import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://zenkai.systems',
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [tailwind({ applyBaseStyles: false })],
  server: { port: 4322 }
});

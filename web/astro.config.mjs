import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://zenkai.systems',
  output: 'server',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [tailwind({ applyBaseStyles: true })],
  server: { port: 4322 }
});

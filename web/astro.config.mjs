import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

/** Rutas que existen pero no deben indexarse ni aparecer en el sitemap. */
const EXCLUDED_FROM_SITEMAP = ['/404', '/jarvis'];

export default defineConfig({
  site: 'https://zenkai.systems',
  output: 'server',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [
    tailwind({ applyBaseStyles: true }),
    sitemap({
      // Con output:'server' el sitemap sólo puede listar rutas prerenderizadas,
      // que es justo lo que queremos: las páginas públicas. Los endpoints /api/*
      // quedan fuera solos; /404 y /jarvis hay que excluirlos a mano.
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return !EXCLUDED_FROM_SITEMAP.includes(path);
      },
    }),
  ],
  server: { port: 4322 }
});

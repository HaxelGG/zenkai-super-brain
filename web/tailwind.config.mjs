/**
 * Los valores de aquí son un ESPEJO de src/styles/tokens.css, que es la fuente
 * de verdad. Están duplicados como literales a propósito: Tailwind necesita un
 * color literal para poder aplicar el modificador de opacidad (`border-zk-border/50`),
 * y con `var(--zk-border)` esas utilidades dejan de funcionar en silencio — que es
 * la peor forma de romperse. Si cambias un token, cambia también aquí.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        zk: {
          bg: '#08080C',
          bg2: '#0C0C12',
          surface: '#12121A',
          surface2: '#181822',
          surface3: '#1F1F2C',
          border: '#232330',
          border2: '#2E2E3E',
          // Subido de #5A5A70 (3,9:1 sobre el fondo · falla WCAG AA) a 6,1:1.
          muted: '#8A8A9E',
          text2: '#A0A0B4',
          text: '#F5F5FA',
          accent: '#1E6FFF',
          accent2: '#3B82F6',
          accent3: '#7DA5FF',
          accent4: '#A78BFA',
          glow: '#1E6FFF',
          // Acentos por dominio · el mismo valor que los tokens --zk-growth etc.
          growth: '#4A9EFF',
          people: '#8B5CF6',
          ops: '#22C55E',
          data: '#06B6D4',
          // Reservado en exclusiva a los CTA de WhatsApp.
          whatsapp: '#25D366',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          neon: '#00D4FF',
        },
      },
      // Espejo de los tokens de styles/tokens.css. Se declaran apuntando a la
      // custom property y no a la lista de familias para que exista UNA sola
      // fuente de verdad: cambiar la display en tokens.css cambia también
      // `font-display` de Tailwind, sin tener que acordarse de este archivo.
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-body)',
        mono: 'var(--font-mono)',
        wordmark: 'var(--font-wordmark)',
      },
    },
  },
  plugins: [],
};

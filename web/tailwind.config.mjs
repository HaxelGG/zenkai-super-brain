/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        zk: {
          bg: '#030305',
          bg2: '#080810',
          surface: '#0D0D17',
          surface2: '#13131F',
          surface3: '#1A1A28',
          border: '#1F1F2C',
          border2: '#2A2A3A',
          muted: '#5A5A70',
          text2: '#9999AE',
          text: '#F5F5FA',
          accent: '#1E6FFF',
          accent2: '#3B82F6',
          accent3: '#7DA5FF',
          accent4: '#A78BFA',
          glow: '#1E6FFF',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          neon: '#00D4FF',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

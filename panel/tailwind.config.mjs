/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-muted": "rgb(var(--bg-muted) / <alpha-value>)",
        "bg-card": "rgb(var(--bg-card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-hover": "rgb(var(--border-hover) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        "text-faint": "rgb(var(--text-faint) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["'Inter Variable'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono Variable'", "Consolas", "monospace"],
      },
      borderRadius: {
        chip: "6px",
        card: "10px",
        hero: "16px",
      },
      fontSize: {
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.55" }],
        small: ["13px", { lineHeight: "1.5" }],
        micro: ["11px", { lineHeight: "1.4", letterSpacing: "0.06em" }],
      },
    },
  },
  plugins: [],
};

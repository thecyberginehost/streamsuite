import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#22d3ee',        // cyan-400
        'accent-dim': '#0891b2',  // cyan-600
        surface: '#0f172a',       // slate-900
        'surface-light': '#1e293b', // slate-800
        'surface-border': 'rgba(34, 211, 238, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

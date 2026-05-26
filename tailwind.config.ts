import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07090c',
        panel: '#0d1117',
        'panel-2': '#111821',
        border: 'rgba(52, 211, 153, 0.12)',
        'border-strong': 'rgba(52, 211, 153, 0.28)',
        accent: '#34d399',
        'accent-dim': '#10b981',
        'accent-bright': '#6ee7b7',
        cyan: '#22d3ee',
        muted: '#8b96a7',
        ink: '#e5e9f0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(52, 211, 153, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#05080F', 900: '#0A1020', 800: '#111A2E', 700: '#1A2640', 600: '#27365A' },
        line: '#1F2B45',
        mist: { 100: '#E8EEF9', 300: '#B7C3DB', 500: '#7C8AA6' },
        pulse: { green: '#1FB58C', amber: '#F2B134', red: '#E5484D', blue: '#4C8DFF', mint: '#C9F3E4' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        arabic: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: { ticker: 'ticker 48s linear infinite', pulseDot: 'pulseDot 1.6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
export default config;

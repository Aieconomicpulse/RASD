import type { Config } from 'tailwindcss';

/** Colours are CSS variables (see app/globals.css) so light and dark are each designed, not inverted. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    // A reading scale for a minister on a laptop or tablet: nothing below 14px, body at 17–19px.
    fontSize: {
      xs: ['0.875rem', { lineHeight: '1.4' }],     // 14
      sm: ['0.9375rem', { lineHeight: '1.45' }],   // 15
      base: ['1.0625rem', { lineHeight: '1.55' }], // 17
      lg: ['1.1875rem', { lineHeight: '1.5' }],    // 19
      xl: ['1.375rem', { lineHeight: '1.35' }],    // 22
      '2xl': ['1.625rem', { lineHeight: '1.25' }], // 26
      '3xl': ['2rem', { lineHeight: '1.15' }],     // 32
      '4xl': ['2.5rem', { lineHeight: '1.08' }],   // 40
      '5xl': ['3.25rem', { lineHeight: '1.02' }],  // 52
      '6xl': ['4rem', { lineHeight: '1' }],        // 64
    },
    extend: {
      colors: {
        page: v('page'), surface: v('surface'), sunken: v('sunken'),
        ink: { DEFAULT: v('ink'), 2: v('ink-2'), 3: v('ink-3') },
        rule: v('rule'), accent: v('accent'),
        sea: v('sea'), land: v('land'), kingdom: v('kingdom'), coast: v('coast'),
        s1: v('series-1'), s2: v('series-2'), ctx: v('context'), up: v('div-up'), down: v('div-down'),
        // status is fixed in both themes and always travels with a shape and a word
        st: { normal: '#0ca30c', watch: '#fab219', alert: '#ec835a', critical: '#d03b3b' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4 Variable"', '"Noto Naskh Arabic"', 'Georgia', 'serif'],
      },
      maxWidth: { page: '84rem', prose: '44rem' },
    },
  },
  plugins: [],
};
export default config;

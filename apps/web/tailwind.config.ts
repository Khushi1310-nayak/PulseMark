import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0E14',
        surface: {
          DEFAULT: '#121824',
          subtle: '#161F2E',
          muted: '#1A2333',
        },
        border: {
          DEFAULT: '#1E293B',
          subtle: '#2A374A',
          strong: '#334155',
        },
        slate: {
          950: '#070A0F',
          900: '#0B0E14',
          850: '#121824',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        emerald: {
          DEFAULT: '#10B981',
          500: '#10B981',
          400: '#34D399',
          600: '#059669',
          900: '#064E3B',
          950: 'rgba(16, 185, 129, 0.12)',
        },
        rose: {
          DEFAULT: '#F43F5E',
          500: '#F43F5E',
          400: '#FB7185',
          600: '#E11D48',
          900: '#881337',
          950: 'rgba(244, 63, 94, 0.12)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          400: '#FBBF24',
          600: '#D97706',
          900: '#78350F',
          950: 'rgba(245, 158, 11, 0.12)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          500: '#06B6D4',
          400: '#22D3EE',
          950: 'rgba(6, 182, 212, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-up': 'flashUp 0.4s ease-out forwards',
        'flash-down': 'flashDown 0.4s ease-out forwards',
      },
      keyframes: {
        flashUp: {
          '0%': { backgroundColor: 'rgba(16, 185, 129, 0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashDown: {
          '0%': { backgroundColor: 'rgba(244, 63, 94, 0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

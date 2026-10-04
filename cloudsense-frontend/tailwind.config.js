/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#f4f4f5',
        surface: {
          DEFAULT: '#111111',
          elevated: '#1a1a1a',
        },
        border: {
          DEFAULT: '#222222',
          subtle: '#2a2a2a',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          subtle: 'rgba(59, 130, 246, 0.1)',
        },
        danger: {
          DEFAULT: '#ef4444',
          subtle: 'rgba(239, 68, 68, 0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          subtle: 'rgba(245, 158, 11, 0.1)',
        },
        success: {
          DEFAULT: '#22c55e',
          subtle: 'rgba(34, 197, 94, 0.1)',
        },
        zinc: {
          950: '#09090b',
          900: '#111111',
          850: '#18181b',
          800: '#222222',
          700: '#2a2a2a',
          600: '#52525b',
          400: '#a1a1aa',
          100: '#f4f4f5',
        }
      },
      borderRadius: {
        xl: '12px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

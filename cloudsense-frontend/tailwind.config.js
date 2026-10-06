/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // slate-50
        foreground: '#0f172a', // slate-900
        surface: {
          DEFAULT: '#ffffff',
          elevated: '#ffffff',
          muted: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0', // slate-200
          subtle: '#f1f5f9', // slate-100
          strong: '#cbd5e1', // slate-300
        },
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8',
          subtle: '#eff6ff', // blue-50
          border: '#bfdbfe',
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          subtle: '#fef2f2', // red-50
          border: '#fecaca',
        },
        warning: {
          DEFAULT: '#d97706', // amber-600
          subtle: '#fffbeb', // amber-50
          border: '#fde68a',
        },
        success: {
          DEFAULT: '#16a34a', // green-600
          subtle: '#f0fdf4', // green-50
          border: '#bbf7d0',
        },
        slate: {
          25: '#fcfcfd',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)',
      },
    },
  },
  plugins: [],
};

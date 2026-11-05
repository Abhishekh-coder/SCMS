/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#2563eb',   // blue-600
          hover:   '#1d4ed8',   // blue-700
          light:   '#3b82f6',   // blue-500
          dark:    '#1e40af',   // blue-800
          subtle:  '#eaf3ff',   // light blue accent
        },
        surface: {
          DEFAULT: '#f7fafe',   // clean light page background
          card:    '#ffffff',   // clean white card
          raised:  '#ffffff',   // raised card
          muted:   '#f1f5f9',   // light gray surface
          highlight: '#eaf3ff', // light blue surface
          overlay: 'rgba(15, 23, 42, 0.45)',
        },
        border: {
          DEFAULT: '#e2e8f0',
          subtle:  '#f1f5f9',
          strong:  '#cbd5e1',
        },
        status: {
          success:  '#16a34a',
          warning:  '#d97706',
          danger:   '#dc2626',
          info:     '#0284c7',
          neutral:  '#64748b',
        },
      },
      transitionDuration: {
        '0': '0ms',
        'hover':  '120',
        'card':   '180',
        'modal':  '220',
        'page':   '250',
        'timeline': '400',
        'slow':   '500',
      },
      transitionTimingFunction: {
        'ease-out-soft': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      letterSpacing: {
        'ultra-tight': '-0.05em',
        'tighter':     '-0.04em',
        'tight':       '-0.02em',
      },
      lineHeight: {
        'display': '1.1',
        'body':    '1.6',
      },
      boxShadow: {
        'glass':     '0 8px 32px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-lg':  '0 16px 48px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'glow-brand': '0 0 20px rgba(37, 99, 235, 0.15), 0 0 60px rgba(14, 165, 233, 0.06)',
        'glow-cyan':  '0 0 20px rgba(6, 182, 212, 0.15), 0 0 60px rgba(6, 182, 212, 0.06)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 55%, #38bdf8 100%)',
        'gradient-brand-subtle': 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(14,165,233,0.05) 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      animation: {
        'float':       'float 20s ease-in-out infinite',
        'float-slow':  'float 30s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s ease-in-out infinite',
        'fade-in':     'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':    'fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse':  'pulse-glow 2s ease-in-out infinite',
        'gradient':    'gradient-shift 3s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '33%':      { transform: 'translateY(-20px) scale(1.02)' },
          '66%':      { transform: 'translateY(10px) scale(0.98)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(37, 99, 235, 0)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}

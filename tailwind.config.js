/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Controlled radius scale
    borderRadius: {
      none:    '0px',
      sm:      '3px',
      DEFAULT: '4px',
      md:      '6px',
      lg:      '8px',
      xl:      '10px',
      '2xl':   '14px',
      '3xl':   '20px',
      full:    '9999px',
    },
    extend: {
      colors: {
        brand:         '#1565C0',
        'brand-dark':  '#0D47A1',
        'brand-light': '#1976D2',
        'brand-pale':  '#EBF4FF',
        sidebar:       '#111318',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel:    '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)',
        card:     '0 1px 2px 0 rgba(0,0,0,0.05)',
        elevated: '0 4px 16px 0 rgba(0,0,0,0.08)',
        modal:    '0 8px 32px 0 rgba(0,0,0,0.12), 0 2px 8px 0 rgba(0,0,0,0.06)',
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'shrink': {
          from: { width: '100%' },
          to:   { width: '0%' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.15s ease-out',
        'fade-in':  'fade-in 0.12s ease-out',
        'shrink':   'shrink 5s linear forwards',
      },
    },
  },
  plugins: [],
}

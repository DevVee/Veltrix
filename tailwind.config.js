/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Updated radius scale — premium SaaS rounding
    borderRadius: {
      none:    '0px',
      sm:      '6px',
      DEFAULT: '8px',
      md:      '10px',
      lg:      '14px',
      xl:      '18px',
      '2xl':   '24px',
      '3xl':   '32px',
      full:    '9999px',
    },
    extend: {
      colors: {
        brand:         '#4F46E5',
        'brand-dark':  '#4338CA',
        'brand-light': '#EEF2FF',
        'brand-pale':  '#E0E7FF',
        sidebar:       '#0D0E14',
        surface:       '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        xs:           '0 1px 2px rgba(0,0,0,0.05)',
        panel:        '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        card:         '0 1px 3px rgba(0,0,0,0.06)',
        elevated:     '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        lg:           '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
        modal:        '0 20px 60px rgba(0,0,0,0.15)',
        dropdown:     '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'indigo-glow':'0 2px 8px rgba(79,70,229,0.4)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
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
        'shimmer': {
          from: { backgroundPosition: '200% 0' },
          to:   { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.2s ease-out',
        'fade-in':  'fade-in 0.12s ease-out',
        'shrink':   'shrink 5s linear forwards',
        'shimmer':  'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}

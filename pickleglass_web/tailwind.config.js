/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: '#64748b',
        accent: '#06b6d4',
        'subtle-bg': '#f8f7f4',
        'subtle-active-bg': '#e7e5e4',
        
        // Activity category colors
        activity: {
          focus: {
            50: '#eff6ff',
            100: '#dbeafe', 
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          },
          communication: {
            50: '#ecfdf5',
            100: '#d1fae5',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          research: {
            50: '#f5f3ff',
            100: '#ede9fe',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9',
          },
          break: {
            50: '#fffbeb',
            100: '#fef3c7',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
          },
          creative: {
            50: '#fdf2f8',
            100: '#fce7f3',
            500: '#ec4899',
            600: '#db2777',
            700: '#be185d',
          },
        },
        
        // Status colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      
      // Typography scales
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }], // 36px
        'h1': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }], // 30px
        'h2': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], // 24px
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // 20px
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }], // 16px
        'small': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }], // 14px
        'tiny': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }], // 12px
      },
      
      // Spacing system (4px base)
      spacing: {
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
      },
      
      // Border radius system
      borderRadius: {
        'sm': '0.25rem', // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'xl': '1rem', // 16px
        '2xl': '1.5rem', // 24px
      },
      
      // Box shadows for depth
      boxShadow: {
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // Animation durations
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      
      // Custom animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
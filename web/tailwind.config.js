/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: withOpacity('--canvas-rgb'),
          subtle: withOpacity('--canvas-subtle-rgb'),
          muted: withOpacity('--canvas-muted-rgb'),
        },
        surface: {
          DEFAULT: withOpacity('--surface-rgb'),
          subtle: withOpacity('--surface-subtle-rgb'),
          muted: withOpacity('--surface-muted-rgb'),
        },
        line: {
          DEFAULT: withOpacity('--line-rgb'),
          strong: withOpacity('--line-strong-rgb'),
          subtle: withOpacity('--line-subtle-rgb'),
        },
        ink: {
          DEFAULT: withOpacity('--ink-rgb'),
          muted: withOpacity('--ink-muted-rgb'),
          subtle: withOpacity('--ink-subtle-rgb'),
          faint: withOpacity('--ink-faint-rgb'),
        },
        accent: {
          DEFAULT: withOpacity('--accent-rgb'),
          hover: withOpacity('--accent-hover-rgb'),
          soft: 'var(--accent-soft)',
          softHover: 'var(--accent-soft-hover)',
          border: 'var(--accent-border)',
        },
        success: {
          DEFAULT: withOpacity('--success-rgb'),
          soft: 'var(--success-soft)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: withOpacity('--warning-rgb'),
          soft: 'var(--warning-soft)',
          border: 'var(--warning-border)',
        },
        danger: {
          DEFAULT: withOpacity('--danger-rgb'),
          soft: 'var(--danger-soft)',
          border: 'var(--danger-border)',
        },
        info: {
          DEFAULT: withOpacity('--info-rgb'),
          soft: 'var(--info-soft)',
          border: 'var(--info-border)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'app-2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.04em' }],
        'app-xs': ['12px', { lineHeight: '16px' }],
        'app-sm': ['13px', { lineHeight: '20px' }],
        'app-base': ['14px', { lineHeight: '20px' }],
        'app-md': ['15px', { lineHeight: '22px' }],
        'app-lg': ['17px', { lineHeight: '24px' }],
        'app-xl': ['20px', { lineHeight: '28px' }],
        'app-2xl': ['24px', { lineHeight: '32px' }],
        'app-3xl': ['28px', { lineHeight: '36px' }],
      },
      borderRadius: {
        'app-sm': '4px',
        'app-md': '6px',
        'app-lg': '8px',
        'app-xl': '10px',
      },
      boxShadow: {
        'app-xs': 'var(--shadow-xs)',
        'app-sm': 'var(--shadow-sm)',
        'app-md': 'var(--shadow-md)',
        'app-lg': 'var(--shadow-lg)',
        'app-popover': 'var(--shadow-popover)',
        'app-drawer': 'var(--shadow-drawer)',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      transitionTimingFunction: {
        'app': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

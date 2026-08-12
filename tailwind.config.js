/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // As variáveis são injetadas por <ThemeVars> a partir das configurações
        // do painel; os hex abaixo são só o fallback antes do React montar.
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb, 139 47 224) / <alpha-value>)',
          50: 'rgb(var(--brand-50-rgb, 246 239 254) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb, 234 221 253) / <alpha-value>)',
          200: '#d6bbfa',
          300: '#c084fc',
          400: '#a855f7',
          500: 'rgb(var(--brand-rgb, 139 47 224) / <alpha-value>)',
          600: 'rgb(var(--brand-dark-rgb, 124 34 206) / <alpha-value>)',
          700: '#6b1db1',
          800: '#4a137d',
          900: '#2e0b4e',
        },
        ink: 'rgb(var(--ink-rgb, 18 18 18) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb, 153 153 153) / <alpha-value>)',
        line: 'rgb(var(--ink-rgb, 18 18 18) / 0.08)',
        headerbg: 'rgb(var(--header-bg-rgb, 0 0 0) / <alpha-value>)',
        headertext: 'rgb(var(--header-text-rgb, 255 255 255) / <alpha-value>)',
        footerbg: 'rgb(var(--footer-bg-rgb, 0 0 0) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-body, "Inter Tight")', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading, "Inter Tight")', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: 'var(--container-width, 1600px)',
      },
      borderRadius: {
        media: 'var(--radius-media, 12px)',
        btn: 'var(--radius-btn, 8px)',
        pill: '40px',
      },
      boxShadow: {
        card: '0 4px 5px rgba(18,18,18,0.06)',
        soft: '0 2px 10px rgba(18,18,18,0.08)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};

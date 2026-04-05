import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        primary: 'var(--primary)',
        primaryContainer: 'var(--primaryContainer)',
        secondary: 'var(--secondary)',
        secondaryContainer: 'var(--secondaryContainer)',
        tertiary: 'var(--tertiary)',
        error: 'var(--error)',
        success: 'var(--success)',
        surface: 'var(--surface)',
        surfaceContainerLow: 'var(--surfaceContainerLow)',
        surfaceContainerLowest: 'var(--surfaceContainerLowest)',
        surfaceContainerHigh: 'var(--surfaceContainerHigh)',
        onSurface: 'var(--onSurface)',
        onSurfaceVariant: 'var(--onSurfaceVariant)',
        outline: 'var(--outline)',
        outlineVariant: 'var(--outlineVariant)'
      },
      fontFamily: {
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 12px 40px rgba(0, 74, 198, 0.08)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in forwards',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        slideIn: { '0%': { transform: 'translateX(100%)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideOut: { '0%': { transform: 'translateX(0)', opacity: '1' }, '100%': { transform: 'translateX(100%)', opacity: '0' } },
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    },
  },
  plugins: [],
};
export default config;

import type { Config } from 'tailwindcss'
import { colors } from './app/design-system/tokens/colors'

// All accent/brand color usage should use var(--accent) at runtime. These tokens are for reference only.

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        'brand': colors.brand,
        'brand-light': colors.brandLight,
        'brand-dark': colors.brandDark,
        
        // Light mode
        'background-main': colors.light.background.main,
        'background-secondary': colors.light.background.secondary,
        'background-tertiary': colors.light.background.tertiary,
        'text-primary': colors.light.text.primary,
        'text-secondary': colors.light.text.secondary,
        'text-brand': colors.light.text.brand,
        'border-main': colors.light.border.main,
        'border-secondary': colors.light.border.secondary,
        
        // Dark mode
        'dark-background-main': colors.dark.background.main,
        'dark-background-secondary': colors.dark.background.secondary,
        'dark-background-tertiary': colors.dark.background.tertiary,
        'dark-text-primary': colors.dark.text.primary,
        'dark-text-secondary': colors.dark.text.secondary,
        'dark-text-brand': colors.dark.text.brand,
        'dark-border-main': colors.dark.border.main,
        'dark-border-secondary': colors.dark.border.secondary,
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} 
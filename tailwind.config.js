/** @type {import('tailwindcss').Config} */
// All accent/brand color usage should use var(--accent) at runtime. These tokens are for reference only.
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--accent)",
        "primary-light": "var(--background-secondary)",
        "primary-border": "var(--border-secondary)",
        "dark-background-main": "#181818",
        "dark-background-light": "#232323",
        "dark-background-dark": "#000000",
        "dark-primary": "#6237FF",
        "dark-primary-light": "#232323",
        "dark-primary-border": "rgba(98, 55, 255, 0.2)",
        "dark-text-primary": "#F8F6F4",
        "dark-text-secondary": "rgba(248, 246, 244, 0.7)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        background: {
          DEFAULT: "var(--background-main)",
          dark: "var(--background-main)",
        },
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} 
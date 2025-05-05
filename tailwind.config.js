/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E34114",
        "primary-light": "#F8F6F4",
        "primary-border": "rgba(227, 65, 20, 0.2)",
        "dark-background-main": "#181818",
        "dark-background-light": "#232323",
        "dark-background-dark": "#000000",
        "dark-primary": "#E34114",
        "dark-primary-light": "#232323",
        "dark-primary-border": "rgba(227, 65, 20, 0.2)",
        "dark-text-primary": "#F8F6F4",
        "dark-text-secondary": "rgba(248, 246, 244, 0.7)",
        text: {
          primary: "#1e1e1e",
          secondary: "rgba(30, 30, 30, 0.5)",
        },
        background: {
          DEFAULT: "#F8F6F4",
          dark: "#181818",
        },
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} 
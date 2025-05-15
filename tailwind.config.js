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
        primary: "#6237FF",
        "primary-light": "#FEFBFF",
        "primary-border": "rgba(98, 55, 255, 0.2)",
        "dark-background-main": "#181818",
        "dark-background-light": "#232323",
        "dark-background-dark": "#000000",
        "dark-primary": "#6237FF",
        "dark-primary-light": "#232323",
        "dark-primary-border": "rgba(98, 55, 255, 0.2)",
        "dark-text-primary": "#F8F6F4",
        "dark-text-secondary": "rgba(248, 246, 244, 0.7)",
        text: {
          primary: "#1e1e1e",
          secondary: "rgba(30, 30, 30, 0.5)",
        },
        background: {
          DEFAULT: "#FEFBFF",
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
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6237FF",
        "primary-light": "#F4F2F8",
        "primary-border": "rgba(98, 55, 255, 0.2)",
        text: {
          primary: "#1e1e1e",
          secondary: "rgba(30, 30, 30, 0.5)",
        }
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
} 
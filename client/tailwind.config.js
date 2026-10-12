/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#176B45",
        deep: "#073B2C",
        primary: "#238B57",
        mint: "#EAF7EF",
        page: "#F5F9F6",
        water: "#2585D8",
        amber: "#E5A11A",
        warning: "#F59E0B",
        error: "#DC2626",
        ink: "#172B23",
        muted: "#64746C",
        line: "#DCE7E0",
      },
      boxShadow: {
        card: "0 8px 24px rgba(7, 59, 44, 0.06)",
      },
    },
  },
  plugins: [],
};

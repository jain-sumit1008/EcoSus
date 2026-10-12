/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Professional Enterprise Color Theme: Slate Navy, Teal, and White
        sidebar: {
          bg: "#1E293B",      // Sidebar background
          text: "#F1F5F9",    // Sidebar text and icons
          active: "#0F766E",  // Active navigation item
          accent: "#2DD4BF",  // Active item accent
          hover: "#334155",   // Restrained hover background
          muted: "#94A3B8",   // Inactive navigation text
        },
        page: "#F8FAFC",      // Main content background
        card: "#FFFFFF",      // Cards background
        ink: "#0F172A",       // Headings & primary typography
        muted: "#64748B",     // Secondary text
        line: "#E2E8F0",      // Borders
        primary: {
          DEFAULT: "#15803D", // Primary buttons
          hover: "#166534",
        },

        // Functional / Semantic Palette
        forest: "#15803D",
        deep: "#1E293B",
        teal: {
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        mint: "#F0FDFA",      // Soft teal-tinted mint
        water: "#2585D8",
        amber: "#E5A11A",
        warning: "#F59E0B",
        error: "#DC2626",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        sidebar: "4px 0 24px 0 rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

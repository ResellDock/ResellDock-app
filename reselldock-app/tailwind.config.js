/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F6F3",
        surface: "#FFFFFF",
        ink: "#1B1B1D",
        muted: "#6B6B70",
        line: "#E7E4DE",
        brand: { DEFAULT: "#0E7C66", dark: "#0A5E4E", soft: "#E4F3EF" },
        warn: { DEFAULT: "#F5A623", soft: "#FCEED4" },
      },
      borderRadius: { xl2: "14px" },
    },
  },
  plugins: [],
};

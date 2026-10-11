/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { snow: "#f4f2ee", ink: "#1c1c1e", stone: "#8a8680", mist: "#e4e0d9", accent: "#a8623c" },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
      },
      letterSpacing: { wide2: "0.18em" },
    },
  },
  plugins: [],
};

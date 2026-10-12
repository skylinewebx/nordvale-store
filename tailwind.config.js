/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { snow: c("snow"), ink: c("ink"), stone: c("stone"), mist: c("mist"), accent: c("accent") },
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      letterSpacing: { wide2: "0.18em" },
    },
  },
  plugins: [],
};

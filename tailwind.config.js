/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { snow: c("snow"), ink: c("ink"), stone: c("stone"), mist: c("mist"), accent: c("accent"), wine: c("wine") },
      fontFamily: {
        display: ['"Jost"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      letterSpacing: { wide2: "0.18em" },
    },
  },
  plugins: [],
};

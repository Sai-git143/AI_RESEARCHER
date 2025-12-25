/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // blue-600
        secondary: "#475569", // slate-600
        accent: "#8b5cf6", // violet-500
      }
    },
  },
  plugins: [],
}

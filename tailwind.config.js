/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1e1e1e',
        'dark-panel': '#262626',
        'dark-hover': '#363636',
        'dark-border': '#404040',
        'accent-blue': '#7eb8da',
        'marker-city': '#e74c3c',
        'marker-region': '#2ecc71',
        'marker-location': '#9b59b6',
        'marker-town': '#f39c12',
        'marker-continent': '#3498db',
      },
    },
  },
  plugins: [],
}

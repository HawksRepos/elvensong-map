/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a2e',
        'dark-panel': '#2d2d44',
        'dark-hover': '#3d3d54',
        'dark-border': '#4d4d64',
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

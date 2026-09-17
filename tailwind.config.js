/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08090b',
        paper: '#f0eee8',
        amber: '#d8bd78',
        spectral: '#a69ac6',
      },
    },
  },
  plugins: [],
}

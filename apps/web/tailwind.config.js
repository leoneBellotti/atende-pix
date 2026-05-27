/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        mint: '#1f8a70',
        coral: '#d65f3f',
        amber: '#c99622'
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brew: {
          50: '#fbf7ee',
          100: '#f5edd6',
          500: '#c28135',
          600: '#a76426',
          700: '#874921',
          800: '#6f3b20',
          900: '#5c311e',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          white: '#FFFFFF',
          accent: '#008765',
          light: '#D6FFF5'
        },
        neutral: {
          light: '#F2F7F6',
          accent: '#D7E3E0',
          border: '#B8C2BF'
        },
        text: {
          main: '#00231A',
          secondary: '#3D5E56',
          light: '#B2BDBA',
          placeholder: '#A9B2B2',
          accent: '#003629'
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
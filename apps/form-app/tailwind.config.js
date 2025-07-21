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
        primary: {
          DEFAULT: '#131f5b',
          hover: '#1e308e',
        },
        secondary: '#eff1f7',
        accent: '#f2e9d1',
        neutral: {
          primary: '#ffffff',
          secondary: '#f5f4f1',
          inverse: '#080c24',
        }
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Figtree"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
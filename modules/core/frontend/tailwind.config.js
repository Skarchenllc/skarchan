/** @type {import('tailwindcss').Config} */
/* Brand palette — SINGLE SOURCE OF TRUTH (mirrors globals.css :root vars and
   ThemeContext defaults). Primary = USA Old-Glory navy, Secondary = Pakistan
   flag green. */
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
          DEFAULT: '#002868',   // navy
          dark: '#001845',
        },
        secondary: {
          DEFAULT: '#01411C',   // Pakistan green (was #006600 — unified)
          dark: '#012E14',
        },
      },
      boxShadow: {
        // Disable all shadows by setting them to none
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
    },
  },
  plugins: [],
}

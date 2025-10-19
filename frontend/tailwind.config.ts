import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#134686',
          dark: '#0D2F5A',
        },
        secondary: {
          DEFAULT: '#ED3F27',
          dark: '#C22E1A',
        },
        accent: {
          DEFAULT: '#FEB21A',
          dark: '#E59F15',
        },
        cream: '#FDF4E3',
      },
    },
  },
  plugins: [],
}
export default config


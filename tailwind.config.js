/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b26',
          light: '#ff8f5a',
          dark: '#cc5520',
        },
        surface: {
          DEFAULT: '#1a1a1a',
          card: '#242424',
          elevated: '#2e2e2e',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        success: '#22c55e',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

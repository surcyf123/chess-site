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
        'board-light': 'var(--board-light)',
        'board-dark': 'var(--board-dark)',
        'highlight-available': 'var(--highlight-available)',
        'highlight-capture': 'var(--highlight-capture)',
        'highlight-selected': 'var(--highlight-selected)',
        'highlight-last-move': 'var(--highlight-last-move)',
      },
    },
  },
  plugins: [],
} 
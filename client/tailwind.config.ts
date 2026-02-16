import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // D&D themed colors
        'dungeon': {
          'primary': '#1a1a2e',
          'secondary': '#16213e',
          'accent': '#e94560',
          'gold': '#f4a261',
          'parchment': '#f5e6d3',
          'blood': '#8b0000',
        },
      },
      fontFamily: {
        'fantasy': ['Cinzel', 'serif'],
        'body': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;

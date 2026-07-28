import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211c',
        moss: '#315843',
        river: '#2f6f73',
        amber: '#c9832b',
        paper: '#f7f5ef',
      },
    },
  },
  plugins: [],
};

export default config;

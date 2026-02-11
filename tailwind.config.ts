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
        cipher: {
          dark: "#0f0f1a",
          card: "#1a1a2e",
          accent: "#6366f1",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;

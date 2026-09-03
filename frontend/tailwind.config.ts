import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        earth: {
          50: "#f4f7f4",
          100: "#e6ede6",
          200: "#cfe0cf",
          300: "#a9cca9",
          400: "#7cb17c",
          500: "#579557",
          600: "#437843",
          700: "#365f36",
          800: "#2d4c2d",
          900: "#263f26",
          950: "#112211",
        },
      },
      keyframes: {
        pulseRadar: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "50%": { transform: "scale(1.8)", opacity: "0.2" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "pulse-radar": "pulseRadar 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

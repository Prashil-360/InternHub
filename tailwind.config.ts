import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      colors: {
        accent: "#6c77ff",
      },
      borderRadius: {
        sm: "6px", md: "8px", lg: "12px", xl: "16px",
      },
    },
  },
  plugins: [],
};
export default config;

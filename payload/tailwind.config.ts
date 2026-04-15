import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ow: {
          blue: "#2B6CB0",
          "blue-dark": "#1E4E8C",
          "blue-light": "#4A90D9",
          accent: "#5BA3D0",
          navy: "#0A1628",
          "navy-light": "#0F2847",
          green: "#10B981",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        glow: "0 4px 14px rgba(43,108,176,.35)",
        "glow-lg": "0 6px 20px rgba(43,108,176,.5)",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

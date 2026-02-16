import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
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
          "green-dark": "#0EA571",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        glow: "0 4px 14px 0 rgba(43, 108, 176, 0.39)",
        "glow-lg": "0 6px 20px rgba(43, 108, 176, 0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-grid":
          "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "60px 60px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        input: "hsl(214 32% 91%)",
        ring: "hsl(222.2 84% 4.9%)",
        background: "#0b1220",
        foreground: "#f8fafc",
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#0ea5e9",
          foreground: "#0b1220"
        },
        muted: {
          DEFAULT: "#0f172a",
          foreground: "#94a3b8"
        },
        accent: {
          DEFAULT: "#22c55e",
          foreground: "#0b1220"
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff"
        },
        card: {
          DEFAULT: "#0f172a",
          foreground: "#e2e8f0"
        }
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)"
      }
    }
  },
  plugins: []
};

export default config;



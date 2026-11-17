import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        desktop: "860px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        "muted-foreground": "var(--muted-foreground)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--foreground)",
        },
        popover: {
          DEFAULT: "var(--background)",
          foreground: "var(--foreground)",
        },
        primary: {
          DEFAULT: "var(--foreground)",
          foreground: "var(--background)",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--foreground)",
        },
        muted: {
          DEFAULT: "var(--surface)",
          foreground: "var(--muted-foreground)",
        },
        input: "var(--border)",
        ring: "var(--foreground)",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "8px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        "12": ["12px", { lineHeight: "16px" }],
        "14": ["14px", { lineHeight: "20px" }],
        "18": ["18px", { lineHeight: "26px" }],
        "26": ["26px", { lineHeight: "32px" }],
        "40": ["40px", { lineHeight: "48px" }],
      },
      boxShadow: {
        none: "none",
        DEFAULT: "none",
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

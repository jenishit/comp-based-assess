import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F2EFE6",
        foreground: "#2E2A3D",
        border: "#E4DFD1",
        input: "#E4DFD1",
        ring: "#4B7B6E",
        muted: {
          DEFAULT: "#F6EBD3",
          foreground: "#726C7E",
        },
        accent: {
          DEFAULT: "#F6EBD3",
          foreground: "#2E2A3D",
        },
        secondary: {
          DEFAULT: "#F6EBD3",
          foreground: "#2E2A3D",
        },
        primary: {
          DEFAULT: "#4B7B6E",
          foreground: "#F2EFE6",
        },
        destructive: {
          DEFAULT: "#D97D6C",
          foreground: "#F2EFE6",
        },
        card: {
          DEFAULT: "#FBFAF6",
          foreground: "#2E2A3D",
        },
        popover: {
          DEFAULT: "#FBFAF6",
          foreground: "#2E2A3D",
        },
        forest: {
          DEFAULT: "#4B7B6E",
          dark: "#3C6459",
        },
        sage: "#4B7B6E",
        espresso: {
          DEFAULT: "#211E2B",
          deep: "#211E2B",
        },
        cream: "#F2EFE6",
        sand: {
          DEFAULT: "#D9A441",
          light: "#F6EBD3",
          border: "#E4DFD1",
        },
        tan: {
          DEFAULT: "#D9A441",
          alt: "#F6EBD3",
        },
        dark: "#2E2A3D",
        bark: "#726C7E",
        olive: "#3C6459",
        "dk-forest": "#3C6459",
        gold: {
          DEFAULT: "#D9A441",
          soft: "#F6EBD3",
        },
        coral: {
          DEFAULT: "#D97D6C",
          soft: "#F5E2DE",
        },
        ink: {
          DEFAULT: "#2E2A3D",
          deep: "#211E2B",
        },
        paper: "#F2EFE6",
        line: "#E4DFD1",
      },
      fontFamily: {
        sans: ["var(--font-figtree)", "Figtree", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        breathe: "breathe 2.6s ease-in-out infinite",
      },
      maxWidth: {
        content: "1060px",
      },
    },
  },
  plugins: [],
};

export default config;
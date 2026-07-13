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
        background: "#FAF6EF",
        foreground: "#1A100A",
        border: "#E0D0B8",
        input: "#E0D0B8",
        ring: "#4A7C59",
        muted: {
          DEFAULT: "#F0E8D6",
          foreground: "#8B6347",
        },
        accent: {
          DEFAULT: "#F0E8D6",
          foreground: "#1A100A",
        },
        secondary: {
          DEFAULT: "#F0E8D6",
          foreground: "#1A100A",
        },
        primary: {
          DEFAULT: "#4A7C59",
          foreground: "#FAF6EF",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#FAF6EF",
        },
        card: {
          DEFAULT: "#FAF6EF",
          foreground: "#1A100A",
        },
        popover: {
          DEFAULT: "#FAF6EF",
          foreground: "#1A100A",
        },
        forest: {
          DEFAULT: "#4A7C59",
          dark: "#2E5C3A",
        },
        sage: "#7FB069",
        espresso: {
          DEFAULT: "#1E1208",
          deep: "#130C06",
        },
        cream: "#FAF6EF",
        sand: {
          DEFAULT: "#C4A882",
          light: "#F0E8D6",
          border: "#E0D0B8",
        },
        tan: {
          DEFAULT: "#C4A882",
          alt: "#F0E8D6",
        },
        dark: "#1A100A",
        bark: "#8B6347",
        olive: "#6B7C3F",
        "dk-forest": "#2E5C3A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1060px",
      },
    },
  },
  plugins: [],
};

export default config;
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Wine / crimson — primary brand accent
        wine: {
          50:  "#fef2f3",
          100: "#fde0e3",
          200: "#fac5cb",
          300: "#f49aa5",
          400: "#ee6475",
          500: "#e33a52",
          600: "#cc2038",
          700: "#b11226",
          800: "#7a0c1c",
          900: "#5c0815",
          950: "#3d0510",
        },
        // Gold — premium highlights only
        gold: {
          50:  "#FDF9ED",
          100: "#F7EEC8",
          200: "#EDD48A",
          300: "#D4AF37",
          400: "#C9981E",
          500: "#A07A10",
          600: "#7C5E0A",
          700: "#5C4506",
          800: "#3C2C03",
          900: "#1E1601",
        },
        // Mocha — warm neutral tones
        mocha: {
          50:  "#FAF6F3",
          100: "#F0E6DC",
          200: "#DEC8B4",
          300: "#C4A080",
          400: "#AA7A56",
          500: "#8B5E3C",
          600: "#7A4A28",
          700: "#623A1C",
          800: "#4A2C14",
          900: "#301C0C",
        },
        // Sand — warm muted
        sand: {
          50:  "#FDFCFA",
          100: "#F8F4EE",
          200: "#EDE4D8",
          300: "#DDD1C0",
          400: "#C5B09A",
          500: "#A69078",
          600: "#8A7260",
          700: "#6E594A",
          800: "#524134",
          900: "#362A22",
        },
        // Rose — soft warm rose
        rose: {
          50:  "#FDF5F3",
          100: "#F9E8E4",
          200: "#F0CCC4",
          300: "#E4A89C",
          400: "#D4806E",
          500: "#C0614C",
          600: "#A04A38",
          700: "#7C3828",
          800: "#58261A",
          900: "#36160D",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        soft:        "0 2px 12px rgba(0, 0, 0, 0.50), 0 1px 3px rgba(0, 0, 0, 0.30)",
        card:        "0 4px 24px rgba(0, 0, 0, 0.55), 0 1px 4px rgba(0, 0, 0, 0.35)",
        "card-hover":"0 16px 48px rgba(0, 0, 0, 0.65), 0 4px 16px rgba(122, 12, 28, 0.25)",
        premium:     "0 24px 72px rgba(0, 0, 0, 0.70), 0 8px 28px rgba(122, 12, 28, 0.30)",
        glow:        "0 4px 28px rgba(177, 18, 38, 0.45), 0 0 0 1px rgba(212, 175, 55, 0.18)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "video-breathe": {
          "0%, 100%": { opacity: "0.58" },
          "50%":      { opacity: "0.50" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.4s ease-out both",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        shimmer:           "shimmer 2s infinite",
        "scale-in":        "scale-in 0.2s ease-out both",
        "video-breathe":   "video-breathe 9s ease-in-out infinite",
      },
      transitionDelay: {
        "0":   "0ms",
        "50":  "50ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

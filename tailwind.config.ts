import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        plum: { 50: "#f8f3f6", 100: "#f0e4eb", 200: "#e1cbd8", 300: "#cca7bb", 400: "#af7897", 500: "#925a7a", 600: "#794561", 700: "#62384f", 800: "#522f42", 900: "#462b39", 950: "#2a1420" },
        sage: { 50: "#f3f7f3", 100: "#e3ece3", 200: "#c8d9c8", 300: "#a0bea1", 400: "#739e76", 500: "#527f57", 600: "#3f6544", 700: "#355139", 800: "#2d4231", 900: "#27372a" },
        amber: { 50: "#fdf8ee", 100: "#f8ecd2", 200: "#f1d7a1", 300: "#e8bb66", 400: "#df9e3d", 500: "#cd8028", 600: "#ad6221", 700: "#8b4920", 800: "#733c20", 900: "#60331f" }
      },
      borderRadius: { xl: "calc(var(--radius) + 4px)", lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(58, 38, 49, 0.28)",
        card: "0 1px 2px rgba(32, 23, 28, .04), 0 12px 32px -24px rgba(42, 20, 32, .25)"
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "soft-pulse": { "0%,100%": { opacity: ".55", transform: "scale(.92)" }, "50%": { opacity: "1", transform: "scale(1.04)" } },
        "wave": { "0%,100%": { transform: "scaleY(.35)" }, "50%": { transform: "scaleY(1)" } }
      },
      animation: { "fade-up": "fade-up .45s ease-out both", "soft-pulse": "soft-pulse 1.8s ease-in-out infinite", wave: "wave 1s ease-in-out infinite" }
    }
  },
  plugins: []
};

export default config;

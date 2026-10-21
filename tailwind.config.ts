import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8F6",
        ink: { DEFAULT: "#17232B", soft: "#2B3A44", muted: "#5B6B75" },
        flare: { DEFAULT: "#FF6542", dark: "#E04A28", light: "#FFE3DB" },
        teal: { DEFAULT: "#21B7AA", dark: "#14857B", light: "#D5F3F0" },
        line: "#E2E6E3",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,35,43,.06), 0 8px 24px -12px rgba(23,35,43,.18)",
        lift: "0 24px 60px -24px rgba(23,35,43,.45)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        pulse_ring: { "0%": { transform: "scale(.8)", opacity: ".8" }, "100%": { transform: "scale(2.2)", opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "pulse-ring": "pulse_ring 1.8s cubic-bezier(.2,.7,.2,1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;

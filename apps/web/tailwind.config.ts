import type { Config } from "tailwindcss";

/**
 * Semantic colour tokens — Warm Korean Editorial (DESIGN.md).
 *
 * Palette values come from DESIGN.md "Color system". The two `-deep`
 * variants and `error`/`warning` are darker in-family inks kept for
 * WCAG AA text contrast on light surfaces.
 */
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF9F5",
        "surface-subtle": "#F6F2EA",
        surface: "#EFE9DE",
        "surface-elevated": "#FFFFFF",
        ink: "#191816",
        "ink-secondary": "#484641",
        "ink-muted": "#75716A",
        hairline: "#E5DFD5",
        "hairline-strong": "#D5CEC2",
        primary: "#C7654C",
        "primary-hover": "#B75943",
        "primary-soft": "#F4E1DA",
        "primary-deep": "#9C4630",
        "on-primary": "#FFFFFF",
        jade: "#4F8373",
        "jade-soft": "#E2EEE9",
        "jade-deep": "#3E6A5C",
        highlight: "#F4E8B8",
        "highlight-soft": "#FAF4DA",
        error: "#A03722",
        warning: "#8A6510"
      }
    }
  },
  plugins: []
};

export default config;

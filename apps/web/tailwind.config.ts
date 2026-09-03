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
        canvas: "#FFF8F0",
        "surface-subtle": "#F9F4EC",
        surface: "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        ink: "#292018",
        "ink-secondary": "#4D4238",
        "ink-muted": "#776B61",
        hairline: "#E5DED4",
        "hairline-strong": "#D8CEBF",
        primary: "#B75532",
        "primary-hover": "#A44A29",
        "primary-soft": "#FFEDE8",
        "primary-deep": "#8D3B20",
        "on-primary": "#FFFFFF",
        sage: "#4D8069",
        "sage-soft": "#E2EEE9",
        "sage-deep": "#3D6955",
        jade: "#4D8069",
        "jade-soft": "#E2EEE9",
        "jade-deep": "#3D6955",
        highlight: "#F4E8B8",
        "highlight-soft": "#FAF4DA",
        error: "#A03722",
        warning: "#8A6510"
      },
      boxShadow: {
        editorial: "0 18px 46px rgb(41 32 24 / 0.07)"
      },
      borderRadius: {
        control: "6px",
        nav: "7px"
      }
    }
  },
  plugins: []
};

export default config;

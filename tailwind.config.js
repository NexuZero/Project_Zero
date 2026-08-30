/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FAFAFA", dark: "#0B0B0F" },
        surface: { DEFAULT: "#FFFFFF", dark: "#151519" },
        border: { DEFAULT: "#E4E4E7", dark: "#27272A" },
        ink: { DEFAULT: "#18181B", dark: "#FAFAFA" },
        muted: { DEFAULT: "#71717A", dark: "#A1A1AA" },
        accent: { DEFAULT: "#6366F1", dark: "#818CF8", foreground: "#FFFFFF" },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace"
        ]
      },
      borderRadius: {
        xl2: "1rem"
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "rise-in": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } }
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "rise-in": "rise-in 300ms ease-out"
      }
    }
  },
  plugins: []
};

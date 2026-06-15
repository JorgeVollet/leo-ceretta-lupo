import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azul-marinho premium + preto + azul de destaque
        navy: {
          950: "#060B16", // quase preto azulado (fundo principal)
          900: "#0A1224", // navy profundo
          800: "#0F1B33", // navy
          700: "#16264A", // navy claro (cards)
          600: "#1E3A6B", // borda/realce
        },
        ink: "#05070D",
        accent: {
          DEFAULT: "#3B82F6", // azul de destaque
          bright: "#60A5FA",
          soft: "#1D4ED8",
        },
        cloud: "#F7F9FC", // branco do respiro
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.25), 0 18px 50px -12px rgba(59,130,246,0.35)",
        card: "0 12px 40px -16px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "navy-radial":
          "radial-gradient(120% 120% at 100% 0%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(90% 90% at 0% 100%, rgba(30,58,107,0.25), transparent 60%)",
      },
    },
  },
  plugins: [],
};
export default config;

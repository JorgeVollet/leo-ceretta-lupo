import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ESCALA EDITORIAL: Pedra (leitura) → Ardósia (destaque) → Navy (fechado)
        // Texto sobre Pedra = NAVY (não preto), detalhes em azul.
        paper: "#FFFFFF", // branco puro — APENAS cards/cartões sobre a Pedra
        bone: "#F6F7F8", // branco levemente off (surfaces sutis dentro de cards)

        // CINZA ÚNICO — off-white frio, bem clarinho (toque sutil de cinza).
        // Ritmo simples: BRANCO (respiro) ↔ este cinza ↔ NAVY (impacto).
        stone: {
          DEFAULT: "#F1F2F4", // cinza bem clarinho (off-white frio)
          pale: "#F1F2F4", // alias (compat)
          light: "#F1F2F4", // alias (compat)
          dark: "#F1F2F4", // alias (compat)
          line: "#DEE0E4", // bordas sobre o cinza
        },

        // ARDÓSIA — faixas de destaque (texto branco)
        slate2: {
          DEFAULT: "#5C636E", // base Ardósia
          dark: "#4C5360",
          light: "#727A86",
        },

        smoke: "#9CA1A8", // compat: aponta pra Pedra (seções antigas herdam o novo tom)
        steel: "#7E848D", // compat: bordas fortes sobre cinza

        ink: {
          DEFAULT: "#0E1117", // navy/quase-preto — TEXTO sobre claro + blocos escuros
          900: "#13171F",
          800: "#1B202B",
          700: "#1B2540", // navy do corpo de texto (sobre Pedra)
        },
        navy: {
          900: "#0A1224",
          800: "#0F1B33",
          700: "#16264A",
        },
        accent: {
          DEFAULT: "#2563EB", // azul firme (links/labels sobre claro/card)
          deep: "#1E3A8A", // azul-marinho escuro (labels sobre Pedra — contraste AA)
          bright: "#3B82F6", // azul vibrante (destaque)
          sky: "#60A5FA", // azul claro (APENAS sobre Navy escuro)
        },
        line: "#DDE0E6", // bordas dentro de cards brancos
        mute: "#333A45", // texto secundário (navy dessaturado, lê bem na Pedra)
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Narrow", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
      },
      boxShadow: {
        // Sombras mais marcantes pros cards flutuarem sobre o concreto
        soft: "0 2px 6px rgba(10,14,22,0.10), 0 14px 36px -16px rgba(10,14,22,0.30)",
        card: "0 4px 10px rgba(10,14,22,0.12), 0 20px 48px -20px rgba(10,14,22,0.40)",
        lift: "0 16px 50px -16px rgba(10,14,22,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;

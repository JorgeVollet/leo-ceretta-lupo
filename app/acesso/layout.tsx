import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Acesso rápido — Leonardo Ceretta · Lupo",
  description: "Pedido, catálogos, rastreio, boletos, materiais e WhatsApp do Leonardo em uma tela só.",
};

// barra do navegador no celular na mesma cor do fundo da página
export const viewport: Viewport = {
  themeColor: "#0A1224",
};

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

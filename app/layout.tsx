import type { Metadata } from "next";
import { Archivo, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import WhatsappFloat from "@/components/WhatsappFloat";
import CarrinhoFlutuante from "@/components/CarrinhoFlutuante";
import { CartProvider } from "@/lib/cart-context";
import { ClienteProvider } from "@/lib/cliente-auth";

const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800", "900"],
});
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Leonardo Ceretta — Representante Oficial Lupo",
  description:
    "Catálogos Lupo por segmento, condições especiais e atendimento próximo. Representante oficial Lupo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-stone font-sans text-ink antialiased">
        <ClienteProvider>
          <CartProvider>
            {children}
            <WhatsappFloat />
            <CarrinhoFlutuante />
          </CartProvider>
        </ClienteProvider>
      </body>
    </html>
  );
}

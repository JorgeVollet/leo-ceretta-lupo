import { LogoMark } from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/8 bg-navy-950 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
        <LogoMark size={38} />
        <div className="font-display text-[15px] font-bold text-cloud">
          Leonardo Ceretta · Representante Lupo
        </div>
        <div className="text-[12.5px] text-cloud/45">
          Catálogos atualizados toda semana · Pedidos pelo WhatsApp
        </div>
        <div className="mt-2 text-[11px] text-cloud/30">Site desenvolvido por JV Web Studio</div>
      </div>
    </footer>
  );
}

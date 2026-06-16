import { CONTATO } from "@/lib/data";

export default function WhatsappFloat() {
  return (
    <a
      href={`https://wa.me/${CONTATO.whatsapp}`}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3.5 shadow-[0_10px_30px_-6px_rgba(37,211,102,0.6)] transition hover:scale-105"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#06241a" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.3z M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
      </svg>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-semibold text-[#06241a] transition-all duration-300 group-hover:max-w-[120px] sm:inline">
        Fale comigo
      </span>
    </a>
  );
}

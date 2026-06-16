// Faixa escura com termos correndo (estilo "ticker"), na pegada do Leo.
const itens = [
  "Representante Oficial Lupo",
  "Meias",
  "Lingerie",
  "Cuecas",
  "Modeladores",
  "Lupo Sport",
  "Beachwear",
  "Pijamas",
  "Linha Infantil",
  "Atendimento Próximo",
  "Condições Especiais",
  "Entrega no Prazo",
  "+500 Lojistas",
  "Noroeste do RS",
];

function Track() {
  return (
    <div className="marquee-track flex shrink-0 items-center gap-0 pr-0">
      {itens.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="mono-label whitespace-nowrap px-6 text-paper/85">{t}</span>
          <span className="text-accent-sky/70" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
}

export default function MarqueeBar() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-ink py-3.5">
      <div className="grain absolute inset-0 opacity-[0.05]" />
      <div className="relative flex">
        {/* dois tracks pra loop contínuo e sem emenda */}
        <Track />
        <Track />
      </div>
    </div>
  );
}

// Rótulo de seção no estilo editorial-técnico: [01] TÍTULO
export default function SectionLabel({
  num,
  children,
  dark = false,
}: {
  num: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className={`mono-label ${dark ? "text-paper" : "text-accent-deep"}`}>[{num}]</span>
      <span className={`mono-label ${dark ? "text-paper/70" : "text-ink/60"}`}>{children}</span>
      <span className={`h-px flex-1 ${dark ? "bg-white/15" : "bg-stone-line/40"}`} />
    </div>
  );
}

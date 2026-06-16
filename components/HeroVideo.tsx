"use client";
import { useEffect, useRef } from "react";

/**
 * Vídeo de fundo do hero com parallax sutil:
 * conforme a página rola, o vídeo move um pouco mais devagar (profundidade).
 * Desliga em prefers-reduced-motion.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        // move até ~12% da rolagem, com leve zoom pra não mostrar borda
        const shift = Math.min(y * 0.18, 120);
        el.style.transform = `translate3d(0, ${shift}px, 0) scale(1.08)`;
      });
    };
    el.style.transform = "scale(1.08)";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 -z-20 h-full w-full object-cover will-change-transform"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/hero/hero-poster.jpg"
      aria-hidden="true"
    >
      <source src="/hero/hero.mp4" type="video/mp4" />
    </video>
  );
}

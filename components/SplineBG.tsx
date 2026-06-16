"use client";
import { useEffect, useRef, useState } from "react";

/**
 * SplineBG — fundo 3D animado (Spline) com LAZY-LOAD.
 * O iframe só é montado quando a seção entra na viewport,
 * evitando carregar várias engines WebGL de uma vez.
 *
 * `src` = URL do projeto Spline (my.spline.design/...).
 */
export default function SplineBG({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // não carrega 3D pesado se o usuário pediu menos movimento
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "200px" } // começa a carregar um pouco antes de aparecer
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {load && (
        <iframe
          src={src}
          title=""
          loading="lazy"
          className="h-full w-full border-0 opacity-80 mix-blend-screen"
          tabIndex={-1}
        />
      )}
    </div>
  );
}

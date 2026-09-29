"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";

// folga para a sombra e o "levantar" dos botões não serem cortados pelo overflow
const FOLGA = 8;

/** Quando o conteúdo muda de tamanho, a caixa cresce/encolhe suavemente em vez de pular. */
export function AlturaSuave({ children, className }: { children: ReactNode; className?: string }) {
  const dentro = useRef<HTMLDivElement>(null);
  const [altura, setAltura] = useState<number | null>(null);

  useEffect(() => {
    const el = dentro.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAltura(el.offsetHeight + FOLGA * 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{ height: altura ?? undefined, margin: -FOLGA, padding: FOLGA }}
      className={cx(
        "overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        className
      )}
    >
      <div ref={dentro}>{children}</div>
    </div>
  );
}

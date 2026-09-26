import type { ReactNode } from "react";
import { cx } from "./cx";

export type Tom = "neutro" | "ouro" | "sucesso" | "perigo" | "aviso" | "info";

const TONS: Record<Tom, string> = {
  neutro: "bg-superficie-3 text-texto-2",
  ouro: "bg-ouro/15 text-ouro",
  sucesso: "bg-sucesso-fundo text-sucesso",
  perigo: "bg-perigo-fundo text-perigo",
  aviso: "bg-aviso-fundo text-aviso",
  info: "bg-info-fundo text-info",
};

/** Selo de situação (Pago, Entregue, Estoque baixo...). */
export function Etiqueta({ tom = "neutro", children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONS[tom],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Etiqueta de filtro, como "Início: 01/09/2026" nos relatórios. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-borda bg-superficie-2 px-3 py-1 text-xs font-semibold text-texto-2",
        className
      )}
    >
      {children}
    </span>
  );
}

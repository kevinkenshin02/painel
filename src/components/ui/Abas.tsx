import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

export type Aba = { href: string; rotulo: string; ativo: boolean; icone?: LucideIcon; contagem?: number };

/** Abas da ficha (Dados cadastrais, Preços, Estoque...) — cada aba é um link, dá para voltar pelo navegador. */
export function Abas({ abas }: { abas: Aba[] }) {
  return (
    <nav
      className="nao-imprimir flex flex-wrap gap-1.5 rounded-2xl border border-borda bg-superficie p-2 shadow-cartao"
      aria-label="Abas"
    >
      {abas.map(({ href, rotulo, ativo, icone: Icone, contagem }) => (
        <Link
          key={href}
          href={href}
          scroll={false}
          aria-current={ativo ? "page" : undefined}
          className={cx(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.97]",
            ativo ? "degrade-sol text-sobre-sol" : "text-texto-2 hover:bg-superficie-2 hover:text-texto"
          )}
        >
          {Icone && <Icone className="h-4 w-4" aria-hidden />}
          {rotulo}
          {contagem !== undefined && (
            <span
              className={cx(
                "numero rounded-full px-2 py-px text-[11px] font-bold",
                ativo ? "bg-black/15" : "bg-superficie-3 text-suave"
              )}
            >
              {contagem}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

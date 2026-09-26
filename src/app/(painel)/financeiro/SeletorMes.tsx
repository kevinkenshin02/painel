import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Navegação ‹ mês › preservando os outros filtros da página. */
export function SeletorMes({
  base,
  mes,
  extra = {},
}: {
  base: string;
  mes: { chave: string; nome: string; anterior: string; proximo: string };
  extra?: Record<string, string | undefined>;
}) {
  const link = (chave: string) => {
    const p = new URLSearchParams({ ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)), mes: chave } as Record<string, string>);
    return `${base}?${p.toString()}`;
  };
  return (
    <div className="nao-imprimir inline-flex items-center gap-1 rounded-xl border border-borda bg-superficie-2 p-1">
      <Link href={link(mes.anterior)} aria-label="Mês anterior" className="rounded-lg p-1.5 text-suave transition hover:bg-superficie-3 hover:text-texto">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="min-w-40 px-2 text-center text-sm font-semibold text-texto">{mes.nome}</span>
      <Link href={link(mes.proximo)} aria-label="Próximo mês" className="rounded-lg p-1.5 text-suave transition hover:bg-superficie-3 hover:text-texto">
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

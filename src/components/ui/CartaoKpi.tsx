import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** Cores dos cartões da Visão Geral — tons do pôr do sol do site. Definidas em globals.css (.kpi-*). */
export type TomKpi = "sol" | "ambar" | "rubi" | "vinho" | "sakura" | "ouro" | "noite" | "jade";

export function CartaoKpi({
  tom,
  icone: Icone,
  valor,
  rotulo,
  detalhe,
  href,
}: {
  tom: TomKpi;
  icone: LucideIcon;
  valor: ReactNode;
  rotulo: ReactNode;
  detalhe?: ReactNode;
  href?: string;
}) {
  // valores longos (ex.: -R$ 12.480,00) diminuem um pouco para não encostar no ícone
  const longo = typeof valor === "string" && valor.length > 11;
  const conteudo = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cx(
              "numero leading-none font-bold tracking-tight whitespace-nowrap",
              longo ? "text-[23px]" : "text-[28px]"
            )}
          >
            {valor}
          </div>
          <div className="mt-2.5 text-[13.5px] leading-snug font-semibold opacity-95">{rotulo}</div>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/18 ring-1 ring-white/25">
          <Icone className="h-6 w-6" aria-hidden />
        </div>
      </div>
      {detalhe && <div className="relative z-10 mt-4 text-xs font-medium opacity-85">{detalhe}</div>}
      {/* sol translúcido no canto, como a logo */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-14 h-40 w-40 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -right-2 -bottom-6 h-20 w-20 rounded-full bg-white/8" />
    </>
  );

  const classes = cx(
    `kpi-${tom}`,
    "relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-cartao transition"
  );

  if (href) {
    return (
      <Link href={href} className={cx(classes, "hover:-translate-y-0.5 hover:brightness-[1.05]")}>
        {conteudo}
      </Link>
    );
  }
  return <div className={classes}>{conteudo}</div>;
}

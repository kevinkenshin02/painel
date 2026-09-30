import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** Caixa padrão do painel (grafite com borda dourada fina). `filete` acende o fio de LED no topo. */
export function Cartao({
  filete,
  className,
  children,
  ...resto
}: { filete?: boolean } & ComponentProps<"section">) {
  return (
    <section
      className={cx(
        "aro-vidro rounded-2xl border border-borda bg-vidro shadow-cartao",
        filete && "filete",
        className
      )}
      {...resto}
    >
      {children}
    </section>
  );
}

/** Título de um cartão: selo pequeno em cima, título e descrição; à direita, o que precisar (contador, botões). */
export function TituloCartao({
  selo,
  icone: Icone,
  titulo,
  descricao,
  children,
  className,
}: {
  selo?: string;
  icone?: LucideIcon;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {selo && (
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-ouro/12 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-ouro uppercase">
            {Icone && <Icone className="h-3.5 w-3.5" aria-hidden />}
            {selo}
          </span>
        )}
        <h2 className="font-titulo text-[19px] leading-snug font-bold text-texto">{titulo}</h2>
        {descricao && <p className="mt-1 text-[13px] text-suave">{descricao}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Mensagem de lista vazia. */
export function Vazio({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-xl border border-dashed border-borda px-6 py-10 text-center text-sm text-suave", className)}>
      {children}
    </div>
  );
}

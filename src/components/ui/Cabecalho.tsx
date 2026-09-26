import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BotaoLink } from "./Botao";
import { Cartao } from "./Cartao";
import { cx } from "./cx";

export type Atalho = {
  href: string;
  rotulo: string;
  icone?: LucideIcon;
  ativo?: boolean;
};

function dataPorExtenso() {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Barra de atalhos no topo da página (como "Voltar · Relatórios · Caixa detalhado"). */
export function BarraAtalhos({ atalhos, children }: { atalhos: Atalho[]; children?: ReactNode }) {
  return (
    <nav className="nao-imprimir flex flex-wrap items-center gap-2 rounded-2xl border border-borda bg-superficie p-2.5 shadow-cartao">
      {atalhos.map((a) => (
        <BotaoLink
          key={a.href + a.rotulo}
          href={a.href}
          icone={a.icone}
          variante={a.ativo ? "primario" : "fantasma"}
          aria-current={a.ativo ? "page" : undefined}
        >
          {a.rotulo}
        </BotaoLink>
      ))}
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </nav>
  );
}

/** Cabeçalho de cada tela: selo da seção, título em serifa, descrição, data e ações. */
export function Cabecalho({
  secao,
  titulo,
  descricao,
  acoes,
  mostrarData = true,
  children,
  className,
}: {
  secao?: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  mostrarData?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Cartao filete className={cx("px-7 py-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          {secao && (
            <div className="text-[11px] font-bold tracking-[0.18em] text-ouro uppercase">{secao}</div>
          )}
          <h1 className="mt-1.5 font-titulo text-[28px] leading-tight font-bold text-texto">{titulo}</h1>
          {descricao && <p className="mt-1.5 max-w-3xl text-sm text-suave">{descricao}</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          {mostrarData && <div className="text-xs font-semibold text-suave">{dataPorExtenso()}</div>}
          {acoes && <div className="nao-imprimir flex flex-wrap justify-end gap-2">{acoes}</div>}
        </div>
      </div>
      {children && <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-borda pt-4">{children}</div>}
    </Cartao>
  );
}

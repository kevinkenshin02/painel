import type { ReactNode } from "react";
import { ArrowLeft, ChartColumn, ClipboardList, Landmark, Package, ShoppingCart, Wallet } from "lucide-react";
import { hojeCalendario } from "@/lib/datas";
import { BarraAtalhos, Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoPdf } from "@/components/BotaoPdf";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { cx } from "@/components/ui/cx";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const br = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);

/** Período dos filtros (?inicio=AAAA-MM-DD&fim=AAAA-MM-DD). Padrão: do dia 1 do mês até hoje. */
export function periodoDe(params: { inicio?: string; fim?: string }) {
  const hoje = hojeCalendario();
  const ler = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00.000Z`) : null);
  let inicio = ler(params.inicio) ?? new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  let fim = ler(params.fim) ?? hoje;
  if (fim < inicio) [inicio, fim] = [fim, inicio];
  const depois = new Date(fim.getTime() + 864e5);
  return {
    inicio,
    fim,
    /** para "menor que": dia seguinte ao fim */
    ate: depois,
    /** para campos com hora (São Paulo = UTC−3) */
    inicioHora: new Date(inicio.getTime() + 3 * 36e5),
    ateHora: new Date(depois.getTime() + 3 * 36e5),
    inicioInput: iso(inicio),
    fimInput: iso(fim),
    rotulo: `${br(inicio)} a ${br(fim)}`,
    inicioBr: br(inicio),
    fimBr: br(fim),
    dias: Math.round((depois.getTime() - inicio.getTime()) / 864e5),
  };
}

export type Periodo = ReturnType<typeof periodoDe>;

export function AtalhosRelatorios({ ativo, isAdmin }: { ativo: string; isAdmin: boolean }) {
  return (
    <BarraAtalhos
      atalhos={[
        { href: "/relatorios", rotulo: "Relatórios", icone: ArrowLeft, ativo: ativo === "inicio" },
        { href: "/relatorios/vendas", rotulo: "Vendas", icone: ShoppingCart, ativo: ativo === "vendas" },
        { href: "/relatorios/os", rotulo: "Ordens de serviço", icone: ClipboardList, ativo: ativo === "os" },
        { href: "/relatorios/estoque", rotulo: "Estoque", icone: Package, ativo: ativo === "estoque" },
        { href: "/relatorios/caixa", rotulo: "Caixa", icone: Wallet, ativo: ativo === "caixa" },
        ...(isAdmin ? [{ href: "/relatorios/financeiro", rotulo: "Financeiro", icone: Landmark, ativo: ativo === "financeiro" }] : []),
      ]}
    />
  );
}

export function CabecalhoRelatorio({ titulo, descricao, nomePdf, children }: { titulo: string; descricao?: string; nomePdf: string; children?: ReactNode }) {
  const gerado = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date());
  return (
    <Cabecalho
      secao="Relatórios"
      titulo={titulo}
      descricao={`${descricao ? `${descricao} · ` : ""}Gerado em ${gerado}`}
      mostrarData={false}
      acoes={<BotaoPdf nomeArquivo={nomePdf} />}
    >
      {children}
    </Cabecalho>
  );
}

/** Formulário de filtros (GET): período + o que cada relatório precisar. */
export function Filtros({ periodo, children, acao, semPeriodo = false }: { periodo?: Periodo; children?: ReactNode; acao: string; semPeriodo?: boolean }) {
  return (
    <form action={acao} className="nao-imprimir flex flex-wrap items-end gap-3 rounded-2xl border border-borda bg-superficie p-4 shadow-cartao">
      {!semPeriodo && periodo && (
        <>
          <Campo rotulo="De" className="w-40">
            <input type="date" name="inicio" defaultValue={periodo.inicioInput} className={cx(classeCampo, "py-2")} />
          </Campo>
          <Campo rotulo="Até" className="w-40">
            <input type="date" name="fim" defaultValue={periodo.fimInput} className={cx(classeCampo, "py-2")} />
          </Campo>
        </>
      )}
      {children}
      <Botao type="submit" variante="primario" icone={ChartColumn}>
        Gerar relatório
      </Botao>
    </form>
  );
}

export const classeFiltro = cx(classeCampo, "py-2");

/** Caixinha de total (como "TOTAL VENDIDO R$ 111,30" do modelo). */
export function Mini({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={destaque ? "rounded-xl border border-borda-forte bg-ouro/10 px-4 py-3" : "rounded-xl border border-borda bg-superficie-2 px-4 py-3"}>
      <div className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">{rotulo}</div>
      <div className="numero mt-1 text-lg font-bold text-texto print:text-[13px]">{valor}</div>
    </div>
  );
}

/** Selo "N registros" no canto do cartão do relatório. */
export function Registros({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-info-fundo px-3 py-1 text-[11px] font-bold tracking-wider text-info uppercase">
      {n} {n === 1 ? "registro" : "registros"}
    </span>
  );
}

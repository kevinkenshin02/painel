import { History, ListOrdered, Wallet } from "lucide-react";
import type { FormaPagamento, TipoMovimentoCaixa } from "@/generated/prisma/enums";
import { formatCurrency } from "@/lib/format";
import { FORMAS_CAIXA, TIPO_MOVIMENTO_CAIXA_LABELS, type resumoCaixa } from "@/lib/caixa";
import { FORMA_PAGAMENTO_LABELS } from "../vendas/labels";
import { BarraAtalhos } from "@/components/ui/Cabecalho";
import { cx } from "@/components/ui/cx";

export const horaCurta = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(d);
export const dataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(d);

export function AtalhosCaixa({ ativo }: { ativo: "atual" | "detalhado" | "historico" }) {
  return (
    <BarraAtalhos
      atalhos={[
        { href: "/caixa", rotulo: "Caixa atual", icone: Wallet, ativo: ativo === "atual" },
        { href: "/caixa/detalhado", rotulo: "Caixa detalhado", icone: ListOrdered, ativo: ativo === "detalhado" },
        { href: "/caixa/historico", rotulo: "Histórico de caixas", icone: History, ativo: ativo === "historico" },
      ]}
    />
  );
}

/** Tabela "Forma de pagamento | Entradas | Saídas | Saldo". */
export function ConsolidadoPorForma({ resumo }: { resumo: ReturnType<typeof resumoCaixa> }) {
  const total = FORMAS_CAIXA.reduce(
    (t, f) => ({
      entradas: t.entradas + resumo.porForma[f].entradas,
      saidas: t.saidas + resumo.porForma[f].saidas,
      saldo: t.saldo + resumo.porForma[f].saldo,
    }),
    { entradas: 0, saidas: 0, saldo: 0 }
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-borda">
      <table className="tabela">
        <thead>
          <tr>
            <th>Forma</th>
            <th className="direita">Entradas</th>
            <th className="direita">Saídas</th>
            <th className="direita">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {FORMAS_CAIXA.map((f) => (
            <tr key={f}>
              <td className="destaque">{FORMA_PAGAMENTO_LABELS[f]}</td>
              <td className="direita numero">{formatCurrency(resumo.porForma[f].entradas)}</td>
              <td className="direita numero">{resumo.porForma[f].saidas ? `− ${formatCurrency(resumo.porForma[f].saidas)}` : formatCurrency(0)}</td>
              <td className="direita numero destaque">{formatCurrency(resumo.porForma[f].saldo)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td className="direita numero">{formatCurrency(total.entradas)}</td>
            <td className="direita numero">− {formatCurrency(total.saidas)}</td>
            <td className="direita numero">{formatCurrency(total.saldo)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export type MovimentoLinha = {
  id: number;
  tipo: TipoMovimentoCaixa;
  formaPagamento: FormaPagamento;
  valor: number;
  descricao: string;
  criadoEm: Date;
  funcionario: { nome: string } | null;
};

export function TabelaMovimentos({ movimentos, comTotal = true }: { movimentos: MovimentoLinha[]; comTotal?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda">
      <table className="tabela">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Forma</th>
            <th>Quem</th>
            <th className="direita">Valor</th>
          </tr>
        </thead>
        <tbody>
          {movimentos.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-suave">
                Nenhum lançamento.
              </td>
            </tr>
          )}
          {movimentos.map((m) => (
            <tr key={m.id}>
              <td className="numero whitespace-nowrap">{horaCurta(m.criadoEm)}</td>
              <td className="whitespace-nowrap">{TIPO_MOVIMENTO_CAIXA_LABELS[m.tipo]}</td>
              <td className="max-w-md">{m.descricao}</td>
              <td className="whitespace-nowrap">{FORMA_PAGAMENTO_LABELS[m.formaPagamento]}</td>
              <td>{m.funcionario?.nome ?? "—"}</td>
              <td className={cx("direita numero font-semibold", m.valor < 0 ? "text-perigo" : "text-texto")}>
                {m.valor < 0 ? `− ${formatCurrency(-m.valor)}` : formatCurrency(m.valor)}
              </td>
            </tr>
          ))}
        </tbody>
        {comTotal && movimentos.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={5}>Saldo dos lançamentos · {movimentos.length}</td>
              <td className="direita numero">{formatCurrency(movimentos.reduce((s, m) => s + m.valor, 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Lista "rótulo ........ valor" do Painel de informações. */
export function Informacoes({ itens }: { itens: [string, React.ReactNode][] }) {
  return (
    <dl className="flex flex-col">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex items-baseline justify-between gap-4 border-b border-borda py-2.5 last:border-0">
          <dt className="text-sm text-suave">{rotulo}</dt>
          <dd className="numero text-right text-sm font-semibold text-texto">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

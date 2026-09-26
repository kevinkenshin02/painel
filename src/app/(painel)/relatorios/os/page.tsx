import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { StatusOS, TipoServico } from "@/generated/prisma/enums";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { STATUS_OS_LABELS, STATUS_OS_ORDER, STATUS_OS_TOM, TIPO_SERVICO_LABELS } from "../../ordens-servico/labels";
import { AtalhosRelatorios, CabecalhoRelatorio, classeFiltro, Filtros, Mini, periodoDe, Registros } from "../comum";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

const VISOES = { tipo: "Por tipo de serviço", situacao: "Por situação", lista: "Lista de OS" } as const;
type Visao = keyof typeof VISOES;

export default async function RelatorioOSPage(props: PageProps<"/relatorios/os">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const periodo = periodoDe(sp);
  const visao: Visao = (sp.ver && sp.ver in VISOES ? sp.ver : "tipo") as Visao;
  const logado = await getFuncionarioLogado();

  const ordens = await prisma.ordemServico.findMany({
    where: {
      dataEntrada: { gte: periodo.inicio, lt: periodo.ate },
      ...(sp.tipo ? { tipoServico: sp.tipo as TipoServico } : {}),
    },
    orderBy: [{ dataEntrada: "asc" }, { id: "asc" }],
  });

  const total = ordens.reduce((s, o) => s + o.valorTotal, 0);
  const pago = ordens.reduce((s, o) => s + o.sinalPago, 0);
  const entregues = ordens.filter((o) => o.status === "ENTREGUE" && o.dataEntrega);
  const diasEntrega = entregues.map((o) => Math.max(0, Math.round((o.dataEntrega!.getTime() - o.dataEntrada.getTime()) / 864e5)));
  const mediaDias = diasEntrega.length ? diasEntrega.reduce((s, d) => s + d, 0) / diasEntrega.length : 0;
  const noPrazo = entregues.filter((o) => o.dataEntrega! < new Date(o.prazoPrometido.getTime() + 864e5 + 3 * 36e5)).length;

  type G = { chave: string; rotulo: string; qtd: number; total: number; pago: number };
  const grupos = new Map<string, G>();
  for (const o of ordens) {
    const chave = visao === "situacao" ? o.status : o.tipoServico;
    const rotulo = visao === "situacao" ? STATUS_OS_LABELS[o.status] : TIPO_SERVICO_LABELS[o.tipoServico];
    const g = grupos.get(chave) ?? { chave, rotulo, qtd: 0, total: 0, pago: 0 };
    g.qtd++;
    g.total += o.valorTotal;
    g.pago += o.sinalPago;
    grupos.set(chave, g);
  }
  const linhas =
    visao === "situacao"
      ? STATUS_OS_ORDER.map((s) => grupos.get(s)).filter((g): g is G => Boolean(g))
      : [...grupos.values()].sort((a, b) => b.total - a.total);

  return (
    <>
      <AtalhosRelatorios ativo="os" isAdmin={logado?.isAdmin ?? false} />
      <CabecalhoRelatorio titulo="Relatório de ordens de serviço" descricao="Pela data de entrada" nomePdf={`ordens-servico-${periodo.inicioInput}-a-${periodo.fimInput}.pdf`} />

      <Filtros periodo={periodo} acao="/relatorios/os">
        <Campo rotulo="Ver" className="w-48">
          <select name="ver" defaultValue={visao} className={classeFiltro}>
            {Object.entries(VISOES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Tipo de serviço" className="w-56">
          <select name="tipo" defaultValue={sp.tipo ?? ""} className={classeFiltro}>
            <option value="">Todos</option>
            {Object.entries(TIPO_SERVICO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
      </Filtros>

      <Cartao filete className="p-6">
        <TituloCartao selo="Serviços" icone={ClipboardList} titulo={VISOES[visao]} descricao="Óculos e relógios que entraram na loja no período." className="mb-5">
          <Registros n={visao === "lista" ? ordens.length : linhas.length} />
        </TituloCartao>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6 print:grid-cols-6">
          <Mini rotulo="Valor das OS" valor={formatCurrency(total)} destaque />
          <Mini rotulo="OS no período" valor={String(ordens.length)} />
          <Mini rotulo="Já recebido" valor={formatCurrency(pago)} />
          <Mini rotulo="Falta receber" valor={formatCurrency(total - pago)} />
          <Mini rotulo="Tempo médio de entrega" valor={entregues.length ? `${mediaDias.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias` : "—"} />
          <Mini rotulo="Entregues no prazo" valor={entregues.length ? formatPercent(noPrazo / entregues.length) : "—"} />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip>Relatório: {VISOES[visao]}</Chip>
          <Chip>Início: {periodo.inicioBr}</Chip>
          <Chip>Fim: {periodo.fimBr}</Chip>
          {sp.tipo && <Chip>Serviço: {TIPO_SERVICO_LABELS[sp.tipo as TipoServico]}</Chip>}
        </div>

        {ordens.length === 0 ? (
          <Vazio>Nenhuma OS nesse período.</Vazio>
        ) : visao === "lista" ? (
          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Entrada</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Prazo</th>
                  <th>Situação</th>
                  <th className="direita">Total</th>
                  <th className="direita">Pago</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((o) => (
                  <tr key={o.id}>
                    <td className="destaque numero">#{o.id}</td>
                    <td className="numero">{formatDate(o.dataEntrada)}</td>
                    <td className="destaque">{o.clienteNome}</td>
                    <td>{TIPO_SERVICO_LABELS[o.tipoServico]}</td>
                    <td className="numero">{formatDate(o.prazoPrometido)}</td>
                    <td>
                      <Etiqueta tom={STATUS_OS_TOM[o.status as StatusOS]}>{STATUS_OS_LABELS[o.status]}</Etiqueta>
                    </td>
                    <td className="direita numero">{formatCurrency(o.valorTotal)}</td>
                    <td className="direita numero">{formatCurrency(o.sinalPago)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>Totais · {ordens.length} OS</td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                  <td className="direita numero">{formatCurrency(pago)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>{visao === "situacao" ? "Situação" : "Tipo de serviço"}</th>
                  <th className="direita">OS</th>
                  <th className="direita">Valor total</th>
                  <th className="direita">Recebido</th>
                  <th className="direita">Falta receber</th>
                  <th className="direita">% do valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((g) => (
                  <tr key={g.chave}>
                    <td className="destaque">{g.rotulo}</td>
                    <td className="direita numero">{g.qtd}</td>
                    <td className="direita numero destaque">{formatCurrency(g.total)}</td>
                    <td className="direita numero">{formatCurrency(g.pago)}</td>
                    <td className="direita numero">{formatCurrency(g.total - g.pago)}</td>
                    <td className="direita numero">{formatPercent(total ? g.total / total : 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Totais</td>
                  <td className="direita numero">{ordens.length}</td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                  <td className="direita numero">{formatCurrency(pago)}</td>
                  <td className="direita numero">{formatCurrency(total - pago)}</td>
                  <td className="direita numero">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

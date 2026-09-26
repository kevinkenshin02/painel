import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { TipoMovimento, TipoProduto } from "@/generated/prisma/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { hojeCalendario } from "@/lib/datas";
import { nomeProduto, TIPO_MOVIMENTO_LABELS, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import { AtalhosRelatorios, CabecalhoRelatorio, classeFiltro, Filtros, Mini, periodoDe, Registros } from "../comum";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const VISOES = { posicao: "Posição por marca", parados: "Produtos parados", movimentos: "Movimentações no período" } as const;
type Visao = keyof typeof VISOES;

export default async function RelatorioEstoquePage(props: PageProps<"/relatorios/estoque">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const periodo = periodoDe(sp);
  const visao: Visao = (sp.ver && sp.ver in VISOES ? sp.ver : "posicao") as Visao;
  const diasParado = Math.max(15, Math.min(730, Number(sp.dias) || 90));
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;
  const hoje = hojeCalendario();

  const produtos = await prisma.produto.findMany({
    where: { ativo: true, ...(sp.tipo ? { tipo: sp.tipo as TipoProduto } : {}) },
    orderBy: [{ tipo: "asc" }, { marca: "asc" }, { descricao: "asc" }],
  });
  const pecas = produtos.reduce((s, p) => s + p.quantidade, 0);
  const valorCusto = produtos.reduce((s, p) => s + p.quantidade * p.custoUnitario, 0);
  const valorVenda = produtos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0);

  // posição por tipo + marca
  const grupos = new Map<string, { tipo: TipoProduto; marca: string; produtos: number; pecas: number; custo: number; venda: number }>();
  for (const p of produtos) {
    const k = `${p.tipo}|${p.marca ?? ""}`;
    const g = grupos.get(k) ?? { tipo: p.tipo, marca: p.marca ?? "Sem marca", produtos: 0, pecas: 0, custo: 0, venda: 0 };
    g.produtos++;
    g.pecas += p.quantidade;
    g.custo += p.quantidade * p.custoUnitario;
    g.venda += p.quantidade * p.precoVenda;
    grupos.set(k, g);
  }
  const posicao = [...grupos.values()].sort((a, b) => b.venda - a.venda);

  // parados: com peça em estoque e sem venda há X dias (ou nunca vendidos desde que entraram)
  let parados: { id: number; codigo: string; nome: string; quantidade: number; ultima: Date | null; desde: Date; dias: number; custo: number; venda: number }[] = [];
  if (visao === "parados") {
    const ultimas = await prisma.venda.groupBy({ by: ["produtoId"], where: { produtoId: { not: null } }, _max: { dataVenda: true } });
    const mapa = new Map(ultimas.map((u) => [u.produtoId, u._max.dataVenda]));
    parados = produtos
      .filter((p) => p.quantidade > 0)
      .map((p) => {
        const ultima = mapa.get(p.id) ?? null;
        const desde = ultima ?? p.criadoEm;
        return {
          id: p.id,
          codigo: p.codigo,
          nome: nomeProduto(p),
          quantidade: p.quantidade,
          ultima,
          desde,
          dias: Math.floor((hoje.getTime() - desde.getTime()) / 864e5),
          custo: p.quantidade * p.custoUnitario,
          venda: p.quantidade * p.precoVenda,
        };
      })
      .filter((p) => p.dias >= diasParado)
      .sort((a, b) => b.dias - a.dias);
  }

  // movimentações no período
  const movimentos =
    visao === "movimentos"
      ? await prisma.movimentoEstoque.findMany({
          where: { criadoEm: { gte: periodo.inicioHora, lt: periodo.ateHora } },
          orderBy: { criadoEm: "asc" },
          include: { produto: { select: { codigo: true, marca: true, descricao: true, custoUnitario: true } }, funcionario: { select: { nome: true } } },
        })
      : [];
  const porTipo = new Map<TipoMovimento, { qtd: number; pecas: number }>();
  for (const m of movimentos) {
    const g = porTipo.get(m.tipo) ?? { qtd: 0, pecas: 0 };
    g.qtd++;
    g.pecas += m.quantidade;
    porTipo.set(m.tipo, g);
  }

  const registros = visao === "posicao" ? posicao.length : visao === "parados" ? parados.length : movimentos.length;

  return (
    <>
      <AtalhosRelatorios ativo="estoque" isAdmin={isAdmin} />
      <CabecalhoRelatorio titulo="Relatório de estoque" descricao="Produtos ativos" nomePdf={`estoque-${hoje.toISOString().slice(0, 10)}.pdf`} />

      <Filtros periodo={periodo} acao="/relatorios/estoque" semPeriodo={visao !== "movimentos"}>
        <Campo rotulo="Ver" className="w-56">
          <select name="ver" defaultValue={visao} className={classeFiltro}>
            {Object.entries(VISOES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Tipo" className="w-48">
          <select name="tipo" defaultValue={sp.tipo ?? ""} className={classeFiltro}>
            <option value="">Todos</option>
            {Object.entries(TIPO_PRODUTO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        {visao === "parados" && (
          <Campo rotulo="Parado há mais de (dias)" className="w-52">
            <input type="number" name="dias" min={15} max={730} defaultValue={diasParado} className={classeFiltro} />
          </Campo>
        )}
      </Filtros>

      <Cartao filete className="p-6">
        <TituloCartao selo="Estoque" icone={Package} titulo={VISOES[visao]} className="mb-5">
          <Registros n={registros} />
        </TituloCartao>
        <div className={`mb-4 grid grid-cols-2 gap-3 ${isAdmin ? "lg:grid-cols-4 print:grid-cols-4" : "lg:grid-cols-3 print:grid-cols-3"}`}>
          <Mini rotulo="Produtos ativos" valor={String(produtos.length)} />
          <Mini rotulo="Peças" valor={String(pecas)} />
          {isAdmin && <Mini rotulo="Valor a custo" valor={formatCurrency(valorCusto)} />}
          <Mini rotulo="Valor a preço de venda" valor={formatCurrency(valorVenda)} destaque />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip>Relatório: {VISOES[visao]}</Chip>
          {visao === "movimentos" && (
            <>
              <Chip>Início: {periodo.inicioBr}</Chip>
              <Chip>Fim: {periodo.fimBr}</Chip>
            </>
          )}
          {visao === "parados" && <Chip>Sem vender há {diasParado}+ dias</Chip>}
          {sp.tipo && <Chip>Tipo: {TIPO_PRODUTO_LABELS[sp.tipo as TipoProduto]}</Chip>}
        </div>

        {visao === "posicao" &&
          (posicao.length === 0 ? (
            <Vazio>Nenhum produto ativo.</Vazio>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Marca</th>
                    <th className="direita">Produtos</th>
                    <th className="direita">Peças</th>
                    {isAdmin && <th className="direita">A custo</th>}
                    <th className="direita">A preço de venda</th>
                  </tr>
                </thead>
                <tbody>
                  {posicao.map((g) => (
                    <tr key={`${g.tipo}|${g.marca}`}>
                      <td>{TIPO_PRODUTO_LABELS[g.tipo]}</td>
                      <td className="destaque">{g.marca}</td>
                      <td className="direita numero">{g.produtos}</td>
                      <td className="direita numero">{g.pecas}</td>
                      {isAdmin && <td className="direita numero">{formatCurrency(g.custo)}</td>}
                      <td className="direita numero destaque">{formatCurrency(g.venda)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Totais</td>
                    <td className="direita numero">{produtos.length}</td>
                    <td className="direita numero">{pecas}</td>
                    {isAdmin && <td className="direita numero">{formatCurrency(valorCusto)}</td>}
                    <td className="direita numero">{formatCurrency(valorVenda)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

        {visao === "parados" &&
          (parados.length === 0 ? (
            <Vazio>Nenhum produto parado há mais de {diasParado} dias.</Vazio>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th className="direita">Peças</th>
                    <th>Última venda</th>
                    <th className="direita">Dias parado</th>
                    {isAdmin && <th className="direita">Parado a custo</th>}
                    <th className="direita">A preço de venda</th>
                  </tr>
                </thead>
                <tbody>
                  {parados.map((p) => (
                    <tr key={p.id}>
                      <td className="numero whitespace-nowrap">{p.codigo}</td>
                      <td className="destaque">{p.nome}</td>
                      <td className="direita numero">{p.quantidade}</td>
                      <td className="numero">{p.ultima ? formatDate(p.ultima) : `nunca (cadastro ${formatDate(p.desde)})`}</td>
                      <td className={cx("direita numero font-semibold", p.dias >= 180 ? "text-perigo" : "text-aviso")}>{p.dias}</td>
                      {isAdmin && <td className="direita numero">{formatCurrency(p.custo)}</td>}
                      <td className="direita numero">{formatCurrency(p.venda)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Totais · {parados.length} produtos</td>
                    <td className="direita numero">{parados.reduce((s, p) => s + p.quantidade, 0)}</td>
                    <td colSpan={2} />
                    {isAdmin && <td className="direita numero">{formatCurrency(parados.reduce((s, p) => s + p.custo, 0))}</td>}
                    <td className="direita numero">{formatCurrency(parados.reduce((s, p) => s + p.venda, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}

        {visao === "movimentos" &&
          (movimentos.length === 0 ? (
            <Vazio>Nenhuma movimentação no período.</Vazio>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {[...porTipo.entries()].map(([tipo, g]) => (
                  <Chip key={tipo}>
                    {TIPO_MOVIMENTO_LABELS[tipo]}: {g.qtd} ({g.pecas > 0 ? `+${g.pecas}` : g.pecas} peças)
                  </Chip>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-borda">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Quando</th>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Motivo</th>
                      <th>Quem</th>
                      <th className="direita">Qtd.</th>
                      <th className="direita">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentos.map((m) => (
                      <tr key={m.id}>
                        <td className="numero whitespace-nowrap">
                          {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(m.criadoEm)}
                        </td>
                        <td className="destaque">{nomeProduto(m.produto)}</td>
                        <td>{TIPO_MOVIMENTO_LABELS[m.tipo]}</td>
                        <td className="max-w-xs">{m.motivo ?? "—"}</td>
                        <td>{m.funcionario?.nome ?? "—"}</td>
                        <td className={cx("direita numero font-semibold", m.quantidade > 0 ? "text-sucesso" : "text-perigo")}>
                          {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                        </td>
                        <td className="direita numero">{m.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}>Saldo das movimentações</td>
                      <td className="direita numero">{movimentos.reduce((s, m) => s + m.quantidade, 0)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ))}
      </Cartao>
    </>
  );
}

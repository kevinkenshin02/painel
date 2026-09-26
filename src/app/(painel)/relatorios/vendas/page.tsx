import { TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { CategoriaVenda, FormaPagamento } from "@/generated/prisma/enums";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { nomeProduto } from "@/lib/produtos";
import { CATEGORIA_VENDA_LABELS, FORMA_PAGAMENTO_LABELS } from "../../vendas/labels";
import { AtalhosRelatorios, CabecalhoRelatorio, classeFiltro, Filtros, Mini, periodoDe } from "../comum";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Campo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

const AGRUPAMENTOS = {
  produtos: "Produtos vendidos",
  categoria: "Por categoria",
  pagamento: "Por forma de pagamento",
  funcionario: "Por funcionário",
  dia: "Por dia",
  lista: "Lista de vendas",
} as const;
type Agrupar = keyof typeof AGRUPAMENTOS;

type Linha = { chave: string; rotulo: string; sub?: string; codigo?: string; vendas: number; qtd: number; valor: number; custo: number };

export default async function RelatorioVendasPage(props: PageProps<"/relatorios/vendas">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const periodo = periodoDe(sp);
  const agrupar: Agrupar = (sp.agrupar && sp.agrupar in AGRUPAMENTOS ? sp.agrupar : "produtos") as Agrupar;
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const where: Prisma.VendaWhereInput = {
    statusPagamento: "PAGO",
    dataVenda: { gte: periodo.inicio, lt: periodo.ate },
    ...(sp.forma ? { formaPagamento: sp.forma as FormaPagamento } : {}),
    ...(sp.categoria ? { categoria: sp.categoria as CategoriaVenda } : {}),
    ...(sp.funcionario ? { funcionarioId: Number(sp.funcionario) || -1 } : {}),
  };
  const [vendas, funcionarios] = await Promise.all([
    prisma.venda.findMany({
      where,
      orderBy: [{ dataVenda: "asc" }, { id: "asc" }],
      include: { produto: { select: { codigo: true, marca: true, descricao: true } }, funcionario: { select: { nome: true } } },
    }),
    prisma.funcionario.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const total = vendas.reduce((s, v) => s + v.valorVendido, 0);
  const custo = vendas.reduce((s, v) => s + v.custoTotal, 0);
  const qtd = vendas.reduce((s, v) => s + v.quantidade, 0);

  const grupos = new Map<string, Linha>();
  const somar = (chave: string, base: Omit<Linha, "vendas" | "qtd" | "valor" | "custo">, v: (typeof vendas)[number]) => {
    const g = grupos.get(chave) ?? { ...base, vendas: 0, qtd: 0, valor: 0, custo: 0 };
    g.vendas += 1;
    g.qtd += v.quantidade;
    g.valor += v.valorVendido;
    g.custo += v.custoTotal;
    grupos.set(chave, g);
  };
  for (const v of vendas) {
    if (agrupar === "produtos") {
      if (v.produto) somar(`p${v.produtoId}`, { chave: `p${v.produtoId}`, rotulo: nomeProduto(v.produto), codigo: v.produto.codigo, sub: CATEGORIA_VENDA_LABELS[v.categoria] }, v);
      else somar(`d${v.descricao.toLowerCase()}`, { chave: `d${v.descricao}`, rotulo: v.descricao, codigo: "—", sub: CATEGORIA_VENDA_LABELS[v.categoria] }, v);
    } else if (agrupar === "categoria") somar(v.categoria, { chave: v.categoria, rotulo: CATEGORIA_VENDA_LABELS[v.categoria] }, v);
    else if (agrupar === "pagamento") somar(v.formaPagamento, { chave: v.formaPagamento, rotulo: FORMA_PAGAMENTO_LABELS[v.formaPagamento] }, v);
    else if (agrupar === "funcionario") somar(String(v.funcionarioId ?? 0), { chave: String(v.funcionarioId ?? 0), rotulo: v.funcionario?.nome ?? "Sem registro" }, v);
    else if (agrupar === "dia") somar(v.dataVenda.toISOString(), { chave: v.dataVenda.toISOString(), rotulo: formatDate(v.dataVenda) }, v);
  }
  const linhas = [...grupos.values()].sort((a, b) => (agrupar === "dia" ? a.chave.localeCompare(b.chave) : b.valor - a.valor));
  const registros = agrupar === "lista" ? vendas.length : linhas.length;

  const nomeFunc = funcionarios.find((f) => String(f.id) === sp.funcionario)?.nome;

  return (
    <>
      <AtalhosRelatorios ativo="vendas" isAdmin={isAdmin} />
      <CabecalhoRelatorio titulo="Relatório de vendas" descricao="Só vendas pagas" nomePdf={`vendas-${periodo.inicioInput}-a-${periodo.fimInput}.pdf`} />

      <Filtros periodo={periodo} acao="/relatorios/vendas">
        <Campo rotulo="Ver" className="w-52">
          <select name="agrupar" defaultValue={agrupar} className={classeFiltro}>
            {Object.entries(AGRUPAMENTOS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Forma de pagamento" className="w-48">
          <select name="forma" defaultValue={sp.forma ?? ""} className={classeFiltro}>
            <option value="">Todas</option>
            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Categoria" className="w-48">
          <select name="categoria" defaultValue={sp.categoria ?? ""} className={classeFiltro}>
            <option value="">Todas</option>
            {Object.entries(CATEGORIA_VENDA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Vendido por" className="w-40">
          <select name="funcionario" defaultValue={sp.funcionario ?? ""} className={classeFiltro}>
            <option value="">Todos</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
      </Filtros>

      <Cartao filete className="p-6">
        <TituloCartao selo="Desempenho comercial" icone={TrendingUp} titulo={AGRUPAMENTOS[agrupar]} descricao="Saída comercial consolidada do período, das vendas pagas." className="mb-5">
          <span className="rounded-full bg-info-fundo px-3 py-1 text-[11px] font-bold tracking-wider text-info uppercase">
            {registros} {registros === 1 ? "registro" : "registros"}
          </span>
        </TituloCartao>

        <div className={`mb-4 grid grid-cols-2 gap-3 ${isAdmin ? "lg:grid-cols-6 print:grid-cols-6" : "lg:grid-cols-4 print:grid-cols-4"}`}>
          <Mini rotulo="Total vendido" valor={formatCurrency(total)} destaque />
          <Mini rotulo="Vendas" valor={String(vendas.length)} />
          <Mini rotulo="Itens" valor={String(qtd)} />
          <Mini rotulo="Ticket médio" valor={formatCurrency(vendas.length ? total / vendas.length : 0)} />
          {isAdmin && <Mini rotulo="Custo" valor={formatCurrency(custo)} />}
          {isAdmin && <Mini rotulo={`Lucro bruto (${formatPercent(total ? (total - custo) / total : 0)})`} valor={formatCurrency(total - custo)} />}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Chip>Relatório: {AGRUPAMENTOS[agrupar]}</Chip>
          <Chip>Início: {periodo.inicioBr}</Chip>
          <Chip>Fim: {periodo.fimBr}</Chip>
          {sp.forma && <Chip>Pagamento: {FORMA_PAGAMENTO_LABELS[sp.forma as FormaPagamento]}</Chip>}
          {sp.categoria && <Chip>Categoria: {CATEGORIA_VENDA_LABELS[sp.categoria as CategoriaVenda]}</Chip>}
          {nomeFunc && <Chip>Vendedor: {nomeFunc}</Chip>}
        </div>

        {vendas.length === 0 ? (
          <Vazio>Nenhuma venda paga nesse período com esses filtros.</Vazio>
        ) : agrupar === "lista" ? (
          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Pagamento</th>
                  <th>Vendedor</th>
                  <th className="direita">Qtd.</th>
                  <th className="direita">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr key={v.id}>
                    <td className="numero">{formatDate(v.dataVenda)}</td>
                    <td className="numero">{v.id}</td>
                    <td>{v.clienteNome ?? "—"}</td>
                    <td className="destaque">{v.descricao}</td>
                    <td>{FORMA_PAGAMENTO_LABELS[v.formaPagamento]}</td>
                    <td>{v.funcionario?.nome ?? "—"}</td>
                    <td className="direita numero">{v.quantidade}</td>
                    <td className="direita numero destaque">{formatCurrency(v.valorVendido)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>Totais</td>
                  <td className="direita numero">{qtd}</td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  {agrupar === "produtos" && <th>Código</th>}
                  <th>{agrupar === "produtos" ? "Descrição" : AGRUPAMENTOS[agrupar].replace("Por ", "").replace(/^./, (c) => c.toUpperCase())}</th>
                  {agrupar === "produtos" && <th>Categoria</th>}
                  <th className="direita">Vendas</th>
                  <th className="direita">Quantidade</th>
                  <th className="direita">Valor total</th>
                  <th className="direita">% do total</th>
                  {isAdmin && <th className="direita">Custo</th>}
                  {isAdmin && <th className="direita">Lucro</th>}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.chave}>
                    {agrupar === "produtos" && <td className="numero whitespace-nowrap">{l.codigo}</td>}
                    <td className="destaque">{l.rotulo}</td>
                    {agrupar === "produtos" && <td>{l.sub}</td>}
                    <td className="direita numero">{l.vendas}</td>
                    <td className="direita numero">{l.qtd}</td>
                    <td className="direita numero destaque">{formatCurrency(l.valor)}</td>
                    <td className="direita numero">{formatPercent(total ? l.valor / total : 0)}</td>
                    {isAdmin && <td className="direita numero">{formatCurrency(l.custo)}</td>}
                    {isAdmin && <td className="direita numero">{formatCurrency(l.valor - l.custo)}</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={agrupar === "produtos" ? 3 : 1}>Totais</td>
                  <td className="direita numero">{vendas.length}</td>
                  <td className="direita numero">{qtd}</td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                  <td className="direita numero">100%</td>
                  {isAdmin && <td className="direita numero">{formatCurrency(custo)}</td>}
                  {isAdmin && <td className="direita numero">{formatCurrency(total - custo)}</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

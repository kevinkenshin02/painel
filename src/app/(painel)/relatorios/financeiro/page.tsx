import { redirect } from "next/navigation";
import { CalendarRange, Landmark, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { hojeCalendario } from "@/lib/datas";
import { mesDe, resumoDoMes } from "@/lib/financeiro";
import { AtalhosRelatorios, CabecalhoRelatorio, Filtros, Mini, periodoDe, Registros } from "../comum";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

export default async function RelatorioFinanceiroPage(props: PageProps<"/relatorios/financeiro">) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/relatorios");
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const periodo = periodoDe(sp);
  const hoje = hojeCalendario();

  // últimos 6 meses (o atual e os 5 anteriores)
  const atual = mesDe();
  const meses = Array.from({ length: 6 }, (_, i) => mesDe(new Date(Date.UTC(atual.ano, atual.mes - (5 - i), 1)).toISOString().slice(0, 7)));
  const resumos = await Promise.all(meses.map(async (m) => ({ mes: m, r: await resumoDoMes(prisma, m) })));

  const [pagas, abertas] = await Promise.all([
    prisma.contaPagar.findMany({
      where: { cancelada: false, pagoEm: { gte: periodo.inicio, lt: periodo.ate } },
      select: { categoria: true, origem: true, valor: true, valorPago: true },
    }),
    prisma.contaPagar.findMany({
      where: { cancelada: false, pagoEm: null, vencimento: { lt: new Date(hoje.getTime() + 31 * 864e5) } },
      orderBy: { vencimento: "asc" },
      include: { fornecedor: { select: { nome: true } } },
    }),
  ]);
  const porCategoria = Object.entries(
    pagas.reduce<Record<string, { qtd: number; valor: number }>>((acc, c) => {
      const k = c.categoria || (c.origem === "NOTA" ? "Fornecedor (mercadoria)" : "Outras");
      acc[k] ??= { qtd: 0, valor: 0 };
      acc[k].qtd++;
      acc[k].valor += c.valorPago ?? c.valor;
      return acc;
    }, {})
  ).sort((a, b) => b[1].valor - a[1].valor);
  const totalPago = porCategoria.reduce((s, [, g]) => s + g.valor, 0);
  const vencidas = abertas.filter((c) => c.vencimento < hoje);

  return (
    <>
      <AtalhosRelatorios ativo="financeiro" isAdmin />
      <CabecalhoRelatorio titulo="Relatório financeiro" nomePdf={`financeiro-${hoje.toISOString().slice(0, 10)}.pdf`} />

      <Cartao filete className="p-6">
        <TituloCartao selo="Resultado" icone={CalendarRange} titulo="Mês a mês" descricao="Receitas (vendas + OS entregues), custo dos produtos, contas do mês e o que sobrou." className="mb-5">
          <Registros n={meses.length} />
        </TituloCartao>
        <div className="overflow-x-auto rounded-xl border border-borda">
          <table className="tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="direita">Vendas</th>
                <th className="direita">Serviços</th>
                <th className="direita">Custo dos produtos</th>
                <th className="direita">Contas do mês</th>
                <th className="direita">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {resumos.map(({ mes, r }) => (
                <tr key={mes.chave}>
                  <td className="destaque">{mes.nome}</td>
                  <td className="direita numero">{formatCurrency(r.receitaVendas)}</td>
                  <td className="direita numero">{formatCurrency(r.receitaServicos)}</td>
                  <td className="direita numero">{formatCurrency(r.custoVendas)}</td>
                  <td className="direita numero">{formatCurrency(r.despesas)}</td>
                  <td className={cx("direita numero font-bold", r.resultado < 0 ? "text-perigo" : "text-sucesso")}>{formatCurrency(r.resultado)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Totais</td>
                <td className="direita numero">{formatCurrency(resumos.reduce((s, x) => s + x.r.receitaVendas, 0))}</td>
                <td className="direita numero">{formatCurrency(resumos.reduce((s, x) => s + x.r.receitaServicos, 0))}</td>
                <td className="direita numero">{formatCurrency(resumos.reduce((s, x) => s + x.r.custoVendas, 0))}</td>
                <td className="direita numero">{formatCurrency(resumos.reduce((s, x) => s + x.r.despesas, 0))}</td>
                <td className="direita numero">{formatCurrency(resumos.reduce((s, x) => s + x.r.resultado, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-xs text-suave">Meses antes do Painel 2.0 só têm as vendas; as contas começam a ser registradas a partir de setembro de 2026.</p>
      </Cartao>

      <Filtros periodo={periodo} acao="/relatorios/financeiro" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao filete className="p-6">
          <TituloCartao selo="Pagas" icone={Receipt} titulo="Contas pagas por categoria" descricao={`Pagamentos de ${periodo.rotulo}.`} className="mb-5" />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Mini rotulo="Total pago" valor={formatCurrency(totalPago)} destaque />
            <Mini rotulo="Contas pagas" valor={String(pagas.length)} />
          </div>
          {porCategoria.length === 0 ? (
            <Vazio>Nenhuma conta paga nesse período.</Vazio>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="direita">Contas</th>
                    <th className="direita">Valor pago</th>
                  </tr>
                </thead>
                <tbody>
                  {porCategoria.map(([cat, g]) => (
                    <tr key={cat}>
                      <td className="destaque">{cat}</td>
                      <td className="direita numero">{g.qtd}</td>
                      <td className="direita numero">{formatCurrency(g.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Totais</td>
                    <td className="direita numero">{pagas.length}</td>
                    <td className="direita numero">{formatCurrency(totalPago)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Cartao>

        <Cartao filete className="p-6">
          <TituloCartao selo="Em aberto" icone={Landmark} titulo="Vencidas e próximos 30 dias" className="mb-5">
            {vencidas.length > 0 && <Chip className="border-perigo/40 text-perigo">{vencidas.length} vencidas</Chip>}
          </TituloCartao>
          {abertas.length === 0 ? (
            <Vazio>Nada em aberto.</Vazio>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Conta</th>
                    <th className="direita">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {abertas.map((c) => (
                    <tr key={c.id}>
                      <td className="numero whitespace-nowrap">
                        {formatDate(c.vencimento)}
                        {c.vencimento < hoje && (
                          <Etiqueta tom="perigo" className="ml-2">
                            vencida
                          </Etiqueta>
                        )}
                      </td>
                      <td>
                        <div className="text-texto">{c.descricao}</div>
                        {c.fornecedor && <div className="text-xs text-suave">{c.fornecedor.nome}</div>}
                      </td>
                      <td className="direita numero destaque">{formatCurrency(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Totais · {abertas.length} contas</td>
                    <td className="direita numero">{formatCurrency(abertas.reduce((s, c) => s + c.valor, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Cartao>
      </div>
    </>
  );
}

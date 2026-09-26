import Link from "next/link";
import {
  BadgeDollarSign,
  CalendarClock,
  ChartColumn,
  CircleCheck,
  ClipboardList,
  Hourglass,
  Package,
  PackageSearch,
  Plus,
  ShoppingCart,
  Target,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusOS, StatusPagamento } from "@/generated/prisma/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { hojeCalendario, mesAtualCalendario } from "@/lib/datas";
import { precisaAtencao } from "@/lib/produtos";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { CartaoKpi } from "@/components/ui/CartaoKpi";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";
import { STATUS_OS_LABELS, STATUS_OS_TOM, TIPO_SERVICO_LABELS } from "./ordens-servico/labels";
import { CATEGORIA_VENDA_LABELS } from "./vendas/labels";

export const dynamic = "force-dynamic";

export default async function VisaoGeral() {
  const hoje = hojeCalendario();
  const mes = mesAtualCalendario();
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [vendasMes, emAndamento, atrasadas, prontas, clientesAtivos, proximas, config, produtos, despesasFixas, clientesNovos] =
    await Promise.all([
      prisma.venda.findMany({
        where: { statusPagamento: StatusPagamento.PAGO, dataVenda: { gte: mes.inicio, lt: mes.fim } },
        select: { dataVenda: true, valorVendido: true, custoTotal: true, categoria: true },
      }),
      prisma.ordemServico.count({ where: { status: { not: StatusOS.ENTREGUE } } }),
      prisma.ordemServico.count({ where: { status: { not: StatusOS.ENTREGUE }, prazoPrometido: { lt: hoje } } }),
      prisma.ordemServico.count({ where: { status: StatusOS.PRONTO_PARA_AVISAR } }),
      prisma.cliente.count({ where: { ativo: true } }),
      prisma.ordemServico.findMany({
        where: { status: { not: StatusOS.ENTREGUE } },
        orderBy: { prazoPrometido: "asc" },
        take: 6,
      }),
      prisma.configuracao.findUnique({ where: { id: 1 } }),
      prisma.produto.findMany({ where: { ativo: true }, select: { quantidade: true, ativo: true, estoqueMinimo: true } }),
      isAdmin ? prisma.despesaFixa.findMany({ where: { ativo: true }, select: { valor: true } }) : Promise.resolve([]),
      prisma.cliente.count({ where: { criadoEm: { gte: mes.inicio } } }),
    ]);

  // ----- vendas do mês -----
  const totalMes = vendasMes.reduce((s, v) => s + v.valorVendido, 0);
  const custoMes = vendasMes.reduce((s, v) => s + v.custoTotal, 0);
  const vendasHoje = vendasMes.filter((v) => v.dataVenda.getTime() === hoje.getTime());
  const totalHoje = vendasHoje.reduce((s, v) => s + v.valorVendido, 0);
  const despesasMes = despesasFixas.reduce((s, d) => s + d.valor, 0);
  const lucroMes = totalMes - custoMes - despesasMes;

  const porDia = Array.from({ length: mes.dias }, (_, i) => ({ dia: i + 1, valor: 0 }));
  for (const v of vendasMes) porDia[v.dataVenda.getUTCDate() - 1].valor += v.valorVendido;
  const maiorDia = Math.max(0, ...porDia.map((d) => d.valor));
  const diaDeHoje = hoje.getUTCDate();

  const porCategoria = Object.entries(
    vendasMes.reduce<Record<string, number>>((acc, v) => {
      acc[v.categoria] = (acc[v.categoria] ?? 0) + v.valorVendido;
      return acc;
    }, {})
  )
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  // ----- estoque -----
  const pecas = produtos.reduce((s, i) => s + i.quantidade, 0);
  const atencao = produtos.filter(precisaAtencao).length;

  const metas = [
    { rotulo: "Meta do dia", atual: totalHoje, meta: config?.metaDiaria ?? 0 },
    { rotulo: "Meta do mês", atual: totalMes, meta: config?.metaMensal ?? 0 },
  ].filter((m) => m.meta > 0);

  return (
    <>
      <Cabecalho
        secao="Operação da loja"
        titulo="Visão Geral"
        descricao="O resumo do dia e do mês: vendas, ordens de serviço e estoque."
        acoes={
          <>
            <BotaoLink href="/ordens-servico/nova" icone={ClipboardList}>
              Nova OS
            </BotaoLink>
            <BotaoLink href="/vendas/nova" variante="primario" icone={Plus}>
              Nova venda
            </BotaoLink>
          </>
        }
      >
        <Chip>{config?.nomeLoja?.trim() || "Tanaka Ótica e Relojoaria"}</Chip>
        <Chip>{logado?.nome ?? "—"}</Chip>
        <Chip>{isAdmin ? "Administrador" : "Funcionário"}</Chip>
      </Cabecalho>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoKpi
          tom="sol"
          icone={ShoppingCart}
          valor={formatCurrency(totalMes)}
          rotulo={`Vendas de ${mes.nome}`}
          detalhe={`${vendasMes.length} ${vendasMes.length === 1 ? "venda paga" : "vendas pagas"}`}
          href="/vendas"
        />
        <CartaoKpi
          tom="ambar"
          icone={BadgeDollarSign}
          valor={formatCurrency(totalHoje)}
          rotulo="Vendas de hoje"
          detalhe={`${vendasHoje.length} ${vendasHoje.length === 1 ? "venda" : "vendas"} hoje`}
          href="/vendas"
        />
        {isAdmin ? (
          <CartaoKpi
            tom="jade"
            icone={TrendingUp}
            valor={formatCurrency(lucroMes)}
            rotulo="Lucro do mês"
            detalhe={`Vendas − custo dos produtos − despesas fixas (${formatCurrency(despesasMes)})`}
            href="/despesas"
          />
        ) : (
          <CartaoKpi
            tom="jade"
            icone={CircleCheck}
            valor={prontas}
            rotulo="Prontas para avisar"
            detalhe="Ordens de serviço prontas"
            href="/ordens-servico"
          />
        )}
        <CartaoKpi
          tom="noite"
          icone={ClipboardList}
          valor={emAndamento}
          rotulo="OS em andamento"
          detalhe={`${prontas} ${prontas === 1 ? "pronta" : "prontas"} para avisar o cliente`}
          href="/ordens-servico"
        />
        <CartaoKpi
          tom="rubi"
          icone={Hourglass}
          valor={atrasadas}
          rotulo="OS atrasadas"
          detalhe="Com o prazo prometido vencido"
          href="/ordens-servico"
        />
        <CartaoKpi
          tom="sakura"
          icone={Users}
          valor={clientesAtivos}
          rotulo="Clientes cadastrados"
          detalhe={`${clientesNovos} ${clientesNovos === 1 ? "novo" : "novos"} este mês`}
          href="/clientes"
        />
        <CartaoKpi
          tom="ouro"
          icone={Package}
          valor={pecas}
          rotulo="Peças em estoque"
          detalhe={`${produtos.length} ${produtos.length === 1 ? "produto ativo" : "produtos ativos"}`}
          href="/estoque"
        />
        <CartaoKpi
          tom="vinho"
          icone={PackageSearch}
          valor={atencao}
          rotulo="Estoque para repor"
          detalhe="Zerados ou abaixo do mínimo"
          href="/produtos?situacao=atencao"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Cartao filete className="p-6 xl:col-span-2">
          <TituloCartao
            selo="Faturamento"
            icone={ChartColumn}
            titulo="Vendas por dia"
            descricao={`${mes.nome.charAt(0).toUpperCase() + mes.nome.slice(1)} · somente vendas pagas`}
          >
            <div className="text-right">
              <div className="numero text-lg font-bold text-texto">{formatCurrency(totalMes)}</div>
              <div className="text-xs text-suave">no mês</div>
            </div>
          </TituloCartao>

          <div className="mt-6">
            <div className="flex h-48 items-end gap-[3px] border-b border-borda" role="img" aria-label="Gráfico de vendas por dia do mês">
              {porDia.map((d) => {
                const altura = maiorDia > 0 ? Math.max(2, (d.valor / maiorDia) * 100) : 2;
                const ehHoje = d.dia === diaDeHoje;
                return (
                  <div
                    key={d.dia}
                    className="flex h-full flex-1 items-end"
                    title={`Dia ${d.dia}: ${formatCurrency(d.valor)}`}
                  >
                    <div
                      className={cx(
                        "w-full rounded-t-[5px] transition-all",
                        ehHoje ? "degrade-sol" : d.valor > 0 ? "bg-ouro/45" : "bg-superficie-3"
                      )}
                      style={{ height: `${altura}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-suave">
              <span>1</span>
              <span>{Math.ceil(mes.dias / 2)}</span>
              <span>{mes.dias}</span>
            </div>
            {maiorDia === 0 && (
              <p className="mt-3 text-center text-sm text-suave">Nenhuma venda paga neste mês ainda.</p>
            )}
          </div>
        </Cartao>

        <Cartao filete className="p-6">
          <TituloCartao selo="Desempenho" icone={TrendingUp} titulo="Vendas por categoria" descricao="Onde o faturamento do mês veio" />
          <div className="mt-5 flex flex-col gap-4">
            {porCategoria.length === 0 && <Vazio>Sem vendas pagas no mês.</Vazio>}
            {porCategoria.map((c) => {
              const pct = totalMes > 0 ? Math.round((c.valor / totalMes) * 100) : 0;
              return (
                <div key={c.categoria}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-texto">
                      {CATEGORIA_VENDA_LABELS[c.categoria as keyof typeof CATEGORIA_VENDA_LABELS] ?? c.categoria}
                    </span>
                    <span className="numero text-xs text-suave">
                      {formatCurrency(c.valor)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-superficie-3">
                    <div className="degrade-sol h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Cartao filete className="overflow-hidden xl:col-span-2">
          <div className="p-6 pb-4">
            <TituloCartao
              selo="Ordens de serviço"
              icone={CalendarClock}
              titulo="Próximas entregas"
              descricao="As OS em andamento com o prazo mais perto"
            >
              <BotaoLink href="/ordens-servico" tamanho="sm">
                Ver todas
              </BotaoLink>
            </TituloCartao>
          </div>
          {proximas.length === 0 ? (
            <div className="px-6 pb-6">
              <Vazio>Nenhuma ordem de serviço em andamento.</Vazio>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Prazo</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {proximas.map((os) => {
                    const atrasada = os.prazoPrometido < hoje;
                    return (
                      <tr key={os.id}>
                        <td className="destaque numero">#{os.id}</td>
                        <td className="destaque">{os.clienteNome}</td>
                        <td>{TIPO_SERVICO_LABELS[os.tipoServico]}</td>
                        <td className={cx("numero", atrasada && "font-semibold text-perigo")}>
                          {formatDate(os.prazoPrometido)}
                          {atrasada && (
                            <TriangleAlert className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px" aria-label="Atrasada" />
                          )}
                        </td>
                        <td>
                          <Etiqueta tom={STATUS_OS_TOM[os.status]}>{STATUS_OS_LABELS[os.status]}</Etiqueta>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>

        <Cartao filete className="p-6">
          <TituloCartao selo="Metas" icone={Target} titulo="Metas de vendas" descricao="Acompanhe o dia e o mês" />
          <div className="mt-5 flex flex-col gap-5">
            {metas.length === 0 ? (
              <Vazio>
                Nenhuma meta definida.
                {isAdmin && (
                  <>
                    {" "}
                    <Link href="/configuracoes" className="font-semibold text-ouro hover:underline">
                      Definir metas
                    </Link>
                  </>
                )}
              </Vazio>
            ) : (
              metas.map((m) => {
                const pct = Math.min(100, Math.round((m.atual / m.meta) * 100));
                const bateu = m.atual >= m.meta;
                return (
                  <div key={m.rotulo}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-texto">{m.rotulo}</span>
                      <span className="numero text-xs text-suave">
                        {formatCurrency(m.atual)} de {formatCurrency(m.meta)}{" "}
                        <span className={bateu ? "font-bold text-sucesso" : ""}>({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-superficie-3">
                      <div
                        className={cx("h-full rounded-full", bateu ? "bg-sucesso" : "degrade-sol")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Cartao>
      </div>
    </>
  );
}

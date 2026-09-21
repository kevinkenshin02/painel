import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusOS, StatusPagamento } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";
import { formatCurrency, formatDate } from "@/lib/format";
import { STATUS_OS_BADGE_CLASSES, STATUS_OS_LABELS, TIPO_SERVICO_LABELS } from "./ordens-servico/labels";
import { getFuncionarioLogado } from "@/lib/currentUser";

export default async function Home() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [
    emAndamento,
    atrasadas,
    entregues,
    proximas,
    vendasMes,
    vendasHoje,
    config,
    estoqueAtivo,
    despesasFixasAtivas,
  ] = await Promise.all([
    prisma.ordemServico.count({ where: { status: { not: StatusOS.ENTREGUE } } }),
    prisma.ordemServico.count({
      where: { status: { not: StatusOS.ENTREGUE }, prazoPrometido: { lt: hoje } },
    }),
    prisma.ordemServico.count({
      where: { status: StatusOS.ENTREGUE, dataEntrega: { gte: inicioMes } },
    }),
    prisma.ordemServico.findMany({
      where: { status: { not: StatusOS.ENTREGUE } },
      orderBy: { prazoPrometido: "asc" },
      take: 5,
    }),
    prisma.venda.aggregate({
      where: { statusPagamento: StatusPagamento.PAGO, dataVenda: { gte: inicioMes } },
      _sum: { valorVendido: true },
    }),
    prisma.venda.aggregate({
      where: { statusPagamento: StatusPagamento.PAGO, dataVenda: { gte: hoje } },
      _sum: { valorVendido: true },
    }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
    Promise.all([
      prisma.armacaoEstoque.count({ where: { ativo: true } }),
      prisma.relogioEstoque.count({ where: { ativo: true } }),
    ]),
    isAdmin ? prisma.despesaFixa.findMany({ where: { ativo: true } }) : Promise.resolve([]),
  ]);

  const totalVendasMes = vendasMes._sum.valorVendido ?? 0;
  const totalVendasHoje = vendasHoje._sum.valorVendido ?? 0;
  const metaDiaria = config?.metaDiaria ?? 0;
  const metaMensal = config?.metaMensal ?? 0;
  const totalItensEstoque = estoqueAtivo[0] + estoqueAtivo[1];
  const totalDespesasMes = despesasFixasAtivas.reduce((sum, d) => sum + d.valor, 0);

  const metas = [
    { label: "Meta diária", atual: totalVendasHoje, meta: metaDiaria },
    { label: "Meta mensal", atual: totalVendasMes, meta: metaMensal },
  ].filter((m) => m.meta > 0);

  const cards = [
    { label: "Vendas do mês", value: formatCurrency(totalVendasMes) },
    ...(isAdmin ? [{ label: "Despesas do mês", value: formatCurrency(totalDespesasMes) }] : []),
    { label: "OS em andamento", value: String(emAndamento) },
    { label: "OS atrasadas", value: String(atrasadas) },
    { label: "Entregues este mês", value: String(entregues) },
    { label: "Itens ativos em estoque", value: String(totalItensEstoque) },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#221d19]">Visão geral</h1>
          <p className="mt-1 text-sm text-[#8a8078]">Resumo da Óticas Tanaka</p>
        </div>
        <Link
          href="/vendas"
          className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
        >
          + Nova venda
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[#eee3d3] bg-white p-5">
            <div className="text-xs font-semibold tracking-wide text-[#8a8078] uppercase">
              {card.label}
            </div>
            <div className="mt-2 text-[26px] font-bold text-[#221d19]">{card.value}</div>
          </div>
        ))}
      </div>

      {metas.length > 0 && (
        <div className="rounded-xl border border-[#eee3d3] bg-white p-6">
          <h3 className="mb-4 text-[15px] font-bold text-[#221d19]">Metas de vendas</h3>
          <div className="flex flex-col gap-5">
            {metas.map((m) => {
              const percentual = Math.min(100, Math.round((m.atual / m.meta) * 100));
              const bateu = m.atual >= m.meta;
              return (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-[#221d19]">{m.label}</span>
                    <span className="text-xs font-medium text-[#8a8078]">
                      {formatCurrency(m.atual)} de {formatCurrency(m.meta)}{" "}
                      <span className={bateu ? "font-bold text-[#3a8f5b]" : ""}>
                        ({percentual}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f3ede4]">
                    <div
                      className={`h-full rounded-full ${
                        bateu
                          ? "bg-[#3a8f5b]"
                          : "bg-gradient-to-r from-[#f6b23b] to-[#e0472e]"
                      }`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#eee3d3] bg-white p-6">
        <h3 className="mb-4 text-[15px] font-bold text-[#221d19]">
          Próximas entregas
        </h3>
        {proximas.length === 0 ? (
          <p className="text-sm text-[#8a8078]">
            Nenhuma ordem de serviço em andamento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {proximas.map((os) => (
              <div
                key={os.id}
                className="flex items-center justify-between border-b border-[#f3ede4] pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-semibold text-[#221d19]">
                    {os.clienteNome}
                  </div>
                  <div className="text-xs text-[#8a8078]">
                    {TIPO_SERVICO_LABELS[os.tipoServico]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#221d19]">
                    {formatDate(os.prazoPrometido)}
                  </div>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_OS_BADGE_CLASSES[os.status]}`}
                  >
                    {STATUS_OS_LABELS[os.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

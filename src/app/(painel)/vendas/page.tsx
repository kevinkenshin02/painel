import { prisma } from "@/lib/prisma";
import { StatusPagamento } from "@/generated/prisma/enums";
import { formatCurrency, toDateInputValue } from "@/lib/format";
import { criarVenda, excluirVenda } from "./actions";
import { NovaVendaForm } from "./NovaVendaForm";
import { VendasTable } from "./VendasTable";
import { getFuncionarioLogado } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function VendasPage() {
  const hoje = new Date();
  const modoTeste = process.env.MP_POINT_TEST_MODE === "true";
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [vendas, armacoesDisponiveis, relogiosDisponiveis, lentesDisponiveis] = await Promise.all([
    prisma.venda.findMany({
      orderBy: { dataVenda: "desc" },
      take: 50,
      include: { funcionario: true },
    }),
    prisma.armacaoEstoque.findMany({
      where: { ativo: true, quantidade: { gt: 0 } },
      orderBy: { marcaModelo: "asc" },
    }),
    prisma.relogioEstoque.findMany({
      where: { ativo: true, quantidade: { gt: 0 } },
      orderBy: { modeloReferencia: "asc" },
    }),
    prisma.lenteEstoque.findMany({
      where: { ativo: true, quantidade: { gt: 0 } },
      orderBy: { descricao: "asc" },
    }),
  ]);

  const totalMes = vendas
    .filter(
      (v) =>
        v.statusPagamento === StatusPagamento.PAGO &&
        v.dataVenda.getMonth() === hoje.getMonth() &&
        v.dataVenda.getFullYear() === hoje.getFullYear()
    )
    .reduce((sum, v) => sum + v.valorVendido, 0);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#221d19]">Vendas</h1>
          <p className="mt-1 text-sm text-[#8a8078]">
            Registro de vendas e cobrança na maquininha.
          </p>
        </div>
        <div className="rounded-xl border border-[#eee3d3] bg-white px-5 py-3 text-right">
          <div className="text-xs font-semibold tracking-wide text-[#8a8078] uppercase">
            Vendas pagas este mês
          </div>
          <div className="mt-1 text-xl font-bold text-[#221d19]">{formatCurrency(totalMes)}</div>
        </div>
      </div>

      {modoTeste && (
        <div className="rounded-lg border border-[#f6b23b] bg-[#fdf0d5] px-4 py-3 text-xs font-medium text-[#8a6a1f]">
          Modo de teste ativo (MP_POINT_TEST_MODE=true) — cobranças no cartão usam o
          terminal virtual do Mercado Pago, sem mexer na maquininha real nem em dinheiro de
          verdade.
        </div>
      )}

      <div className="rounded-xl border-2 border-[#f6b23b] bg-white pb-6 shadow-sm">
        <div className="rounded-t-lg bg-gradient-to-r from-[#f6b23b] to-[#e0472e] px-6 py-3">
          <h2 className="text-sm font-bold text-white">Nova venda</h2>
        </div>

        <NovaVendaForm
          action={criarVenda}
          hoje={toDateInputValue(hoje)}
          armacoes={armacoesDisponiveis}
          relogios={relogiosDisponiveis}
          lentes={lentesDisponiveis}
          isAdmin={isAdmin}
        />
      </div>

      <VendasTable vendas={vendas} excluir={excluirVenda} modoTeste={modoTeste} />
    </div>
  );
}

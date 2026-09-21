import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { criarDespesasFixasEmLote, alternarAtivoDespesaFixa, excluirDespesaFixa } from "./actions";
import { DespesasLoteForm } from "./DespesasLoteForm";
import { DespesaFixaRow } from "./DespesaFixaRow";
import { getFuncionarioLogado } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    redirect("/");
  }

  const despesas = await prisma.despesaFixa.findMany({
    orderBy: { criadoEm: "asc" },
  });

  const totalMensal = despesas
    .filter((d) => d.ativo)
    .reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-[26px] font-bold text-[#221d19]">Despesas</h1>
        <p className="mt-1 text-sm text-[#8a8078]">
          Despesas fixas da loja, contabilizadas todo mês automaticamente.
        </p>
      </div>

      <div className="rounded-xl border border-[#eee3d3] bg-white p-5">
        <div className="text-xs font-semibold tracking-wide text-[#8a8078] uppercase">
          Despesas fixas por mês
        </div>
        <div className="mt-2 text-[26px] font-bold text-[#221d19]">
          {formatCurrency(totalMensal)}
        </div>
      </div>

      <details open className="rounded-xl border border-[#eee3d3] bg-white open:pb-6">
        <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-[#221d19] select-none">
          + Lançar despesas fixas
        </summary>

        <DespesasLoteForm action={criarDespesasFixasEmLote} />
      </details>

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Nome</th>
              <th className="px-5 py-3.5">Valor mensal</th>
              <th className="px-5 py-3.5">Observação</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {despesas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                  Nenhuma despesa fixa cadastrada ainda.
                </td>
              </tr>
            )}
            {despesas.map((d) => (
              <DespesaFixaRow
                key={d.id}
                despesa={d}
                alternarAtivo={alternarAtivoDespesaFixa}
                excluir={excluirDespesaFixa}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Landmark, ListPlus, Receipt } from "lucide-react";
import { BotaoLink } from "@/components/ui/Botao";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { criarDespesasFixasEmLote, alternarAtivoDespesaFixa, excluirDespesaFixa } from "./actions";
import { DespesasLoteForm } from "./DespesasLoteForm";
import { DespesaFixaRow } from "./DespesaFixaRow";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function DespesasPage() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    redirect("/");
  }

  const despesas = await prisma.despesaFixa.findMany({
    orderBy: { criadoEm: "asc" },
  });

  const ativas = despesas.filter((d) => d.ativo);
  const totalMensal = ativas.reduce((sum, d) => sum + d.valor, 0);

  return (
    <>
      <Cabecalho
        secao="Financeiro"
        titulo="Despesas fixas"
        descricao="Aluguel, condomínio, internet, salários... Todo mês cada uma vira uma conta a pagar com o vencimento no dia escolhido."
        acoes={
          <BotaoLink href="/financeiro/contas-a-pagar" icone={Landmark}>
            Contas a pagar
          </BotaoLink>
        }
      >
        <Chip>
          Por mês: <span className="numero text-texto">{formatCurrency(totalMensal)}</span>
        </Chip>
        <Chip>
          {ativas.length} {ativas.length === 1 ? "despesa ativa" : "despesas ativas"}
        </Chip>
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Lançamento"
          icone={ListPlus}
          titulo="Lançar despesas fixas"
          descricao="Preencha quantas linhas quiser — linhas em branco são ignoradas."
          className="mb-5"
        />
        <DespesasLoteForm action={criarDespesasFixasEmLote} />
      </Cartao>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Cadastro" icone={Receipt} titulo="Despesas cadastradas" descricao="Desative as que não valem mais sem perder o histórico." />
        </div>
        <div className="overflow-x-auto border-t border-borda">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valor mensal</th>
                <th>Vencimento</th>
                <th>Observação</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-suave">
                    Nenhuma despesa fixa cadastrada ainda.
                  </td>
                </tr>
              )}
              {despesas.map((d) => (
                <DespesaFixaRow key={d.id} despesa={d} alternarAtivo={alternarAtivoDespesaFixa} excluir={excluirDespesaFixa} />
              ))}
            </tbody>
            {despesas.length > 0 && (
              <tfoot>
                <tr>
                  <td>Total mensal (ativas)</td>
                  <td className="numero">{formatCurrency(totalMensal)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Cartao>
    </>
  );
}

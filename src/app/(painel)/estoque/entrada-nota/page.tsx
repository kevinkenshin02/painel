import { redirect } from "next/navigation";
import { FileText, FileUp, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { EntradaNota } from "./EntradaNota";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";

export const dynamic = "force-dynamic";

export default async function EntradaNotaPage() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/estoque");

  const [produtos, notas] = await Promise.all([
    prisma.produto.findMany({
      select: {
        id: true,
        codigo: true,
        codigoBarras: true,
        referencia: true,
        tipo: true,
        marca: true,
        descricao: true,
        precoVenda: true,
        custoUnitario: true,
        quantidade: true,
        aConferir: true,
      },
    }),
    prisma.notaEntrada.findMany({
      orderBy: { criadoEm: "desc" },
      take: 30,
      include: {
        fornecedor: { select: { nome: true } },
        funcionario: { select: { nome: true } },
        itens: { select: { quantidade: true, lancado: true } },
      },
    }),
  ]);

  return (
    <>
      <Cabecalho
        secao="Estoque"
        titulo="Entrada por nota fiscal (XML)"
        descricao="Lê a nota do fornecedor, soma as peças no estoque com o custo real, cadastra o que for novo e guarda as parcelas."
        acoes={
          <BotaoLink href="/estoque" icone={Package}>
            Posição do estoque
          </BotaoLink>
        }
      />

      <Cartao filete className="p-6">
        <TituloCartao selo="Nova entrada" icone={FileUp} titulo="Lançar nota" className="mb-5" />
        <EntradaNota produtos={produtos} chavesLancadas={notas.map((n) => n.chave).filter((c): c is string => Boolean(c))} />
      </Cartao>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Histórico" icone={FileText} titulo="Notas já lançadas" descricao="As 30 mais recentes." />
        </div>
        {notas.length === 0 ? (
          <div className="px-6 pb-6">
            <Vazio>Nenhuma nota lançada pelo XML ainda.</Vazio>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>NF</th>
                  <th>Fornecedor</th>
                  <th>Emissão</th>
                  <th>Lançada em</th>
                  <th>Por</th>
                  <th className="direita">Peças</th>
                  <th className="direita">Total da nota</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((n) => (
                  <tr key={n.id}>
                    <td className="destaque numero">
                      {n.numero}
                      {n.serie ? `/${n.serie}` : ""}
                    </td>
                    <td>{n.fornecedor?.nome ?? "—"}</td>
                    <td className="numero">{n.dataEmissao ? formatDate(n.dataEmissao) : "—"}</td>
                    <td className="numero">{n.criadoEm.toLocaleDateString("pt-BR")}</td>
                    <td>{n.funcionario?.nome ?? "—"}</td>
                    <td className="direita numero">{Math.round(n.itens.filter((i) => i.lancado).reduce((s, i) => s + i.quantidade, 0))}</td>
                    <td className="direita numero destaque">{formatCurrency(n.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

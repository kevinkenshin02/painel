import Link from "next/link";
import { History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { resumoCaixa } from "@/lib/caixa";
import { AtalhosCaixa, dataHora } from "../componentes";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

export default async function HistoricoCaixasPage() {
  const caixas = await prisma.caixa.findMany({
    orderBy: { abertoEm: "desc" },
    take: 90,
    include: {
      abertoPor: { select: { nome: true } },
      fechadoPor: { select: { nome: true } },
      movimentos: { select: { tipo: true, formaPagamento: true, valor: true } },
    },
  });

  const linhas = caixas.map((c) => {
    const r = resumoCaixa(c.movimentos);
    const esperado = c.dinheiroEsperado ?? r.dinheiroEsperado;
    return { ...c, recebido: r.recebido, esperado, diferenca: c.dinheiroContado !== null ? c.dinheiroContado - esperado : null };
  });

  return (
    <>
      <AtalhosCaixa ativo="historico" />
      <Cabecalho secao="Caixa" titulo="Histórico de caixas" descricao="Aberturas e fechamentos, com o que foi recebido e a diferença da gaveta." />
      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Histórico" icone={History} titulo="Caixas" descricao="Os 90 mais recentes. Clique no número para ver o detalhado." />
        </div>
        {linhas.length === 0 ? (
          <div className="px-6 pb-6">
            <Vazio>Nenhum caixa aberto ainda.</Vazio>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Abertura</th>
                  <th>Fechamento</th>
                  <th className="direita">Recebido</th>
                  <th className="direita">Devia ter na gaveta</th>
                  <th className="direita">Contado</th>
                  <th className="direita">Diferença</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((c) => (
                  <tr key={c.id}>
                    <td className="destaque numero">
                      <Link href={`/caixa/detalhado?id=${c.id}`} className="hover:text-ouro hover:underline">
                        #{c.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="numero">{dataHora(c.abertoEm)}</div>
                      <div className="text-xs text-suave">{c.abertoPor?.nome ?? "—"}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="numero">{c.fechadoEm ? dataHora(c.fechadoEm) : "—"}</div>
                      <div className="text-xs text-suave">{c.fechadoPor?.nome ?? ""}</div>
                    </td>
                    <td className="direita numero destaque">{formatCurrency(c.recebido)}</td>
                    <td className="direita numero">{formatCurrency(c.esperado)}</td>
                    <td className="direita numero">{c.dinheiroContado !== null ? formatCurrency(c.dinheiroContado) : "—"}</td>
                    <td
                      className={cx(
                        "direita numero font-semibold",
                        c.diferenca === null ? "text-suave" : Math.abs(c.diferenca) < 0.01 ? "text-sucesso" : c.diferenca > 0 ? "text-aviso" : "text-perigo"
                      )}
                    >
                      {c.diferenca === null ? "—" : Math.abs(c.diferenca) < 0.01 ? "Bateu" : `${c.diferenca > 0 ? "+" : "−"} ${formatCurrency(Math.abs(c.diferenca))}`}
                    </td>
                    <td>
                      {c.status === "ABERTO" ? <Etiqueta tom="sucesso">Aberto</Etiqueta> : <Etiqueta>Fechado</Etiqueta>}
                      {c.aberturaAutomatica && <Etiqueta tom="aviso" className="ml-1">auto</Etiqueta>}
                    </td>
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

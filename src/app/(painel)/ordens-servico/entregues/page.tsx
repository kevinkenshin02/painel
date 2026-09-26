import { CircleCheck, ClipboardList, Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusOS } from "@/generated/prisma/enums";
import { formatCurrency, formatDate } from "@/lib/format";
import { TIPO_SERVICO_LABELS } from "../labels";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";

export const dynamic = "force-dynamic";

export default async function OrdensEntreguesPage() {
  const entregues = await prisma.ordemServico.findMany({
    where: { status: StatusOS.ENTREGUE },
    orderBy: { dataEntrega: "desc" },
    take: 100,
  });
  const total = entregues.reduce((s, os) => s + os.valorTotal, 0);

  return (
    <>
      <Cabecalho
        secao="Ordens de serviço"
        titulo="Entregues"
        descricao="As 100 entregas mais recentes, com o comprovante para reimprimir."
        acoes={
          <BotaoLink href="/ordens-servico" icone={ClipboardList}>
            Em andamento
          </BotaoLink>
        }
      />

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Histórico" icone={CircleCheck} titulo="Ordens entregues" />
        </div>
        <div className="overflow-x-auto border-t border-borda">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Entrada</th>
                <th>Entregue em</th>
                <th className="direita">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entregues.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-suave">
                    Nenhuma entrega registrada ainda.
                  </td>
                </tr>
              )}
              {entregues.map((os) => (
                <tr key={os.id}>
                  <td className="destaque numero">#{os.id}</td>
                  <td className="destaque">{os.clienteNome}</td>
                  <td>{TIPO_SERVICO_LABELS[os.tipoServico]}</td>
                  <td className="numero">{formatDate(os.dataEntrada)}</td>
                  <td className="numero">{os.dataEntrega ? formatDate(os.dataEntrega) : "—"}</td>
                  <td className="direita numero">{formatCurrency(os.valorTotal)}</td>
                  <td className="direita">
                    <a
                      href={`/recibo/${os.id}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
                    >
                      <Printer className="h-3.5 w-3.5" aria-hidden />
                      Comprovante
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
            {entregues.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    Totais · {entregues.length} {entregues.length === 1 ? "entrega" : "entregas"}
                  </td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Cartao>
    </>
  );
}

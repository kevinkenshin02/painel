import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, HandCoins } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { hojeCalendario } from "@/lib/datas";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { STATUS_OS_LABELS, STATUS_OS_TOM, TIPO_SERVICO_LABELS } from "../../ordens-servico/labels";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

export default async function ContasReceberPage() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/");
  const hoje = hojeCalendario();

  const abertas = (
    await prisma.ordemServico.findMany({
      where: { status: { not: "ENTREGUE" } },
      orderBy: { prazoPrometido: "asc" },
    })
  ).filter((o) => o.valorTotal - o.sinalPago > 0.009);

  const total = abertas.reduce((s, o) => s + o.valorTotal - o.sinalPago, 0);
  const prontas = abertas.filter((o) => o.status === "PRONTO_PARA_AVISAR" || o.status === "CLIENTE_AVISADO");

  return (
    <>
      <Cabecalho
        secao="Financeiro"
        titulo="Contas a receber"
        descricao="O que os clientes ainda vão pagar nas ordens de serviço (o restante é recebido na retirada)."
        acoes={
          <BotaoLink href="/ordens-servico" icone={ClipboardList}>
            Ordens em andamento
          </BotaoLink>
        }
      >
        <Chip>
          A receber: <span className="numero text-texto">{formatCurrency(total)}</span>
        </Chip>
        <Chip>{abertas.length} OS com saldo</Chip>
        <Chip className={prontas.length ? "border-aviso/40 text-aviso" : undefined}>
          {prontas.length} prontas para retirar ({formatCurrency(prontas.reduce((s, o) => s + o.valorTotal - o.sinalPago, 0))})
        </Chip>
      </Cabecalho>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Saldos" icone={HandCoins} titulo="OS com valor a receber" descricao="Para receber, use o botão Receber em Ordens de serviço → Em andamento." />
        </div>
        {abertas.length === 0 ? (
          <div className="px-6 pb-6">
            <Vazio>Nenhuma OS com valor a receber.</Vazio>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº OS</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Prazo</th>
                  <th>Situação</th>
                  <th className="direita">Total</th>
                  <th className="direita">Pago</th>
                  <th className="direita">Falta</th>
                </tr>
              </thead>
              <tbody>
                {abertas.map((o) => (
                  <tr key={o.id}>
                    <td className="destaque numero">#{o.id}</td>
                    <td>
                      {o.clienteId ? (
                        <Link href={`/clientes/${o.clienteId}?aba=historico`} className="font-semibold text-texto hover:text-ouro hover:underline">
                          {o.clienteNome}
                        </Link>
                      ) : (
                        <span className="font-semibold text-texto">{o.clienteNome}</span>
                      )}
                    </td>
                    <td>{TIPO_SERVICO_LABELS[o.tipoServico]}</td>
                    <td className={cx("numero", o.prazoPrometido < hoje && "font-semibold text-perigo")}>{formatDate(o.prazoPrometido)}</td>
                    <td>
                      <Etiqueta tom={STATUS_OS_TOM[o.status]}>{STATUS_OS_LABELS[o.status]}</Etiqueta>
                    </td>
                    <td className="direita numero">{formatCurrency(o.valorTotal)}</td>
                    <td className="direita numero">{formatCurrency(o.sinalPago)}</td>
                    <td className="direita numero destaque">{formatCurrency(o.valorTotal - o.sinalPago)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Totais · {abertas.length} OS</td>
                  <td className="direita numero">{formatCurrency(abertas.reduce((s, o) => s + o.valorTotal, 0))}</td>
                  <td className="direita numero">{formatCurrency(abertas.reduce((s, o) => s + o.sinalPago, 0))}</td>
                  <td className="direita numero">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

"use client";

import { Fragment, useState } from "react";
import { HandCoins, PackageCheck, Printer, Search } from "lucide-react";
import { ReceberOS } from "./ReceberOS";
import { formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import { STATUS_OS_LABELS, STATUS_OS_TOM, TIPO_SERVICO_LABELS } from "./labels";
import { StatusSelect } from "./StatusSelect";
import { DeleteButton } from "./DeleteButton";
import { AvisarClienteButton } from "./AvisarClienteButton";
import type { StatusOS, TipoServico } from "@/generated/prisma/enums";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { classeCampo } from "@/components/ui/Campo";
import { cx } from "@/components/ui/cx";

type OrdemServico = {
  id: number;
  clienteNome: string;
  clienteWhatsapp: string;
  tipoServico: TipoServico;
  status: StatusOS;
  prazoPrometido: Date;
  valorTotal: number;
  sinalPago: number;
};

export function OrdensAtivasTable({ ativas, hoje }: { ativas: OrdemServico[]; hoje: Date }) {
  const [busca, setBusca] = useState("");
  const [recebendo, setRecebendo] = useState<{ id: number; entregar: boolean } | null>(null);

  const termo = busca.trim().toLowerCase();
  const termoDigits = termo.replace(/\D/g, "");
  const filtradas = termo
    ? ativas.filter((os) => {
        const texto = `#${os.id} ${os.clienteNome}`.toLowerCase();
        const telefoneDigits = os.clienteWhatsapp.replace(/\D/g, "");
        return texto.includes(termo) || (termoDigits && telefoneDigits.includes(termoDigits));
      })
    : ativas;

  const total = filtradas.reduce((s, os) => s + os.valorTotal, 0);
  const restante = filtradas.reduce((s, os) => s + (os.valorTotal - os.sinalPago), 0);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
        <input
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nº da OS, cliente ou telefone..."
          className={cx(classeCampo, "pl-10")}
        />
      </label>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nº OS</th>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Prazo</th>
              <th>Situação</th>
              <th className="direita">Total</th>
              <th className="direita">Falta pagar</th>
              <th className="direita">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-suave">
                  {ativas.length === 0
                    ? "Nenhuma ordem de serviço em andamento."
                    : "Nenhuma ordem de serviço encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtradas.map((os) => {
              const atrasada = os.prazoPrometido < hoje;
              const restante = Math.round((os.valorTotal - os.sinalPago) * 100) / 100;
              const pronta = os.status === "PRONTO_PARA_AVISAR" || os.status === "CLIENTE_AVISADO";
              return (
                <Fragment key={os.id}>
                <tr className={atrasada ? "[&>td:first-child]:shadow-[inset_3px_0_0_var(--perigo)]" : undefined}>
                  <td className="destaque numero">#{os.id}</td>
                  <td>
                    <div className="font-semibold text-texto">{os.clienteNome}</div>
                    <div className="numero text-xs whitespace-nowrap text-suave">{formatTelefone(os.clienteWhatsapp)}</div>
                  </td>
                  <td className="whitespace-nowrap">{TIPO_SERVICO_LABELS[os.tipoServico]}</td>
                  <td className="whitespace-nowrap">
                    <span className={cx("numero", atrasada && "font-bold text-perigo")}>{formatDate(os.prazoPrometido)}</span>
                    {atrasada && <div className="text-xs font-semibold text-perigo">Atrasada</div>}
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1.5">
                      <Etiqueta tom={STATUS_OS_TOM[os.status]}>{STATUS_OS_LABELS[os.status]}</Etiqueta>
                      <StatusSelect
                        id={os.id}
                        status={os.status}
                        restante={restante}
                        aoPedirRecebimento={() => setRecebendo({ id: os.id, entregar: true })}
                      />
                    </div>
                  </td>
                  <td className="direita numero">{formatCurrency(os.valorTotal)}</td>
                  <td className="direita numero destaque">{formatCurrency(os.valorTotal - os.sinalPago)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {restante > 0.009 ? (
                        <button
                          type="button"
                          onClick={() => setRecebendo(recebendo?.id === os.id ? null : { id: os.id, entregar: pronta })}
                          title="Registrar pagamento (entra no caixa)"
                          className="inline-flex items-center gap-1 rounded-lg border border-borda-forte bg-ouro/10 px-2 py-1 text-xs font-semibold text-ouro transition hover:bg-ouro/20"
                        >
                          <HandCoins className="h-3.5 w-3.5" aria-hidden />
                          Receber
                        </button>
                      ) : (
                        pronta && (
                          <button
                            type="button"
                            onClick={() => setRecebendo({ id: os.id, entregar: true })}
                            title="Marcar como entregue"
                            className="inline-flex items-center gap-1 rounded-lg border border-sucesso/35 bg-sucesso-fundo px-2 py-1 text-xs font-semibold text-sucesso transition hover:border-sucesso/70"
                          >
                            <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                            Entregar
                          </button>
                        )
                      )}
                      <AvisarClienteButton
                        id={os.id}
                        clienteNome={os.clienteNome}
                        clienteWhatsapp={os.clienteWhatsapp}
                        tipoServicoLabel={TIPO_SERVICO_LABELS[os.tipoServico]}
                      />
                      <a
                        href={`/recibo/${os.id}`}
                        target="_blank"
                        rel="noopener"
                        title="Imprimir comprovante"
                        aria-label="Imprimir comprovante"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
                      >
                        <Printer className="h-3.5 w-3.5" aria-hidden />
                      </a>
                      <DeleteButton id={os.id} />
                    </div>
                  </td>
                </tr>
                {recebendo?.id === os.id && (
                  <tr>
                    <td colSpan={8} className="bg-superficie-2/60">
                      <ReceberOS osId={os.id} restante={restante} entregarPadrao={recebendo.entregar} aoFechar={() => setRecebendo(null)} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
          {filtradas.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5}>
                  Totais · {filtradas.length} {filtradas.length === 1 ? "ordem" : "ordens"}
                </td>
                <td className="direita numero">{formatCurrency(total)}</td>
                <td className="direita numero">{formatCurrency(restante)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

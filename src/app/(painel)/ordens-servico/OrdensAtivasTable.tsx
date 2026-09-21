"use client";

import { useState } from "react";
import { formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import { STATUS_OS_BADGE_CLASSES, STATUS_OS_LABELS, TIPO_SERVICO_LABELS } from "./labels";
import { StatusSelect } from "./StatusSelect";
import { DeleteButton } from "./DeleteButton";
import { AvisarClienteButton } from "./AvisarClienteButton";
import type { StatusOS, TipoServico } from "@/generated/prisma/enums";

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

  const termo = busca.trim().toLowerCase();
  const termoDigits = termo.replace(/\D/g, "");
  const filtradas = termo
    ? ativas.filter((os) => {
        const texto = `#${os.id} ${os.clienteNome}`.toLowerCase();
        const telefoneDigits = os.clienteWhatsapp.replace(/\D/g, "");
        return (
          texto.includes(termo) || (termoDigits && telefoneDigits.includes(termoDigits))
        );
      })
    : ativas;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por nº da OS, cliente ou telefone..."
        className="w-full max-w-sm rounded-lg border border-[#e4dbcb] bg-white px-3 py-2 text-sm text-[#221d19]"
      />

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Nº OS</th>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Serviço</th>
              <th className="px-5 py-3.5">Prazo</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Restante</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                  {ativas.length === 0
                    ? "Nenhuma ordem de serviço em andamento."
                    : "Nenhuma ordem de serviço encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtradas.map((os) => {
              const atrasada = os.prazoPrometido < hoje;
              return (
                <tr
                  key={os.id}
                  className={`border-t border-[#f3ede4] ${atrasada ? "bg-[#fdf3f1]" : ""}`}
                >
                  <td className="px-5 py-4 font-semibold text-[#221d19]">#{os.id}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#221d19]">{os.clienteNome}</div>
                    <div className="text-xs text-[#8a8078]">{formatTelefone(os.clienteWhatsapp)}</div>
                  </td>
                  <td className="px-5 py-4 text-[#4a4038]">
                    {TIPO_SERVICO_LABELS[os.tipoServico]}
                  </td>
                  <td className="px-5 py-4">
                    <span className={atrasada ? "font-bold text-[#c0472b]" : "text-[#4a4038]"}>
                      {formatDate(os.prazoPrometido)}
                    </span>
                    {atrasada && (
                      <div className="text-xs font-medium text-[#c0472b]">Atrasada</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="mb-1.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_OS_BADGE_CLASSES[os.status]}`}
                      >
                        {STATUS_OS_LABELS[os.status]}
                      </span>
                    </div>
                    <StatusSelect id={os.id} status={os.status} />
                  </td>
                  <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(os.valorTotal)}</td>
                  <td className="px-5 py-4 text-[#4a4038]">
                    {formatCurrency(os.valorTotal - os.sinalPago)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-1.5">
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
                        className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
                      >
                        Comprovante
                      </a>
                      <DeleteButton id={os.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

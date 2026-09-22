"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  CANAL_ORIGEM_LABELS,
  CATEGORIA_VENDA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO_BADGE_CLASSES,
  STATUS_PAGAMENTO_LABELS,
} from "./labels";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { PagamentoPendente } from "./PagamentoPendente";
import { CupomFiscalCell } from "./CupomFiscalCell";
import { StatusPagamento } from "@/generated/prisma/enums";
import type {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusFiscal,
} from "@/generated/prisma/enums";

type Venda = {
  id: number;
  dataVenda: Date;
  clienteNome: string | null;
  descricao: string;
  categoria: CategoriaVenda;
  canalOrigem: CanalOrigem;
  formaPagamento: FormaPagamento;
  valorVendido: number;
  statusPagamento: StatusPagamento;
  satStatus: StatusFiscal;
  satMensagemErro: string | null;
  funcionario: { nome: string } | null;
};

export function VendasTable({
  vendas,
  excluir,
  modoTeste,
}: {
  vendas: Venda[];
  excluir: (formData: FormData) => void;
  modoTeste: boolean;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? vendas.filter((v) =>
        [
          v.clienteNome ?? "",
          v.descricao,
          CATEGORIA_VENDA_LABELS[v.categoria],
          CANAL_ORIGEM_LABELS[v.canalOrigem],
          FORMA_PAGAMENTO_LABELS[v.formaPagamento],
          v.funcionario?.nome ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(termo)
      )
    : vendas;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por cliente, descrição, canal ou forma de pagamento..."
        className="w-full max-w-sm rounded-lg border border-[#e4dbcb] bg-white px-3 py-2 text-sm text-[#221d19]"
      />

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Data</th>
              <th className="px-5 py-3.5">Cliente</th>
              <th className="px-5 py-3.5">Descrição</th>
              <th className="px-5 py-3.5">Canal</th>
              <th className="px-5 py-3.5">Pagamento</th>
              <th className="px-5 py-3.5">Valor</th>
              <th className="px-5 py-3.5">Vendido por</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Cupom fiscal</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                  {vendas.length === 0
                    ? "Nenhuma venda registrada ainda."
                    : "Nenhuma venda encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtradas.map((v) => (
              <tr key={v.id} className="border-t border-[#f3ede4]">
                <td className="px-5 py-4 text-[#4a4038]">{formatDate(v.dataVenda)}</td>
                <td className="px-5 py-4 font-semibold text-[#221d19]">
                  {v.clienteNome || "—"}
                </td>
                <td className="px-5 py-4 text-[#4a4038]">
                  {v.descricao}
                  <div className="text-xs text-[#8a8078]">{CATEGORIA_VENDA_LABELS[v.categoria]}</div>
                </td>
                <td className="px-5 py-4 text-[#4a4038]">{CANAL_ORIGEM_LABELS[v.canalOrigem]}</td>
                <td className="px-5 py-4 text-[#4a4038]">{FORMA_PAGAMENTO_LABELS[v.formaPagamento]}</td>
                <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(v.valorVendido)}</td>
                <td className="px-5 py-4 text-[#4a4038]">{v.funcionario?.nome ?? "—"}</td>
                <td className="px-5 py-4">
                  {v.statusPagamento === StatusPagamento.PENDENTE ? (
                    <PagamentoPendente vendaId={v.id} modoTeste={modoTeste} />
                  ) : (
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PAGAMENTO_BADGE_CLASSES[v.statusPagamento]}`}
                    >
                      {STATUS_PAGAMENTO_LABELS[v.statusPagamento]}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <CupomFiscalCell
                    vendaId={v.id}
                    satStatus={v.satStatus}
                    satMensagemErro={v.satMensagemErro}
                    statusPagamento={v.statusPagamento}
                  />
                </td>
                <td className="px-5 py-4 text-right">
                  <ConfirmDeleteForm id={v.id} action={excluir} confirmMessage="Excluir esta venda?" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

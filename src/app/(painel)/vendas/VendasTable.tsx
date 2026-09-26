"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  CANAL_ORIGEM_LABELS,
  CATEGORIA_VENDA_LABELS,
  FORMA_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO_TOM,
} from "./labels";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { PagamentoPendente } from "./PagamentoPendente";
import { StatusPagamento } from "@/generated/prisma/enums";
import type { CanalOrigem, CategoriaVenda, FormaPagamento } from "@/generated/prisma/enums";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { classeCampo } from "@/components/ui/Campo";
import { cx } from "@/components/ui/cx";

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
  funcionario: { nome: string } | null;
};

export function VendasTable({
  vendas,
  excluir,
  modoTeste,
  mostrarBusca = true,
  vazio = "Nenhuma venda registrada ainda.",
}: {
  vendas: Venda[];
  excluir: (formData: FormData) => void;
  modoTeste: boolean;
  mostrarBusca?: boolean;
  vazio?: string;
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

  const pagas = filtradas.filter((v) => v.statusPagamento === StatusPagamento.PAGO);
  const totalPago = pagas.reduce((s, v) => s + v.valorVendido, 0);

  return (
    <div className="flex flex-col gap-4">
      {mostrarBusca && (
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por cliente, descrição, canal ou pagamento..."
            className={cx(classeCampo, "pl-10")}
          />
        </label>
      )}

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Descrição</th>
              <th>Canal</th>
              <th>Pagamento</th>
              <th className="direita">Valor</th>
              <th>Vendido por</th>
              <th>Situação</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-suave">
                  {vendas.length === 0 ? vazio : "Nenhuma venda encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtradas.map((v) => (
              <tr key={v.id}>
                <td className="numero">{formatDate(v.dataVenda)}</td>
                <td className="destaque">{v.clienteNome || "—"}</td>
                <td>
                  <div className="text-texto">{v.descricao}</div>
                  <div className="text-xs text-suave">{CATEGORIA_VENDA_LABELS[v.categoria]}</div>
                </td>
                <td>{CANAL_ORIGEM_LABELS[v.canalOrigem]}</td>
                <td>{FORMA_PAGAMENTO_LABELS[v.formaPagamento]}</td>
                <td className="direita numero destaque">{formatCurrency(v.valorVendido)}</td>
                <td>{v.funcionario?.nome ?? "—"}</td>
                <td>
                  {v.statusPagamento === StatusPagamento.PENDENTE ? (
                    <PagamentoPendente vendaId={v.id} modoTeste={modoTeste} />
                  ) : (
                    <Etiqueta tom={STATUS_PAGAMENTO_TOM[v.statusPagamento]}>{STATUS_PAGAMENTO_LABELS[v.statusPagamento]}</Etiqueta>
                  )}
                </td>
                <td className="direita">
                  <ConfirmDeleteForm id={v.id} action={excluir} confirmMessage="Excluir esta venda? O item volta para o estoque." compacto />
                </td>
              </tr>
            ))}
          </tbody>
          {filtradas.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5}>
                  Totais · {pagas.length} {pagas.length === 1 ? "venda paga" : "vendas pagas"}
                  {pagas.length !== filtradas.length && (
                    <span className="font-medium text-suave"> (de {filtradas.length} na lista)</span>
                  )}
                </td>
                <td className="direita numero">{formatCurrency(totalPago)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

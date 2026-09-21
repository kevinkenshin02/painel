"use client";

import { useState } from "react";
import { ArmacaoRow } from "./ArmacaoRow";

type Armacao = {
  id: number;
  codigo: string;
  marcaModelo: string;
  corReferencia: string;
  fornecedor: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
  ativo: boolean;
};

export function ArmacoesTable({
  armacoes,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  armacoes: Armacao[];
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? armacoes.filter((a) =>
        [a.codigo, a.marcaModelo, a.corReferencia, a.fornecedor]
          .join(" ")
          .toLowerCase()
          .includes(termo)
      )
    : armacoes;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, marca/modelo, cor ou fornecedor..."
        className="w-full max-w-sm rounded-lg border border-[#e4dbcb] bg-white px-3 py-2 text-sm text-[#221d19]"
      />

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Código</th>
              <th className="px-5 py-3.5">Marca/Modelo</th>
              <th className="px-5 py-3.5">Cor</th>
              <th className="px-5 py-3.5">Fornecedor</th>
              <th className="px-5 py-3.5">Qtd.</th>
              {isAdmin && <th className="px-5 py-3.5">Custo</th>}
              <th className="px-5 py-3.5">Preço</th>
              <th className="px-5 py-3.5">Status</th>
              {isAdmin && <th className="px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 7} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                  {armacoes.length === 0
                    ? "Nenhuma armação cadastrada."
                    : "Nenhuma armação encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtradas.map((a) => (
              <ArmacaoRow
                key={a.id}
                armacao={a}
                alternarAtivo={alternarAtivo}
                excluir={excluir}
                isAdmin={isAdmin}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

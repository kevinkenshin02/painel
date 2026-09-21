"use client";

import { useState } from "react";
import { LenteRow } from "./LenteRow";

type Lente = {
  id: number;
  codigo: string;
  descricao: string;
  grau: string;
  fornecedor: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
  ativo: boolean;
};

export function LentesTable({
  lentes,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  lentes: Lente[];
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? lentes.filter((l) =>
        [l.codigo, l.descricao, l.grau, l.fornecedor].join(" ").toLowerCase().includes(termo)
      )
    : lentes;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, descrição, grau ou fornecedor..."
        className="w-full max-w-sm rounded-lg border border-[#e4dbcb] bg-white px-3 py-2 text-sm text-[#221d19]"
      />

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Código</th>
              <th className="px-5 py-3.5">Descrição</th>
              <th className="px-5 py-3.5">Grau</th>
              <th className="px-5 py-3.5">Fornecedor</th>
              <th className="px-5 py-3.5">Qtd.</th>
              {isAdmin && <th className="px-5 py-3.5">Custo</th>}
              <th className="px-5 py-3.5">Preço</th>
              <th className="px-5 py-3.5">Status</th>
              {isAdmin && <th className="px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 7} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                  {lentes.length === 0
                    ? "Nenhuma lente cadastrada."
                    : "Nenhuma lente encontrada para essa busca."}
                </td>
              </tr>
            )}
            {filtrados.map((l) => (
              <LenteRow
                key={l.id}
                lente={l}
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

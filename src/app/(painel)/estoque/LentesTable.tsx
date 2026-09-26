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
    <div className="filete flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-6 shadow-cartao">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, descrição, grau ou fornecedor..."
        className="w-full max-w-md rounded-xl border border-borda bg-superficie-2 px-3.5 py-2.5 text-sm text-texto placeholder:text-suave/70 focus:border-ouro focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Grau</th>
              <th>Fornecedor</th>
              <th>Qtd.</th>
              {isAdmin && <th>Custo</th>}
              <th>Preço</th>
              <th>Status</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 7} className="py-10 text-center text-suave">
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

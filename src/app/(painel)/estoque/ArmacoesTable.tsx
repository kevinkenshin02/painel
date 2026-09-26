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
    <div className="filete flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-6 shadow-cartao">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, marca/modelo, cor ou fornecedor..."
        className="w-full max-w-md rounded-xl border border-borda bg-superficie-2 px-3.5 py-2.5 text-sm text-texto placeholder:text-suave/70 focus:border-ouro focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Marca/Modelo</th>
              <th>Cor</th>
              <th>Fornecedor</th>
              <th>Qtd.</th>
              {isAdmin && <th>Custo</th>}
              <th>Preço</th>
              <th>Status</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 7} className="py-10 text-center text-suave">
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

"use client";

import { useState } from "react";
import { MARCA_RELOGIO_LABELS } from "./labels";
import { RelogioRow } from "./RelogioRow";
import type { MarcaRelogio, MecanismoRelogio, PublicoRelogio } from "@/generated/prisma/enums";

type Relogio = {
  id: number;
  codigo: string;
  marca: MarcaRelogio;
  marcaOutro: string | null;
  modeloReferencia: string;
  tipoPublico: PublicoRelogio;
  tipoMecanismo: MecanismoRelogio;
  fornecedor: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
  ativo: boolean;
};

export function RelogiosTable({
  relogios,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  relogios: Relogio[];
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? relogios.filter((r) =>
        [
          r.codigo,
          r.marca === "OUTRO" && r.marcaOutro ? r.marcaOutro : MARCA_RELOGIO_LABELS[r.marca],
          r.modeloReferencia,
          r.fornecedor,
        ]
          .join(" ")
          .toLowerCase()
          .includes(termo)
      )
    : relogios;

  return (
    <div className="filete flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-6 shadow-cartao">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, marca, modelo ou fornecedor..."
        className="w-full max-w-md rounded-xl border border-borda bg-superficie-2 px-3.5 py-2.5 text-sm text-texto placeholder:text-suave/70 focus:border-ouro focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Público</th>
              <th>Mecanismo</th>
              <th>Qtd.</th>
              <th>Preço</th>
              <th>Status</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="py-10 text-center text-suave">
                  {relogios.length === 0
                    ? "Nenhum relógio cadastrado."
                    : "Nenhum relógio encontrado para essa busca."}
                </td>
              </tr>
            )}
            {filtrados.map((r) => (
              <RelogioRow
                key={r.id}
                relogio={r}
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

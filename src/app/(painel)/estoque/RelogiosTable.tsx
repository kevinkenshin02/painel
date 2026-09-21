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
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        placeholder="Buscar por código, marca, modelo ou fornecedor..."
        className="w-full max-w-sm rounded-lg border border-[#e4dbcb] bg-white px-3 py-2 text-sm text-[#221d19]"
      />

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3.5">Código</th>
              <th className="px-5 py-3.5">Marca</th>
              <th className="px-5 py-3.5">Modelo</th>
              <th className="px-5 py-3.5">Público</th>
              <th className="px-5 py-3.5">Mecanismo</th>
              <th className="px-5 py-3.5">Qtd.</th>
              <th className="px-5 py-3.5">Preço</th>
              <th className="px-5 py-3.5">Status</th>
              {isAdmin && <th className="px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="px-5 py-8 text-center text-sm text-[#8a8078]">
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

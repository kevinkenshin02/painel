"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { editarDespesaFixa } from "./actions";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-2.5 py-1.5 text-sm text-[#221d19]";

type Despesa = {
  id: number;
  nome: string;
  valor: number;
  observacao: string | null;
  ativo: boolean;
};

export function DespesaFixaRow({
  despesa,
  alternarAtivo,
  excluir,
}: {
  despesa: Despesa;
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
}) {
  const [editando, setEditando] = useState(false);

  async function handleSalvar(formData: FormData) {
    formData.set("id", String(despesa.id));
    await editarDespesaFixa(formData);
    setEditando(false);
  }

  if (editando) {
    return (
      <tr className="border-t border-[#f3ede4] bg-[#f7f1e6]">
        <td colSpan={5} className="px-5 py-4">
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Nome</span>
              <input type="text" name="nome" required defaultValue={despesa.nome} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Valor mensal (R$)</span>
              <input
                type="number"
                name="valor"
                required
                min={0.01}
                step="0.01"
                defaultValue={despesa.valor}
                className={inputClass}
              />
            </label>
            <label className="flex flex-1 min-w-[180px] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Observação</span>
              <input
                type="text"
                name="observacao"
                defaultValue={despesa.observacao ?? ""}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-4 py-2 text-xs font-bold text-white"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-[#e4dbcb] px-4 py-2 text-xs font-semibold text-[#4a4038] hover:bg-white"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[#f3ede4]">
      <td className="px-5 py-4 font-semibold text-[#221d19]">{despesa.nome}</td>
      <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(despesa.valor)}</td>
      <td className="px-5 py-4 text-[#4a4038]">{despesa.observacao || "—"}</td>
      <td className="px-5 py-4">
        <ToggleAtivoButton id={despesa.id} ativo={despesa.ativo} action={alternarAtivo} />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
          >
            Editar
          </button>
          <ConfirmDeleteForm id={despesa.id} action={excluir} confirmMessage="Excluir esta despesa fixa?" />
        </div>
      </td>
    </tr>
  );
}

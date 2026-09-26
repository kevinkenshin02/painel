"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { editarDespesaFixa } from "./actions";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";

const inputClass =
  "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

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
      <tr className="bg-superficie-2">
        <td colSpan={5}>
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Nome</span>
              <input type="text" name="nome" required defaultValue={despesa.nome} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Valor mensal (R$)</span>
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
              <span className="font-semibold text-suave">Observação</span>
              <input
                type="text"
                name="observacao"
                defaultValue={despesa.observacao ?? ""}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="degrade-sol rounded-lg px-4 py-2 text-xs font-bold text-sobre-sol"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-borda px-4 py-2 text-xs font-semibold text-texto-2 hover:bg-superficie-3"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="destaque">{despesa.nome}</td>
      <td className="numero">{formatCurrency(despesa.valor)}</td>
      <td >{despesa.observacao || "—"}</td>
      <td>
        <ToggleAtivoButton id={despesa.id} ativo={despesa.ativo} action={alternarAtivo} />
      </td>
      <td className="direita">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
          >
            Editar
          </button>
          <ConfirmDeleteForm id={despesa.id} action={excluir} confirmMessage="Excluir esta despesa fixa?" />
        </div>
      </td>
    </tr>
  );
}

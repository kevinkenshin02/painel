"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { editarLente } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-2.5 py-1.5 text-sm text-[#221d19]";

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

export function LenteRow({
  lente,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  lente: Lente;
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [editando, setEditando] = useState(false);

  async function handleSalvar(formData: FormData) {
    formData.set("id", String(lente.id));
    await editarLente(formData);
    setEditando(false);
  }

  if (editando && isAdmin) {
    return (
      <tr className="border-t border-[#f3ede4] bg-[#f7f1e6]">
        <td colSpan={9} className="px-5 py-4">
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Código</span>
              <input type="text" name="codigo" required defaultValue={lente.codigo} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Descrição</span>
              <input
                type="text"
                name="descricao"
                required
                defaultValue={lente.descricao}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Grau</span>
              <input type="text" name="grau" required defaultValue={lente.grau} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Fornecedor</span>
              <input
                type="text"
                name="fornecedor"
                required
                defaultValue={lente.fornecedor}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Quantidade</span>
              <input
                type="number"
                name="quantidade"
                min={0}
                required
                defaultValue={lente.quantidade}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Custo unitário (R$)</span>
              <input
                type="number"
                name="custoUnitario"
                min={0}
                step="0.01"
                required
                defaultValue={lente.custoUnitario}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Preço de venda (R$)</span>
              <input
                type="number"
                name="precoVenda"
                min={0}
                step="0.01"
                required
                defaultValue={lente.precoVenda}
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
      <td className="px-5 py-4 font-semibold text-[#221d19]">{lente.codigo}</td>
      <td className="px-5 py-4 text-[#4a4038]">{lente.descricao}</td>
      <td className="px-5 py-4 text-[#4a4038]">{lente.grau}</td>
      <td className="px-5 py-4 text-[#4a4038]">{lente.fornecedor}</td>
      <td className="px-5 py-4 text-[#4a4038]">{lente.quantidade}</td>
      {isAdmin && <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(lente.custoUnitario)}</td>}
      <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(lente.precoVenda)}</td>
      <td className="px-5 py-4">
        {isAdmin ? (
          <ToggleAtivoButton id={lente.id} ativo={lente.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              lente.ativo ? "bg-[#e3f1e8] text-[#3a8f5b]" : "bg-[#f3ede4] text-[#8a8078]"
            }`}
          >
            {lente.ativo ? "Ativo" : "Inativo"}
          </span>
        )}
      </td>
      {isAdmin && (
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
            >
              Editar
            </button>
            <ConfirmDeleteForm id={lente.id} action={excluir} confirmMessage="Excluir esta lente?" />
          </div>
        </td>
      )}
    </tr>
  );
}

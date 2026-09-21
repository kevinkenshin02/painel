"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { editarArmacao } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-2.5 py-1.5 text-sm text-[#221d19]";

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

export function ArmacaoRow({
  armacao,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  armacao: Armacao;
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [editando, setEditando] = useState(false);

  async function handleSalvar(formData: FormData) {
    formData.set("id", String(armacao.id));
    await editarArmacao(formData);
    setEditando(false);
  }

  if (editando && isAdmin) {
    return (
      <tr className="border-t border-[#f3ede4] bg-[#f7f1e6]">
        <td colSpan={9} className="px-5 py-4">
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <span className="text-sm font-semibold text-[#221d19]">
              {armacao.codigo} — {armacao.marcaModelo}
            </span>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Quantidade</span>
              <input
                type="number"
                name="quantidade"
                min={0}
                required
                defaultValue={armacao.quantidade}
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
                defaultValue={armacao.custoUnitario}
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
                defaultValue={armacao.precoVenda}
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
      <td className="px-5 py-4 font-semibold text-[#221d19]">{armacao.codigo}</td>
      <td className="px-5 py-4 text-[#4a4038]">{armacao.marcaModelo}</td>
      <td className="px-5 py-4 text-[#4a4038]">{armacao.corReferencia}</td>
      <td className="px-5 py-4 text-[#4a4038]">{armacao.fornecedor}</td>
      <td className="px-5 py-4 text-[#4a4038]">{armacao.quantidade}</td>
      {isAdmin && <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(armacao.custoUnitario)}</td>}
      <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(armacao.precoVenda)}</td>
      <td className="px-5 py-4">
        {isAdmin ? (
          <ToggleAtivoButton id={armacao.id} ativo={armacao.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              armacao.ativo ? "bg-[#e3f1e8] text-[#3a8f5b]" : "bg-[#f3ede4] text-[#8a8078]"
            }`}
          >
            {armacao.ativo ? "Ativo" : "Inativo"}
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
            <ConfirmDeleteForm id={armacao.id} action={excluir} confirmMessage="Excluir esta armação?" />
          </div>
        </td>
      )}
    </tr>
  );
}

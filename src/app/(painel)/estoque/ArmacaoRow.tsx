"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { semEstoque } from "@/lib/estoque";
import { editarArmacao } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";

const inputClass =
  "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

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
      <tr className="bg-superficie-2">
        <td colSpan={9} >
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <span className="text-sm font-semibold text-texto">
              {armacao.codigo} — {armacao.marcaModelo}
            </span>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Quantidade</span>
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
              <span className="font-semibold text-suave">Custo unitário (R$)</span>
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
              <span className="font-semibold text-suave">Preço de venda (R$)</span>
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
      <td className="destaque whitespace-nowrap">{armacao.codigo}</td>
      <td>{armacao.marcaModelo}</td>
      <td>{armacao.corReferencia}</td>
      <td>{armacao.fornecedor}</td>
      <td className="numero">
        <span className={semEstoque(armacao) ? "font-bold text-perigo" : "text-texto"}>{armacao.quantidade}</span>
        {semEstoque(armacao) && <span className="ml-1.5 rounded-full bg-perigo-fundo px-1.5 py-px text-[10px] font-bold text-perigo uppercase">zerado</span>}
      </td>
      {isAdmin && <td className="numero">{formatCurrency(armacao.custoUnitario)}</td>}
      <td className="numero">{formatCurrency(armacao.precoVenda)}</td>
      <td>
        {isAdmin ? (
          <ToggleAtivoButton id={armacao.id} ativo={armacao.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              armacao.ativo ? "bg-sucesso-fundo text-sucesso" : "bg-superficie-3 text-suave"
            }`}
          >
            {armacao.ativo ? "Ativo" : "Inativo"}
          </span>
        )}
      </td>
      {isAdmin && (
        <td className="direita">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
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

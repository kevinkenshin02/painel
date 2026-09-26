"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { semEstoque } from "@/lib/estoque";
import { editarLente } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";

const inputClass =
  "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

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
      <tr className="bg-superficie-2">
        <td colSpan={9} >
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Código</span>
              <input type="text" name="codigo" required defaultValue={lente.codigo} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Descrição</span>
              <input
                type="text"
                name="descricao"
                required
                defaultValue={lente.descricao}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Grau</span>
              <input type="text" name="grau" required defaultValue={lente.grau} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Fornecedor</span>
              <input
                type="text"
                name="fornecedor"
                required
                defaultValue={lente.fornecedor}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Quantidade</span>
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
              <span className="font-semibold text-suave">Custo unitário (R$)</span>
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
              <span className="font-semibold text-suave">Preço de venda (R$)</span>
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
      <td className="destaque whitespace-nowrap">{lente.codigo}</td>
      <td>{lente.descricao}</td>
      <td>{lente.grau}</td>
      <td>{lente.fornecedor}</td>
      <td className="numero">
        <span className={semEstoque(lente) ? "font-bold text-perigo" : "text-texto"}>{lente.quantidade}</span>
        {semEstoque(lente) && <span className="ml-1.5 rounded-full bg-perigo-fundo px-1.5 py-px text-[10px] font-bold text-perigo uppercase">zerado</span>}
      </td>
      {isAdmin && <td className="numero">{formatCurrency(lente.custoUnitario)}</td>}
      <td className="numero">{formatCurrency(lente.precoVenda)}</td>
      <td>
        {isAdmin ? (
          <ToggleAtivoButton id={lente.id} ativo={lente.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              lente.ativo ? "bg-sucesso-fundo text-sucesso" : "bg-superficie-3 text-suave"
            }`}
          >
            {lente.ativo ? "Ativo" : "Inativo"}
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
            <ConfirmDeleteForm id={lente.id} action={excluir} confirmMessage="Excluir esta lente?" />
          </div>
        </td>
      )}
    </tr>
  );
}

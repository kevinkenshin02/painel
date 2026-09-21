"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { editarRelogio } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { MARCA_RELOGIO_LABELS, MECANISMO_RELOGIO_LABELS, PUBLICO_RELOGIO_LABELS } from "./labels";
import type { MarcaRelogio, MecanismoRelogio, PublicoRelogio } from "@/generated/prisma/enums";

const MARCAS_RELOGIO = Object.keys(MARCA_RELOGIO_LABELS) as MarcaRelogio[];
const PUBLICOS_RELOGIO = Object.keys(PUBLICO_RELOGIO_LABELS) as PublicoRelogio[];
const MECANISMOS_RELOGIO = Object.keys(MECANISMO_RELOGIO_LABELS) as MecanismoRelogio[];

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-2.5 py-1.5 text-sm text-[#221d19]";

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

export function RelogioRow({
  relogio,
  alternarAtivo,
  excluir,
  isAdmin,
}: {
  relogio: Relogio;
  alternarAtivo: (formData: FormData) => void;
  excluir: (formData: FormData) => void;
  isAdmin: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [marcaEdicao, setMarcaEdicao] = useState<MarcaRelogio>(relogio.marca);
  const nomeMarca =
    relogio.marca === "OUTRO" && relogio.marcaOutro ? relogio.marcaOutro : MARCA_RELOGIO_LABELS[relogio.marca];

  async function handleSalvar(formData: FormData) {
    formData.set("id", String(relogio.id));
    await editarRelogio(formData);
    setEditando(false);
  }

  if (editando && isAdmin) {
    return (
      <tr className="border-t border-[#f3ede4] bg-[#f7f1e6]">
        <td colSpan={9} className="px-5 py-4">
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Código</span>
              <input
                type="text"
                name="codigo"
                required
                defaultValue={relogio.codigo}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Marca</span>
              <select
                name="marca"
                value={marcaEdicao}
                onChange={(e) => setMarcaEdicao(e.target.value as MarcaRelogio)}
                className={inputClass}
              >
                {MARCAS_RELOGIO.map((m) => (
                  <option key={m} value={m}>
                    {MARCA_RELOGIO_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            {marcaEdicao === "OUTRO" && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-semibold text-[#8a8078]">Qual marca?</span>
                <input
                  type="text"
                  name="marcaOutro"
                  defaultValue={relogio.marcaOutro ?? ""}
                  className={inputClass}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Modelo / referência</span>
              <input
                type="text"
                name="modeloReferencia"
                required
                defaultValue={relogio.modeloReferencia}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Público</span>
              <select name="tipoPublico" defaultValue={relogio.tipoPublico} className={inputClass}>
                {PUBLICOS_RELOGIO.map((p) => (
                  <option key={p} value={p}>
                    {PUBLICO_RELOGIO_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Mecanismo</span>
              <select name="tipoMecanismo" defaultValue={relogio.tipoMecanismo} className={inputClass}>
                {MECANISMOS_RELOGIO.map((m) => (
                  <option key={m} value={m}>
                    {MECANISMO_RELOGIO_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[#8a8078]">Fornecedor</span>
              <input
                type="text"
                name="fornecedor"
                required
                defaultValue={relogio.fornecedor}
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
                defaultValue={relogio.quantidade}
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
                defaultValue={relogio.custoUnitario}
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
                defaultValue={relogio.precoVenda}
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
      <td className="px-5 py-4 font-semibold text-[#221d19]">{relogio.codigo}</td>
      <td className="px-5 py-4 text-[#4a4038]">{nomeMarca}</td>
      <td className="px-5 py-4 text-[#4a4038]">{relogio.modeloReferencia}</td>
      <td className="px-5 py-4 text-[#4a4038]">{PUBLICO_RELOGIO_LABELS[relogio.tipoPublico]}</td>
      <td className="px-5 py-4 text-[#4a4038]">{MECANISMO_RELOGIO_LABELS[relogio.tipoMecanismo]}</td>
      <td className="px-5 py-4 text-[#4a4038]">{relogio.quantidade}</td>
      <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(relogio.precoVenda)}</td>
      <td className="px-5 py-4">
        {isAdmin ? (
          <ToggleAtivoButton id={relogio.id} ativo={relogio.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              relogio.ativo ? "bg-[#e3f1e8] text-[#3a8f5b]" : "bg-[#f3ede4] text-[#8a8078]"
            }`}
          >
            {relogio.ativo ? "Ativo" : "Inativo"}
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
            <ConfirmDeleteForm id={relogio.id} action={excluir} confirmMessage="Excluir este relógio?" />
          </div>
        </td>
      )}
    </tr>
  );
}

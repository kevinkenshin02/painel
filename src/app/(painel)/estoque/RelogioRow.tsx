"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { semEstoque } from "@/lib/estoque";
import { editarRelogio } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { MARCA_RELOGIO_LABELS, MECANISMO_RELOGIO_LABELS, PUBLICO_RELOGIO_LABELS } from "./labels";
import type { MarcaRelogio, MecanismoRelogio, PublicoRelogio } from "@/generated/prisma/enums";

const MARCAS_RELOGIO = Object.keys(MARCA_RELOGIO_LABELS) as MarcaRelogio[];
const PUBLICOS_RELOGIO = Object.keys(PUBLICO_RELOGIO_LABELS) as PublicoRelogio[];
const MECANISMOS_RELOGIO = Object.keys(MECANISMO_RELOGIO_LABELS) as MecanismoRelogio[];

const inputClass =
  "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

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
      <tr className="bg-superficie-2">
        <td colSpan={9} >
          <form action={handleSalvar} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Código</span>
              <input
                type="text"
                name="codigo"
                required
                defaultValue={relogio.codigo}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Marca</span>
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
                <span className="font-semibold text-suave">Qual marca?</span>
                <input
                  type="text"
                  name="marcaOutro"
                  defaultValue={relogio.marcaOutro ?? ""}
                  className={inputClass}
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Modelo / referência</span>
              <input
                type="text"
                name="modeloReferencia"
                required
                defaultValue={relogio.modeloReferencia}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Público</span>
              <select name="tipoPublico" defaultValue={relogio.tipoPublico} className={inputClass}>
                {PUBLICOS_RELOGIO.map((p) => (
                  <option key={p} value={p}>
                    {PUBLICO_RELOGIO_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Mecanismo</span>
              <select name="tipoMecanismo" defaultValue={relogio.tipoMecanismo} className={inputClass}>
                {MECANISMOS_RELOGIO.map((m) => (
                  <option key={m} value={m}>
                    {MECANISMO_RELOGIO_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-suave">Fornecedor</span>
              <input
                type="text"
                name="fornecedor"
                required
                defaultValue={relogio.fornecedor}
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
                defaultValue={relogio.quantidade}
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
                defaultValue={relogio.custoUnitario}
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
                defaultValue={relogio.precoVenda}
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
      <td className="destaque whitespace-nowrap">{relogio.codigo}</td>
      <td>{nomeMarca}</td>
      <td>{relogio.modeloReferencia}</td>
      <td>{PUBLICO_RELOGIO_LABELS[relogio.tipoPublico]}</td>
      <td>{MECANISMO_RELOGIO_LABELS[relogio.tipoMecanismo]}</td>
      <td className="numero">
        <span className={semEstoque(relogio) ? "font-bold text-perigo" : "text-texto"}>{relogio.quantidade}</span>
        {semEstoque(relogio) && <span className="ml-1.5 rounded-full bg-perigo-fundo px-1.5 py-px text-[10px] font-bold text-perigo uppercase">zerado</span>}
      </td>
      <td className="numero">{formatCurrency(relogio.precoVenda)}</td>
      <td>
        {isAdmin ? (
          <ToggleAtivoButton id={relogio.id} ativo={relogio.ativo} action={alternarAtivo} />
        ) : (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              relogio.ativo ? "bg-sucesso-fundo text-sucesso" : "bg-superficie-3 text-suave"
            }`}
          >
            {relogio.ativo ? "Ativo" : "Inativo"}
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
            <ConfirmDeleteForm id={relogio.id} action={excluir} confirmMessage="Excluir este relógio?" />
          </div>
        </td>
      )}
    </tr>
  );
}

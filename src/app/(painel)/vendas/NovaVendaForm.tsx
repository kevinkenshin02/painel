"use client";

import { useRef, useState } from "react";
import {
  CANAL_ORIGEM_LABELS,
  CATEGORIA_VENDA_LABELS,
  FORMA_PAGAMENTO_LABELS,
} from "./labels";
import { MARCA_RELOGIO_LABELS } from "../estoque/labels";
import type { MarcaRelogio } from "@/generated/prisma/enums";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

type ArmacaoOpcao = {
  id: number;
  codigo: string;
  marcaModelo: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

type RelogioOpcao = {
  id: number;
  codigo: string;
  marca: MarcaRelogio;
  marcaOutro: string | null;
  modeloReferencia: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

type LenteOpcao = {
  id: number;
  codigo: string;
  descricao: string;
  grau: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

export function NovaVendaForm({
  action,
  hoje,
  armacoes,
  relogios,
  lentes,
  isAdmin,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hoje: string;
  armacoes: ArmacaoOpcao[];
  relogios: RelogioOpcao[];
  lentes: LenteOpcao[];
  isAdmin: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  const descricaoRef = useRef<HTMLInputElement>(null);
  const custoTotalRef = useRef<HTMLInputElement>(null);
  const valorVendidoRef = useRef<HTMLInputElement>(null);
  const quantidadeRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);

  function handleItemChange(value: string) {
    if (!value) return;
    const [tipo, idStr] = value.split(":");
    const id = Number(idStr);
    const qtd = Number(quantidadeRef.current?.value) || 1;

    if (tipo === "A") {
      const item = armacoes.find((a) => a.id === id);
      if (!item) return;
      if (descricaoRef.current) descricaoRef.current.value = `${item.marcaModelo} (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "SO_ARMACAO";
    } else if (tipo === "R") {
      const item = relogios.find((r) => r.id === id);
      if (!item) return;
      const nomeMarca = item.marca === "OUTRO" && item.marcaOutro ? item.marcaOutro : MARCA_RELOGIO_LABELS[item.marca];
      if (descricaoRef.current) descricaoRef.current.value = `${nomeMarca} ${item.modeloReferencia} (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "RELOGIO";
    } else if (tipo === "L") {
      const item = lentes.find((l) => l.id === id);
      if (!item) return;
      if (descricaoRef.current) descricaoRef.current.value = `${item.descricao} (${item.grau}) (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "SO_LENTE";
    }
  }

  async function handleAction(formData: FormData) {
    await action(formData);
    setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={handleAction} className="flex flex-col gap-4 px-6 pt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-4">
          <span className="text-xs font-semibold text-[#8a8078]">
            Vincular a um item do estoque (opcional)
          </span>
          <select
            name="itemEstoque"
            defaultValue=""
            onChange={(event) => handleItemChange(event.target.value)}
            className={inputClass}
            autoFocus
          >
            <option value="">Nenhum — descrição livre</option>
            {armacoes.length > 0 && (
              <optgroup label="Armações">
                {armacoes.map((a) => (
                  <option key={`A:${a.id}`} value={`A:${a.id}`}>
                    {a.codigo} — {a.marcaModelo} (estoque: {a.quantidade})
                  </option>
                ))}
              </optgroup>
            )}
            {relogios.length > 0 && (
              <optgroup label="Relógios">
                {relogios.map((r) => (
                  <option key={`R:${r.id}`} value={`R:${r.id}`}>
                    {r.codigo} — {r.marca === "OUTRO" && r.marcaOutro ? r.marcaOutro : MARCA_RELOGIO_LABELS[r.marca]}{" "}
                    {r.modeloReferencia} (estoque: {r.quantidade})
                  </option>
                ))}
              </optgroup>
            )}
            {lentes.length > 0 && (
              <optgroup label="Lentes prontas">
                {lentes.map((l) => (
                  <option key={`L:${l.id}`} value={`L:${l.id}`}>
                    {l.codigo} — {l.descricao} ({l.grau}) (estoque: {l.quantidade})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <span className="text-xs text-[#8a8078]">
            Selecionar um item preenche a descrição e os valores automaticamente.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-xs font-semibold text-[#8a8078]">Descrição</span>
          <input ref={descricaoRef} type="text" name="descricao" required className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">Categoria</span>
          <select
            ref={categoriaRef}
            name="categoria"
            required
            defaultValue="OCULOS_COMPLETO"
            className={inputClass}
          >
            {Object.entries(CATEGORIA_VENDA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">Valor vendido (R$)</span>
          <input
            ref={valorVendidoRef}
            type="number"
            name="valorVendido"
            required
            min={0}
            step="0.01"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-2">
          <span className="text-xs font-semibold text-[#8a8078]">Forma de pagamento</span>
          <select name="formaPagamento" required defaultValue="DINHEIRO" className={inputClass}>
            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="rounded-lg border border-[#e4dbcb] bg-[#faf7f2] open:pb-4">
        <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-[#8a8078] select-none">
          + Mais detalhes (cliente, data, quantidade, canal de origem...)
        </summary>
        <div className="grid grid-cols-1 gap-4 px-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Data da venda</span>
            <input type="date" name="dataVenda" required defaultValue={hoje} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Cliente (opcional)</span>
            <input type="text" name="clienteNome" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Quantidade</span>
            <input
              ref={quantidadeRef}
              type="number"
              name="quantidade"
              min={1}
              defaultValue={1}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Canal de origem</span>
            <select name="canalOrigem" required defaultValue="GOOGLE_MAPS" className={inputClass}>
              {Object.entries(CANAL_ORIGEM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {isAdmin && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Custo total (R$)</span>
              <input
                ref={custoTotalRef}
                type="number"
                name="custoTotal"
                min={0}
                step="0.01"
                defaultValue={0}
                className={inputClass}
              />
            </label>
          )}
        </div>
      </details>

      {!isAdmin && <input ref={custoTotalRef} type="hidden" name="custoTotal" defaultValue={0} />}

      <div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-8 py-3 text-sm font-bold text-white"
        >
          Registrar venda
        </button>
        <p className="mt-2 text-xs text-[#8a8078]">
          Se a forma de pagamento for cartão de crédito ou débito, a cobrança é enviada
          automaticamente para a Point Smart 2 assim que a venda for registrada.
        </p>
      </div>
    </form>
  );
}

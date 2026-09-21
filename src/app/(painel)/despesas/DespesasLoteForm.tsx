"use client";

import { useState } from "react";

const ROWS_INICIAIS = 4;
const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

function linhasVazias(qtd: number, startId: number) {
  return Array.from({ length: qtd }, (_, i) => ({ id: startId + i }));
}

export function DespesasLoteForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [linhas, setLinhas] = useState(() => linhasVazias(ROWS_INICIAIS, 0));
  const [nextId, setNextId] = useState(ROWS_INICIAIS);
  const [formKey, setFormKey] = useState(0);

  function adicionarLinha() {
    setLinhas((prev) => [...prev, { id: nextId }]);
    setNextId((n) => n + 1);
  }

  function removerLinha(id: number) {
    setLinhas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  async function handleAction(formData: FormData) {
    await action(formData);
    setLinhas(linhasVazias(ROWS_INICIAIS, nextId));
    setNextId((n) => n + ROWS_INICIAIS);
    setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={handleAction} className="flex flex-col gap-4 px-6 pt-2">
      <div className="flex flex-col gap-3">
        {linhas.map((linha, index) => (
          <div key={linha.id} className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-sm">
              {index === 0 && (
                <span className="text-xs font-semibold text-[#8a8078]">Nome da despesa</span>
              )}
              <input type="text" name="nome[]" placeholder="Ex: Aluguel" className={inputClass} />
            </label>
            <label className="flex w-44 flex-col gap-1.5 text-sm">
              {index === 0 && (
                <span className="text-xs font-semibold text-[#8a8078]">Valor mensal (R$)</span>
              )}
              <input type="number" name="valor[]" min={0} step="0.01" placeholder="0,00" className={inputClass} />
            </label>
            <button
              type="button"
              onClick={() => removerLinha(linha.id)}
              disabled={linhas.length === 1}
              className="mb-0.5 rounded-md px-2 py-2.5 text-xs font-semibold text-[#8a8078] hover:text-[#c0472b] disabled:opacity-40"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={adicionarLinha}
          className="rounded-lg border border-[#e4dbcb] px-4 py-2.5 text-sm font-semibold text-[#221d19] hover:bg-[#f7f1e6]"
        >
          + Adicionar linha
        </button>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
        >
          Salvar despesas
        </button>
      </div>
      <p className="text-xs text-[#8a8078]">
        Preencha quantas linhas quiser — linhas em branco são ignoradas. Cada uma fica ativa e
        entra na conta todo mês.
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { PinPad } from "./PinPad";
import { CriarFuncionarioForm } from "./CriarFuncionarioForm";

type Funcionario = {
  id: number;
  nome: string;
};

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return primeiras.join("") || "?";
}

export function PerfilPicker({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [selecionado, setSelecionado] = useState<Funcionario | null>(null);
  const [criando, setCriando] = useState(false);

  if (criando) {
    return <CriarFuncionarioForm onVoltar={() => setCriando(false)} />;
  }

  if (selecionado) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f6b23b] to-[#e0472e] text-lg font-bold text-white">
            {iniciais(selecionado.nome)}
          </div>
          <span className="text-sm font-semibold text-[#221d19]">{selecionado.nome}</span>
        </div>
        <PinPad funcionarioId={selecionado.id} />
        <button
          type="button"
          onClick={() => setSelecionado(null)}
          className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
        >
          Não é você? Trocar de perfil
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {funcionarios.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelecionado(f)}
            className="flex flex-col items-center gap-2 rounded-xl border border-[#e4dbcb] bg-white p-4 hover:border-[#f6b23b] hover:bg-[#fdf0d5]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f6b23b] to-[#e0472e] text-base font-bold text-white">
              {iniciais(f.nome)}
            </div>
            <span className="truncate text-sm font-semibold text-[#221d19]">{f.nome}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#e4dbcb] bg-white p-4 hover:border-[#f6b23b] hover:bg-[#fdf0d5]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#c9bfae] text-xl font-bold text-[#8a8078]">
            +
          </div>
          <span className="truncate text-sm font-semibold text-[#8a8078]">Novo funcionário</span>
        </button>
      </div>
    </div>
  );
}

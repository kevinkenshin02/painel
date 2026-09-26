"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="degrade-sol flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-sobre-sol">
            {iniciais(selecionado.nome)}
          </div>
          <div className="text-left">
            <div className="text-base font-semibold text-texto">{selecionado.nome}</div>
            <button
              type="button"
              onClick={() => setSelecionado(null)}
              className="text-xs font-semibold text-suave hover:text-ouro hover:underline"
            >
              Não é você? Trocar de perfil
            </button>
          </div>
        </div>
        <PinPad funcionarioId={selecionado.id} />
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {funcionarios.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setSelecionado(f)}
          className="group flex flex-col items-center gap-2.5 rounded-2xl border border-borda bg-superficie-2 p-4 transition hover:-translate-y-0.5 hover:border-borda-forte hover:bg-superficie-3"
        >
          <div className="degrade-sol flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-sobre-sol">
            {iniciais(f.nome)}
          </div>
          <span className="w-full truncate text-sm font-semibold text-texto">{f.nome}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setCriando(true)}
        className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-borda-forte p-4 text-suave transition hover:bg-superficie-2 hover:text-texto"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-borda-forte">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>
        <span className="w-full truncate text-sm font-semibold" title="Novo funcionário">
          Adicionar
        </span>
      </button>
    </div>
  );
}

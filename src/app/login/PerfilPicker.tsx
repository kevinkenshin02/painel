"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { PinPad } from "./PinPad";
import { CriarFuncionarioForm } from "./CriarFuncionarioForm";
import { AlturaSuave } from "@/components/AlturaSuave";

type Funcionario = {
  id: number;
  nome: string;
};

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return primeiras.join("") || "?";
}

// cada tela entra subindo 8px e aparecendo; o cartão em volta cresce junto (AlturaSuave)
const ENTRADA =
  "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none";

export function PerfilPicker({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [selecionado, setSelecionado] = useState<Funcionario | null>(null);
  const [criando, setCriando] = useState(false);

  const tela = criando ? "criar" : selecionado ? `pin-${selecionado.id}` : "perfis";
  return (
    <AlturaSuave>
      <div key={tela} className={ENTRADA}>
        {criando ? (
          <CriarFuncionarioForm onVoltar={() => setCriando(false)} />
        ) : selecionado ? (
          <TelaPin funcionario={selecionado} onTrocar={() => setSelecionado(null)} />
        ) : (
          <Perfis funcionarios={funcionarios} onEscolher={setSelecionado} onCriar={() => setCriando(true)} />
        )}
      </div>
    </AlturaSuave>
  );
}

function TelaPin({ funcionario, onTrocar }: { funcionario: Funcionario; onTrocar: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <div className="degrade-sol flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-sobre-sol">
          {iniciais(funcionario.nome)}
        </div>
        <div className="text-left">
          <div className="text-base font-semibold text-texto">{funcionario.nome}</div>
          <button type="button" onClick={onTrocar} className="text-xs font-semibold text-suave hover:text-ouro hover:underline">
            Não é você? Trocar de perfil
          </button>
        </div>
      </div>
      <PinPad funcionarioId={funcionario.id} />
    </div>
  );
}

function Perfis({
  funcionarios,
  onEscolher,
  onCriar,
}: {
  funcionarios: Funcionario[];
  onEscolher: (f: Funcionario) => void;
  onCriar: () => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
      {funcionarios.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onEscolher(f)}
          className="liquido-botao group flex flex-col items-center gap-2 rounded-[20px] px-2 py-3.5"
        >
          <div className="degrade-sol flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-sobre-sol shadow-[0_6px_16px_-6px_rgba(224,57,47,0.6)]">
            {iniciais(f.nome)}
          </div>
          <span className="w-full truncate text-[13px] font-semibold text-texto">{f.nome}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onCriar}
        className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-white/20 px-2 py-3.5 text-suave transition-[transform,background-color,color] duration-150 ease-out hover:bg-white/5 hover:text-texto active:scale-95"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/20">
          <UserPlus className="h-5 w-5" aria-hidden />
        </div>
        <span className="w-full truncate text-[13px] font-semibold" title="Novo funcionário">
          Adicionar
        </span>
      </button>
    </div>
  );
}

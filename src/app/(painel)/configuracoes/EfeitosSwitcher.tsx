"use client";

import { useState, useSyncExternalStore } from "react";
import { Gauge, Sparkles, Wand2 } from "lucide-react";
import { cx } from "@/components/ui/cx";

type Escolha = "auto" | "completo" | "leve";

const semInscricao = () => () => {};

function aparelhoFraco() {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (n.hardwareConcurrency || 8) <= 4 || (n.deviceMemory || 8) <= 4 || !!n.connection?.saveData;
}

function escolhaSalva(): Escolha {
  try {
    const v = localStorage.getItem("efeitos");
    return v === "leve" || v === "completo" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function EfeitosSwitcher() {
  // o script do <head> já aplicou a escolha; aqui só lemos o que está salvo
  const salva = useSyncExternalStore(semInscricao, escolhaSalva, () => "auto" as Escolha);
  const fraco = useSyncExternalStore(semInscricao, aparelhoFraco, () => false);
  const [escolhido, setEscolhido] = useState<Escolha | null>(null);
  const escolha = escolhido ?? salva;

  function aplicar(nova: Escolha) {
    setEscolhido(nova);
    try {
      if (nova === "auto") localStorage.removeItem("efeitos");
      else localStorage.setItem("efeitos", nova);
    } catch {
      // sem localStorage a escolha só não fica guardada
    }
    const leve = nova === "leve" || (nova === "auto" && fraco);
    if (leve) document.documentElement.setAttribute("data-leve", "");
    else document.documentElement.removeAttribute("data-leve");
  }

  const opcoes = [
    {
      valor: "auto" as const,
      rotulo: "Automático",
      detalhe: fraco ? "Este aparelho parece mais fraco: está usando o leve" : "Este aparelho aguenta: está usando o completo",
      Icone: Wand2,
    },
    { valor: "completo" as const, rotulo: "Completo", detalhe: "Vidro, transições e animações", Icone: Sparkles },
    { valor: "leve" as const, rotulo: "Leve", detalhe: "Sem vidro nem transições: mais rápido", Icone: Gauge },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {opcoes.map(({ valor, rotulo, detalhe, Icone }) => (
        <button
          key={valor}
          type="button"
          onClick={() => aplicar(valor)}
          aria-pressed={escolha === valor}
          className={cx(
            "flex flex-col gap-1 rounded-xl border p-4 text-left transition active:scale-[0.98]",
            escolha === valor ? "border-ouro bg-ouro/10" : "border-borda bg-superficie-2 hover:border-borda-forte"
          )}
        >
          <div className="flex items-center gap-1.5 text-sm font-semibold text-texto">
            <Icone className="h-4 w-4 text-ouro" aria-hidden />
            {rotulo}
          </div>
          <div className="text-xs text-suave">{detalhe}</div>
        </button>
      ))}
    </div>
  );
}

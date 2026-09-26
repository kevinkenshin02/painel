"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cx } from "@/components/ui/cx";

type Tema = "dark" | "light";

const semInscricao = () => () => {};
const temaDoDocumento = (): Tema => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

export function ThemeSwitcher() {
  // O tema salvo já foi aplicado no <html> antes da página aparecer; aqui só lemos de lá.
  const temaInicial = useSyncExternalStore(semInscricao, temaDoDocumento, () => "dark" as Tema);
  const [escolhido, setEscolhido] = useState<Tema | null>(null);
  const tema = escolhido ?? temaInicial;

  function aplicar(novo: Tema) {
    setEscolhido(novo);
    if (novo === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível — o tema só não persiste entre sessões.
    }
  }

  const opcoes = [
    { valor: "dark" as const, rotulo: "Escuro", detalhe: "O visual do site (padrão)", Icone: Moon, amostra: ["#0d0c0b", "#15120f", "#e0a63d"] },
    { valor: "light" as const, rotulo: "Claro", detalhe: "Fundo creme, bom com muita luz", Icone: Sun, amostra: ["#f4eee4", "#fffdf9", "#a0701b"] },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {opcoes.map(({ valor, rotulo, detalhe, Icone, amostra }) => (
        <button
          key={valor}
          type="button"
          onClick={() => aplicar(valor)}
          aria-pressed={tema === valor}
          className={cx(
            "flex items-center gap-4 rounded-xl border p-4 text-left transition",
            tema === valor ? "border-ouro bg-ouro/10" : "border-borda bg-superficie-2 hover:border-borda-forte"
          )}
        >
          <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-borda">
            {amostra.map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-texto">
              <Icone className="h-4 w-4 text-ouro" aria-hidden />
              {rotulo}
            </div>
            <div className="text-xs text-suave">{detalhe}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

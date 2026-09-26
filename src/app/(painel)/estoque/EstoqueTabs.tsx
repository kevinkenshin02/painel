"use client";

import { useState, type ReactNode } from "react";
import { Glasses, Eye, Watch } from "lucide-react";
import { cx } from "@/components/ui/cx";

type Aba = "armacoes" | "relogios" | "lentes";

export function EstoqueTabs({
  inicial = "relogios",
  contagem,
  armacoes,
  relogios,
  lentes,
}: {
  inicial?: Aba;
  contagem: Record<Aba, number>;
  armacoes: ReactNode;
  relogios: ReactNode;
  lentes: ReactNode;
}) {
  const [tab, setTab] = useState<Aba>(inicial);

  const abas = [
    { id: "relogios" as const, label: "Relógios", Icone: Watch },
    { id: "armacoes" as const, label: "Armações", Icone: Glasses },
    { id: "lentes" as const, label: "Lentes prontas", Icone: Eye },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex flex-wrap gap-2 rounded-2xl border border-borda bg-superficie p-2 shadow-cartao">
        {abas.map(({ id, label, Icone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === id ? "degrade-sol text-sobre-sol" : "text-texto-2 hover:bg-superficie-2 hover:text-texto"
            )}
          >
            <Icone className="h-4 w-4" aria-hidden />
            {label}
            <span
              className={cx(
                "numero rounded-full px-2 py-px text-[11px] font-bold",
                tab === id ? "bg-black/15" : "bg-superficie-3 text-suave"
              )}
            >
              {contagem[id]}
            </span>
          </button>
        ))}
      </div>

      <div className={tab === "relogios" ? "block" : "hidden"}>{relogios}</div>
      <div className={tab === "armacoes" ? "block" : "hidden"}>{armacoes}</div>
      <div className={tab === "lentes" ? "block" : "hidden"}>{lentes}</div>
    </div>
  );
}

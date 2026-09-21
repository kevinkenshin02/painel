"use client";

import { useState, type ReactNode } from "react";

export function EstoqueTabs({
  armacoes,
  relogios,
  lentes,
}: {
  armacoes: ReactNode;
  relogios: ReactNode;
  lentes: ReactNode;
}) {
  const [tab, setTab] = useState<"armacoes" | "relogios" | "lentes">("armacoes");

  const abas = [
    { id: "armacoes" as const, label: "Armações" },
    { id: "relogios" as const, label: "Relógios" },
    { id: "lentes" as const, label: "Lentes prontas" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setTab(aba.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === aba.id
                ? "bg-gradient-to-br from-[#f6b23b] to-[#e0472e] text-white"
                : "border border-[#eee3d3] bg-white text-[#4a4038]"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <div className={tab === "armacoes" ? "block" : "hidden"}>{armacoes}</div>
      <div className={tab === "relogios" ? "block" : "hidden"}>{relogios}</div>
      <div className={tab === "lentes" ? "block" : "hidden"}>{lentes}</div>
    </div>
  );
}

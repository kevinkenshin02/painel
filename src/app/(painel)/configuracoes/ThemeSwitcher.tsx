"use client";

import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const atual = document.documentElement.getAttribute("data-theme");
    setTema(atual === "dark" ? "dark" : "light");
  }, []);

  function aplicar(novo: "light" | "dark") {
    setTema(novo);
    document.documentElement.setAttribute("data-theme", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      // localStorage indisponível — o tema só não persiste entre sessões.
    }
  }

  const opcoes: { valor: "light" | "dark"; label: string; emoji: string }[] = [
    { valor: "light", label: "Claro", emoji: "☀️" },
    { valor: "dark", label: "Escuro", emoji: "🌙" },
  ];

  return (
    <div className="flex gap-3">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => aplicar(opcao.valor)}
          className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
            tema === opcao.valor
              ? "border-[#f6b23b] bg-[#fdf0d5] text-[#221d19]"
              : "border-[#e4dbcb] text-[#4a4038] hover:bg-[#f7f1e6]"
          }`}
        >
          {opcao.emoji} {opcao.label}
        </button>
      ))}
    </div>
  );
}

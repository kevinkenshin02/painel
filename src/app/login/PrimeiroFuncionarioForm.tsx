"use client";

import { useState, useTransition } from "react";
import { criarPrimeiroFuncionario } from "./actions";

export function PrimeiroFuncionarioForm() {
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await criarPrimeiroFuncionario(nome, pin);
      if (resultado?.erro) {
        setErro(resultado.erro);
      } else {
        window.location.href = "/";
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-[#8a8078]">Seu nome</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-[#8a8078]">Crie um PIN (4 números)</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          required
          className="rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19] tracking-[0.3em]"
        />
      </label>
      {erro && <p className="text-sm font-medium text-[#c0472b]">{erro}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Criando..." : "Criar e entrar"}
      </button>
    </form>
  );
}

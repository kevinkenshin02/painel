"use client";

import { useState, useTransition } from "react";
import { criarPrimeiroFuncionario } from "./actions";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";

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
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Campo rotulo="Seu nome">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className={classeCampo} />
      </Campo>
      <Campo rotulo="Crie um PIN (4 a 6 números)">
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          required
          className={`${classeCampo} tracking-[0.3em]`}
        />
      </Campo>
      {erro && <Aviso tom="perigo">{erro}</Aviso>}
      <Botao type="submit" variante="primario" tamanho="lg" disabled={isPending}>
        {isPending ? "Criando..." : "Criar e entrar"}
      </Botao>
    </form>
  );
}

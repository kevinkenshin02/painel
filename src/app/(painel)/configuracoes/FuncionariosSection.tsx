"use client";

import { useActionState, useState, useEffect } from "react";
import { criarFuncionario, alternarAtivoFuncionario } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

type Funcionario = {
  id: number;
  nome: string;
  ativo: boolean;
};

const ESTADO_INICIAL: { erro?: string; ok?: boolean; nomeAdicionado?: string } = {};

export function FuncionariosSection({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [estado, formAction, isPending] = useActionState(criarFuncionario, ESTADO_INICIAL);
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");

  // Campos são controlados de propósito: um <form action> descontrolado é
  // limpo pelo React assim que a submissão termina, mesmo quando a ação
  // retorna um erro (ex: PIN repetido) — obrigando a pessoa a redigitar
  // tudo de novo sem entender por quê. Só limpamos manualmente no sucesso.
  useEffect(() => {
    if (estado.ok) {
      setNome("");
      setPin("");
    }
  }, [estado]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">Nome</span>
          <input
            type="text"
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">PIN (4 a 6 números)</span>
          <input
            type="text"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            required
            pattern="\d{4,6}"
            title="4 a 6 números"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} tracking-[0.3em]`}
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Criando..." : "Adicionar funcionário"}
        </button>
      </form>
      {estado.erro && (
        <p className="rounded-lg border border-[#fde8e2] bg-[#fde8e2] px-4 py-2.5 text-sm font-semibold text-[#c0472b]">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p className="rounded-lg border border-[#e3f1e8] bg-[#e3f1e8] px-4 py-2.5 text-sm font-semibold text-[#3a8f5b]">
          &quot;{estado.nomeAdicionado}&quot; foi adicionado — já aparece na lista abaixo e pode
          fazer login com o PIN cadastrado.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#eee3d3]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f7f1e6]">
            <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-sm text-[#8a8078]">
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            )}
            {funcionarios.map((f) => (
              <tr key={f.id} className="border-t border-[#f3ede4]">
                <td className="px-5 py-3 font-medium text-[#221d19]">{f.nome}</td>
                <td className="px-5 py-3">
                  <ToggleAtivoButton id={f.id} ativo={f.ativo} action={alternarAtivoFuncionario} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#8a8078]">
        Desativar um funcionário impede o login dele, mas mantém o histórico de vendas já
        registradas em nome dele.
      </p>
    </div>
  );
}

"use client";

import { useActionState, useState, useEffect } from "react";
import { criarFuncionarioComPinAdmin } from "./actions";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

const ESTADO_INICIAL: { erro?: string; ok?: boolean; nomeAdicionado?: string } = {};

export function CriarFuncionarioForm({ onVoltar }: { onVoltar: () => void }) {
  const [estado, formAction, isPending] = useActionState(criarFuncionarioComPinAdmin, ESTADO_INICIAL);
  const [pinAdmin, setPinAdmin] = useState("");
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (estado.ok) {
      setPinAdmin("");
      setNome("");
      setPin("");
    }
  }, [estado]);

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-4">
      <div className="rounded-lg border border-[#e4dbcb] bg-[#fdf0d5] px-3 py-2.5 text-xs text-[#8a6a1f]">
        Só o administrador pode cadastrar novos funcionários. Digite o PIN do administrador
        para liberar o cadastro.
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-[#8a8078]">PIN do administrador</span>
        <input
          type="text"
          name="pinAdmin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          required
          value={pinAdmin}
          onChange={(e) => setPinAdmin(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} tracking-[0.3em]`}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-[#8a8078]">Nome do novo funcionário</span>
        <input
          type="text"
          name="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-[#8a8078]">PIN do novo funcionário (4 a 6 números)</span>
        <input
          type="text"
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} tracking-[0.3em]`}
        />
      </label>

      {estado.erro && (
        <p className="rounded-lg border border-[#fde8e2] bg-[#fde8e2] px-4 py-2.5 text-sm font-semibold text-[#c0472b]">
          {estado.erro}
        </p>
      )}
      {estado.ok && (
        <p className="rounded-lg border border-[#e3f1e8] bg-[#e3f1e8] px-4 py-2.5 text-sm font-semibold text-[#3a8f5b]">
          &quot;{estado.nomeAdicionado}&quot; foi cadastrado. Já pode escolher o perfil dele e
          entrar com o PIN.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Criando..." : "Criar funcionário"}
      </button>
      <button
        type="button"
        onClick={onVoltar}
        className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
      >
        Voltar
      </button>
    </form>
  );
}

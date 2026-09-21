"use client";

import { useState, useTransition } from "react";
import { rodarBackupManual } from "./actions";

export function BackupButton() {
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  function handleClick() {
    setMensagem(null);
    startTransition(async () => {
      const resultado = await rodarBackupManual();
      setMensagem(resultado.mensagem);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="self-start rounded-lg border border-[#e4dbcb] px-4 py-2.5 text-sm font-semibold text-[#221d19] hover:bg-[#f7f1e6] disabled:opacity-60"
      >
        {isPending ? "Fazendo backup..." : "Fazer backup agora"}
      </button>
      {mensagem && <p className="text-xs text-[#8a8078]">{mensagem}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { DatabaseBackup } from "lucide-react";
import { rodarBackupManual } from "./actions";
import { Botao } from "@/components/ui/Botao";

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
    <div className="flex flex-col items-start gap-2">
      <Botao onClick={handleClick} disabled={isPending} icone={DatabaseBackup}>
        {isPending ? "Fazendo backup..." : "Fazer backup agora"}
      </Botao>
      {mensagem && <p className="text-xs text-suave">{mensagem}</p>}
    </div>
  );
}

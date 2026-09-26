"use client";

import { Trash2 } from "lucide-react";

export function ConfirmDeleteForm({
  id,
  action,
  confirmMessage = "Excluir este item?",
  compacto = false,
}: {
  id: number;
  action: (formData: FormData) => void;
  confirmMessage?: string;
  /** só o ícone da lixeira (para tabelas com muitas colunas) */
  compacto?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="Excluir"
        aria-label="Excluir"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-perigo-fundo hover:text-perigo"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        {!compacto && "Excluir"}
      </button>
    </form>
  );
}

"use client";

import { cx } from "./ui/cx";

export function ToggleAtivoButton({
  id,
  ativo,
  action,
}: {
  id: number;
  ativo: boolean;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ativo" value={String(ativo)} />
      <button
        type="submit"
        title={ativo ? "Clique para desativar" : "Clique para ativar"}
        className={cx(
          "rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:brightness-110",
          ativo ? "bg-sucesso-fundo text-sucesso" : "bg-superficie-3 text-suave"
        )}
      >
        {ativo ? "Ativo" : "Inativo"}
      </button>
    </form>
  );
}

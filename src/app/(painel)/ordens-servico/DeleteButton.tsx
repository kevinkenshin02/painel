"use client";

import { excluirOrdemServico } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  return (
    <form
      action={excluirOrdemServico}
      onSubmit={(event) => {
        if (!confirm("Excluir esta ordem de serviço?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs font-semibold text-[#8a8078] hover:text-[#c0472b] hover:underline"
      >
        Excluir
      </button>
    </form>
  );
}

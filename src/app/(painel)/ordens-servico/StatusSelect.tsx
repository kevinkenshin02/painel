"use client";

import { useRef } from "react";
import { atualizarStatusOrdemServico } from "./actions";
import { STATUS_OS_LABELS, STATUS_OS_ORDER } from "./labels";
import type { StatusOS } from "@/generated/prisma/enums";

export function StatusSelect({ id, status }: { id: number; status: StatusOS }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={atualizarStatusOrdemServico}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label="Mudar situação"
        onChange={() => formRef.current?.requestSubmit()}
        className="w-auto rounded-lg border border-borda bg-superficie-2 px-2 py-1 text-xs font-medium text-texto-2 focus:border-ouro focus:outline-none"
      >
        {STATUS_OS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_OS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}

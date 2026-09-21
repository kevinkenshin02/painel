"use client";

import { useRef } from "react";
import { atualizarStatusOrdemServico } from "./actions";
import { STATUS_OS_LABELS, STATUS_OS_ORDER } from "./labels";
import type { StatusOS } from "@/generated/prisma/enums";

export function StatusSelect({ id, status }: { id: number; status: StatusOS }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={atualizarStatusOrdemServico}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-[#e4dbcb] bg-white px-2 py-1 text-xs font-medium text-[#4a4038]"
      >
        {STATUS_OS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_OS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        aria-label="Salvar status"
        className="rounded-md border border-[#e4dbcb] px-1.5 py-1 text-xs text-[#8a8078] hover:bg-[#f7f1e6]"
      >
        ✓
      </button>
    </form>
  );
}

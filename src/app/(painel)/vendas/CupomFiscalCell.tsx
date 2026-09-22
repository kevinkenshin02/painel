"use client";

import { useActionState } from "react";
import { StatusFiscal, StatusPagamento } from "@/generated/prisma/enums";
import { emitirCupomFiscal, type ResultadoEmissao } from "./actions";

export function CupomFiscalCell({
  vendaId,
  satStatus,
  satMensagemErro,
  statusPagamento,
}: {
  vendaId: number;
  satStatus: StatusFiscal;
  satMensagemErro: string | null;
  statusPagamento: StatusPagamento;
}) {
  const [estado, formAction, emitindo] = useActionState<ResultadoEmissao, FormData>(
    emitirCupomFiscal,
    {}
  );

  if (satStatus === StatusFiscal.EMITIDO) {
    return (
      <a
        href={`/cupom-fiscal/${vendaId}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-[#3a8f5b] hover:underline"
      >
        Ver cupom
      </a>
    );
  }

  if (statusPagamento !== StatusPagamento.PAGO) {
    return <span className="text-xs text-[#8a8078]">—</span>;
  }

  const erro = estado.erro ?? (satStatus === StatusFiscal.ERRO ? satMensagemErro : null);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={vendaId} />
      <button
        type="submit"
        disabled={emitindo}
        className="rounded-md border border-[#e4dbcb] px-2 py-1 text-xs font-semibold text-[#8a8078] hover:bg-[#f7f1e6] disabled:opacity-50"
      >
        {emitindo ? "Emitindo..." : satStatus === StatusFiscal.ERRO ? "Tentar de novo" : "Emitir cupom"}
      </button>
      {erro && <span className="max-w-[220px] text-xs text-[#c0472b]">{erro}</span>}
    </form>
  );
}

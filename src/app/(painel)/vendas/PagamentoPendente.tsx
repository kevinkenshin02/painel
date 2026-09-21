"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { simularPagamentoTeste } from "./actions";

export function PagamentoPendente({
  vendaId,
  modoTeste,
}: {
  vendaId: number;
  modoTeste: boolean;
}) {
  const router = useRouter();
  const [checando, setChecando] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      setChecando(true);
      try {
        const res = await fetch(`/api/vendas/${vendaId}/status-pagamento`);
        const data = await res.json();
        if (data.statusPagamento && data.statusPagamento !== "PENDENTE") {
          router.refresh();
        }
      } catch {
        // tenta de novo no próximo ciclo
      } finally {
        setChecando(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [vendaId, router]);

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c98a1f]">
        <span
          className={`h-1.5 w-1.5 rounded-full bg-[#c98a1f] ${checando ? "animate-pulse" : ""}`}
        />
        Aguardando maquininha...
      </span>
      {modoTeste && (
        <form action={simularPagamentoTeste}>
          <input type="hidden" name="id" value={vendaId} />
          <button
            type="submit"
            className="rounded-md border border-[#e4dbcb] px-2 py-1 text-xs font-semibold text-[#8a8078] hover:bg-[#f7f1e6]"
          >
            Simular aprovação (teste)
          </button>
        </form>
      )}
    </div>
  );
}

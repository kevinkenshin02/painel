"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { simularPagamentoTeste } from "./actions";
import { cx } from "@/components/ui/cx";

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
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-aviso-fundo px-2.5 py-0.5 text-xs font-semibold text-aviso">
        <span className={cx("h-1.5 w-1.5 rounded-full bg-aviso", checando && "animate-pulse")} />
        Aguardando maquininha...
      </span>
      {modoTeste && (
        <form action={simularPagamentoTeste}>
          <input type="hidden" name="id" value={vendaId} />
          <button
            type="submit"
            className="rounded-lg border border-borda px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
          >
            Simular aprovação (teste)
          </button>
        </form>
      )}
    </div>
  );
}

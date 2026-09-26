"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { receberPagamentoOS } from "./actions";
import { FORMA_PAGAMENTO_LABELS } from "../vendas/labels";
import { formatCurrency } from "@/lib/format";
import { Botao } from "@/components/ui/Botao";
import { cx } from "@/components/ui/cx";

const classeMini = "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

/** Linha que abre embaixo da OS para registrar o pagamento (e a entrega). */
export function ReceberOS({
  osId,
  restante,
  entregarPadrao,
  aoFechar,
}: {
  osId: number;
  restante: number;
  entregarPadrao: boolean;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(restante.toFixed(2));
  const [entregar, setEntregar] = useState(entregarPadrao);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(formData: FormData) {
    setEnviando(true);
    setErro(null);
    try {
      formData.set("entregar", String(entregar));
      const r = await receberPagamentoOS(formData);
      if (r.erro) setErro(r.erro);
      else {
        aoFechar();
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form action={enviar} className="flex flex-wrap items-end gap-3 rounded-xl border border-borda-forte bg-ouro/8 p-4">
      <input type="hidden" name="id" value={osId} />
      <div className="flex items-center gap-2 self-center text-sm font-semibold text-texto">
        <HandCoins className="h-4 w-4 text-ouro" aria-hidden />
        Falta pagar {formatCurrency(restante)}
      </div>
      <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
        Valor recebido (R$)
        <input
          name="valor"
          type="number"
          min={0}
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={cx(classeMini, "numero w-32")}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
        Forma
        <select name="formaPagamento" defaultValue="DINHEIRO" className={classeMini}>
          {Object.entries(FORMA_PAGAMENTO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 self-center text-sm text-texto-2">
        <input type="checkbox" checked={entregar} onChange={(e) => setEntregar(e.target.checked)} className="accent-[#e0a63d]" />
        Entregar agora
      </label>
      <Botao type="submit" variante="primario" tamanho="sm" disabled={enviando}>
        {enviando ? "Salvando..." : entregar ? "Receber e entregar" : "Receber"}
      </Botao>
      <Botao tamanho="sm" variante="fantasma" onClick={aoFechar}>
        Cancelar
      </Botao>
      {erro && <p className="w-full text-sm font-semibold text-perigo">{erro}</p>}
    </form>
  );
}

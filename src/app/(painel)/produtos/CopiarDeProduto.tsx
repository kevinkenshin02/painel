"use client";

import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import type { TipoProduto } from "@/generated/prisma/enums";
import { classeCampo } from "@/components/ui/Campo";
import { cx } from "@/components/ui/cx";

export type OpcaoCopia = { id: number; tipo: TipoProduto; rotulo: string };

export function CopiarDeProduto({ opcoes, selecionado, codigo }: { opcoes: OpcaoCopia[]; selecionado?: number; codigo?: string }) {
  const router = useRouter();
  const tipos = Object.keys(TIPO_PRODUTO_LABELS) as TipoProduto[];

  function escolher(valor: string) {
    const q = new URLSearchParams();
    if (valor) q.set("copiar", valor);
    if (codigo) q.set("codigo", codigo);
    const s = q.toString();
    router.push(s ? `/produtos/novo?${s}` : "/produtos/novo");
  }

  return (
    <label className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-2/60 p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-texto">
        <Copy className="h-4 w-4 text-ouro" aria-hidden />
        Começar de um produto parecido
      </span>
      <select value={selecionado ?? ""} onChange={(e) => escolher(e.target.value)} className={cx(classeCampo, "sm:max-w-xl")}>
        <option value="">Em branco (sem copiar)</option>
        {tipos.map((t) => {
          const doTipo = opcoes.filter((o) => o.tipo === t);
          if (doTipo.length === 0) return null;
          return (
            <optgroup key={t} label={TIPO_PRODUTO_LABELS[t]}>
              {doTipo.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.rotulo}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}

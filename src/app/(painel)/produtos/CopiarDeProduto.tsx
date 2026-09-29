"use client";

import { useRouter } from "next/navigation";
import { TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import type { TipoProduto } from "@/generated/prisma/enums";
import { Campo, classeCampo } from "@/components/ui/Campo";

export type OpcaoCopia = { id: number; tipo: TipoProduto; rotulo: string };

export function CopiarDeProduto({
  opcoes,
  tipo,
  selecionado,
  codigo,
  className,
}: {
  opcoes: OpcaoCopia[];
  tipo: TipoProduto;
  selecionado?: number;
  codigo?: string;
  className?: string;
}) {
  const router = useRouter();
  const doTipo = opcoes.filter((o) => o.tipo === tipo);
  const rotuloTipo = TIPO_PRODUTO_LABELS[tipo];

  function escolher(valor: string) {
    const q = new URLSearchParams();
    if (valor) q.set("copiar", valor);
    if (codigo) q.set("codigo", codigo);
    const s = q.toString();
    router.push(s ? `/produtos/novo?${s}` : "/produtos/novo");
  }

  return (
    <Campo
      rotulo="Começar de um produto parecido"
      dica={doTipo.length ? `Só aparecem produtos do tipo ${rotuloTipo}.` : undefined}
      className={className}
    >
      <select
        value={doTipo.some((o) => o.id === selecionado) ? selecionado : ""}
        onChange={(e) => escolher(e.target.value)}
        disabled={doTipo.length === 0}
        className={classeCampo}
      >
        <option value="">{doTipo.length ? "Em branco (sem copiar)" : `Nenhum produto do tipo ${rotuloTipo} cadastrado ainda`}</option>
        {doTipo.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </Campo>
  );
}

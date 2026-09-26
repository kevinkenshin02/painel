"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TipoMovimento } from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { movimentarEstoque } from "@/lib/produtos";

export type ItemConferido = { produtoId: number; contado: number; precoVenda: number | null };

export async function aplicarConferencia(itens: ItemConferido[]): Promise<{ erro?: string; ok?: boolean; resumo?: string }> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador aplica a conferência no estoque." };
  if (!itens.length) return { erro: "Nenhum produto foi contado ainda." };
  if (itens.some((i) => !Number.isInteger(i.contado) || i.contado < 0)) return { erro: "Tem contagem inválida (use números inteiros, 0 ou mais)." };

  const hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const motivo = `Conferência da vitrine ${hoje}`;
  const r = { ajustados: 0, encontrados: 0, naoEncontrados: 0, iguais: 0 };

  await prisma.$transaction(async (tx) => {
    for (const i of itens) {
      const p = await tx.produto.findUnique({ where: { id: i.produtoId } });
      if (!p) continue;
      const delta = i.contado - p.quantidade;
      if (delta !== 0) {
        await movimentarEstoque(tx, { produtoId: p.id, delta, tipo: TipoMovimento.CONFERENCIA, motivo, funcionarioId: logado.id });
        r.ajustados++;
      } else r.iguais++;

      const precoNovo = i.precoVenda !== null && i.precoVenda >= 0 && i.precoVenda !== p.precoVenda ? i.precoVenda : null;
      if (precoNovo !== null) {
        await tx.historicoPreco.create({
          data: { produtoId: p.id, custoUnitario: p.custoUnitario, precoVenda: precoNovo, origem: motivo, funcionarioId: logado.id },
        });
      }
      if (p.aConferir) {
        if (i.contado > 0) r.encontrados++;
        else r.naoEncontrados++;
      }
      await tx.produto.update({
        where: { id: p.id },
        data: {
          aConferir: false,
          ...(i.contado > 0 ? { ativo: true } : {}),
          ...(precoNovo !== null ? { precoVenda: precoNovo } : {}),
        },
      });
    }
  });

  revalidatePath("/estoque", "layout");
  revalidatePath("/produtos", "layout");
  revalidatePath("/");
  const partes = [
    `${itens.length} produtos conferidos`,
    `${r.ajustados} com estoque acertado`,
    r.encontrados ? `${r.encontrados} da lista antiga encontrados e ativados` : "",
    r.naoEncontrados ? `${r.naoEncontrados} da lista antiga não estavam na loja (continuam inativos)` : "",
  ].filter(Boolean);
  return { ok: true, resumo: partes.join(" · ") + "." };
}

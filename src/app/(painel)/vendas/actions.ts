"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusPagamento,
} from "@/generated/prisma/enums";
import { criarCobrancaPoint, simularEventoCobranca } from "@/lib/mercadopago";
import { getFuncionarioLogado } from "@/lib/currentUser";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function criarVenda(formData: FormData): Promise<{ erro?: string; ok?: boolean }> {
  try {
    return await registrarVenda(formData);
  } catch (err) {
    return { erro: err instanceof Error ? err.message : "Não foi possível registrar a venda." };
  }
}

async function registrarVenda(formData: FormData): Promise<{ erro?: string; ok?: boolean }> {
  const dataVenda = formData.get("dataVenda") as string;
  const clienteNome = (formData.get("clienteNome") as string)?.trim() || null;
  const categoria = formData.get("categoria") as CategoriaVenda;
  const descricao = (formData.get("descricao") as string)?.trim();
  const quantidade = parseNumber(formData.get("quantidade"), 1);
  const custoTotal = parseNumber(formData.get("custoTotal"));
  const valorVendido = parseNumber(formData.get("valorVendido"));
  const canalOrigem = formData.get("canalOrigem") as CanalOrigem;
  const formaPagamento = formData.get("formaPagamento") as FormaPagamento;
  const itemEstoque = (formData.get("itemEstoque") as string) || "";

  if (!dataVenda || !categoria || !descricao || !canalOrigem || !formaPagamento) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }

  const [tipoItem, idItemRaw] = itemEstoque.split(":");
  const idItem = Number(idItemRaw);
  const statusPagamento =
    formaPagamento === FormaPagamento.CARTAO_MAQUININHA
      ? StatusPagamento.PENDENTE
      : StatusPagamento.PAGO;
  const funcionario = await getFuncionarioLogado();
  const funcionarioId = funcionario?.id ?? null;

  const venda = await prisma.$transaction(async (tx) => {
    if (tipoItem === "A" && idItem) {
      const armacao = await tx.armacaoEstoque.findUnique({ where: { id: idItem } });
      if (!armacao || armacao.quantidade < quantidade) {
        throw new Error("Estoque insuficiente para essa armação.");
      }
      await tx.armacaoEstoque.update({
        where: { id: idItem },
        data: { quantidade: armacao.quantidade - quantidade },
      });
      return tx.venda.create({
        data: {
          dataVenda: new Date(dataVenda),
          clienteNome,
          categoria,
          descricao,
          quantidade,
          custoTotal,
          valorVendido,
          canalOrigem,
          formaPagamento,
          statusPagamento,
          armacaoId: idItem,
          funcionarioId,
        },
      });
    }

    if (tipoItem === "R" && idItem) {
      const relogio = await tx.relogioEstoque.findUnique({ where: { id: idItem } });
      if (!relogio || relogio.quantidade < quantidade) {
        throw new Error("Estoque insuficiente para esse relógio.");
      }
      await tx.relogioEstoque.update({
        where: { id: idItem },
        data: { quantidade: relogio.quantidade - quantidade },
      });
      return tx.venda.create({
        data: {
          dataVenda: new Date(dataVenda),
          clienteNome,
          categoria,
          descricao,
          quantidade,
          custoTotal,
          valorVendido,
          canalOrigem,
          formaPagamento,
          statusPagamento,
          relogioId: idItem,
          funcionarioId,
        },
      });
    }

    if (tipoItem === "L" && idItem) {
      const lente = await tx.lenteEstoque.findUnique({ where: { id: idItem } });
      if (!lente || lente.quantidade < quantidade) {
        throw new Error("Estoque insuficiente para essa lente.");
      }
      await tx.lenteEstoque.update({
        where: { id: idItem },
        data: { quantidade: lente.quantidade - quantidade },
      });
      return tx.venda.create({
        data: {
          dataVenda: new Date(dataVenda),
          clienteNome,
          categoria,
          descricao,
          quantidade,
          custoTotal,
          valorVendido,
          canalOrigem,
          formaPagamento,
          statusPagamento,
          lenteId: idItem,
          funcionarioId,
        },
      });
    }

    return tx.venda.create({
      data: {
        dataVenda: new Date(dataVenda),
        clienteNome,
        categoria,
        descricao,
        quantidade,
        custoTotal,
        valorVendido,
        canalOrigem,
        formaPagamento,
        statusPagamento,
        funcionarioId,
      },
    });
  });

  if (formaPagamento === FormaPagamento.CARTAO_MAQUININHA) {
    try {
      const order = await criarCobrancaPoint({
        valor: valorVendido,
        referenciaExterna: `venda-${venda.id}`,
      });
      await prisma.venda.update({
        where: { id: venda.id },
        data: { mercadoPagoOrderId: order.id },
      });
    } catch (err) {
      await prisma.venda.update({
        where: { id: venda.id },
        data: { statusPagamento: StatusPagamento.RECUSADO },
      });
      revalidatePath("/vendas", "layout");
      revalidatePath("/");
      const motivo = err instanceof Error ? err.message : "erro desconhecido";
      return {
        erro: `A venda foi registrada, mas a cobrança não chegou na maquininha (${motivo}). Ela ficou como "Recusado" — exclua e registre de novo, ou use outra forma de pagamento.`,
      };
    }
  }

  revalidatePath("/vendas", "layout");
  revalidatePath("/estoque");
  revalidatePath("/");
  return { ok: true };
}

export async function excluirVenda(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");

  await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({ where: { id } });
    if (!venda) throw new Error("Venda inválida.");

    if (venda.armacaoId) {
      await tx.armacaoEstoque.update({
        where: { id: venda.armacaoId },
        data: { quantidade: { increment: venda.quantidade } },
      });
    }
    if (venda.relogioId) {
      await tx.relogioEstoque.update({
        where: { id: venda.relogioId },
        data: { quantidade: { increment: venda.quantidade } },
      });
    }
    if (venda.lenteId) {
      await tx.lenteEstoque.update({
        where: { id: venda.lenteId },
        data: { quantidade: { increment: venda.quantidade } },
      });
    }

    await tx.venda.delete({ where: { id } });
  });

  revalidatePath("/vendas", "layout");
  revalidatePath("/estoque");
  revalidatePath("/");
}

export async function simularPagamentoTeste(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");

  const venda = await prisma.venda.findUnique({ where: { id } });
  if (!venda?.mercadoPagoOrderId) {
    throw new Error("Esta venda não tem uma cobrança associada.");
  }

  await simularEventoCobranca(venda.mercadoPagoOrderId, "processed");
  revalidatePath("/vendas", "layout");
}

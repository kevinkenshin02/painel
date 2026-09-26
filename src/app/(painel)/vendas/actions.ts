"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusPagamento,
  TipoMovimento,
} from "@/generated/prisma/enums";
import { criarCobrancaPoint, simularEventoCobranca } from "@/lib/mercadopago";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { movimentarEstoque } from "@/lib/produtos";
import { clienteDaOperacao } from "@/lib/clientes";
import { registrarNoCaixa } from "@/lib/caixa";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null || String(value).trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function revalidarVendas() {
  revalidatePath("/vendas", "layout");
  revalidatePath("/caixa", "layout");
  revalidatePath("/estoque");
  revalidatePath("/produtos", "layout");
  revalidatePath("/clientes", "layout");
  revalidatePath("/");
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
  const clienteId = Number(formData.get("clienteId")) || null;
  const categoria = formData.get("categoria") as CategoriaVenda;
  const descricao = (formData.get("descricao") as string)?.trim();
  const quantidade = Math.max(1, Math.trunc(parseNumber(formData.get("quantidade"), 1)));
  const custoInformado = (formData.get("custoTotal") as string | null)?.trim();
  const valorVendido = parseNumber(formData.get("valorVendido"));
  const canalOrigem = formData.get("canalOrigem") as CanalOrigem;
  const formaPagamento = formData.get("formaPagamento") as FormaPagamento;
  const produtoId = Number(formData.get("produtoId")) || null;

  if (!dataVenda || !categoria || !descricao || !canalOrigem || !formaPagamento) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (!(valorVendido > 0)) return { erro: "Informe o valor vendido." };

  const statusPagamento =
    formaPagamento === FormaPagamento.CARTAO_MAQUININHA ? StatusPagamento.PENDENTE : StatusPagamento.PAGO;
  const funcionario = await getFuncionarioLogado();
  const funcionarioId = funcionario?.id ?? null;

  const venda = await prisma.$transaction(async (tx) => {
    const produto = produtoId ? await tx.produto.findUnique({ where: { id: produtoId } }) : null;
    if (produtoId && !produto) throw new Error("Produto não encontrado.");

    // custo: o que o administrador digitou; senão, o custo da ficha do produto
    const custoTotal =
      funcionario?.isAdmin && custoInformado ? parseNumber(custoInformado) : produto ? produto.custoUnitario * quantidade : 0;

    const cliente = await clienteDaOperacao(tx, { clienteId, nome: clienteNome ?? "", criarSeNaoExistir: false });

    const criada = await tx.venda.create({
      data: {
        dataVenda: new Date(dataVenda),
        clienteNome: cliente?.nome ?? clienteNome,
        clienteId: cliente?.id ?? null,
        categoria,
        descricao,
        quantidade,
        custoTotal,
        valorVendido,
        canalOrigem,
        formaPagamento,
        statusPagamento,
        produtoId: produto?.id ?? null,
        funcionarioId,
      },
    });

    if (produto) {
      await movimentarEstoque(tx, {
        produtoId: produto.id,
        delta: -quantidade,
        tipo: TipoMovimento.SAIDA_VENDA,
        motivo: `Venda nº ${criada.id}${cliente ? ` — ${cliente.nome}` : clienteNome ? ` — ${clienteNome}` : ""}`,
        vendaId: criada.id,
        funcionarioId,
      });
    }
    // dinheiro, Pix e "outro" entram no caixa na hora; o cartão entra quando a maquininha aprovar
    if (statusPagamento === StatusPagamento.PAGO) {
      await registrarNoCaixa(tx, {
        tipo: "VENDA",
        formaPagamento,
        valor: valorVendido,
        descricao: `Venda nº ${criada.id} — ${descricao}`,
        vendaId: criada.id,
        funcionarioId,
      });
    }
    return criada;
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
      revalidarVendas();
      const motivo = err instanceof Error ? err.message : "erro desconhecido";
      return {
        erro: `A venda foi registrada, mas a cobrança não chegou na maquininha (${motivo}). Ela ficou como "Recusado" — exclua e registre de novo, ou use outra forma de pagamento.`,
      };
    }
  }

  revalidarVendas();
  return { ok: true };
}

export async function excluirVenda(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");
  const funcionario = await getFuncionarioLogado();

  await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({ where: { id } });
    if (!venda) throw new Error("Venda inválida.");

    if (venda.produtoId) {
      await movimentarEstoque(tx, {
        produtoId: venda.produtoId,
        delta: venda.quantidade,
        tipo: TipoMovimento.ESTORNO_VENDA,
        motivo: `Venda nº ${venda.id} excluída`,
        vendaId: venda.id,
        funcionarioId: funcionario?.id ?? null,
      });
    }

    // o que essa venda colocou no caixa sai de novo (estorno), por forma de pagamento
    const noCaixa = await tx.movimentoCaixa.findMany({ where: { vendaId: venda.id, tipo: { in: ["VENDA", "ESTORNO"] } } });
    for (const forma of new Set(noCaixa.map((m) => m.formaPagamento))) {
      const liquido = noCaixa.filter((m) => m.formaPagamento === forma).reduce((s, m) => s + m.valor, 0);
      if (liquido > 0.004) {
        await registrarNoCaixa(tx, {
          tipo: "ESTORNO",
          formaPagamento: forma,
          valor: -liquido,
          descricao: `Venda nº ${venda.id} excluída — ${venda.descricao}`,
          vendaId: venda.id,
          funcionarioId: funcionario?.id ?? null,
        });
      }
    }

    await tx.venda.delete({ where: { id } });
  });

  revalidarVendas();
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

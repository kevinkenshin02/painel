"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusFiscal,
  StatusPagamento,
} from "@/generated/prisma/enums";
import { criarCobrancaPoint, simularEventoCobranca } from "@/lib/mercadopago";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { getSatDriver, parseRetornoVenda, RETORNO_VENDA_AUTORIZADA } from "@/lib/sat";
import { buildCfeXml } from "@/lib/sat/cfeBuilder";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function criarVenda(formData: FormData) {
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
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  const [tipoItem, idItemRaw] = itemEstoque.split(":");
  const idItem = Number(idItemRaw);
  const ehCartaoNaMaquininha =
    formaPagamento === FormaPagamento.CARTAO_CREDITO || formaPagamento === FormaPagamento.CARTAO_DEBITO;
  const statusPagamento = ehCartaoNaMaquininha ? StatusPagamento.PENDENTE : StatusPagamento.PAGO;
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

  if (ehCartaoNaMaquininha) {
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
      throw err;
    }
  }

  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/");
}

export async function excluirVenda(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");

  await prisma.$transaction(async (tx) => {
    const venda = await tx.venda.findUnique({ where: { id } });
    if (!venda) throw new Error("Venda inválida.");

    if (venda.satStatus === StatusFiscal.EMITIDO) {
      throw new Error(
        "Esta venda já teve cupom fiscal emitido e transmitido à SEFAZ — não dá para excluir pelo painel. O cancelamento precisa ser feito pelo processo fiscal, senão o painel fica diferente do que a Receita já registrou."
      );
    }

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

  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/");
}

export async function emitirCupomFiscal(formData: FormData) {
  const logado = await getFuncionarioLogado();
  if (!logado) throw new Error("Faça login para emitir cupom fiscal.");

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");

  const [venda, config] = await Promise.all([
    prisma.venda.findUnique({ where: { id } }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
  ]);

  if (!venda) throw new Error("Venda inválida.");
  if (venda.satStatus === StatusFiscal.EMITIDO) {
    throw new Error("Esta venda já tem cupom fiscal emitido.");
  }
  if (venda.statusPagamento !== StatusPagamento.PAGO) {
    throw new Error("Só dá para emitir cupom fiscal de venda paga.");
  }

  try {
    const xml = buildCfeXml(venda, {
      cnpj: config?.cnpj ?? null,
      inscricaoEstadual: config?.inscricaoEstadual ?? null,
    });

    const resposta = await getSatDriver().enviarDadosVenda(xml);
    if (resposta.codigo !== RETORNO_VENDA_AUTORIZADA) {
      throw new Error(`SAT recusou a emissão (${resposta.codigo}): ${resposta.mensagem}`);
    }

    const { chaveConsulta, xmlBase64 } = parseRetornoVenda(resposta);
    await prisma.venda.update({
      where: { id },
      data: {
        satStatus: StatusFiscal.EMITIDO,
        satChaveAcesso: chaveConsulta || null,
        satNumeroSessao: Number(resposta.numeroSessao) || null,
        satXmlRetorno: xmlBase64 || resposta.raw,
        satMensagemErro: null,
        satEmitidoEm: new Date(),
      },
    });
  } catch (err) {
    await prisma.venda.update({
      where: { id },
      data: {
        satStatus: StatusFiscal.ERRO,
        satMensagemErro: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }

  revalidatePath("/vendas");
}

export async function simularPagamentoTeste(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Venda inválida.");

  const venda = await prisma.venda.findUnique({ where: { id } });
  if (!venda?.mercadoPagoOrderId) {
    throw new Error("Esta venda não tem uma cobrança associada.");
  }

  await simularEventoCobranca(venda.mercadoPagoOrderId, "processed");
  revalidatePath("/vendas");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MecanismoRelogio, PublicoRelogio, TipoMovimento, TipoProduto } from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { movimentarEstoque } from "@/lib/produtos";

type Resultado = { erro?: string; ok?: boolean; id?: number };
const texto = (f: FormData, k: string) => ((f.get(k) as string | null) ?? "").trim();
/** Campo vazio vira NaN (= "não informado"), para não confundir com zero. */
const numero = (f: FormData, k: string) => {
  const t = texto(f, k);
  if (!t) return NaN;
  const v = Number(t.replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
};

function revalidarTudo() {
  revalidatePath("/produtos", "layout");
  revalidatePath("/estoque", "layout");
  revalidatePath("/fornecedores", "layout");
  revalidatePath("/vendas/nova");
  revalidatePath("/");
}

export async function salvarProduto(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador cadastra e altera produtos." };

  const id = Number(formData.get("id")) || null;
  const tipo = texto(formData, "tipo") as TipoProduto;
  const codigo = texto(formData, "codigo").toUpperCase();
  const descricao = texto(formData, "descricao");
  const custoInformado = numero(formData, "custoUnitario");
  const custoUnitario = Number.isNaN(custoInformado) ? 0 : custoInformado;
  const precoVenda = numero(formData, "precoVenda");
  const estoqueMinimo = Math.max(0, Math.trunc(numero(formData, "estoqueMinimo") || 0));
  const fornecedorId = Number(formData.get("fornecedorId")) || null;
  const publico = texto(formData, "publico") as PublicoRelogio | "";
  const mecanismo = texto(formData, "mecanismo") as MecanismoRelogio | "";

  if (!Object.values(TipoProduto).includes(tipo)) return { erro: "Escolha o tipo do produto." };
  if (!codigo) return { erro: "Informe o código do produto." };
  if (!descricao) return { erro: "Informe a descrição / modelo." };
  if (!(precoVenda >= 0)) return { erro: "Informe o preço de venda." };
  if (!(custoUnitario >= 0)) return { erro: "O custo precisa ser um número (0 ou mais)." };

  const outro = await prisma.produto.findUnique({ where: { codigo } });
  if (outro && outro.id !== id) return { erro: `O código ${codigo} já é de outro produto.` };

  const dados = {
    tipo,
    codigo,
    descricao,
    marca: texto(formData, "marca") || null,
    codigoBarras: texto(formData, "codigoBarras") || null,
    referencia: texto(formData, "referencia") || null,
    cor: texto(formData, "cor") || null,
    publico: tipo === "RELOGIO" && publico ? publico : null,
    mecanismo: tipo === "RELOGIO" && mecanismo ? mecanismo : null,
    grau: texto(formData, "grau") || null,
    ncm: texto(formData, "ncm") || null,
    unidade: texto(formData, "unidade") || "UN",
    localizacao: texto(formData, "localizacao") || null,
    fornecedorId,
    estoqueMinimo,
    custoUnitario,
    precoVenda,
    observacoes: texto(formData, "observacoes") || null,
  };

  const produto = await prisma.$transaction(async (tx) => {
    if (id) {
      const antes = await tx.produto.findUnique({ where: { id } });
      if (!antes) throw new Error("Produto não encontrado.");
      const p = await tx.produto.update({ where: { id }, data: dados });
      if (antes.custoUnitario !== custoUnitario || antes.precoVenda !== precoVenda) {
        await tx.historicoPreco.create({
          data: { produtoId: id, custoUnitario, precoVenda, origem: "Alterado na ficha", funcionarioId: logado.id },
        });
      }
      return p;
    }
    const quantidadeInicial = Math.max(0, Math.trunc(numero(formData, "quantidade") || 0));
    const p = await tx.produto.create({ data: { ...dados, quantidade: 0 } });
    await tx.historicoPreco.create({
      data: { produtoId: p.id, custoUnitario, precoVenda, origem: "Cadastro", funcionarioId: logado.id },
    });
    await movimentarEstoque(tx, {
      produtoId: p.id,
      delta: quantidadeInicial,
      tipo: TipoMovimento.CADASTRO,
      motivo: "Quantidade inicial no cadastro",
      funcionarioId: logado.id,
      custoUnitario,
    });
    return p;
  });

  revalidarTudo();
  return { ok: true, id: produto.id };
}

export async function ajustarEstoque(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador ajusta o estoque." };

  const id = Number(formData.get("id"));
  const novaQuantidade = Math.trunc(numero(formData, "novaQuantidade"));
  const motivo = texto(formData, "motivo");
  if (!id) return { erro: "Produto inválido." };
  if (!(novaQuantidade >= 0)) return { erro: "Informe a quantidade que tem de verdade (0 ou mais)." };
  if (!motivo) return { erro: "Escreva o motivo do ajuste (ex.: conferência da vitrine, peça com defeito)." };

  try {
    await prisma.$transaction(async (tx) => {
      const p = await tx.produto.findUnique({ where: { id } });
      if (!p) throw new Error("Produto não encontrado.");
      const delta = novaQuantidade - p.quantidade;
      if (delta === 0) throw new Error("A quantidade informada é a mesma que já está no sistema.");
      await movimentarEstoque(tx, { produtoId: id, delta, tipo: TipoMovimento.AJUSTE, motivo, funcionarioId: logado.id });
    });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não foi possível ajustar." };
  }
  revalidarTudo();
  return { ok: true, id };
}

export async function entradaEstoque(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador lança entrada de estoque." };

  const id = Number(formData.get("id"));
  const quantidade = Math.trunc(numero(formData, "quantidade"));
  const custo = numero(formData, "custoUnitario");
  const motivo = texto(formData, "motivo") || "Entrada manual";
  if (!id) return { erro: "Produto inválido." };
  if (!(quantidade > 0)) return { erro: "Informe quantas peças chegaram." };

  await prisma.$transaction(async (tx) => {
    await movimentarEstoque(tx, {
      produtoId: id,
      delta: quantidade,
      tipo: TipoMovimento.ENTRADA,
      motivo,
      funcionarioId: logado.id,
      custoUnitario: custo >= 0 ? custo : null,
    });
    if (custo >= 0) {
      const p = await tx.produto.findUnique({ where: { id } });
      if (p && p.custoUnitario !== custo) {
        await tx.produto.update({ where: { id }, data: { custoUnitario: custo } });
        await tx.historicoPreco.create({
          data: { produtoId: id, custoUnitario: custo, precoVenda: p.precoVenda, origem: "Entrada de estoque", funcionarioId: logado.id },
        });
      }
    }
  });
  revalidarTudo();
  return { ok: true, id };
}

export async function alternarAtivoProduto(formData: FormData) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return;
  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  await prisma.produto.update({ where: { id }, data: { ativo: !ativo } });
  revalidarTudo();
}

export async function excluirProduto(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador exclui produtos." };
  const id = Number(formData.get("id"));
  const vendas = await prisma.venda.count({ where: { produtoId: id } });
  if (vendas > 0) return { erro: "Esse produto já tem vendas — desative em vez de excluir, para não perder o histórico." };
  await prisma.produto.delete({ where: { id } });
  revalidarTudo();
  return { ok: true };
}

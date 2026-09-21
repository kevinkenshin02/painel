"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  MarcaRelogio,
  MecanismoRelogio,
  PublicoRelogio,
} from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function exigirAdmin() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    throw new Error("Só o administrador pode gerenciar o estoque.");
  }
}

export async function criarArmacao(formData: FormData) {
  await exigirAdmin();

  const codigo = (formData.get("codigo") as string)?.trim();
  const marcaModelo = (formData.get("marcaModelo") as string)?.trim();
  const corReferencia = (formData.get("corReferencia") as string)?.trim();
  const fornecedor = (formData.get("fornecedor") as string)?.trim();
  const dataEntrada = formData.get("dataEntrada") as string;
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (!codigo || !marcaModelo || !corReferencia || !fornecedor || !dataEntrada) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  await prisma.armacaoEstoque.create({
    data: {
      codigo,
      marcaModelo,
      corReferencia,
      fornecedor,
      dataEntrada: new Date(dataEntrada),
      quantidade,
      custoUnitario,
      precoVenda,
    },
  });

  revalidatePath("/estoque");
}

export async function criarRelogio(formData: FormData) {
  await exigirAdmin();

  const codigo = (formData.get("codigo") as string)?.trim();
  const marca = formData.get("marca") as MarcaRelogio;
  const marcaOutro = (formData.get("marcaOutro") as string)?.trim() || null;
  const modeloReferencia = (formData.get("modeloReferencia") as string)?.trim();
  const tipoPublico = formData.get("tipoPublico") as PublicoRelogio;
  const tipoMecanismo = formData.get("tipoMecanismo") as MecanismoRelogio;
  const fornecedor = (formData.get("fornecedor") as string)?.trim();
  const dataEntrada = formData.get("dataEntrada") as string;
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (!codigo || !modeloReferencia || !fornecedor || !dataEntrada) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  await prisma.relogioEstoque.create({
    data: {
      codigo,
      marca,
      marcaOutro: marca === MarcaRelogio.OUTRO ? marcaOutro : null,
      modeloReferencia,
      tipoPublico,
      tipoMecanismo,
      fornecedor,
      dataEntrada: new Date(dataEntrada),
      quantidade,
      custoUnitario,
      precoVenda,
    },
  });

  revalidatePath("/estoque");
}

export async function editarArmacao(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (!id || quantidade < 0 || custoUnitario < 0 || precoVenda < 0) {
    throw new Error("Dados inválidos.");
  }

  await prisma.armacaoEstoque.update({
    where: { id },
    data: { quantidade, custoUnitario, precoVenda },
  });

  revalidatePath("/estoque");
  revalidatePath("/");
  revalidatePath("/vendas");
}

export async function editarRelogio(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const codigo = (formData.get("codigo") as string)?.trim();
  const marca = formData.get("marca") as MarcaRelogio;
  const marcaOutro = (formData.get("marcaOutro") as string)?.trim() || null;
  const modeloReferencia = (formData.get("modeloReferencia") as string)?.trim();
  const tipoPublico = formData.get("tipoPublico") as PublicoRelogio;
  const tipoMecanismo = formData.get("tipoMecanismo") as MecanismoRelogio;
  const fornecedor = (formData.get("fornecedor") as string)?.trim();
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (
    !id ||
    !codigo ||
    !modeloReferencia ||
    !fornecedor ||
    quantidade < 0 ||
    custoUnitario < 0 ||
    precoVenda < 0
  ) {
    throw new Error("Dados inválidos.");
  }

  await prisma.relogioEstoque.update({
    where: { id },
    data: {
      codigo,
      marca,
      marcaOutro: marca === MarcaRelogio.OUTRO ? marcaOutro : null,
      modeloReferencia,
      tipoPublico,
      tipoMecanismo,
      fornecedor,
      quantidade,
      custoUnitario,
      precoVenda,
    },
  });

  revalidatePath("/estoque");
  revalidatePath("/");
  revalidatePath("/vendas");
}

export async function criarLente(formData: FormData) {
  await exigirAdmin();

  const codigo = (formData.get("codigo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();
  const grau = (formData.get("grau") as string)?.trim();
  const fornecedor = (formData.get("fornecedor") as string)?.trim();
  const dataEntrada = formData.get("dataEntrada") as string;
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (!codigo || !descricao || !grau || !fornecedor || !dataEntrada) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  await prisma.lenteEstoque.create({
    data: {
      codigo,
      descricao,
      grau,
      fornecedor,
      dataEntrada: new Date(dataEntrada),
      quantidade,
      custoUnitario,
      precoVenda,
    },
  });

  revalidatePath("/estoque");
}

export async function editarLente(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const codigo = (formData.get("codigo") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim();
  const grau = (formData.get("grau") as string)?.trim();
  const fornecedor = (formData.get("fornecedor") as string)?.trim();
  const quantidade = parseNumber(formData.get("quantidade"));
  const custoUnitario = parseNumber(formData.get("custoUnitario"));
  const precoVenda = parseNumber(formData.get("precoVenda"));

  if (
    !id ||
    !codigo ||
    !descricao ||
    !grau ||
    !fornecedor ||
    quantidade < 0 ||
    custoUnitario < 0 ||
    precoVenda < 0
  ) {
    throw new Error("Dados inválidos.");
  }

  await prisma.lenteEstoque.update({
    where: { id },
    data: { codigo, descricao, grau, fornecedor, quantidade, custoUnitario, precoVenda },
  });

  revalidatePath("/estoque");
  revalidatePath("/");
  revalidatePath("/vendas");
}

export async function alternarAtivoLente(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Item inválido.");

  await prisma.lenteEstoque.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/estoque");
}

export async function excluirLente(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Item inválido.");

  await prisma.lenteEstoque.delete({ where: { id } });
  revalidatePath("/estoque");
}

export async function alternarAtivoArmacao(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Item inválido.");

  await prisma.armacaoEstoque.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/estoque");
}

export async function alternarAtivoRelogio(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Item inválido.");

  await prisma.relogioEstoque.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/estoque");
}

export async function excluirArmacao(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Item inválido.");

  await prisma.armacaoEstoque.delete({ where: { id } });
  revalidatePath("/estoque");
}

export async function excluirRelogio(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Item inválido.");

  await prisma.relogioEstoque.delete({ where: { id } });
  revalidatePath("/estoque");
}

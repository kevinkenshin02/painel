"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function exigirAdmin() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    throw new Error("Só o administrador pode gerenciar despesas.");
  }
}

export async function criarDespesasFixasEmLote(formData: FormData) {
  await exigirAdmin();

  const nomes = formData.getAll("nome[]") as string[];
  const valores = formData.getAll("valor[]") as string[];

  const itens = nomes
    .map((nome, i) => ({ nome: nome.trim(), valor: parseNumber(valores[i]) }))
    .filter((item) => item.nome && item.valor > 0);

  if (itens.length === 0) {
    throw new Error("Preencha ao menos uma despesa com nome e valor.");
  }

  await prisma.despesaFixa.createMany({
    data: itens.map((item) => ({ nome: item.nome, valor: item.valor })),
  });

  revalidatePath("/despesas");
  revalidatePath("/");
}

export async function editarDespesaFixa(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const nome = (formData.get("nome") as string)?.trim();
  const valor = parseNumber(formData.get("valor"));
  const observacao = (formData.get("observacao") as string)?.trim() || null;

  if (!id || !nome || valor <= 0) {
    throw new Error("Preencha o nome e um valor válido.");
  }

  await prisma.despesaFixa.update({
    where: { id },
    data: { nome, valor, observacao },
  });

  revalidatePath("/despesas");
  revalidatePath("/");
}

export async function alternarAtivoDespesaFixa(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Despesa inválida.");

  await prisma.despesaFixa.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/despesas");
  revalidatePath("/");
}

export async function excluirDespesaFixa(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Despesa inválida.");

  await prisma.despesaFixa.delete({ where: { id } });
  revalidatePath("/despesas");
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { mesDe } from "@/lib/financeiro";

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

export async function criarDespesasFixasEmLote(formData: FormData): Promise<{ erro?: string; ok?: boolean }> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador pode gerenciar despesas." };

  const nomes = formData.getAll("nome[]") as string[];
  const valores = formData.getAll("valor[]") as string[];
  const dias = formData.getAll("dia[]") as string[];

  const itens = nomes
    .map((nome, i) => ({ nome: nome.trim(), valor: parseNumber(valores[i]), dia: diaValido(dias[i]) }))
    .filter((item) => item.nome && item.valor > 0);

  if (itens.length === 0) {
    return { erro: "Preencha ao menos uma despesa com nome e valor." };
  }

  await prisma.despesaFixa.createMany({
    data: itens.map((item) => ({ nome: item.nome, valor: item.valor, diaVencimento: item.dia })),
  });

  revalidar();
  return { ok: true };
}

function diaValido(v: FormDataEntryValue | null | undefined) {
  const d = Math.trunc(Number(v));
  return d >= 1 && d <= 31 ? d : 10;
}

function revalidar() {
  revalidatePath("/despesas");
  revalidatePath("/financeiro", "layout");
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

  const diaVencimento = diaValido(formData.get("diaVencimento"));
  await prisma.$transaction(async (tx) => {
    await tx.despesaFixa.update({
      where: { id },
      data: { nome, valor, observacao, diaVencimento },
    });
    // a conta deste mês que ainda não foi paga acompanha a mudança
    const mes = mesDe();
    const conta = await tx.contaPagar.findFirst({ where: { despesaFixaId: id, competencia: mes.chave, pagoEm: null } });
    if (conta) {
      await tx.contaPagar.update({
        where: { id: conta.id },
        data: { descricao: nome, valor, vencimento: new Date(Date.UTC(mes.ano, mes.mes, Math.min(diaVencimento, mes.dias))) },
      });
    }
  });

  revalidar();
}

export async function alternarAtivoDespesaFixa(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Despesa inválida.");

  await prisma.despesaFixa.update({ where: { id }, data: { ativo: !ativo } });
  revalidar();
}

export async function excluirDespesaFixa(formData: FormData) {
  await exigirAdmin();

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Despesa inválida.");

  await prisma.despesaFixa.delete({ where: { id } });
  revalidar();
}

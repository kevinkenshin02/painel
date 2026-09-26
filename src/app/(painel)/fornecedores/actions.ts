"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { soDigitos } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";

type Resultado = { erro?: string; ok?: boolean; id?: number };
const texto = (f: FormData, k: string) => ((f.get(k) as string | null) ?? "").trim();

export async function salvarFornecedor(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador cadastra fornecedores." };

  const id = Number(formData.get("id")) || null;
  const nome = texto(formData, "nome");
  const cnpj = soDigitos(texto(formData, "cnpj")) || null;
  if (!nome) return { erro: "Informe o nome do fornecedor." };
  if (cnpj && cnpj.length !== 14) return { erro: "O CNPJ tem 14 números." };

  if (cnpj) {
    const outro = await prisma.fornecedor.findUnique({ where: { cnpj } });
    if (outro && outro.id !== id) return { erro: `Esse CNPJ já é do fornecedor "${outro.nome}".` };
  }

  const dados = {
    nome,
    cnpj,
    razaoSocial: texto(formData, "razaoSocial") || null,
    telefone: soDigitos(texto(formData, "telefone")) || null,
    email: texto(formData, "email") || null,
    representante: texto(formData, "representante") || null,
    observacoes: texto(formData, "observacoes") || null,
  };
  const f = id ? await prisma.fornecedor.update({ where: { id }, data: dados }) : await prisma.fornecedor.create({ data: dados });
  revalidatePath("/fornecedores", "layout");
  revalidatePath("/produtos", "layout");
  return { ok: true, id: f.id };
}

export async function alternarAtivoFornecedor(formData: FormData) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return;
  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  await prisma.fornecedor.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/fornecedores", "layout");
}

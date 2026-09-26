"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { soDigitos } from "@/lib/format";
import { CanalOrigem } from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";

type Resultado = { erro?: string; ok?: boolean; id?: number };

const texto = (f: FormData, k: string) => ((f.get(k) as string | null) ?? "").trim();
const opcional = (f: FormData, k: string) => texto(f, k) || null;

export async function salvarCliente(formData: FormData): Promise<Resultado> {
  if (!(await getFuncionarioLogado())) return { erro: "Entre no Painel de novo." };

  const id = Number(formData.get("id")) || null;
  const nome = texto(formData, "nome");
  const telefone = soDigitos(texto(formData, "telefone"));
  const cpf = soDigitos(texto(formData, "cpf")) || null;
  const nascimento = texto(formData, "nascimento");
  const origem = texto(formData, "origem") as CanalOrigem | "";

  if (!nome) return { erro: "Informe o nome do cliente." };
  if (telefone && (telefone.length < 10 || telefone.length > 11)) return { erro: "Telefone com DDD: 10 ou 11 números." };
  if (cpf && cpf.length !== 11) return { erro: "O CPF tem 11 números." };
  if (origem && !Object.values(CanalOrigem).includes(origem)) return { erro: "Origem inválida." };

  if (!id) {
    const repetido = await prisma.cliente.findFirst({ where: { telefone, nome } });
    if (repetido && telefone) return { erro: `Já existe "${repetido.nome}" com esse telefone (cadastro nº ${repetido.id}).` };
  }

  const dados = {
    nome,
    telefone,
    cpf,
    email: opcional(formData, "email"),
    nascimento: nascimento ? new Date(nascimento) : null,
    endereco: opcional(formData, "endereco"),
    origem: origem || null,
    observacoes: opcional(formData, "observacoes"),
  };

  const cliente = id
    ? await prisma.cliente.update({ where: { id }, data: dados })
    : await prisma.cliente.create({ data: dados });

  revalidatePath("/clientes", "layout");
  return { ok: true, id: cliente.id };
}

export async function alternarAtivoCliente(formData: FormData) {
  if (!(await getFuncionarioLogado())) return;
  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  await prisma.cliente.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/clientes", "layout");
}

const CAMPOS_RECEITA = [
  "tipoLente", "medico",
  "odEsferico", "odCilindrico", "odEixo", "odAdicao", "odPrisma", "odBase",
  "oeEsferico", "oeCilindrico", "oeEixo", "oeAdicao", "oePrisma", "oeBase",
  "dp", "observacoes",
] as const;

export async function salvarReceita(formData: FormData): Promise<Resultado> {
  if (!(await getFuncionarioLogado())) return { erro: "Entre no Painel de novo." };
  const clienteId = Number(formData.get("clienteId"));
  if (!clienteId) return { erro: "Cliente inválido." };

  const dados = Object.fromEntries(CAMPOS_RECEITA.map((k) => [k, opcional(formData, k)])) as Record<
    (typeof CAMPOS_RECEITA)[number],
    string | null
  >;
  const temGrau = ["odEsferico", "odCilindrico", "odAdicao", "oeEsferico", "oeCilindrico", "oeAdicao"].some(
    (k) => dados[k as (typeof CAMPOS_RECEITA)[number]]
  );
  if (!temGrau) return { erro: "Preencha pelo menos o grau (esférico, cilíndrico ou adição) de um dos olhos." };

  const data = texto(formData, "dataReceita");
  const receita = await prisma.receita.create({
    data: { clienteId, ...dados, dataReceita: data ? new Date(data) : null },
  });
  await prisma.cliente.update({ where: { id: clienteId }, data: {} }); // atualiza "atualizadoEm" (sobe na busca)
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true, id: receita.id };
}

export async function excluirReceita(formData: FormData) {
  if (!(await getFuncionarioLogado())) return;
  const id = Number(formData.get("id"));
  const receita = await prisma.receita.delete({ where: { id } });
  revalidatePath(`/clientes/${receita.clienteId}`);
}

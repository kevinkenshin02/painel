"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { caixaAberto, resumoCaixa } from "@/lib/caixa";

type Resultado = { erro?: string; ok?: boolean };
const valorDe = (f: FormData, k: string) => {
  const t = ((f.get(k) as string | null) ?? "").trim().replace(",", ".");
  if (!t) return NaN;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
};

function revalidar() {
  revalidatePath("/caixa", "layout");
  revalidatePath("/vendas/nova");
  revalidatePath("/");
}

export async function abrirCaixa(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado) return { erro: "Entre no Painel de novo." };
  const troco = valorDe(formData, "trocoInicial");
  const observacao = ((formData.get("observacao") as string) ?? "").trim() || null;
  if (!(troco >= 0)) return { erro: "Informe o troco que está na gaveta (pode ser 0)." };

  const erro = await prisma.$transaction(async (tx) => {
    if (await caixaAberto(tx)) return "Já existe um caixa aberto.";
    const caixa = await tx.caixa.create({ data: { trocoInicial: troco, abertoPorId: logado.id, observacaoAbertura: observacao } });
    await tx.movimentoCaixa.create({
      data: { caixaId: caixa.id, tipo: "ABERTURA", formaPagamento: "DINHEIRO", valor: troco, descricao: "Troco inicial", funcionarioId: logado.id },
    });
    return null;
  });
  if (erro) return { erro };
  revalidar();
  return { ok: true };
}

export async function lancarNoCaixa(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado) return { erro: "Entre no Painel de novo." };
  const tipo = formData.get("tipo") as "SANGRIA" | "REFORCO" | "DESPESA";
  const valor = valorDe(formData, "valor");
  const descricao = ((formData.get("descricao") as string) ?? "").trim();
  if (!["SANGRIA", "REFORCO", "DESPESA"].includes(tipo)) return { erro: "Escolha o tipo de lançamento." };
  if (!(valor > 0)) return { erro: "Informe o valor." };
  if (!descricao) return { erro: tipo === "DESPESA" ? "Escreva o que foi pago (ex.: café, motoboy)." : "Escreva o motivo (ex.: depósito no banco)." };

  const caixa = await caixaAberto(prisma);
  if (!caixa) return { erro: "O caixa está fechado. Abra o caixa primeiro." };
  if (tipo !== "REFORCO") {
    const movs = await prisma.movimentoCaixa.findMany({ where: { caixaId: caixa.id } });
    const naGaveta = resumoCaixa(movs).dinheiroEsperado;
    if (valor > naGaveta + 0.009) return { erro: `Só deveria ter R$ ${naGaveta.toFixed(2).replace(".", ",")} de dinheiro na gaveta.` };
  }
  await prisma.movimentoCaixa.create({
    data: {
      caixaId: caixa.id,
      tipo,
      formaPagamento: "DINHEIRO",
      valor: tipo === "REFORCO" ? valor : -valor,
      descricao,
      funcionarioId: logado.id,
    },
  });
  revalidar();
  return { ok: true };
}

export async function fecharCaixa(formData: FormData): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado) return { erro: "Entre no Painel de novo." };
  const contado = valorDe(formData, "dinheiroContado");
  const observacao = ((formData.get("observacao") as string) ?? "").trim() || null;
  if (!(contado >= 0)) return { erro: "Conte o dinheiro da gaveta e informe o valor (pode ser 0)." };

  const caixa = await caixaAberto(prisma);
  if (!caixa) return { erro: "Não há caixa aberto." };
  const movs = await prisma.movimentoCaixa.findMany({ where: { caixaId: caixa.id } });
  const esperado = resumoCaixa(movs).dinheiroEsperado;
  const diferenca = Math.round((contado - esperado) * 100) / 100;
  if (Math.abs(diferenca) >= 0.01 && !observacao) {
    return { erro: `Deu diferença de R$ ${diferenca.toFixed(2).replace(".", ",")}. Escreva uma observação explicando (ex.: troco errado, vale).` };
  }

  await prisma.caixa.update({
    where: { id: caixa.id },
    data: {
      status: "FECHADO",
      fechadoEm: new Date(),
      fechadoPorId: logado.id,
      dinheiroContado: contado,
      dinheiroEsperado: esperado,
      observacaoFechamento: observacao,
    },
  });
  revalidar();
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FormaPagamento } from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { registrarNoCaixa } from "@/lib/caixa";

type Resultado = { erro?: string; ok?: boolean };
const texto = (f: FormData, k: string) => ((f.get(k) as string | null) ?? "").trim();
const valorDe = (f: FormData, k: string) => {
  const t = texto(f, k).replace(",", ".");
  if (!t) return NaN;
  const v = Number(t);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : NaN;
};
const dataDe = (f: FormData, k: string) => {
  const t = texto(f, k);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? new Date(`${t}T00:00:00.000Z`) : null;
};

async function exigirAdmin() {
  const logado = await getFuncionarioLogado();
  return logado?.isAdmin ? logado : null;
}

function revalidar() {
  revalidatePath("/financeiro", "layout");
  revalidatePath("/caixa", "layout");
  revalidatePath("/");
}

export async function criarContaPagar(formData: FormData): Promise<Resultado> {
  const logado = await exigirAdmin();
  if (!logado) return { erro: "Só o administrador mexe no financeiro." };
  const descricao = texto(formData, "descricao");
  const valor = valorDe(formData, "valor");
  const vencimento = dataDe(formData, "vencimento");
  const parcelas = Math.min(24, Math.max(1, Math.trunc(Number(texto(formData, "parcelas")) || 1)));
  if (!descricao) return { erro: "Descreva a conta (ex.: aluguel da máquina, compra de estojos)." };
  if (!(valor > 0)) return { erro: "Informe o valor." };
  if (!vencimento) return { erro: "Informe o vencimento." };

  const valorParcela = Math.round((valor / parcelas) * 100) / 100;
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < parcelas; i++) {
      const venc = new Date(Date.UTC(vencimento.getUTCFullYear(), vencimento.getUTCMonth() + i, vencimento.getUTCDate()));
      // última parcela leva os centavos que sobram
      const v = i === parcelas - 1 ? Math.round((valor - valorParcela * (parcelas - 1)) * 100) / 100 : valorParcela;
      await tx.contaPagar.create({
        data: {
          descricao,
          categoria: texto(formData, "categoria") || null,
          fornecedorId: Number(formData.get("fornecedorId")) || null,
          valor: v,
          vencimento: venc,
          parcela: parcelas > 1 ? `${i + 1}/${parcelas}` : null,
          observacoes: texto(formData, "observacoes") || null,
          funcionarioId: logado.id,
        },
      });
    }
  });
  revalidar();
  return { ok: true };
}

export async function pagarConta(formData: FormData): Promise<Resultado> {
  const logado = await exigirAdmin();
  if (!logado) return { erro: "Só o administrador mexe no financeiro." };
  const id = Number(formData.get("id"));
  const pagoEm = dataDe(formData, "pagoEm");
  const valorPago = valorDe(formData, "valorPago");
  const forma = Object.values(FormaPagamento).includes(texto(formData, "formaPagamento") as FormaPagamento)
    ? (texto(formData, "formaPagamento") as FormaPagamento)
    : FormaPagamento.PIX;
  const peloCaixa = formData.get("pagoPeloCaixa") === "on" && forma === FormaPagamento.DINHEIRO;
  if (!pagoEm) return { erro: "Informe a data do pagamento." };
  if (!(valorPago > 0)) return { erro: "Informe o valor pago." };

  const conta = await prisma.contaPagar.findUnique({ where: { id } });
  if (!conta) return { erro: "Conta não encontrada." };
  if (conta.pagoEm) return { erro: "Essa conta já está paga." };

  await prisma.$transaction(async (tx) => {
    await tx.contaPagar.update({
      where: { id },
      data: { pagoEm, valorPago, formaPagamento: forma, pagoPeloCaixa: peloCaixa },
    });
    if (peloCaixa) {
      await registrarNoCaixa(tx, {
        tipo: "DESPESA",
        formaPagamento: "DINHEIRO",
        valor: -valorPago,
        descricao: `Conta paga: ${conta.descricao}${conta.parcela ? ` (${conta.parcela})` : ""}`,
        funcionarioId: logado.id,
      });
    }
  });
  revalidar();
  return { ok: true };
}

export async function desfazerPagamento(formData: FormData): Promise<Resultado> {
  const logado = await exigirAdmin();
  if (!logado) return { erro: "Só o administrador mexe no financeiro." };
  const conta = await prisma.contaPagar.findUnique({ where: { id: Number(formData.get("id")) } });
  if (!conta?.pagoEm) return { erro: "Essa conta não está paga." };
  if (conta.pagoPeloCaixa) return { erro: "Foi paga com dinheiro do caixa — para desfazer, lance um reforço no caixa e depois desfaça aqui." };
  await prisma.contaPagar.update({ where: { id: conta.id }, data: { pagoEm: null, valorPago: null, formaPagamento: null } });
  revalidar();
  return { ok: true };
}

/** Avulsa: exclui. Despesa fixa/parcela de nota: marca como "não vale neste mês" (não volta sozinha). */
export async function removerConta(formData: FormData): Promise<Resultado> {
  const logado = await exigirAdmin();
  if (!logado) return { erro: "Só o administrador mexe no financeiro." };
  const conta = await prisma.contaPagar.findUnique({ where: { id: Number(formData.get("id")) } });
  if (!conta) return { erro: "Conta não encontrada." };
  if (conta.pagoEm) return { erro: "Desfaça o pagamento antes de remover." };
  if (conta.origem === "AVULSA") await prisma.contaPagar.delete({ where: { id: conta.id } });
  else await prisma.contaPagar.update({ where: { id: conta.id }, data: { cancelada: !conta.cancelada } });
  revalidar();
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { StatusOS, TipoServico } from "@/generated/prisma/enums";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function criarOrdemServico(formData: FormData): Promise<{ erro?: string; ok?: boolean; id?: number }> {
  const dataEntrada = formData.get("dataEntrada") as string;
  const clienteNome = (formData.get("clienteNome") as string)?.trim();
  const clienteWhatsapp = (formData.get("clienteWhatsapp") as string)?.trim();
  const tipoServico = formData.get("tipoServico") as TipoServico;
  const descricao = (formData.get("descricao") as string)?.trim();
  const prazoPrometido = formData.get("prazoPrometido") as string;
  const valorTotal = parseNumber(formData.get("valorTotal"));
  const sinalPago = parseNumber(formData.get("sinalPago"));
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (
    !dataEntrada ||
    !clienteNome ||
    !clienteWhatsapp ||
    !descricao ||
    !prazoPrometido
  ) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (sinalPago > valorTotal) {
    return { erro: "O sinal pago não pode ser maior que o valor total." };
  }

  const os = await prisma.ordemServico.create({
    data: {
      dataEntrada: new Date(dataEntrada),
      clienteNome,
      clienteWhatsapp,
      tipoServico,
      descricao,
      prazoPrometido: new Date(prazoPrometido),
      valorTotal,
      sinalPago,
      observacoes,
    },
  });

  revalidatePath("/ordens-servico", "layout");
  revalidatePath("/");
  return { ok: true, id: os.id };
}

export async function atualizarStatusOrdemServico(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = formData.get("status") as StatusOS;

  if (!id || !Object.values(StatusOS).includes(status)) {
    throw new Error("Dados inválidos para atualização de status.");
  }

  if (status === StatusOS.ENTREGUE) {
    const os = await prisma.ordemServico.findUnique({ where: { id } });
    if (!os) {
      throw new Error("Ordem de serviço não encontrada.");
    }

    await prisma.ordemServico.update({
      where: { id },
      data: {
        status,
        dataEntrega: new Date(),
        sinalPago: os.valorTotal,
      },
    });
  } else {
    await prisma.ordemServico.update({
      where: { id },
      data: {
        status,
        dataEntrega: null,
      },
    });
  }

  revalidatePath("/ordens-servico", "layout");
  revalidatePath("/");
}

export async function excluirOrdemServico(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Ordem de serviço inválida.");
  }

  await prisma.ordemServico.delete({ where: { id } });

  revalidatePath("/ordens-servico", "layout");
  revalidatePath("/");
}

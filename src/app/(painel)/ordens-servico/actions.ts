"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FormaPagamento, StatusOS, TipoServico } from "@/generated/prisma/enums";
import { clienteDaOperacao } from "@/lib/clientes";
import { soDigitos } from "@/lib/format";
import { registrarNoCaixa } from "@/lib/caixa";
import { getFuncionarioLogado } from "@/lib/currentUser";

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function revalidarOS() {
  revalidatePath("/ordens-servico", "layout");
  revalidatePath("/clientes", "layout");
  revalidatePath("/caixa", "layout");
  revalidatePath("/");
}

const formaValida = (v: FormDataEntryValue | null): FormaPagamento =>
  Object.values(FormaPagamento).includes(v as FormaPagamento) ? (v as FormaPagamento) : FormaPagamento.DINHEIRO;

export async function criarOrdemServico(formData: FormData): Promise<{ erro?: string; ok?: boolean; id?: number }> {
  const clienteId = Number(formData.get("clienteId")) || null;
  const dataEntrada = formData.get("dataEntrada") as string;
  const clienteNome = (formData.get("clienteNome") as string)?.trim();
  const clienteWhatsapp = (formData.get("clienteWhatsapp") as string)?.trim();
  const tipoServico = formData.get("tipoServico") as TipoServico;
  const descricao = (formData.get("descricao") as string)?.trim();
  const prazoPrometido = formData.get("prazoPrometido") as string;
  const valorTotal = parseNumber(formData.get("valorTotal"));
  const sinalPago = parseNumber(formData.get("sinalPago"));
  const formaSinal = formaValida(formData.get("formaSinal"));
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (!dataEntrada || !clienteNome || !clienteWhatsapp || !descricao || !prazoPrometido) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (sinalPago < 0 || sinalPago > valorTotal) {
    return { erro: "O sinal pago não pode ser maior que o valor total." };
  }
  const funcionario = await getFuncionarioLogado();

  const os = await prisma.$transaction(async (tx) => {
    // liga a OS ao cadastro do cliente (acha pelo nome + telefone ou cria na hora)
    const cliente = await clienteDaOperacao(tx, { clienteId, nome: clienteNome, telefone: clienteWhatsapp, criarSeNaoExistir: true });
    if (cliente && !cliente.telefone && soDigitos(clienteWhatsapp)) {
      await tx.cliente.update({ where: { id: cliente.id }, data: { telefone: soDigitos(clienteWhatsapp) } });
    }
    const criada = await tx.ordemServico.create({
      data: {
        dataEntrada: new Date(dataEntrada),
        clienteNome: cliente?.nome ?? clienteNome,
        clienteWhatsapp,
        clienteId: cliente?.id ?? null,
        tipoServico,
        descricao,
        prazoPrometido: new Date(prazoPrometido),
        valorTotal,
        sinalPago,
        observacoes,
      },
    });
    if (sinalPago > 0) {
      await tx.pagamentoOS.create({
        data: { ordemServicoId: criada.id, valor: sinalPago, formaPagamento: formaSinal, descricao: "Sinal", funcionarioId: funcionario?.id ?? null },
      });
      await registrarNoCaixa(tx, {
        tipo: "RECEBIMENTO_OS",
        formaPagamento: formaSinal,
        valor: sinalPago,
        descricao: `Sinal da OS nº ${criada.id} — ${criada.clienteNome}`,
        ordemServicoId: criada.id,
        funcionarioId: funcionario?.id ?? null,
      });
    }
    return criada;
  });

  revalidarOS();
  return { ok: true, id: os.id };
}

/** Recebe um valor da OS (sinal, parte ou o restante) e, se pedido, já marca como entregue. */
export async function receberPagamentoOS(formData: FormData): Promise<{ erro?: string; ok?: boolean }> {
  const id = Number(formData.get("id"));
  const valor = Math.round(parseNumber(formData.get("valor")) * 100) / 100;
  const forma = formaValida(formData.get("formaPagamento"));
  const entregar = formData.get("entregar") === "true";
  const funcionario = await getFuncionarioLogado();
  if (!funcionario) return { erro: "Entre no Painel de novo." };

  const os = await prisma.ordemServico.findUnique({ where: { id } });
  if (!os) return { erro: "Ordem de serviço não encontrada." };
  const restante = Math.round((os.valorTotal - os.sinalPago) * 100) / 100;
  if (valor < 0 || valor > restante + 0.009) return { erro: `O valor precisa ser entre R$ 0,00 e o que falta (R$ ${restante.toFixed(2).replace(".", ",")}).` };
  if (valor === 0 && !entregar) return { erro: "Informe o valor recebido." };
  if (entregar && valor < restante - 0.009) {
    return { erro: "Para entregar, receba o que falta (ou ajuste o valor total da OS)." };
  }

  await prisma.$transaction(async (tx) => {
    if (valor > 0) {
      await tx.pagamentoOS.create({
        data: {
          ordemServicoId: os.id,
          valor,
          formaPagamento: forma,
          descricao: entregar ? "Restante na entrega" : "Pagamento",
          funcionarioId: funcionario.id,
        },
      });
      await registrarNoCaixa(tx, {
        tipo: "RECEBIMENTO_OS",
        formaPagamento: forma,
        valor,
        descricao: `${entregar ? "Entrega" : "Pagamento"} da OS nº ${os.id} — ${os.clienteNome}`,
        ordemServicoId: os.id,
        funcionarioId: funcionario.id,
      });
    }
    await tx.ordemServico.update({
      where: { id: os.id },
      data: {
        sinalPago: Math.min(os.valorTotal, os.sinalPago + valor),
        ...(entregar ? { status: StatusOS.ENTREGUE, dataEntrega: new Date() } : {}),
      },
    });
  });

  revalidarOS();
  return { ok: true };
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
    const funcionario = await getFuncionarioLogado();
    const restante = Math.round((os.valorTotal - os.sinalPago) * 100) / 100;

    await prisma.$transaction(async (tx) => {
      // entregue sem passar pelo "Receber": o que faltava conta como pago, forma não informada
      if (restante > 0) {
        await tx.pagamentoOS.create({
          data: {
            ordemServicoId: os.id,
            valor: restante,
            formaPagamento: FormaPagamento.OUTRO,
            descricao: "Restante marcado como pago na entrega (forma não informada)",
            funcionarioId: funcionario?.id ?? null,
          },
        });
        await registrarNoCaixa(tx, {
          tipo: "RECEBIMENTO_OS",
          formaPagamento: FormaPagamento.OUTRO,
          valor: restante,
          descricao: `Entrega da OS nº ${os.id} — ${os.clienteNome} (forma não informada)`,
          ordemServicoId: os.id,
          funcionarioId: funcionario?.id ?? null,
        });
      }
      await tx.ordemServico.update({
        where: { id },
        data: { status, dataEntrega: new Date(), sinalPago: os.valorTotal },
      });
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

  revalidarOS();
}

export async function excluirOrdemServico(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Ordem de serviço inválida.");
  }
  const funcionario = await getFuncionarioLogado();

  await prisma.$transaction(async (tx) => {
    const os = await tx.ordemServico.findUnique({ where: { id } });
    if (!os) return;
    // o que foi recebido desta OS pelo caixa sai de novo (estorno), por forma de pagamento
    const noCaixa = await tx.movimentoCaixa.findMany({ where: { ordemServicoId: id, tipo: { in: ["RECEBIMENTO_OS", "ESTORNO"] } } });
    for (const forma of new Set(noCaixa.map((m) => m.formaPagamento))) {
      const liquido = noCaixa.filter((m) => m.formaPagamento === forma).reduce((s, m) => s + m.valor, 0);
      if (liquido > 0.004) {
        await registrarNoCaixa(tx, {
          tipo: "ESTORNO",
          formaPagamento: forma,
          valor: -liquido,
          descricao: `OS nº ${id} excluída — ${os.clienteNome}`,
          ordemServicoId: id,
          funcionarioId: funcionario?.id ?? null,
        });
      }
    }
    await tx.ordemServico.delete({ where: { id } });
  });

  revalidarOS();
}

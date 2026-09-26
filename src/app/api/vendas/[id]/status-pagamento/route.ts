import { prisma } from "@/lib/prisma";
import { consultarCobranca } from "@/lib/mercadopago";
import { registrarNoCaixa } from "@/lib/caixa";
import { StatusPagamento } from "@/generated/prisma/enums";

function mapStatus(mpStatus: string): StatusPagamento {
  switch (mpStatus) {
    case "processed":
      return StatusPagamento.PAGO;
    case "canceled":
    case "refunded":
      return StatusPagamento.CANCELADO;
    default:
      return StatusPagamento.PENDENTE;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const venda = await prisma.venda.findUnique({ where: { id: Number(id) } });

  if (!venda) {
    return Response.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  if (!venda.mercadoPagoOrderId || venda.statusPagamento !== StatusPagamento.PENDENTE) {
    return Response.json({ statusPagamento: venda.statusPagamento });
  }

  const order = await consultarCobranca(venda.mercadoPagoOrderId);
  const statusPagamento = mapStatus(order.status);

  if (statusPagamento !== venda.statusPagamento) {
    await prisma.$transaction(async (tx) => {
      await tx.venda.update({ where: { id: venda.id }, data: { statusPagamento } });
      // cartão aprovado: agora sim entra no caixa (uma vez só)
      if (statusPagamento === StatusPagamento.PAGO) {
        const ja = await tx.movimentoCaixa.findFirst({ where: { vendaId: venda.id, tipo: "VENDA" } });
        if (!ja) {
          await registrarNoCaixa(tx, {
            tipo: "VENDA",
            formaPagamento: venda.formaPagamento,
            valor: venda.valorVendido,
            descricao: `Venda nº ${venda.id} — ${venda.descricao}`,
            vendaId: venda.id,
            funcionarioId: venda.funcionarioId,
          });
        }
      }
    });
  }

  return Response.json({ statusPagamento, detalhe: order.status_detail });
}

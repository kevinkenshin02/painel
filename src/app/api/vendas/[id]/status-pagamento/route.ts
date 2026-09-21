import { prisma } from "@/lib/prisma";
import { consultarCobranca } from "@/lib/mercadopago";
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
    await prisma.venda.update({ where: { id: venda.id }, data: { statusPagamento } });
  }

  return Response.json({ statusPagamento, detalhe: order.status_detail });
}

import { consultarCobranca } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const orderId: string | undefined = payload?.data?.id;

  if (!orderId) {
    return Response.json({ ok: true });
  }

  // Nunca confiar no status vindo do payload do webhook — sempre reconsultar
  // a cobrança direto na API do Mercado Pago antes de aplicar qualquer mudança.
  const order = await consultarCobranca(orderId);

  console.log(
    `[mercadopago] pedido ${order.id} (${order.external_reference}) -> ${order.status}`
  );

  // Quando o módulo de Vendas existir, é aqui que a venda correspondente
  // (localizada por order.external_reference) será marcada como paga.

  return Response.json({ ok: true });
}

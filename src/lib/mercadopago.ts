const MP_API_BASE = "https://api.mercadopago.com";
const VIRTUAL_TERMINAL_ID = "NEWLAND_N950__SBX0000001";

function isTestMode() {
  return process.env.MP_POINT_TEST_MODE === "true";
}

function getAccessToken() {
  const token = isTestMode()
    ? process.env.MERCADOPAGO_ACCESS_TOKEN
    : process.env.MERCADOPAGO_ACCESS_TOKEN_PRODUCTION;
  if (!token) {
    const nomeVar = isTestMode() ? "MERCADOPAGO_ACCESS_TOKEN" : "MERCADOPAGO_ACCESS_TOKEN_PRODUCTION";
    throw new Error(`${nomeVar} não configurado no .env.`);
  }
  return token;
}

function resolveTerminalId() {
  if (isTestMode()) {
    return VIRTUAL_TERMINAL_ID;
  }
  const terminalId = process.env.MP_POINT_TERMINAL_ID;
  if (!terminalId) {
    throw new Error(
      "MP_POINT_TERMINAL_ID não configurado. Associe a Point Smart 2 à conta de produção e defina essa variável antes de cobrar de verdade."
    );
  }
  return terminalId;
}

async function mpFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${MP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago API ${res.status}: ${body}`);
  }

  return res;
}

export type MercadoPagoOrderStatus =
  | "created"
  | "at_terminal"
  | "processed"
  | "canceled"
  | "refunded";

export type MercadoPagoOrder = {
  id: string;
  status: MercadoPagoOrderStatus;
  status_detail: string;
  external_reference: string;
  total_paid_amount?: string;
  transactions: {
    payments: Array<{ id: string; amount: string; status: string }>;
  };
};

export async function criarCobrancaPoint(params: {
  valor: number;
  referenciaExterna: string;
}): Promise<MercadoPagoOrder> {
  const res = await mpFetch("/v1/orders", {
    method: "POST",
    headers: { "X-Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({
      type: "point",
      external_reference: params.referenciaExterna,
      transactions: { payments: [{ amount: params.valor.toFixed(2) }] },
      config: { point: { terminal_id: resolveTerminalId() } },
    }),
  });

  return res.json();
}

export async function consultarCobranca(orderId: string): Promise<MercadoPagoOrder> {
  const res = await mpFetch(`/v1/orders/${orderId}`);
  return res.json();
}

/**
 * Só funciona com credenciais de teste — o terminal virtual não processa
 * pagamentos reais, então o resultado precisa ser simulado manualmente.
 */
export async function simularEventoCobranca(
  orderId: string,
  status: Extract<MercadoPagoOrderStatus, "processed" | "canceled" | "refunded">
) {
  if (!isTestMode()) {
    throw new Error("Simulação de eventos só é permitida com MP_POINT_TEST_MODE=true.");
  }

  await mpFetch(`/v1/orders/${orderId}/events`, {
    method: "POST",
    headers: { "X-Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ status }),
  });
}

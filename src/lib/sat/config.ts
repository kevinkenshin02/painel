/**
 * Configuração do equipamento SAT. Dados sensíveis (código de ativação e
 * assinatura AC) ficam só no .env, nunca no banco — mesmo critério usado para
 * os tokens do Mercado Pago em src/lib/mercadopago.ts.
 */

export function isSatTestMode() {
  return process.env.SAT_TEST_MODE === "true";
}

function obrigatoria(nome: string) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `${nome} não configurado no .env. Sem isso o painel não consegue falar com o equipamento SAT.`
    );
  }
  return valor;
}

export function getSatDllPath() {
  return obrigatoria("SAT_DLL_PATH");
}

export function getCodigoAtivacao() {
  return obrigatoria("SAT_CODIGO_ATIVACAO");
}

/** Assinatura do AC (software house) sobre CNPJ da SH + CNPJ do emitente. */
export function getAssinaturaAC() {
  return obrigatoria("SAT_ASSINATURA_AC");
}

/** CNPJ da software house — vai no bloco <ide> do CF-e. */
export function getCnpjSoftwareHouse() {
  return obrigatoria("SAT_CNPJ_SOFTWARE_HOUSE");
}

export function getNumeroCaixa() {
  const valor = process.env.SAT_NUMERO_CAIXA ?? "1";
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 999) {
    throw new Error("SAT_NUMERO_CAIXA deve ser um número inteiro de 0 a 999.");
  }
  return numero;
}

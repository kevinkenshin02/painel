const SECRET = process.env.SESSION_SECRET ?? "oticas-tanaka-dev-secret-troque-isso";
export const SESSION_COOKIE = "sessao_funcionario";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function assinar(valor: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = await crypto.subtle.sign("HMAC", key, encoder.encode(valor));
  return toHex(assinatura);
}

export async function criarCookieSessao(funcionarioId: number) {
  const valor = String(funcionarioId);
  const assinatura = await assinar(valor);
  return `${valor}.${assinatura}`;
}

export async function lerFuncionarioIdDoCookie(cookieValue: string | undefined): Promise<number | null> {
  if (!cookieValue) return null;
  const [valor, assinatura] = cookieValue.split(".");
  if (!valor || !assinatura) return null;

  const assinaturaEsperada = await assinar(valor);
  if (assinatura !== assinaturaEsperada) return null;

  const id = Number(valor);
  return Number.isFinite(id) ? id : null;
}

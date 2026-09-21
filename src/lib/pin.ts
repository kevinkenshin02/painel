function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function derivar(pin: string, salt: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${pin}`));
  return toHex(digest);
}

export async function hashPin(pin: string) {
  const salt = randomSalt();
  const hash = await derivar(pin, salt);
  return { salt, hash };
}

export async function verificarPin(pin: string, salt: string, hashEsperado: string) {
  const hash = await derivar(pin, salt);
  return hash === hashEsperado;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { iniciarRelayConsulta } = await import("./lib/consulta-relay-painel");
  iniciarRelayConsulta();
}

export function montarLinkWhatsApp(telefone: string, mensagem: string) {
  const digits = telefone.replace(/\D/g, "");
  const comCodigoPais = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${comCodigoPais}?text=${encodeURIComponent(mensagem)}`;
}

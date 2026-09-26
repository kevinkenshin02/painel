import type { Prisma } from "@/generated/prisma/client";
import { soDigitos } from "./format";

type Tx = Prisma.TransactionClient;

/**
 * Para a OS e a venda: usa o cliente escolhido na busca; se não escolheram ninguém,
 * procura pelo mesmo nome + telefone e, se não achar, cria o cadastro.
 */
export async function clienteDaOperacao(
  tx: Tx,
  dados: { clienteId?: number | null; nome: string; telefone?: string | null; criarSeNaoExistir: boolean }
) {
  if (dados.clienteId) {
    const c = await tx.cliente.findUnique({ where: { id: dados.clienteId } });
    if (c) return c;
  }
  const nome = dados.nome.trim();
  const telefone = soDigitos(dados.telefone);
  if (!nome) return null;

  const candidatos = await tx.cliente.findMany({ where: telefone ? { telefone } : { telefone: "" } });
  const mesmo = candidatos.find((c) => c.nome.trim().toLowerCase() === nome.toLowerCase());
  if (mesmo) return mesmo;
  if (!dados.criarSeNaoExistir) return null;
  return tx.cliente.create({ data: { nome, telefone } });
}

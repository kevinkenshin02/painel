import type { Prisma } from "@/generated/prisma/client";
import type { MecanismoRelogio, PublicoRelogio, TipoMovimento, TipoProduto } from "@/generated/prisma/enums";

export const TIPO_PRODUTO_LABELS: Record<TipoProduto, string> = {
  RELOGIO: "Relógio",
  ARMACAO: "Armação",
  OCULOS_SOL: "Óculos de sol",
  LENTE_PRONTA: "Lente pronta",
  LENTE_CONTATO: "Lente de contato",
  PULSEIRA: "Pulseira",
  BATERIA: "Bateria",
  ACESSORIO: "Acessório",
  OUTRO: "Outro",
};

export const PUBLICO_LABELS: Record<PublicoRelogio, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  INFANTIL: "Infantil",
  UNISSEX: "Unissex",
};

export const MECANISMO_LABELS: Record<MecanismoRelogio, string> = {
  ANALOGICO: "Analógico",
  AUTOMATICO: "Automático",
  DIGITAL: "Digital",
  SMART: "Smart",
  OUTRO: "Outro",
};

export const TIPO_MOVIMENTO_LABELS: Record<TipoMovimento, string> = {
  CADASTRO: "Cadastro",
  ENTRADA: "Entrada",
  SAIDA_VENDA: "Venda",
  ESTORNO_VENDA: "Venda excluída (volta ao estoque)",
  AJUSTE: "Ajuste",
  CONFERENCIA: "Conferência",
};

/** Marcas que a loja trabalha (sugestões no cadastro; dá para digitar outra). */
export const MARCAS_SUGERIDAS = ["Orient", "Magnum", "Cosmos", "Lince", "Champion", "X-Watch", "Skmei", "Tuguir", "Weide", "Oslo"];

/** Nome do produto para mostrar em listas e na venda: "Orient 469SS080NH D1SX". */
export function nomeProduto(p: { marca: string | null; descricao: string }) {
  const marca = p.marca?.trim();
  if (!marca) return p.descricao;
  return p.descricao.toLowerCase().startsWith(marca.toLowerCase()) ? p.descricao : `${marca} ${p.descricao}`;
}

/** Item ativo zerado ou abaixo do mínimo definido na ficha. */
export function precisaAtencao(p: { quantidade: number; estoqueMinimo: number; ativo: boolean }) {
  return p.ativo && (p.quantidade <= 0 || (p.estoqueMinimo > 0 && p.quantidade < p.estoqueMinimo));
}

type Tx = Prisma.TransactionClient;

/**
 * Mexe no estoque de um produto e registra o movimento com o saldo depois.
 * `delta` positivo entra, negativo sai. Recusa deixar o estoque negativo (a não ser que `permitirNegativo`).
 */
export async function movimentarEstoque(
  tx: Tx,
  dados: {
    produtoId: number;
    delta: number;
    tipo: TipoMovimento;
    motivo?: string | null;
    vendaId?: number | null;
    funcionarioId?: number | null;
    custoUnitario?: number | null;
    permitirNegativo?: boolean;
  }
) {
  const produto = await tx.produto.findUnique({ where: { id: dados.produtoId } });
  if (!produto) throw new Error("Produto não encontrado.");
  const saldo = produto.quantidade + dados.delta;
  if (saldo < 0 && !dados.permitirNegativo) {
    throw new Error(`Estoque insuficiente de ${nomeProduto(produto)} (tem ${produto.quantidade}).`);
  }
  await tx.produto.update({ where: { id: produto.id }, data: { quantidade: saldo } });
  await tx.movimentoEstoque.create({
    data: {
      produtoId: produto.id,
      tipo: dados.tipo,
      quantidade: dados.delta,
      saldo,
      custoUnitario: dados.custoUnitario ?? null,
      motivo: dados.motivo ?? null,
      vendaId: dados.vendaId ?? null,
      funcionarioId: dados.funcionarioId ?? null,
    },
  });
  return saldo;
}

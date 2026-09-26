/**
 * Relógio costuma ter 1 peça por modelo, então "estoque baixo" por quantidade fixa marcava quase tudo.
 * Por enquanto o aviso é só para item ativo zerado; o estoque mínimo por produto vem com o cadastro de Produtos.
 */
export function semEstoque(item: { quantidade: number; ativo: boolean }) {
  return item.ativo && item.quantidade <= 0;
}

import {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusPagamento,
} from "@/generated/prisma/enums";

export const CATEGORIA_VENDA_LABELS: Record<CategoriaVenda, string> = {
  OCULOS_COMPLETO: "Óculos completo",
  SO_ARMACAO: "Só armação",
  SO_LENTE: "Só lente",
  RELOGIO: "Relógio",
  CONSERTO_RELOGIO: "Conserto de relógio",
  BATERIA: "Bateria",
  ACESSORIO: "Acessório",
  OUTRO: "Outro",
};

export const CANAL_ORIGEM_LABELS: Record<CanalOrigem, string> = {
  GOOGLE_MAPS: "Google Maps",
  PASSOU_EM_FRENTE: "Passou em frente",
  INDICACAO: "Indicação",
  CLIENTE_ANTIGO: "Cliente antigo",
  INSTAGRAM: "Instagram",
  SITE: "Site",
  OUTRO: "Outro",
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  OUTRO: "Outro",
};

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  PAGO: "Pago",
  PENDENTE: "Aguardando maquininha",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};

export const STATUS_PAGAMENTO_BADGE_CLASSES: Record<StatusPagamento, string> = {
  PAGO: "bg-[#e3f1e8] text-[#3a8f5b]",
  PENDENTE: "bg-[#fdf0d5] text-[#c98a1f]",
  RECUSADO: "bg-[#fde8e2] text-[#c0472b]",
  CANCELADO: "bg-[#f3ede4] text-[#6b6157]",
};

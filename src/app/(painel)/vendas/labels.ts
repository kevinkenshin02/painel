import {
  CanalOrigem,
  CategoriaVenda,
  FormaPagamento,
  StatusPagamento,
} from "@/generated/prisma/enums";
import type { Tom } from "@/components/ui/Etiqueta";

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
  CARTAO_MAQUININHA: "Cartão (maquininha)",
  OUTRO: "Outro",
};

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  PAGO: "Pago",
  PENDENTE: "Aguardando maquininha",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};

export const STATUS_PAGAMENTO_TOM: Record<StatusPagamento, Tom> = {
  PAGO: "sucesso",
  PENDENTE: "aviso",
  RECUSADO: "perigo",
  CANCELADO: "neutro",
};

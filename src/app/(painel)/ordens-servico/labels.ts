import { StatusOS, TipoServico } from "@/generated/prisma/enums";

export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  VISAO_SIMPLES: "Visão Simples",
  MULTIFOCAL: "Multifocal",
  ALTO_PADRAO_BRASLAB: "Alto Padrão (Braslab)",
  CONSERTO_RELOGIO: "Conserto de Relógio",
  TROCA_PULSEIRA_BATERIA: "Troca de Pulseira/Bateria",
  AJUSTE_ARMACAO: "Ajuste de Armação",
  OUTRO: "Outro",
};

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
  RECEBIDO: "Recebido",
  NO_LABORATORIO_BANCADA: "No laboratório/bancada",
  PRONTO_PARA_AVISAR: "Pronto",
  CLIENTE_AVISADO: "Cliente avisado",
  ENTREGUE: "Entregue",
};

export const STATUS_OS_ORDER: StatusOS[] = [
  StatusOS.RECEBIDO,
  StatusOS.NO_LABORATORIO_BANCADA,
  StatusOS.PRONTO_PARA_AVISAR,
  StatusOS.CLIENTE_AVISADO,
  StatusOS.ENTREGUE,
];

export const STATUS_OS_BADGE_CLASSES: Record<StatusOS, string> = {
  RECEBIDO: "bg-[#f3ede4] text-[#6b6157]",
  NO_LABORATORIO_BANCADA: "bg-[#fdf0d5] text-[#c98a1f]",
  PRONTO_PARA_AVISAR: "bg-[#fde8e2] text-[#c0472b]",
  CLIENTE_AVISADO: "bg-[#fdeccb] text-[#a5631a]",
  ENTREGUE: "bg-[#e3f1e8] text-[#3a8f5b]",
};

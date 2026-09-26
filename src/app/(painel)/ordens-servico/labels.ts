import { StatusOS, TipoServico } from "@/generated/prisma/enums";
import type { Tom } from "@/components/ui/Etiqueta";

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

export const STATUS_OS_TOM: Record<StatusOS, Tom> = {
  RECEBIDO: "neutro",
  NO_LABORATORIO_BANCADA: "aviso",
  PRONTO_PARA_AVISAR: "ouro",
  CLIENTE_AVISADO: "info",
  ENTREGUE: "sucesso",
};

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { STATUS_OS_LABELS, TIPO_SERVICO_LABELS } from "@/app/(painel)/ordens-servico/labels";
import { iniciarRelay } from "./consulta-relay";

/**
 * Liga o Painel ao site da consulta online (só se CONSULTA_RELAY_URL e CONSULTA_RELAY_SECRET estiverem no .env).
 * CONSULTA_RELAY_URL=https://tanakaotica.com.br/api/painel/os ; CONSULTA_RELAY_SECRET = a mesma PAINEL_SECRET do site.
 * Roda uma vez quando o servidor do Painel sobe (ver src/instrumentation.ts) e não trava a abertura do Painel.
 */
export function iniciarRelayConsulta() {
  const url = process.env.CONSULTA_RELAY_URL;
  const secret = process.env.CONSULTA_RELAY_SECRET;
  if (!url || !secret) return;

  const g = globalThis as { __consultaRelay?: unknown };
  if (g.__consultaRelay) return;

  g.__consultaRelay = iniciarRelay({
    url,
    secret,
    lerOs: async (desde) => {
      const lista = await prisma.ordemServico.findMany({
        where: desde ? { atualizadoEm: { gte: desde } } : undefined,
      });
      return lista.map((o) => ({
        id: o.id,
        clienteWhatsapp: o.clienteWhatsapp,
        tipo: TIPO_SERVICO_LABELS[o.tipoServico],
        status: o.status,
        statusLabel: STATUS_OS_LABELS[o.status],
        entrada: formatDate(o.dataEntrada),
        prazo: formatDate(o.prazoPrometido),
        valorTotal: o.valorTotal,
        sinalPago: o.sinalPago,
        atualizadoEm: o.atualizadoEm,
      }));
    },
  });
}

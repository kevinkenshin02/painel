import crypto from "node:crypto";

/**
 * Cliente da consulta online: o Painel manda (HTTP POST) para o site da loja uma cópia enxuta das OS,
 * para o cliente consultar em tanakaotica.com.br/consulta-os mesmo com o Painel fechado.
 * Aqui não tem nada do Next nem do banco: quem lê as OS é quem chama.
 * Vai para a nuvem só o necessário: número da OS, tipo, situação, datas e valores; o telefone vai EMBARALHADO (HMAC) e o nome nunca vai.
 */

export type OsPainel = {
  id: number;
  clienteWhatsapp: string;
  tipo: string;
  status: string;
  statusLabel: string;
  entrada: string;
  prazo: string;
  valorTotal: number;
  sinalPago: number;
  atualizadoEm: Date;
};

export type OpcoesRelay = {
  url: string;
  secret: string;
  /** Sem `desde`: todas as OS. Com `desde`: as alteradas a partir dessa data. */
  lerOs: (desde?: Date) => Promise<OsPainel[]>;
  log?: (mensagem: string) => void;
};

// mesma regra do serviço: só dígitos, sem o 55 do país
export function normalizarTelefone(v: string) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

const INTERVALO_MUDANCAS_MS = 15_000;
const INTERVALO_SNAPSHOT_MS = 15 * 60_000;
const TEMPO_LIMITE_MS = 60_000;

export function iniciarRelay({ url, secret, lerOs, log = (m) => console.log(`[consulta-online] ${m}`) }: OpcoesRelay) {
  let parado = false;
  let ocupado = false;
  // true até a primeira lista completa chegar ao site (e de novo se uma falhar): enquanto isso, cada ciclo tenta a lista completa
  let precisaSnapshot = true;
  let noAr: boolean | null = null;
  let marca = new Date(0);
  const enviados = new Map<number, string>();

  const paraNuvem = (o: OsPainel) => ({
    id: o.id,
    tel: crypto.createHmac("sha256", secret).update(normalizarTelefone(o.clienteWhatsapp)).digest("hex"),
    tipo: o.tipo,
    status: o.status,
    statusLabel: o.statusLabel,
    entrada: o.entrada,
    prazo: o.prazo,
    total: o.valorTotal,
    sinal: o.sinalPago,
    atualizado: o.atualizadoEm.toISOString(),
  });
  const consultavel = (o: OsPainel) => normalizarTelefone(o.clienteWhatsapp).length >= 10;
  const avancarMarca = (lista: OsPainel[]) => { for (const o of lista) if (o.atualizadoEm > marca) marca = o.atualizadoEm; };

  /** Manda para o site; true só se ele confirmou que gravou. Loga só quando muda (não enche o log a cada 15 s). */
  async function enviar(type: "snapshot" | "upsert", lista: OsPainel[]) {
    let erro = "";
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
        body: JSON.stringify({ type, os: lista.map(paraNuvem) }),
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      });
      const r = (await resp.json().catch(() => ({}))) as { ok?: boolean; motivo?: string };
      if (resp.ok && r.ok) {
        if (noAr !== true) log(noAr === null ? "conectado ao site" : "conectado de novo ao site");
        noAr = true;
        return true;
      }
      erro = resp.status === 401 ? "chave recusada (confira CONSULTA_RELAY_SECRET)" : `o site recusou os dados: ${r.motivo ?? `HTTP ${resp.status}`}`;
    } catch (e) {
      erro = `site fora do ar: ${(e as Error).message}`;
    }
    if (noAr !== false) log(`${erro}; tento de novo a cada ${INTERVALO_MUDANCAS_MS / 1000} s`);
    noAr = false;
    return false;
  }

  async function snapshot() {
    const todas = (await lerOs()).filter(consultavel);
    if (!(await enviar("snapshot", todas))) { precisaSnapshot = true; return; }
    precisaSnapshot = false;
    enviados.clear();
    for (const o of todas) enviados.set(o.id, o.atualizadoEm.toISOString());
    marca = new Date(0);
    avancarMarca(todas);
  }

  async function mudancas() {
    const recentes = (await lerOs(new Date(marca.getTime() - 5000))).filter(consultavel);
    const novas = recentes.filter((o) => enviados.get(o.id) !== o.atualizadoEm.toISOString());
    if (!novas.length) return;
    // só marca como enviada depois que o site confirmou: se falhar, vai de novo no próximo ciclo
    if (!(await enviar("upsert", novas))) return;
    for (const o of novas) enviados.set(o.id, o.atualizadoEm.toISOString());
    avancarMarca(novas);
  }

  async function ciclo(completo: boolean) {
    if (ocupado || parado) return;
    ocupado = true;
    try {
      if (completo || precisaSnapshot) await snapshot();
      else await mudancas();
    } catch (e) {
      log(`falha ao ler as OS: ${(e as Error).message}`);
    } finally {
      ocupado = false;
    }
  }

  try {
    new URL(url);
  } catch {
    log(`endereço inválido em CONSULTA_RELAY_URL: ${url}`);
    return { parar() {} };
  }
  if (!/^https?:/.test(url)) log("CONSULTA_RELAY_URL deve ser o endereço https do site (ex.: https://tanakaotica.com.br/api/painel/os)");

  void ciclo(true);
  const timerMudancas = setInterval(() => void ciclo(false), INTERVALO_MUDANCAS_MS);
  const timerSnapshot = setInterval(() => void ciclo(true), INTERVALO_SNAPSHOT_MS);

  return {
    parar() {
      parado = true;
      clearInterval(timerMudancas);
      clearInterval(timerSnapshot);
    },
  };
}

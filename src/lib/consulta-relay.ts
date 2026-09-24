import crypto from "node:crypto";

/**
 * Cliente da consulta online: o Painel conecta (WebSocket) no serviço publicado e mantém lá uma cópia enxuta das OS,
 * para o cliente consultar mesmo com o Painel fechado. Aqui não tem nada do Next nem do banco: quem lê as OS é quem chama.
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

export function iniciarRelay({ url, secret, lerOs, log = (m) => console.log(`[consulta-online] ${m}`) }: OpcoesRelay) {
  let ws: WebSocket | null = null;
  let parado = false;
  let tentativa = 0;
  let timerMudancas: ReturnType<typeof setInterval> | undefined;
  let timerSnapshot: ReturnType<typeof setInterval> | undefined;
  let timerReconexao: ReturnType<typeof setTimeout> | undefined;
  let ocupado = false;
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
  const enviar = (msg: object) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
  const avancarMarca = (lista: OsPainel[]) => { for (const o of lista) if (o.atualizadoEm > marca) marca = o.atualizadoEm; };

  async function snapshot() {
    if (ocupado) return;
    ocupado = true;
    try {
      const todas = (await lerOs()).filter(consultavel);
      enviados.clear();
      for (const o of todas) enviados.set(o.id, o.atualizadoEm.toISOString());
      marca = new Date(0);
      avancarMarca(todas);
      enviar({ type: "snapshot", os: todas.map(paraNuvem) });
    } catch (e) {
      log(`falha ao ler as OS: ${(e as Error).message}`);
    } finally {
      ocupado = false;
    }
  }

  async function mudancas() {
    if (ocupado) return;
    ocupado = true;
    try {
      const recentes = (await lerOs(new Date(marca.getTime() - 5000))).filter(consultavel);
      const novas = recentes.filter((o) => enviados.get(o.id) !== o.atualizadoEm.toISOString());
      if (!novas.length) return;
      for (const o of novas) enviados.set(o.id, o.atualizadoEm.toISOString());
      avancarMarca(novas);
      enviar({ type: "upsert", os: novas.map(paraNuvem) });
    } catch (e) {
      log(`falha ao ler as alterações: ${(e as Error).message}`);
    } finally {
      ocupado = false;
    }
  }

  function limparTimers() {
    clearInterval(timerMudancas);
    clearInterval(timerSnapshot);
  }

  function reconectar() {
    limparTimers();
    if (parado || timerReconexao) return;
    const espera = Math.min(30_000, 2000 * 2 ** Math.min(tentativa, 5));
    tentativa += 1;
    timerReconexao = setTimeout(() => { timerReconexao = undefined; conectar(); }, espera);
  }

  function conectar() {
    if (parado) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (e) {
      log(`endereço inválido: ${(e as Error).message}`);
      return;
    }
    ws = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "auth", secret }));
    socket.onmessage = (ev) => {
      let m: { type?: string; motivo?: string };
      try { m = JSON.parse(String(ev.data)); } catch { return; }
      if (m.type === "hello") {
        if (tentativa > 0) log("conectado");
        else log("conectado ao site");
        tentativa = 0;
        void snapshot();
        timerMudancas = setInterval(() => void mudancas(), INTERVALO_MUDANCAS_MS);
        timerSnapshot = setInterval(() => void snapshot(), INTERVALO_SNAPSHOT_MS);
      } else if (m.type === "erro") {
        log(`o site recusou os dados: ${m.motivo ?? "?"}`);
      }
    };
    socket.onclose = () => { if (ws === socket) { limparTimers(); reconectar(); } };
    socket.onerror = () => { /* o onclose cuida da reconexão */ };
  }

  conectar();

  return {
    parar() {
      parado = true;
      limparTimers();
      clearTimeout(timerReconexao);
      try { ws?.close(); } catch { /* já fechado */ }
    },
  };
}

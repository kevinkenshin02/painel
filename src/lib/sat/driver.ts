/**
 * Contrato com o equipamento SAT-CF-e.
 *
 * As funções e o formato de retorno são padronizados pela SEFAZ-SP (ER SAT),
 * então valem igual para qualquer fabricante — inclusive o Control iD usado na
 * loja. O que muda por fabricante é só o arquivo .dll (SAT_DLL_PATH).
 *
 * Só estão aqui as funções que o painel realmente usa hoje. As outras da
 * especificação (ativação, bloqueio, troca de código de ativação, extração de
 * logs) são feitas pelo software do próprio fabricante.
 */

export type SatResponse = {
  /** Retorno bruto, delimitado por "|" — guardado para auditoria. */
  raw: string;
  numeroSessao: string;
  /** Código de retorno de 5 dígitos (EEEEE). Ex.: "06000" = CF-e autorizado. */
  codigo: string;
  mensagem: string;
  /** Campos restantes, na ordem em que o equipamento devolveu. */
  campos: string[];
};

export interface SatDriver {
  /** Verifica se o equipamento está respondendo. Sucesso = 08000. */
  consultarSAT(): Promise<SatResponse>;
  /** Transmite o CF-e de venda. Sucesso = 06000. */
  enviarDadosVenda(xmlVenda: string): Promise<SatResponse>;
}

export const RETORNO_SAT_OK = "08000";
export const RETORNO_VENDA_AUTORIZADA = "06000";

/** A ER SAT exige um número de sessão aleatório de 6 dígitos por chamada. */
export function gerarNumeroSessao() {
  return Math.floor(100000 + Math.random() * 900000);
}

export function parseRetornoSat(raw: string): SatResponse {
  const partes = raw.split("|");
  return {
    raw,
    numeroSessao: partes[0] ?? "",
    codigo: partes[1] ?? "",
    mensagem: partes[2] ?? "",
    campos: partes.slice(3),
  };
}

/**
 * Posições dos campos do retorno de EnviarDadosVenda, conforme a ER SAT:
 * numeroSessao|EEEEE|mensagem|cod|mensagemSEFAZ|arquivoCFeSAT|timeStamp|
 * chaveConsulta|valorTotalCFe|CPFCNPJValue|assinaturaQRCODE
 *
 * TODO(verificar spec): confirmar a ordem exata contra o manual do integrador
 * do Control iD antes de emitir cupom de verdade — a especificação teve
 * revisões e alguns fabricantes acrescentam campos no fim.
 */
export function parseRetornoVenda(resposta: SatResponse) {
  const [, , xmlBase64, , chaveConsulta] = resposta.campos;
  return {
    xmlBase64: xmlBase64 ?? "",
    chaveConsulta: chaveConsulta ?? "",
  };
}

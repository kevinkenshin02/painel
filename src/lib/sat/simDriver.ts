/**
 * Driver de simulação (SAT_TEST_MODE=true): responde no mesmo formato da ER SAT
 * sem tocar em DLL nenhuma, para dar pra desenvolver e testar o fluxo de
 * emissão sem o equipamento — que fica na loja, não na máquina de dev.
 */

import {
  RETORNO_SAT_OK,
  RETORNO_VENDA_AUTORIZADA,
  gerarNumeroSessao,
  parseRetornoSat,
  type SatDriver,
  type SatResponse,
} from "./driver";

function chaveFake() {
  let chave = "35";
  while (chave.length < 44) {
    chave += Math.floor(Math.random() * 10);
  }
  return chave;
}

export const simDriver: SatDriver = {
  async consultarSAT(): Promise<SatResponse> {
    return parseRetornoSat(
      `${gerarNumeroSessao()}|${RETORNO_SAT_OK}|SAT em Operacao (simulado)`
    );
  },

  async enviarDadosVenda(xmlVenda: string): Promise<SatResponse> {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const xmlBase64 = Buffer.from(xmlVenda, "utf8").toString("base64");
    return parseRetornoSat(
      [
        gerarNumeroSessao(),
        RETORNO_VENDA_AUTORIZADA,
        "Emitido com sucesso (simulado)",
        "0000",
        "Simulacao — nenhum documento foi transmitido a SEFAZ",
        xmlBase64,
        timestamp,
        chaveFake(),
      ].join("|")
    );
  },
};

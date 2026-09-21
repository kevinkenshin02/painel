/**
 * Driver real: chama a DLL do equipamento SAT via FFI.
 *
 * TODO(verificar spec): três coisas precisam ser confirmadas no manual do
 * integrador do Control iD, com o equipamento em mãos:
 *   1. convenção de chamada (__stdcall é o padrão da ER SAT, mas alguns
 *      fabricantes exportam como cdecl);
 *   2. ordem/tipo exato dos parâmetros de cada função;
 *   3. arquitetura da DLL — se for 32 bits, o koffi não carrega dentro do
 *      processo do painel (que roda em x64) e vai ser preciso um executável
 *      auxiliar de 32 bits. Nesse caso só este arquivo muda: quem chama usa a
 *      interface SatDriver, não a DLL direto.
 */

import {
  gerarNumeroSessao,
  parseRetornoSat,
  type SatDriver,
  type SatResponse,
} from "./driver";
import { getCodigoAtivacao, getSatDllPath } from "./config";

type SatFuncoes = {
  ConsultarSAT: (numeroSessao: number) => string;
  EnviarDadosVenda: (
    numeroSessao: number,
    codigoAtivacao: string,
    dadosVenda: string
  ) => string;
};

let funcoes: SatFuncoes | null = null;

function carregarDll(): SatFuncoes {
  if (funcoes) return funcoes;

  // require dinâmico: o binário nativo do koffi só é tocado quando há uma
  // emissão real, então dev/build/modo de teste nunca dependem da DLL.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const koffi = require("koffi");
  const lib = koffi.load(getSatDllPath());

  funcoes = {
    ConsultarSAT: lib.func("__stdcall", "ConsultarSAT", "str", ["int"]),
    EnviarDadosVenda: lib.func("__stdcall", "EnviarDadosVenda", "str", [
      "int",
      "str",
      "str",
    ]),
  };

  return funcoes;
}

export const ffiDriver: SatDriver = {
  async consultarSAT(): Promise<SatResponse> {
    const sat = carregarDll();
    return parseRetornoSat(sat.ConsultarSAT(gerarNumeroSessao()));
  },

  async enviarDadosVenda(xmlVenda: string): Promise<SatResponse> {
    const sat = carregarDll();
    return parseRetornoSat(
      sat.EnviarDadosVenda(gerarNumeroSessao(), getCodigoAtivacao(), xmlVenda)
    );
  },
};

import { isSatTestMode } from "./config";
import type { SatDriver } from "./driver";
import { simDriver } from "./simDriver";

export function getSatDriver(): SatDriver {
  if (isSatTestMode()) return simDriver;
  // require tardio para o koffi (binário nativo) não ser carregado em modo de teste.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./ffiDriver").ffiDriver as SatDriver;
}

export { isSatTestMode } from "./config";
export {
  RETORNO_VENDA_AUTORIZADA,
  parseRetornoVenda,
  type SatResponse,
} from "./driver";

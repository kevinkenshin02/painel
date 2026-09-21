/**
 * Monta o XML do CF-e de venda que vai para o equipamento SAT.
 *
 * O endereço do emitente NÃO entra aqui: o próprio SAT preenche com os dados
 * da ativação dele na SEFAZ. O bloco <emit> do XML de entrada leva só
 * CNPJ/IE/indRatISSQN.
 */

import type { CategoriaVenda, FormaPagamento } from "@/generated/prisma/enums";
import {
  getAssinaturaAC,
  getCnpjSoftwareHouse,
  getNumeroCaixa,
  isSatTestMode,
} from "./config";

/** Versão do leiaute de entrada do CF-e-SAT. */
const VERSAO_DADOS_ENT = "0.08";

const NCM_PENDENTE = "00000000";

/**
 * Classificação fiscal por categoria de venda.
 *
 * TODO(contador): estes são valores provisórios só para o modo de teste. Os
 * códigos reais precisam vir do contador da loja — emitir com NCM/CFOP errado
 * é problema fiscal, então `buildCfeXml` recusa emitir de verdade enquanto
 * estiverem como NCM_PENDENTE.
 */
const CLASSIFICACAO_FISCAL: Record<CategoriaVenda, { ncm: string; cfop: string }> = {
  OCULOS_COMPLETO: { ncm: NCM_PENDENTE, cfop: "5102" },
  SO_ARMACAO: { ncm: NCM_PENDENTE, cfop: "5102" },
  SO_LENTE: { ncm: NCM_PENDENTE, cfop: "5102" },
  RELOGIO: { ncm: NCM_PENDENTE, cfop: "5102" },
  CONSERTO_RELOGIO: { ncm: NCM_PENDENTE, cfop: "5102" },
  BATERIA: { ncm: NCM_PENDENTE, cfop: "5102" },
  ACESSORIO: { ncm: NCM_PENDENTE, cfop: "5102" },
  OUTRO: { ncm: NCM_PENDENTE, cfop: "5102" },
};

/**
 * Meios de pagamento da ER SAT.
 *
 * TODO(verificar spec): o código do Pix entrou na tabela em revisão posterior
 * da especificação — confirmar o valor vigente na SEFAZ-SP antes de emitir
 * venda no Pix de verdade. Até lá a emissão real no Pix é recusada.
 */
const CODIGO_MEIO_PAGAMENTO: Record<FormaPagamento, string | null> = {
  DINHEIRO: "01",
  CARTAO_CREDITO: "03",
  CARTAO_DEBITO: "04",
  OUTRO: "99",
  PIX: null,
};

function escaparXml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export type DadosEmitente = {
  cnpj: string | null;
  inscricaoEstadual: string | null;
};

export type DadosVendaFiscal = {
  id: number;
  categoria: CategoriaVenda;
  descricao: string;
  quantidade: number;
  valorVendido: number;
  formaPagamento: FormaPagamento;
};

export function buildCfeXml(venda: DadosVendaFiscal, emitente: DadosEmitente): string {
  const cnpj = somenteDigitos(emitente.cnpj ?? "");
  const ie = somenteDigitos(emitente.inscricaoEstadual ?? "");

  if (cnpj.length !== 14) {
    throw new Error(
      "CNPJ da loja não configurado (ou inválido). Preencha os dados fiscais em Configurações antes de emitir cupom fiscal."
    );
  }
  if (!ie) {
    throw new Error(
      "Inscrição estadual da loja não configurada. Preencha os dados fiscais em Configurações antes de emitir cupom fiscal."
    );
  }

  const meioPagamento = CODIGO_MEIO_PAGAMENTO[venda.formaPagamento];
  const { ncm, cfop } = CLASSIFICACAO_FISCAL[venda.categoria];

  // Em modo de teste nada é transmitido à SEFAZ, então os valores provisórios
  // passam. Numa emissão real eles não podem sair daqui.
  if (!isSatTestMode()) {
    if (ncm === NCM_PENDENTE) {
      throw new Error(
        "NCM desta categoria ainda não foi confirmado com o contador. Emitir cupom fiscal com classificação errada é problema fiscal — confirme os códigos antes de emitir de verdade."
      );
    }
    if (!meioPagamento) {
      throw new Error(
        "O código do Pix na tabela de meios de pagamento do SAT ainda precisa ser confirmado na especificação da SEFAZ-SP. Registre essa venda em outra forma de pagamento ou confirme o código antes de emitir."
      );
    }
  }

  const quantidade = venda.quantidade > 0 ? venda.quantidade : 1;
  const valorUnitario = venda.valorVendido / quantidade;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<CFe>",
    `<infCFe versaoDadosEnt="${VERSAO_DADOS_ENT}">`,
    "<ide>",
    `<CNPJ>${somenteDigitos(getCnpjSoftwareHouse())}</CNPJ>`,
    `<signAC>${escaparXml(getAssinaturaAC())}</signAC>`,
    `<numeroCaixa>${String(getNumeroCaixa()).padStart(3, "0")}</numeroCaixa>`,
    "</ide>",
    "<emit>",
    `<CNPJ>${cnpj}</CNPJ>`,
    `<IE>${ie}</IE>`,
    "<indRatISSQN>N</indRatISSQN>",
    "</emit>",
    "<dest></dest>",
    '<det nItem="1">',
    "<prod>",
    `<cProd>${venda.id}</cProd>`,
    `<xProd>${escaparXml(venda.descricao)}</xProd>`,
    `<NCM>${ncm}</NCM>`,
    `<CFOP>${cfop}</CFOP>`,
    "<uCom>UN</uCom>",
    `<qCom>${quantidade.toFixed(4)}</qCom>`,
    `<vUnCom>${valorUnitario.toFixed(2)}</vUnCom>`,
    "<indRegra>A</indRegra>",
    "</prod>",
    "<imposto>",
    // TODO(contador): tratamento tributário assumindo Simples Nacional
    // (CSOSN 102 / PIS e COFINS CST 49). Confirmar o regime da loja antes de
    // emitir de verdade.
    "<ICMS><ICMSSN102><Orig>0</Orig><CSOSN>102</CSOSN></ICMSSN102></ICMS>",
    "<PIS><PISSN><CST>49</CST></PISSN></PIS>",
    "<COFINS><COFINSSN><CST>49</CST></COFINSSN></COFINS>",
    "</imposto>",
    "</det>",
    "<total></total>",
    "<pgto>",
    "<MP>",
    `<cMP>${meioPagamento ?? "99"}</cMP>`,
    `<vMP>${venda.valorVendido.toFixed(2)}</vMP>`,
    "</MP>",
    "</pgto>",
    "</infCFe>",
    "</CFe>",
  ].join("");
}

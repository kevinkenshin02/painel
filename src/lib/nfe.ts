/**
 * Leitor do XML da NF-e (nota do fornecedor). Só texto e expressões regulares, sem dependências,
 * para funcionar igual no navegador (prévia) e no servidor (lançamento).
 */

export type ItemNFe = {
  item: number;
  codigo: string;
  ean: string | null;
  descricao: string;
  ncm: string | null;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorProdutos: number;
  /** custo real por peça: produto + frete + seguro + outros + IPI + ICMS-ST − desconto, dividido pela quantidade */
  custoUnitario: number;
};

export type ParcelaNFe = { numero: string; vencimento: string; valor: number };

export type NotaNFe = {
  chave: string | null;
  numero: string;
  serie: string | null;
  dataEmissao: string | null;
  emitente: { cnpj: string | null; nome: string; fantasia: string | null; telefone: string | null };
  itens: ItemNFe[];
  totalProdutos: number;
  totalNota: number;
  parcelas: ParcelaNFe[];
};

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodificar(t: string) {
  return t
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
      if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTIDADES[e.toLowerCase()] ?? _;
    })
    .trim();
}

/** Conteúdo do primeiro <nome>...</nome> dentro do bloco (aceita prefixo de namespace, ex. <nfe:xProd>). */
function tag(bloco: string, nome: string): string | null {
  const m = bloco.match(new RegExp(`<(?:\\w+:)?${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${nome}>`));
  return m ? decodificar(m[1]) : null;
}

function blocos(xml: string, nome: string): string[] {
  const re = new RegExp(`<(?:\\w+:)?${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${nome}>`, "g");
  return [...xml.matchAll(re)].map((m) => m[1]);
}

const num = (v: string | null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** EAN só vale se tiver 8, 12, 13 ou 14 números (a nota usa "SEM GTIN" quando não tem). */
export function eanValido(v: string | null | undefined): string | null {
  const d = (v ?? "").replace(/\D/g, "");
  return [8, 12, 13, 14].includes(d.length) && /^\d+$/.test((v ?? "").trim()) ? d : null;
}

export function lerNFe(xml: string): NotaNFe {
  if (!/<(?:\w+:)?infNFe[\s>]/.test(xml)) {
    throw new Error("Esse arquivo não parece o XML de uma NF-e. Peça ao fornecedor o arquivo .xml da nota (não o PDF/DANFE).");
  }
  const chave = xml.match(/<(?:\w+:)?infNFe[^>]*\sId="NFe(\d{44})"/)?.[1] ?? null;
  const ide = blocos(xml, "ide")[0] ?? "";
  const emit = blocos(xml, "emit")[0] ?? "";
  const total = blocos(xml, "ICMSTot")[0] ?? "";

  const itens: ItemNFe[] = [...xml.matchAll(/<(?:\w+:)?det\s+nItem="(\d+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?det>/g)].map((m) => {
    const det = m[2];
    const prod = blocos(det, "prod")[0] ?? "";
    const imposto = blocos(det, "imposto")[0] ?? "";
    const ipi = blocos(imposto, "IPI")[0] ?? "";
    const quantidade = num(tag(prod, "qCom"));
    const valorProdutos = num(tag(prod, "vProd"));
    const extras =
      num(tag(prod, "vFrete")) +
      num(tag(prod, "vSeg")) +
      num(tag(prod, "vOutro")) +
      num(tag(ipi, "vIPI")) +
      num(tag(imposto, "vICMSST")) -
      num(tag(prod, "vDesc"));
    return {
      item: Number(m[1]),
      codigo: tag(prod, "cProd") ?? "",
      ean: eanValido(tag(prod, "cEAN")) ?? eanValido(tag(prod, "cEANTrib")),
      descricao: tag(prod, "xProd") ?? "",
      ncm: tag(prod, "NCM"),
      unidade: (tag(prod, "uCom") ?? "UN").toUpperCase(),
      quantidade,
      valorUnitario: num(tag(prod, "vUnCom")),
      valorProdutos,
      custoUnitario: quantidade > 0 ? Math.round(((valorProdutos + extras) / quantidade) * 100) / 100 : 0,
    };
  });

  if (itens.length === 0) throw new Error("A nota não tem itens (det).");

  return {
    chave,
    numero: tag(ide, "nNF") ?? "",
    serie: tag(ide, "serie"),
    dataEmissao: tag(ide, "dhEmi") ?? tag(ide, "dEmi"),
    emitente: {
      cnpj: tag(emit, "CNPJ") ?? tag(emit, "CPF"),
      nome: tag(emit, "xNome") ?? "Fornecedor",
      fantasia: tag(emit, "xFant"),
      telefone: tag(emit, "fone"),
    },
    itens,
    totalProdutos: num(tag(total, "vProd")),
    totalNota: num(tag(total, "vNF")),
    parcelas: blocos(xml, "dup").map((d) => ({
      numero: tag(d, "nDup") ?? "",
      vencimento: tag(d, "dVenc") ?? "",
      valor: num(tag(d, "vDup")),
    })),
  };
}

/** Normaliza códigos para comparar ("469SS084NH-D1SX" = "469SS084NH D1SX"). */
export const normalizarCodigo = (c: string | null | undefined) => (c ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Acha o produto já cadastrado que corresponde ao item da nota. */
export function acharProduto<P extends { id: number; codigo: string; codigoBarras: string | null; referencia: string | null }>(
  item: Pick<ItemNFe, "codigo" | "ean">,
  produtos: P[]
): P | null {
  if (item.ean) {
    const porEan = produtos.find((p) => eanValido(p.codigoBarras) === item.ean || normalizarCodigo(p.codigo) === item.ean);
    if (porEan) return porEan;
  }
  const cod = normalizarCodigo(item.codigo);
  if (!cod) return null;
  return produtos.find((p) => normalizarCodigo(p.referencia) === cod || normalizarCodigo(p.codigo) === cod) ?? null;
}

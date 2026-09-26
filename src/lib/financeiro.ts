import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { hojeCalendario } from "./datas";

type Db = PrismaClient | Prisma.TransactionClient;

const NOME_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Mês escolhido na tela (?mes=2026-09) ou o mês atual; datas de calendário (meia-noite UTC). */
export function mesDe(param?: string | null) {
  const hoje = hojeCalendario();
  const m = param?.match(/^(\d{4})-(\d{2})$/);
  const ano = m ? Number(m[1]) : hoje.getUTCFullYear();
  const mes = m ? Number(m[2]) - 1 : hoje.getUTCMonth();
  const chave = (a: number, b: number) => {
    const d = new Date(Date.UTC(a, b, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const nome = NOME_MES.format(new Date(Date.UTC(ano, mes, 1)));
  return {
    chave: chave(ano, mes),
    ano,
    mes,
    inicio: new Date(Date.UTC(ano, mes, 1)),
    fim: new Date(Date.UTC(ano, mes + 1, 1)),
    dias: new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate(),
    nome: nome.charAt(0).toUpperCase() + nome.slice(1),
    anterior: chave(ano, mes - 1),
    proximo: chave(ano, mes + 1),
    /** para campos gravados com hora (dataEntrega, pagamentos): o mês em São Paulo (UTC−3) */
    inicioHora: new Date(Date.UTC(ano, mes, 1, 3)),
    fimHora: new Date(Date.UTC(ano, mes + 1, 1, 3)),
  };
}

/** Cria (uma vez por mês) a conta a pagar de cada despesa fixa ativa — só do mês atual em diante. */
export async function gerarContasDoMes(db: Db, mes: ReturnType<typeof mesDe>) {
  if (mes.chave < mesDe().chave) return 0; // mês passado: não inventa conta atrasada
  const [fixas, existentes] = await Promise.all([
    db.despesaFixa.findMany({ where: { ativo: true, criadoEm: { lt: mes.fimHora } } }),
    db.contaPagar.findMany({ where: { competencia: mes.chave, despesaFixaId: { not: null } }, select: { despesaFixaId: true } }),
  ]);
  const ja = new Set(existentes.map((c) => c.despesaFixaId));
  const faltam = fixas.filter((f) => !ja.has(f.id));
  for (const f of faltam) {
    const dia = Math.min(Math.max(1, f.diaVencimento), mes.dias);
    await db.contaPagar.create({
      data: {
        descricao: f.nome,
        categoria: "Despesa fixa",
        valor: f.valor,
        vencimento: new Date(Date.UTC(mes.ano, mes.mes, dia)),
        origem: "DESPESA_FIXA",
        despesaFixaId: f.id,
        competencia: mes.chave,
        observacoes: f.observacao,
      },
    });
  }
  return faltam.length;
}

type ParcelaNota = { numero: string; vencimento: string; valor: number };

/** Parcelas (duplicatas) das notas lançadas viram contas a pagar — uma vez só por nota. */
export async function gerarContasDasNotas(db: Db) {
  const notas = await db.notaEntrada.findMany({
    where: { parcelas: { not: null }, contas: { none: {} } },
    include: { fornecedor: { select: { nome: true } } },
  });
  for (const n of notas) {
    let parcelas: ParcelaNota[] = [];
    try {
      parcelas = JSON.parse(n.parcelas ?? "[]") as ParcelaNota[];
    } catch {
      continue;
    }
    for (const [i, p] of parcelas.entries()) {
      const venc = /^\d{4}-\d{2}-\d{2}$/.test(p.vencimento) ? new Date(`${p.vencimento}T00:00:00.000Z`) : hojeCalendario();
      await db.contaPagar.create({
        data: {
          descricao: `NF ${n.numero} — ${n.fornecedor?.nome ?? "fornecedor"}`,
          categoria: "Fornecedor (mercadoria)",
          fornecedorId: n.fornecedorId,
          valor: p.valor,
          vencimento: venc,
          origem: "NOTA",
          notaId: n.id,
          parcela: `${p.numero || i + 1}/${parcelas.length}`,
        },
      });
    }
  }
  return notas.length;
}

/** Números do mês (regime de competência simples): o que vendeu/entregou, o custo e as contas do mês. */
export async function resumoDoMes(db: Db, mes: ReturnType<typeof mesDe>) {
  const [vendas, osEntregues, contas, movimentosCaixa] = await Promise.all([
    db.venda.findMany({
      where: { statusPagamento: "PAGO", dataVenda: { gte: mes.inicio, lt: mes.fim } },
      select: { valorVendido: true, custoTotal: true, categoria: true, formaPagamento: true },
    }),
    db.ordemServico.findMany({
      where: { status: "ENTREGUE", dataEntrega: { gte: mes.inicioHora, lt: mes.fimHora } },
      select: { valorTotal: true, tipoServico: true },
    }),
    db.contaPagar.findMany({
      where: { cancelada: false, vencimento: { gte: mes.inicio, lt: mes.fim } },
      select: { valor: true, valorPago: true, pagoEm: true, vencimento: true, categoria: true, origem: true },
    }),
    db.movimentoCaixa.findMany({
      where: { criadoEm: { gte: mes.inicioHora, lt: mes.fimHora }, tipo: { in: ["VENDA", "RECEBIMENTO_OS", "ESTORNO"] } },
      select: { valor: true, formaPagamento: true },
    }),
  ]);

  const receitaVendas = vendas.reduce((s, v) => s + v.valorVendido, 0);
  const custoVendas = vendas.reduce((s, v) => s + v.custoTotal, 0);
  const receitaServicos = osEntregues.reduce((s, o) => s + o.valorTotal, 0);
  const despesas = contas.reduce((s, c) => s + c.valor, 0);
  const pagas = contas.filter((c) => c.pagoEm);
  const hoje = hojeCalendario();
  const vencidas = contas.filter((c) => !c.pagoEm && c.vencimento < hoje);

  const porCategoria = Object.entries(
    contas.reduce<Record<string, number>>((acc, c) => {
      const k = c.categoria || (c.origem === "NOTA" ? "Fornecedor (mercadoria)" : "Outras");
      acc[k] = (acc[k] ?? 0) + c.valor;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return {
    receitaVendas,
    receitaServicos,
    receitaTotal: receitaVendas + receitaServicos,
    custoVendas,
    lucroBruto: receitaVendas + receitaServicos - custoVendas,
    despesas,
    despesasPagas: pagas.reduce((s, c) => s + (c.valorPago ?? c.valor), 0),
    despesasEmAberto: contas.filter((c) => !c.pagoEm).reduce((s, c) => s + c.valor, 0),
    vencidas: { qtd: vencidas.length, valor: vencidas.reduce((s, c) => s + c.valor, 0) },
    resultado: receitaVendas + receitaServicos - custoVendas - despesas,
    qtdVendas: vendas.length,
    qtdOs: osEntregues.length,
    porCategoria,
    recebidoNoCaixa: movimentosCaixa.reduce((s, m) => s + m.valor, 0),
  };
}

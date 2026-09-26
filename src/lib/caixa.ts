import type { Prisma } from "@/generated/prisma/client";
import type { FormaPagamento, TipoMovimentoCaixa } from "@/generated/prisma/enums";

type Tx = Prisma.TransactionClient;

export const TIPO_MOVIMENTO_CAIXA_LABELS: Record<TipoMovimentoCaixa, string> = {
  ABERTURA: "Abertura (troco)",
  VENDA: "Venda",
  RECEBIMENTO_OS: "Recebimento de OS",
  REFORCO: "Reforço",
  SANGRIA: "Sangria",
  DESPESA: "Despesa paga no caixa",
  ESTORNO: "Estorno",
};

export const FORMAS_CAIXA: FormaPagamento[] = ["DINHEIRO", "PIX", "CARTAO_MAQUININHA", "OUTRO"];

export function caixaAberto(db: Tx) {
  return db.caixa.findFirst({ where: { status: "ABERTO" }, orderBy: { abertoEm: "desc" } });
}

/**
 * Lança um valor no caixa aberto. Se o caixa estiver fechado, abre um sozinho (troco R$ 0)
 * para o pagamento não se perder — o Painel avisa na tela do Caixa para conferir o troco.
 */
export async function registrarNoCaixa(
  tx: Tx,
  dados: {
    tipo: TipoMovimentoCaixa;
    formaPagamento: FormaPagamento;
    valor: number;
    descricao: string;
    vendaId?: number | null;
    ordemServicoId?: number | null;
    funcionarioId?: number | null;
  }
) {
  let caixa = await caixaAberto(tx);
  if (!caixa) {
    caixa = await tx.caixa.create({
      data: {
        aberturaAutomatica: true,
        abertoPorId: dados.funcionarioId ?? null,
        trocoInicial: 0,
        observacaoAbertura: `Aberto sozinho ao registrar: ${dados.descricao}`,
      },
    });
    await tx.movimentoCaixa.create({
      data: {
        caixaId: caixa.id,
        tipo: "ABERTURA",
        formaPagamento: "DINHEIRO",
        valor: 0,
        descricao: "Abertura automática (troco não informado)",
        funcionarioId: dados.funcionarioId ?? null,
      },
    });
  }
  return tx.movimentoCaixa.create({
    data: {
      caixaId: caixa.id,
      tipo: dados.tipo,
      formaPagamento: dados.formaPagamento,
      valor: Math.round(dados.valor * 100) / 100,
      descricao: dados.descricao,
      vendaId: dados.vendaId ?? null,
      ordemServicoId: dados.ordemServicoId ?? null,
      funcionarioId: dados.funcionarioId ?? null,
    },
  });
}

type Mov = { tipo: TipoMovimentoCaixa; formaPagamento: FormaPagamento; valor: number };

/** Totais do caixa: por forma de pagamento e o dinheiro que deve estar na gaveta. */
export function resumoCaixa(movimentos: Mov[]) {
  const porForma = Object.fromEntries(FORMAS_CAIXA.map((f) => [f, { entradas: 0, saidas: 0, saldo: 0 }])) as Record<
    FormaPagamento,
    { entradas: number; saidas: number; saldo: number }
  >;
  const soma = (tipo: TipoMovimentoCaixa) => movimentos.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.valor, 0);
  for (const m of movimentos) {
    const f = porForma[m.formaPagamento];
    if (m.valor >= 0) f.entradas += m.valor;
    else f.saidas += -m.valor;
    f.saldo += m.valor;
  }
  // recebido de verdade: vendas + OS, menos o que foi estornado (venda/OS excluída)
  const recebido = movimentos
    .filter((m) => m.tipo === "VENDA" || m.tipo === "RECEBIMENTO_OS" || m.tipo === "ESTORNO")
    .reduce((s, m) => s + m.valor, 0);
  return {
    porForma,
    /** troco + tudo que entrou e saiu em dinheiro */
    dinheiroEsperado: porForma.DINHEIRO.saldo,
    recebido,
    vendas: soma("VENDA"),
    recebimentosOS: soma("RECEBIMENTO_OS"),
    qtdVendas: movimentos.filter((m) => m.tipo === "VENDA").length,
    qtdRecebimentosOS: movimentos.filter((m) => m.tipo === "RECEBIMENTO_OS").length,
    sangrias: -soma("SANGRIA"),
    reforcos: soma("REFORCO"),
    despesas: -soma("DESPESA"),
    estornos: -soma("ESTORNO"),
  };
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePlus2, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { hojeCalendario, hojeInput } from "@/lib/datas";
import { gerarContasDasNotas, gerarContasDoMes, mesDe } from "@/lib/financeiro";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { NovaContaForm, TabelaContas } from "./ContasPagar";
import { SeletorMes } from "../SeletorMes";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const SITUACOES = [
  ["todas", "Todas"],
  ["abertas", "Em aberto"],
  ["vencidas", "Vencidas"],
  ["pagas", "Pagas"],
] as const;

export default async function ContasPagarPage(props: PageProps<"/financeiro/contas-a-pagar">) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/");
  const { mes: mesParam, situacao = "todas" } = (await props.searchParams) as { mes?: string; situacao?: string };
  const mes = mesDe(mesParam);
  const hoje = hojeCalendario();

  await gerarContasDoMes(prisma, mes);
  await gerarContasDasNotas(prisma);

  const [contas, fornecedores, vencidasAntes] = await Promise.all([
    prisma.contaPagar.findMany({
      where: { vencimento: { gte: mes.inicio, lt: mes.fim } },
      orderBy: [{ vencimento: "asc" }, { id: "asc" }],
      include: { fornecedor: { select: { nome: true } } },
    }),
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.contaPagar.aggregate({
      where: { pagoEm: null, cancelada: false, vencimento: { lt: mes.inicio } },
      _sum: { valor: true },
      _count: true,
    }),
  ]);

  const validas = contas.filter((c) => !c.cancelada);
  const vencidas = validas.filter((c) => !c.pagoEm && c.vencimento < hoje);
  const filtradas = contas.filter((c) => {
    if (situacao === "abertas") return !c.pagoEm && !c.cancelada;
    if (situacao === "vencidas") return !c.pagoEm && !c.cancelada && c.vencimento < hoje;
    if (situacao === "pagas") return Boolean(c.pagoEm);
    return true;
  });

  return (
    <>
      <Cabecalho
        secao="Financeiro"
        titulo="Contas a pagar"
        descricao="Despesas fixas do mês (geradas sozinhas), parcelas das notas de fornecedor e contas avulsas."
        acoes={<SeletorMes base="/financeiro/contas-a-pagar" mes={mes} extra={{ situacao }} />}
      >
        <Chip>
          Total do mês: <span className="numero text-texto">{formatCurrency(validas.reduce((s, c) => s + c.valor, 0))}</span>
        </Chip>
        <Chip>
          Pago: <span className="numero text-texto">{formatCurrency(validas.filter((c) => c.pagoEm).reduce((s, c) => s + (c.valorPago ?? c.valor), 0))}</span>
        </Chip>
        <Chip>
          Em aberto: <span className="numero text-texto">{formatCurrency(validas.filter((c) => !c.pagoEm).reduce((s, c) => s + c.valor, 0))}</span>
        </Chip>
        {vencidas.length > 0 && (
          <Chip className="border-perigo/40 text-perigo">
            {vencidas.length} vencidas · {formatCurrency(vencidas.reduce((s, c) => s + c.valor, 0))}
          </Chip>
        )}
        {vencidasAntes._count > 0 && (
          <Chip className="border-perigo/40 text-perigo">
            + {vencidasAntes._count} em aberto de meses anteriores ({formatCurrency(vencidasAntes._sum.valor ?? 0)})
          </Chip>
        )}
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao selo={mes.nome} icone={Receipt} titulo="Contas do mês" className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {SITUACOES.map(([valor, rotulo]) => (
              <Link
                key={valor}
                href={`/financeiro/contas-a-pagar?mes=${mes.chave}&situacao=${valor}`}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  situacao === valor ? "degrade-sol text-sobre-sol" : "border border-borda text-texto-2 hover:bg-superficie-2"
                )}
              >
                {rotulo}
              </Link>
            ))}
          </div>
        </TituloCartao>
        <TabelaContas
          hoje={hoje}
          hojeInput={hojeInput()}
          contas={filtradas.map((c) => ({
            id: c.id,
            descricao: c.descricao,
            categoria: c.categoria,
            fornecedor: c.fornecedor?.nome ?? null,
            valor: c.valor,
            vencimento: c.vencimento,
            pagoEm: c.pagoEm,
            valorPago: c.valorPago,
            formaPagamento: c.formaPagamento,
            pagoPeloCaixa: c.pagoPeloCaixa,
            cancelada: c.cancelada,
            origem: c.origem,
            parcela: c.parcela,
          }))}
        />
      </Cartao>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Nova"
          icone={FilePlus2}
          titulo="Lançar conta avulsa"
          descricao="Para o que não é despesa fixa nem veio pela nota (ex.: laboratório, manutenção, compra parcelada)."
          className="mb-5"
        />
        <NovaContaForm fornecedores={fornecedores} hojeInput={hojeInput()} />
      </Cartao>
    </>
  );
}

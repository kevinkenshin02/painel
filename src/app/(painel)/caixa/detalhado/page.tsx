import { notFound } from "next/navigation";
import { ListOrdered, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { resumoCaixa } from "@/lib/caixa";
import { AtalhosCaixa, ConsolidadoPorForma, dataHora, Informacoes, TabelaMovimentos } from "../componentes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function CaixaDetalhadoPage(props: PageProps<"/caixa/detalhado">) {
  const { id } = (await props.searchParams) as { id?: string };
  const include = {
    abertoPor: { select: { nome: true } },
    fechadoPor: { select: { nome: true } },
    movimentos: { orderBy: { criadoEm: "asc" as const }, include: { funcionario: { select: { nome: true } } } },
  };
  const caixa = id
    ? await prisma.caixa.findUnique({ where: { id: Number(id) || -1 }, include })
    : ((await prisma.caixa.findFirst({ where: { status: "ABERTO" }, orderBy: { abertoEm: "desc" }, include })) ??
      (await prisma.caixa.findFirst({ orderBy: { abertoEm: "desc" }, include })));

  if (id && !caixa) notFound();
  if (!caixa) {
    return (
      <>
        <AtalhosCaixa ativo="detalhado" />
        <Cartao className="p-6">
          <Vazio>Nenhum caixa aberto ainda.</Vazio>
        </Cartao>
      </>
    );
  }

  const resumo = resumoCaixa(caixa.movimentos);
  const diferenca = caixa.dinheiroContado !== null && caixa.dinheiroEsperado !== null ? caixa.dinheiroContado - caixa.dinheiroEsperado : null;

  return (
    <>
      <AtalhosCaixa ativo="detalhado" />
      <Cabecalho
        secao={`Caixa nº ${caixa.id}`}
        titulo="Caixa detalhado"
        descricao={`Aberto em ${dataHora(caixa.abertoEm)}${caixa.abertoPor ? ` por ${caixa.abertoPor.nome}` : ""}${
          caixa.fechadoEm ? ` · fechado em ${dataHora(caixa.fechadoEm)}${caixa.fechadoPor ? ` por ${caixa.fechadoPor.nome}` : ""}` : ""
        }.`}
        acoes={<BotaoImprimir />}
      >
        <Etiqueta tom={caixa.status === "ABERTO" ? "sucesso" : "neutro"}>{caixa.status === "ABERTO" ? "Aberto" : "Fechado"}</Etiqueta>
        <Chip>
          Recebido: <span className="numero text-texto">{formatCurrency(resumo.recebido)}</span>
        </Chip>
        {caixa.aberturaAutomatica && <Chip className="border-aviso/40 text-aviso">Aberto automaticamente</Chip>}
      </Cabecalho>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao filete className="p-6">
          <TituloCartao selo="Resumo" icone={Wallet} titulo="Dinheiro da gaveta" className="mb-3" />
          <Informacoes
            itens={[
              ["Troco inicial", formatCurrency(caixa.trocoInicial)],
              ["Dinheiro recebido", formatCurrency(caixa.movimentos.filter((m) => m.formaPagamento === "DINHEIRO" && (m.tipo === "VENDA" || m.tipo === "RECEBIMENTO_OS")).reduce((s, m) => s + m.valor, 0))],
              ["Reforços", formatCurrency(resumo.reforcos)],
              ["Sangrias", `− ${formatCurrency(resumo.sangrias)}`],
              ["Despesas pagas no caixa", `− ${formatCurrency(resumo.despesas)}`],
              ["Estornos em dinheiro", `− ${formatCurrency(Math.max(0, -caixa.movimentos.filter((m) => m.tipo === "ESTORNO" && m.formaPagamento === "DINHEIRO").reduce((s, m) => s + m.valor, 0)))}`],
              ["Devia ter na gaveta", formatCurrency(caixa.dinheiroEsperado ?? resumo.dinheiroEsperado)],
              ["Contado no fechamento", caixa.dinheiroContado !== null ? formatCurrency(caixa.dinheiroContado) : "—"],
              [
                "Diferença",
                diferenca === null ? (
                  "—"
                ) : (
                  <span className={Math.abs(diferenca) < 0.01 ? "text-sucesso" : diferenca > 0 ? "text-aviso" : "text-perigo"}>
                    {Math.abs(diferenca) < 0.01 ? "Bateu" : `${diferenca > 0 ? "+" : "−"} ${formatCurrency(Math.abs(diferenca))}`}
                  </span>
                ),
              ],
            ]}
          />
          {caixa.observacaoFechamento && <p className="mt-3 text-sm text-texto-2">Obs.: {caixa.observacaoFechamento}</p>}
        </Cartao>
        <Cartao filete className="p-6">
          <TituloCartao selo="Consolidado" icone={Wallet} titulo="Por forma de pagamento" className="mb-5" />
          <ConsolidadoPorForma resumo={resumo} />
        </Cartao>
      </div>

      <Cartao filete className="p-6">
        <TituloCartao selo="Lançamentos" icone={ListOrdered} titulo="Todos os lançamentos" descricao="Em ordem de horário." className="mb-5" />
        <TabelaMovimentos movimentos={caixa.movimentos} />
      </Cartao>
    </>
  );
}

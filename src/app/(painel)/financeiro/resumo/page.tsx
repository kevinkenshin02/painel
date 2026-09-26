import { redirect } from "next/navigation";
import { BadgeDollarSign, ChartColumn, Landmark, Package, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatPercent } from "@/lib/format";
import { gerarContasDasNotas, gerarContasDoMes, mesDe, resumoDoMes } from "@/lib/financeiro";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { SeletorMes } from "../SeletorMes";
import { BotaoImprimir } from "@/components/BotaoImprimir";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { CartaoKpi } from "@/components/ui/CartaoKpi";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

function Linha({ rotulo, valor, tipo = "item", recuo = false }: { rotulo: string; valor: number; tipo?: "item" | "total" | "resultado"; recuo?: boolean }) {
  return (
    <div
      className={cx(
        "flex items-baseline justify-between gap-4 py-2.5",
        tipo === "item" && "border-b border-borda",
        tipo === "total" && "border-b border-borda-forte font-bold text-texto",
        tipo === "resultado" && "mt-1 rounded-xl bg-ouro/10 px-3 font-bold"
      )}
    >
      <span className={cx("text-sm", recuo ? "pl-5 text-suave" : "text-texto-2", tipo !== "item" && "text-texto")}>{rotulo}</span>
      <span className={cx("numero text-sm", tipo === "resultado" && (valor < 0 ? "text-perigo" : "text-sucesso"), tipo === "item" && "text-texto")}>
        {valor < 0 ? `− ${formatCurrency(-valor)}` : formatCurrency(valor)}
      </span>
    </div>
  );
}

export default async function ResumoMesPage(props: PageProps<"/financeiro/resumo">) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/");
  const { mes: mesParam } = (await props.searchParams) as { mes?: string };
  const mes = mesDe(mesParam);
  await gerarContasDoMes(prisma, mes);
  await gerarContasDasNotas(prisma);
  const r = await resumoDoMes(prisma, mes);
  const margemBruta = r.receitaTotal > 0 ? r.lucroBruto / r.receitaTotal : 0;

  return (
    <>
      <Cabecalho
        secao="Financeiro"
        titulo={`Resumo de ${mes.nome.toLowerCase()}`}
        descricao="Quanto a loja vendeu, quanto custou o que foi vendido, as contas do mês e o que sobrou."
        acoes={
          <>
            <SeletorMes base="/financeiro/resumo" mes={mes} />
            <BotaoImprimir />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoKpi tom="sol" icone={BadgeDollarSign} valor={formatCurrency(r.receitaTotal)} rotulo="Receitas" detalhe={`${r.qtdVendas} vendas · ${r.qtdOs} OS entregues`} />
        <CartaoKpi tom="ouro" icone={Package} valor={formatCurrency(r.custoVendas)} rotulo="Custo dos produtos vendidos" detalhe={`Lucro bruto ${formatPercent(margemBruta)}`} />
        <CartaoKpi tom="vinho" icone={Receipt} valor={formatCurrency(r.despesas)} rotulo="Despesas do mês" detalhe={`${formatCurrency(r.despesasEmAberto)} ainda em aberto`} />
        <CartaoKpi
          tom={r.resultado >= 0 ? "jade" : "rubi"}
          icone={r.resultado >= 0 ? TrendingUp : TrendingDown}
          valor={formatCurrency(r.resultado)}
          rotulo="Resultado do mês"
          detalhe={r.resultado >= 0 ? "Sobrou depois de tudo" : "Faltou para cobrir as contas"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Cartao filete className="p-6 xl:col-span-3">
          <TituloCartao selo="Demonstrativo" icone={ChartColumn} titulo="De onde veio e para onde foi" className="mb-4" />
          <Linha rotulo={`Vendas de produtos (${r.qtdVendas})`} valor={r.receitaVendas} />
          <Linha rotulo={`Serviços entregues (${r.qtdOs} OS)`} valor={r.receitaServicos} />
          <Linha rotulo="Receita total" valor={r.receitaTotal} tipo="total" />
          <Linha rotulo="Custo dos produtos vendidos" valor={-r.custoVendas} />
          <Linha rotulo={`Lucro bruto (${formatPercent(margemBruta)})`} valor={r.lucroBruto} tipo="total" />
          {r.porCategoria.map(([categoria, valor]) => (
            <Linha key={categoria} rotulo={categoria} valor={-valor} recuo />
          ))}
          <Linha rotulo="Despesas do mês" valor={-r.despesas} tipo="total" />
          <Linha rotulo="Resultado do mês" valor={r.resultado} tipo="resultado" />
          <p className="mt-4 text-xs text-suave">
            Conta simples por competência: vendas pela data da venda, OS pela data de entrega e despesas pelo vencimento (as parcelas das
            notas de mercadoria entram como despesa no mês em que vencem).
          </p>
        </Cartao>

        <div className="flex flex-col gap-6 xl:col-span-2">
          <Cartao filete className="p-6">
            <TituloCartao selo="Contas" icone={Landmark} titulo="Contas do mês" className="mb-3" />
            <Linha rotulo="Total das contas" valor={r.despesas} />
            <Linha rotulo="Pagas" valor={r.despesasPagas} />
            <Linha rotulo="Em aberto" valor={r.despesasEmAberto} />
            <Linha rotulo={`Vencidas sem pagar (${r.vencidas.qtd})`} valor={r.vencidas.valor} />
          </Cartao>
          <Cartao filete className="p-6">
            <TituloCartao selo="Caixa" icone={Wallet} titulo="Dinheiro que entrou" descricao="Tudo o que passou pelos caixas do mês (vendas e OS, menos estornos)." className="mb-3" />
            <div className="numero text-2xl font-bold text-texto">{formatCurrency(r.recebidoNoCaixa)}</div>
          </Cartao>
        </div>
      </div>
    </>
  );
}

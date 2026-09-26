import Link from "next/link";
import { Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { resumoCaixa } from "@/lib/caixa";
import { AtalhosRelatorios, CabecalhoRelatorio, Filtros, Mini, periodoDe, Registros } from "../comum";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const dataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(d);

export default async function RelatorioCaixaPage(props: PageProps<"/relatorios/caixa">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const periodo = periodoDe(sp);
  const logado = await getFuncionarioLogado();

  const caixas = await prisma.caixa.findMany({
    where: { abertoEm: { gte: periodo.inicioHora, lt: periodo.ateHora } },
    orderBy: { abertoEm: "asc" },
    include: { abertoPor: { select: { nome: true } }, movimentos: { select: { tipo: true, formaPagamento: true, valor: true } } },
  });
  const linhas = caixas.map((c) => {
    const r = resumoCaixa(c.movimentos);
    const esperado = c.dinheiroEsperado ?? r.dinheiroEsperado;
    return {
      ...c,
      r,
      recebidoDinheiro: c.movimentos.filter((m) => m.formaPagamento === "DINHEIRO" && m.tipo !== "ABERTURA" && m.tipo !== "REFORCO" && m.tipo !== "SANGRIA" && m.tipo !== "DESPESA").reduce((s, m) => s + m.valor, 0),
      recebidoPix: c.movimentos.filter((m) => m.formaPagamento === "PIX" && m.tipo !== "DESPESA").reduce((s, m) => s + m.valor, 0),
      recebidoCartao: c.movimentos.filter((m) => m.formaPagamento === "CARTAO_MAQUININHA").reduce((s, m) => s + m.valor, 0),
      recebidoOutro: c.movimentos.filter((m) => m.formaPagamento === "OUTRO").reduce((s, m) => s + m.valor, 0),
      diferenca: c.dinheiroContado !== null ? c.dinheiroContado - esperado : null,
    };
  });
  const soma = (f: (l: (typeof linhas)[number]) => number) => linhas.reduce((s, l) => s + f(l), 0);
  const diferencas = soma((l) => l.diferenca ?? 0);

  return (
    <>
      <AtalhosRelatorios ativo="caixa" isAdmin={logado?.isAdmin ?? false} />
      <CabecalhoRelatorio titulo="Relatório de caixa" descricao="Caixas abertos no período" nomePdf={`caixa-${periodo.inicioInput}-a-${periodo.fimInput}.pdf`} />
      <Filtros periodo={periodo} acao="/relatorios/caixa" />

      <Cartao filete className="p-6">
        <TituloCartao selo="Caixa" icone={Wallet} titulo="Caixas do período" descricao="Recebido por forma de pagamento (vendas e OS, menos estornos) e a diferença da gaveta no fechamento." className="mb-5">
          <Registros n={linhas.length} />
        </TituloCartao>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-6 print:grid-cols-6">
          <Mini rotulo="Recebido" valor={formatCurrency(soma((l) => l.r.recebido))} destaque />
          <Mini rotulo="Dinheiro" valor={formatCurrency(soma((l) => l.recebidoDinheiro))} />
          <Mini rotulo="Pix" valor={formatCurrency(soma((l) => l.recebidoPix))} />
          <Mini rotulo="Cartão" valor={formatCurrency(soma((l) => l.recebidoCartao))} />
          <Mini rotulo="Sangrias" valor={formatCurrency(soma((l) => l.r.sangrias))} />
          <Mini rotulo="Diferenças de gaveta" valor={formatCurrency(diferencas)} />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip>Início: {periodo.inicioBr}</Chip>
          <Chip>Fim: {periodo.fimBr}</Chip>
        </div>
        {linhas.length === 0 ? (
          <Vazio>Nenhum caixa aberto nesse período.</Vazio>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Aberto</th>
                  <th className="direita">Dinheiro</th>
                  <th className="direita">Pix</th>
                  <th className="direita">Cartão</th>
                  <th className="direita">Outro</th>
                  <th className="direita">Recebido</th>
                  <th className="direita">Sangrias + despesas</th>
                  <th className="direita">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td className="destaque numero">
                      <Link href={`/caixa/detalhado?id=${l.id}`} className="hover:text-ouro hover:underline">
                        #{l.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="numero">{dataHora(l.abertoEm)}</div>
                      <div className="text-xs text-suave">{l.abertoPor?.nome ?? "—"}</div>
                    </td>
                    <td className="direita numero">{formatCurrency(l.recebidoDinheiro)}</td>
                    <td className="direita numero">{formatCurrency(l.recebidoPix)}</td>
                    <td className="direita numero">{formatCurrency(l.recebidoCartao)}</td>
                    <td className="direita numero">{formatCurrency(l.recebidoOutro)}</td>
                    <td className="direita numero destaque">{formatCurrency(l.r.recebido)}</td>
                    <td className="direita numero">{formatCurrency(l.r.sangrias + l.r.despesas)}</td>
                    <td
                      className={cx(
                        "direita numero font-semibold",
                        l.diferenca === null ? "text-suave" : Math.abs(l.diferenca) < 0.01 ? "text-sucesso" : l.diferenca > 0 ? "text-aviso" : "text-perigo"
                      )}
                    >
                      {l.diferenca === null ? (l.status === "ABERTO" ? "aberto" : "—") : Math.abs(l.diferenca) < 0.01 ? "Bateu" : formatCurrency(l.diferenca)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Totais · {linhas.length} caixas</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.recebidoDinheiro))}</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.recebidoPix))}</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.recebidoCartao))}</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.recebidoOutro))}</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.r.recebido))}</td>
                  <td className="direita numero">{formatCurrency(soma((l) => l.r.sangrias + l.r.despesas))}</td>
                  <td className="direita numero">{formatCurrency(diferencas)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

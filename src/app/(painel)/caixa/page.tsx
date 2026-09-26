import Link from "next/link";
import { BadgeDollarSign, Banknote, CreditCard, Info, Lock, PiggyBank, QrCode, Scale, Unlock, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { resumoCaixa } from "@/lib/caixa";
import { AbrirCaixaForm, FecharCaixaForm, LancamentoForm } from "./CaixaForms";
import { AtalhosCaixa, ConsolidadoPorForma, dataHora, horaCurta, Informacoes, TabelaMovimentos } from "./componentes";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { CartaoKpi } from "@/components/ui/CartaoKpi";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const caixa = await prisma.caixa.findFirst({
    where: { status: "ABERTO" },
    orderBy: { abertoEm: "desc" },
    include: {
      abertoPor: { select: { nome: true } },
      movimentos: { orderBy: { criadoEm: "desc" }, include: { funcionario: { select: { nome: true } } } },
    },
  });

  if (!caixa) {
    const ultimo = await prisma.caixa.findFirst({
      where: { status: "FECHADO" },
      orderBy: { fechadoEm: "desc" },
      include: { fechadoPor: { select: { nome: true } } },
    });
    return (
      <>
        <AtalhosCaixa ativo="atual" />
        <Cabecalho
          secao="Caixa"
          titulo="Caixa fechado"
          descricao="Abra o caixa com o troco que está na gaveta. Vendas e recebimentos de OS entram sozinhos, separados por forma de pagamento."
        >
          <Etiqueta tom="neutro">
            <Lock className="h-3 w-3" aria-hidden /> Fechado
          </Etiqueta>
          {ultimo && (
            <Chip>
              Último fechamento: {ultimo.fechadoEm ? dataHora(ultimo.fechadoEm) : "—"}
              {ultimo.fechadoPor ? ` por ${ultimo.fechadoPor.nome}` : ""}
            </Chip>
          )}
        </Cabecalho>
        <Cartao filete className="p-6">
          <TituloCartao selo="Abertura" icone={Unlock} titulo="Abrir o caixa" className="mb-5" />
          <AbrirCaixaForm sugestao={ultimo?.dinheiroContado ?? null} />
        </Cartao>
      </>
    );
  }

  const resumo = resumoCaixa(caixa.movimentos);
  const vendaAuto = caixa.aberturaAutomatica;

  return (
    <>
      <AtalhosCaixa ativo="atual" />
      <Cabecalho
        secao={`Caixa nº ${caixa.id}`}
        titulo="Caixa aberto"
        descricao={`Aberto ${caixa.abertoPor ? `por ${caixa.abertoPor.nome} ` : ""}em ${dataHora(caixa.abertoEm)}.`}
        acoes={
          <BotaoLink href={`/caixa/detalhado?id=${caixa.id}`} icone={Scale}>
            Ver detalhado
          </BotaoLink>
        }
      >
        <Etiqueta tom="sucesso">
          <Unlock className="h-3 w-3" aria-hidden /> Aberto
        </Etiqueta>
        <Chip>
          Troco inicial: <span className="numero text-texto">{formatCurrency(caixa.trocoInicial)}</span>
        </Chip>
        <Chip>{caixa.movimentos.length} lançamentos</Chip>
      </Cabecalho>

      {vendaAuto && (
        <Aviso tom="aviso">
          Esse caixa abriu sozinho ({caixa.observacaoAbertura?.replace("Aberto sozinho ao registrar: ", "") ?? "com uma venda"}), sem o troco. Se tinha
          dinheiro de troco na gaveta, lance um <strong>Reforço</strong> com esse valor para o fechamento bater.
        </Aviso>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoKpi tom="sol" icone={BadgeDollarSign} valor={formatCurrency(resumo.recebido)} rotulo="Recebido neste caixa" detalhe={`${resumo.qtdVendas} vendas · ${resumo.qtdRecebimentosOS} recebimentos de OS`} />
        <CartaoKpi tom="jade" icone={Banknote} valor={formatCurrency(resumo.dinheiroEsperado)} rotulo="Dinheiro na gaveta" detalhe="Troco + dinheiro recebido − sangrias e despesas" />
        <CartaoKpi tom="noite" icone={QrCode} valor={formatCurrency(resumo.porForma.PIX.saldo)} rotulo="Pix" detalhe="Recebido no Pix neste caixa" />
        <CartaoKpi tom="sakura" icone={CreditCard} valor={formatCurrency(resumo.porForma.CARTAO_MAQUININHA.saldo)} rotulo="Cartão (maquininha)" detalhe="Aprovado na Point Smart" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao filete className="p-6">
          <TituloCartao selo="Informações" icone={Info} titulo="Painel de informações" className="mb-3" />
          <Informacoes
            itens={[
              ["Situação", "Aberto"],
              ["Aberto por", caixa.abertoPor?.nome ?? "—"],
              ["Aberto às", horaCurta(caixa.abertoEm)],
              ["Troco inicial", formatCurrency(caixa.trocoInicial)],
              ["Vendas", `${resumo.qtdVendas} · ${formatCurrency(resumo.vendas)}`],
              ["Recebimentos de OS", `${resumo.qtdRecebimentosOS} · ${formatCurrency(resumo.recebimentosOS)}`],
              ["Reforços", formatCurrency(resumo.reforcos)],
              ["Sangrias", formatCurrency(resumo.sangrias)],
              ["Despesas pagas no caixa", formatCurrency(resumo.despesas)],
              ["Estornos", formatCurrency(resumo.estornos)],
            ]}
          />
        </Cartao>
        <Cartao filete className="p-6">
          <TituloCartao selo="Consolidado" icone={Wallet} titulo="Por forma de pagamento" className="mb-5" />
          <ConsolidadoPorForma resumo={resumo} />
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao filete className="p-6">
          <TituloCartao selo="Movimentar" icone={PiggyBank} titulo="Sangria, reforço ou despesa" className="mb-5" />
          <LancamentoForm />
        </Cartao>
        <Cartao filete className="p-6">
          <TituloCartao selo="Fechamento" icone={Lock} titulo="Fechar o caixa" descricao="Conte o dinheiro da gaveta; o Painel mostra se bateu." className="mb-5" />
          <FecharCaixaForm dinheiroEsperado={resumo.dinheiroEsperado} />
        </Cartao>
      </div>

      <Cartao filete className="p-6">
        <TituloCartao selo="Lançamentos" icone={Scale} titulo="Últimos lançamentos" className="mb-5">
          <Link href={`/caixa/detalhado?id=${caixa.id}`} className="text-sm font-semibold text-ouro hover:underline">
            Ver todos
          </Link>
        </TituloCartao>
        <TabelaMovimentos movimentos={caixa.movimentos.slice(0, 12)} comTotal={false} />
      </Cartao>
    </>
  );
}

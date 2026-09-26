import { CalendarCheck, History, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hojeCalendario, hojeInput } from "@/lib/datas";
import { criarVenda, excluirVenda } from "../actions";
import { NovaVendaForm } from "../NovaVendaForm";
import { VendasTable } from "../VendasTable";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function NovaVendaPage() {
  const modoTeste = process.env.MP_POINT_TEST_MODE === "true";
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [vendasHoje, armacoes, relogios, lentes] = await Promise.all([
    prisma.venda.findMany({
      where: { dataVenda: hojeCalendario() },
      orderBy: { id: "desc" },
      include: { funcionario: true },
    }),
    prisma.armacaoEstoque.findMany({ where: { ativo: true, quantidade: { gt: 0 } }, orderBy: { marcaModelo: "asc" } }),
    prisma.relogioEstoque.findMany({ where: { ativo: true, quantidade: { gt: 0 } }, orderBy: { modeloReferencia: "asc" } }),
    prisma.lenteEstoque.findMany({ where: { ativo: true, quantidade: { gt: 0 } }, orderBy: { descricao: "asc" } }),
  ]);

  return (
    <>
      <Cabecalho
        secao="Vendas"
        titulo="Nova venda"
        descricao="Registre a venda no balcão. No cartão, a cobrança vai direto para a maquininha."
        acoes={
          <BotaoLink href="/vendas" icone={History}>
            Vendas realizadas
          </BotaoLink>
        }
      />

      {modoTeste && (
        <Aviso tom="aviso">
          Modo de teste ligado: as cobranças no cartão usam o terminal virtual do Mercado Pago, sem mexer na maquininha
          real nem em dinheiro de verdade.
        </Aviso>
      )}

      <Cartao filete className="p-6">
        <TituloCartao selo="Balcão" icone={ShoppingCart} titulo="Dados da venda" className="mb-6" />
        <NovaVendaForm
          action={criarVenda}
          hoje={hojeInput()}
          armacoes={armacoes}
          relogios={relogios}
          lentes={lentes}
          isAdmin={isAdmin}
        />
      </Cartao>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Hoje"
          icone={CalendarCheck}
          titulo="Vendas de hoje"
          descricao="Acompanhe aqui a cobrança na maquininha."
          className="mb-5"
        />
        <VendasTable
          vendas={vendasHoje}
          excluir={excluirVenda}
          modoTeste={modoTeste}
          mostrarBusca={false}
          vazio="Nenhuma venda registrada hoje ainda."
        />
      </Cartao>
    </>
  );
}

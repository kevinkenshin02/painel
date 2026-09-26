import { CalendarCheck, History, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hojeCalendario, hojeInput } from "@/lib/datas";
import { criarVenda, excluirVenda } from "../actions";
import { NovaVendaForm, type ProdutoOpcao } from "../NovaVendaForm";
import { VendasTable } from "../VendasTable";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function NovaVendaPage(props: PageProps<"/vendas/nova">) {
  const busca = (await props.searchParams) as { produto?: string; cliente?: string };
  const modoTeste = process.env.MP_POINT_TEST_MODE === "true";
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [vendasHoje, produtos, cliente] = await Promise.all([
    prisma.venda.findMany({
      where: { dataVenda: hojeCalendario() },
      orderBy: { id: "desc" },
      include: { funcionario: true },
    }),
    prisma.produto.findMany({
      where: { ativo: true, OR: [{ quantidade: { gt: 0 } }, { id: Number(busca.produto) || -1 }] },
      orderBy: [{ tipo: "asc" }, { marca: "asc" }, { descricao: "asc" }],
      select: { id: true, codigo: true, tipo: true, marca: true, descricao: true, quantidade: true, custoUnitario: true, precoVenda: true },
    }),
    busca.cliente
      ? prisma.cliente.findUnique({ where: { id: Number(busca.cliente) || -1 }, select: { id: true, nome: true, telefone: true } })
      : Promise.resolve(null),
  ]);

  // funcionário não vê custo
  const opcoes: ProdutoOpcao[] = produtos.map((p) => ({ ...p, custoUnitario: isAdmin ? p.custoUnitario : 0 }));
  const produtoInicial = opcoes.find((p) => p.id === Number(busca.produto)) ?? null;

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
          produtos={opcoes}
          isAdmin={isAdmin}
          produtoInicial={produtoInicial}
          clienteInicial={cliente}
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

import { Package, PackagePlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { precisaAtencao } from "@/lib/produtos";
import { ProdutosTabela, type FiltrosProdutos } from "./ProdutosTabela";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function ProdutosPage(props: PageProps<"/produtos">) {
  const filtros = (await props.searchParams) as FiltrosProdutos;
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [produtos, fornecedores] = await Promise.all([
    prisma.produto.findMany({
      orderBy: [{ tipo: "asc" }, { marca: "asc" }, { descricao: "asc" }],
      include: { fornecedor: { select: { nome: true } } },
    }),
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const ativos = produtos.filter((p) => p.ativo);
  const atencao = produtos.filter(precisaAtencao).length;

  return (
    <>
      <Cabecalho
        secao="Cadastros"
        titulo="Produtos"
        descricao="Relógios, armações, lentes e acessórios numa ficha só: códigos, fornecedor, preços, estoque e histórico."
        acoes={
          isAdmin ? (
            <BotaoLink href="/produtos/novo" variante="primario" icone={PackagePlus}>
              Novo produto
            </BotaoLink>
          ) : undefined
        }
      >
        <Chip>{ativos.length} produtos ativos</Chip>
        <Chip>{ativos.reduce((s, p) => s + p.quantidade, 0)} peças</Chip>
        <Chip>
          Estoque a preço de venda:{" "}
          <span className="numero text-texto">{formatCurrency(ativos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0))}</span>
        </Chip>
        {atencao > 0 && <Chip className="border-perigo/40 text-perigo">{atencao} zerados ou abaixo do mínimo</Chip>}
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao selo="Catálogo" icone={Package} titulo="Lista de produtos" descricao="Clique no produto para abrir a ficha." className="mb-5" />
        <ProdutosTabela
          isAdmin={isAdmin}
          inicial={filtros}
          fornecedores={fornecedores}
          produtos={produtos.map((p) => ({
            id: p.id,
            codigo: p.codigo,
            codigoBarras: p.codigoBarras,
            referencia: p.referencia,
            tipo: p.tipo,
            marca: p.marca,
            descricao: p.descricao,
            localizacao: p.localizacao,
            fornecedorId: p.fornecedorId,
            fornecedor: p.fornecedor?.nome ?? null,
            quantidade: p.quantidade,
            estoqueMinimo: p.estoqueMinimo,
            // funcionário não vê custo
            custoUnitario: isAdmin ? p.custoUnitario : 0,
            precoVenda: p.precoVenda,
            ativo: p.ativo,
          }))}
        />
      </Cartao>
    </>
  );
}

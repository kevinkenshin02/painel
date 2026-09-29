import { redirect } from "next/navigation";
import { Package, PackagePlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { MARCAS_SUGERIDAS, nomeProduto } from "@/lib/produtos";
import { ProdutoForm } from "../ProdutoForm";
import { CopiarDeProduto } from "../CopiarDeProduto";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage(props: PageProps<"/produtos/novo">) {
  const { codigo, copiar } = (await props.searchParams) as { codigo?: string; copiar?: string };
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/produtos");

  const copiarId = Number(copiar) || undefined;
  const [fornecedores, marcasUsadas, todos, modelo] = await Promise.all([
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.produto.findMany({ where: { marca: { not: null } }, distinct: ["marca"], select: { marca: true } }),
    prisma.produto.findMany({
      orderBy: [{ tipo: "asc" }, { marca: "asc" }, { descricao: "asc" }],
      select: { id: true, tipo: true, codigo: true, marca: true, descricao: true, cor: true },
    }),
    copiarId ? prisma.produto.findUnique({ where: { id: copiarId } }) : null,
  ]);
  const marcas = [...new Set([...MARCAS_SUGERIDAS, ...marcasUsadas.map((m) => m.marca as string)])].sort((a, b) => a.localeCompare(b));
  const opcoes = todos.map((p) => ({ id: p.id, tipo: p.tipo, rotulo: `${nomeProduto(p)}${p.cor ? ` · ${p.cor}` : ""} (${p.codigo})` }));

  return (
    <>
      <Cabecalho
        secao="Cadastros · Produtos"
        titulo="Novo produto"
        descricao="Para peças parecidas, comece de uma que já está cadastrada e troque só o que muda."
        acoes={
          <BotaoLink href="/produtos" icone={Package}>
            Lista de produtos
          </BotaoLink>
        }
      />
      <Cartao filete className="p-6">
        <TituloCartao selo="Ficha" icone={PackagePlus} titulo="Dados do produto" className="mb-6" />
        <div className="mb-6 flex flex-col gap-3">
          <CopiarDeProduto opcoes={opcoes} selecionado={modelo?.id} codigo={codigo} />
          {modelo && (
            <Aviso tom="info">
              Copiado de <strong>{nomeProduto(modelo)}</strong> ({modelo.codigo}). Preencha o código desta peça e ajuste o que for diferente — a
              ficha original não muda.
            </Aviso>
          )}
        </div>
        <ProdutoForm
          key={modelo?.id ?? "novo"}
          fornecedores={fornecedores}
          marcas={marcas}
          podeEditar
          codigoInicial={codigo}
          modelo={
            modelo
              ? {
                  tipo: modelo.tipo,
                  codigo: "",
                  codigoBarras: null,
                  referencia: null,
                  marca: modelo.marca,
                  descricao: modelo.descricao,
                  cor: modelo.cor,
                  publico: modelo.publico,
                  mecanismo: modelo.mecanismo,
                  grau: modelo.grau,
                  ncm: modelo.ncm,
                  unidade: modelo.unidade,
                  localizacao: modelo.localizacao,
                  fornecedorId: modelo.fornecedorId,
                  estoqueMinimo: modelo.estoqueMinimo,
                  custoUnitario: modelo.custoUnitario,
                  precoVenda: modelo.precoVenda,
                  observacoes: modelo.observacoes,
                }
              : undefined
          }
        />
      </Cartao>
    </>
  );
}

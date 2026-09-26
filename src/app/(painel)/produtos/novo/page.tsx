import { redirect } from "next/navigation";
import { Package, PackagePlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { MARCAS_SUGERIDAS } from "@/lib/produtos";
import { ProdutoForm } from "../ProdutoForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) redirect("/produtos");

  const [fornecedores, marcasUsadas] = await Promise.all([
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.produto.findMany({ where: { marca: { not: null } }, distinct: ["marca"], select: { marca: true } }),
  ]);
  const marcas = [...new Set([...MARCAS_SUGERIDAS, ...marcasUsadas.map((m) => m.marca as string)])].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <Cabecalho
        secao="Cadastros · Produtos"
        titulo="Novo produto"
        descricao="Para muitos itens de uma vez, a entrada pela nota fiscal (XML) vai cadastrar sozinha — em breve."
        acoes={
          <BotaoLink href="/produtos" icone={Package}>
            Lista de produtos
          </BotaoLink>
        }
      />
      <Cartao filete className="p-6">
        <TituloCartao selo="Ficha" icone={PackagePlus} titulo="Dados do produto" className="mb-6" />
        <ProdutoForm fornecedores={fornecedores} marcas={marcas} podeEditar />
      </Cartao>
    </>
  );
}

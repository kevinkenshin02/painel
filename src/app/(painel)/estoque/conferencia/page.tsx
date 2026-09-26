import { ClipboardCheck, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { ConferenciaCliente } from "./ConferenciaCliente";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function ConferenciaPage() {
  const logado = await getFuncionarioLogado();
  const produtos = await prisma.produto.findMany({
    where: { OR: [{ ativo: true }, { aConferir: true }] },
    orderBy: [{ marca: "asc" }, { descricao: "asc" }],
    select: {
      id: true,
      codigo: true,
      codigoBarras: true,
      referencia: true,
      marca: true,
      descricao: true,
      localizacao: true,
      quantidade: true,
      precoVenda: true,
      ativo: true,
      aConferir: true,
    },
  });
  const aConferir = produtos.filter((p) => p.aConferir).length;

  return (
    <>
      <Cabecalho
        secao="Estoque"
        titulo="Conferência da vitrine"
        descricao="Conte o que tem na loja com o leitor de código de barras. No fim, o Painel acerta o estoque e registra as diferenças."
        acoes={
          <BotaoLink href="/estoque" icone={Package}>
            Posição do estoque
          </BotaoLink>
        }
      >
        <Chip>{produtos.filter((p) => p.ativo).length} produtos ativos</Chip>
        {aConferir > 0 && <Chip>{aConferir} relógios da lista antiga (Le Store) a conferir</Chip>}
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Contagem"
          icone={ClipboardCheck}
          titulo="Contar peças"
          descricao="Relógio da lista antiga que você encontrar vira ativo com a quantidade contada; o que não achar continua inativo."
          className="mb-5"
        />
        <ConferenciaCliente produtos={produtos} isAdmin={logado?.isAdmin ?? false} />
      </Cartao>
    </>
  );
}

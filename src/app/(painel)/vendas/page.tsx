import { History, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusPagamento } from "@/generated/prisma/enums";
import { formatCurrency } from "@/lib/format";
import { mesAtualCalendario } from "@/lib/datas";
import { excluirVenda } from "./actions";
import { VendasTable } from "./VendasTable";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function VendasPage() {
  const modoTeste = process.env.MP_POINT_TEST_MODE === "true";
  const mes = mesAtualCalendario();

  const vendas = await prisma.venda.findMany({
    orderBy: [{ dataVenda: "desc" }, { id: "desc" }],
    take: 200,
    include: { funcionario: true },
  });

  const pagasMes = vendas.filter(
    (v) => v.statusPagamento === StatusPagamento.PAGO && v.dataVenda >= mes.inicio && v.dataVenda < mes.fim
  );
  const totalMes = pagasMes.reduce((sum, v) => sum + v.valorVendido, 0);
  const pendentes = vendas.filter((v) => v.statusPagamento === StatusPagamento.PENDENTE).length;

  return (
    <>
      <Cabecalho
        secao="Vendas"
        titulo="Vendas realizadas"
        descricao="As últimas vendas registradas, com a situação do pagamento."
        acoes={
          <BotaoLink href="/vendas/nova" variante="primario" icone={Plus}>
            Nova venda
          </BotaoLink>
        }
      >
        <Chip>
          Pago em {mes.nome}: <span className="numero text-texto">{formatCurrency(totalMes)}</span>
        </Chip>
        <Chip>
          {pagasMes.length} {pagasMes.length === 1 ? "venda paga" : "vendas pagas"} no mês
        </Chip>
        {pendentes > 0 && <Chip>{pendentes} aguardando maquininha</Chip>}
      </Cabecalho>

      {modoTeste && (
        <Aviso tom="aviso">
          Modo de teste ligado: as cobranças no cartão usam o terminal virtual do Mercado Pago, sem mexer na maquininha
          real nem em dinheiro de verdade.
        </Aviso>
      )}

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Histórico"
          icone={History}
          titulo="Vendas"
          descricao="Mostra as 200 mais recentes. Excluir uma venda devolve o item ao estoque."
          className="mb-5"
        />
        <VendasTable vendas={vendas} excluir={excluirVenda} modoTeste={modoTeste} />
      </Cartao>
    </>
  );
}

import { UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusOS, StatusPagamento } from "@/generated/prisma/enums";
import { mesAtualCalendario } from "@/lib/datas";
import { ClientesTabela, type LinhaCliente } from "./ClientesTabela";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const mes = mesAtualCalendario();
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    include: {
      ordens: { select: { status: true, dataEntrada: true, valorTotal: true } },
      vendas: { select: { valorVendido: true, statusPagamento: true, dataVenda: true } },
    },
  });

  const mesAtual = mes.inicio.getUTCMonth();
  const linhas: LinhaCliente[] = clientes.map((c) => {
    const pagas = c.vendas.filter((v) => v.statusPagamento === StatusPagamento.PAGO);
    const entregues = c.ordens.filter((o) => o.status === StatusOS.ENTREGUE);
    const datas = [...c.ordens.map((o) => o.dataEntrada), ...c.vendas.map((v) => v.dataVenda)];
    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      cpf: c.cpf,
      ativo: c.ativo,
      aniversarioNoMes: c.nascimento?.getUTCMonth() === mesAtual,
      qtdOs: c.ordens.length,
      osAbertas: c.ordens.length - entregues.length,
      qtdCompras: pagas.length,
      totalGasto: pagas.reduce((s, v) => s + v.valorVendido, 0) + entregues.reduce((s, o) => s + o.valorTotal, 0),
      ultimaVisita: datas.length ? new Date(Math.max(...datas.map((d) => d.getTime()))) : null,
    };
  });

  const ativos = linhas.filter((c) => c.ativo).length;
  const novos = clientes.filter((c) => c.criadoEm >= mes.inicio).length;
  const aniversariantes = linhas.filter((c) => c.aniversarioNoMes && c.ativo).length;

  return (
    <>
      <Cabecalho
        secao="Cadastros"
        titulo="Clientes"
        descricao="Ficha de cada cliente com telefone, receitas de óculos e o histórico de OS e compras."
        acoes={
          <BotaoLink href="/clientes/novo" variante="primario" icone={UserPlus}>
            Novo cliente
          </BotaoLink>
        }
      >
        <Chip>{ativos} ativos</Chip>
        <Chip>{novos} novos em {mes.nome.split(" ")[0]}</Chip>
        <Chip>{aniversariantes} fazem aniversário este mês</Chip>
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Cadastro"
          icone={Users}
          titulo="Lista de clientes"
          descricao="Clique no cliente para abrir a ficha. Toda OS nova já cria ou atualiza o cadastro."
          className="mb-5"
        />
        <ClientesTabela clientes={linhas} />
      </Cartao>
    </>
  );
}

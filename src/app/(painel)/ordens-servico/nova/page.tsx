import { ClipboardList, ClipboardPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hojeInput } from "@/lib/datas";
import { criarOrdemServico } from "../actions";
import { NovaOSForm } from "../NovaOSForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";

export const dynamic = "force-dynamic";

export default async function NovaOrdemServicoPage(props: PageProps<"/ordens-servico/nova">) {
  const { cliente: clienteParam } = (await props.searchParams) as { cliente?: string };
  const cliente = clienteParam
    ? await prisma.cliente.findUnique({ where: { id: Number(clienteParam) || -1 }, select: { id: true, nome: true, telefone: true } })
    : null;

  return (
    <>
      <Cabecalho
        secao="Ordens de serviço"
        titulo="Nova ordem de serviço"
        descricao="Óculos para o laboratório, conserto de relógio, troca de bateria ou pulseira, ajuste de armação."
        acoes={
          <BotaoLink href="/ordens-servico" icone={ClipboardList}>
            Em andamento
          </BotaoLink>
        }
      />
      <Cartao filete className="p-7">
        <TituloCartao selo="Entrada" icone={ClipboardPlus} titulo="Dados da OS" className="mb-6" />
        <NovaOSForm action={criarOrdemServico} hoje={hojeInput()} clienteInicial={cliente} />
      </Cartao>
    </>
  );
}

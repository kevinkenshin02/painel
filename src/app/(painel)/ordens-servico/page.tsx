import { CircleCheck, ClipboardList, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusOS } from "@/generated/prisma/enums";
import { hojeCalendario } from "@/lib/datas";
import { OrdensAtivasTable } from "./OrdensAtivasTable";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function OrdensServicoPage() {
  const hoje = hojeCalendario();
  const ativas = await prisma.ordemServico.findMany({
    where: { status: { not: StatusOS.ENTREGUE } },
    orderBy: { prazoPrometido: "asc" },
  });

  const atrasadas = ativas.filter((os) => os.prazoPrometido < hoje).length;
  const prontas = ativas.filter((os) => os.status === StatusOS.PRONTO_PARA_AVISAR).length;

  return (
    <>
      <Cabecalho
        secao="Ordens de serviço"
        titulo="Em andamento"
        descricao="Óculos e relógios em serviço. Mude a situação na própria linha; o Avisar abre o WhatsApp com a mensagem pronta."
        acoes={
          <>
            <BotaoLink href="/ordens-servico/entregues" icone={CircleCheck}>
              Entregues
            </BotaoLink>
            <BotaoLink href="/ordens-servico/nova" variante="primario" icone={Plus}>
              Nova OS
            </BotaoLink>
          </>
        }
      >
        <Chip>{ativas.length} em andamento</Chip>
        <Chip>{prontas} prontas para avisar</Chip>
        <Chip className={atrasadas > 0 ? "border-perigo/40 text-perigo" : undefined}>{atrasadas} atrasadas</Chip>
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao
          selo="Serviços"
          icone={ClipboardList}
          titulo="Ordens em andamento"
          descricao="Ordenadas pelo prazo prometido; as atrasadas ficam com a marca vermelha."
          className="mb-5"
        />
        <OrdensAtivasTable ativas={ativas} hoje={hoje} />
      </Cartao>
    </>
  );
}

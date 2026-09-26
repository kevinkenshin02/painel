import { ClipboardList, ClipboardPlus } from "lucide-react";
import { hojeInput } from "@/lib/datas";
import { criarOrdemServico } from "../actions";
import { NovaOSForm } from "../NovaOSForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";

export const dynamic = "force-dynamic";

export default function NovaOrdemServicoPage() {
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
        <NovaOSForm action={criarOrdemServico} hoje={hojeInput()} />
      </Cartao>
    </>
  );
}

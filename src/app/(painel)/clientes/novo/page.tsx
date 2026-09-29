import { UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ClienteForm } from "../ClienteForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Aviso } from "@/components/ui/Aviso";

export const dynamic = "force-dynamic";

export default async function NovoClientePage(props: PageProps<"/clientes/novo">) {
  const { copiar } = (await props.searchParams) as { copiar?: string };
  const copiarId = Number(copiar) || undefined;
  const parente = copiarId
    ? await prisma.cliente.findUnique({ where: { id: copiarId }, select: { id: true, nome: true, telefone: true, endereco: true, origem: true } })
    : null;

  return (
    <>
      <Cabecalho
        secao="Cadastros"
        titulo={parente ? "Novo cliente da mesma família" : "Novo cliente"}
        descricao="Depois de salvar, a ficha abre para guardar a receita dos óculos."
        acoes={
          <BotaoLink href="/clientes" icone={Users}>
            Lista de clientes
          </BotaoLink>
        }
      />
      <Cartao filete className="p-6">
        <TituloCartao selo="Dados" icone={UserPlus} titulo="Dados do cliente" className="mb-6" />
        {parente && (
          <Aviso tom="info" className="mb-6">
            Telefone, endereço e origem vieram de <strong>{parente.nome}</strong>. Preencha o nome e os dados que são só desta pessoa.
          </Aviso>
        )}
        <ClienteForm key={parente?.id ?? "novo"} familia={parente ?? undefined} />
      </Cartao>
    </>
  );
}

import { UserPlus, Users } from "lucide-react";
import { ClienteForm } from "../ClienteForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";

export default function NovoClientePage() {
  return (
    <>
      <Cabecalho
        secao="Cadastros"
        titulo="Novo cliente"
        descricao="Depois de salvar, a ficha abre para guardar a receita dos óculos."
        acoes={
          <BotaoLink href="/clientes" icone={Users}>
            Lista de clientes
          </BotaoLink>
        }
      />
      <Cartao filete className="p-6">
        <TituloCartao selo="Dados" icone={UserPlus} titulo="Dados do cliente" className="mb-6" />
        <ClienteForm />
      </Cartao>
    </>
  );
}

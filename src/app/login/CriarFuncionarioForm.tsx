"use client";

import { useActionState, useState } from "react";
import { criarFuncionarioComPinAdmin } from "./actions";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";

const ESTADO_INICIAL: { erro?: string; ok?: boolean; nomeAdicionado?: string } = {};

export function CriarFuncionarioForm({ onVoltar }: { onVoltar: () => void }) {
  const [pinAdmin, setPinAdmin] = useState("");
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  // Campos controlados: só limpa quando deu certo (num erro a pessoa não precisa redigitar tudo).
  const [estado, formAction, isPending] = useActionState(
    async (anterior: typeof ESTADO_INICIAL, formData: FormData) => {
      const resultado = await criarFuncionarioComPinAdmin(anterior, formData);
      if (resultado.ok) {
        setPinAdmin("");
        setNome("");
        setPin("");
      }
      return resultado;
    },
    ESTADO_INICIAL
  );

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Aviso tom="aviso">
        Só o administrador pode cadastrar novos funcionários. Digite o PIN do administrador para liberar o cadastro.
      </Aviso>

      <Campo rotulo="PIN do administrador">
        <input
          type="password"
          name="pinAdmin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          required
          value={pinAdmin}
          onChange={(e) => setPinAdmin(e.target.value.replace(/\D/g, ""))}
          className={`${classeCampo} tracking-[0.3em]`}
        />
      </Campo>

      <Campo rotulo="Nome do novo funcionário">
        <input type="text" name="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className={classeCampo} />
      </Campo>

      <Campo rotulo="PIN do novo funcionário (4 a 6 números)">
        <input
          type="password"
          name="pin"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className={`${classeCampo} tracking-[0.3em]`}
        />
      </Campo>

      {estado.erro && <Aviso tom="perigo">{estado.erro}</Aviso>}
      {estado.ok && (
        <Aviso tom="sucesso">
          &quot;{estado.nomeAdicionado}&quot; foi cadastrado. Já pode escolher o perfil e entrar com o PIN.
        </Aviso>
      )}

      <Botao type="submit" variante="primario" tamanho="lg" disabled={isPending}>
        {isPending ? "Criando..." : "Criar funcionário"}
      </Botao>
      <button type="button" onClick={onVoltar} className="text-xs font-semibold text-suave hover:text-ouro hover:underline">
        Voltar para os perfis
      </button>
    </form>
  );
}

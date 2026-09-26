"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { criarFuncionario, alternarAtivoFuncionario } from "./actions";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Etiqueta } from "@/components/ui/Etiqueta";

type Funcionario = {
  id: number;
  nome: string;
  ativo: boolean;
  isAdmin: boolean;
};

const ESTADO_INICIAL: { erro?: string; ok?: boolean; nomeAdicionado?: string } = {};

export function FuncionariosSection({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");

  // Campos são controlados de propósito: um <form action> descontrolado é
  // limpo pelo React assim que a submissão termina, mesmo quando a ação
  // retorna um erro (ex: PIN repetido) — obrigando a pessoa a redigitar
  // tudo de novo sem entender por quê. Só limpamos manualmente no sucesso.
  const [estado, formAction, isPending] = useActionState(
    async (anterior: typeof ESTADO_INICIAL, formData: FormData) => {
      const resultado = await criarFuncionario(anterior, formData);
      if (resultado.ok) {
        setNome("");
        setPin("");
      }
      return resultado;
    },
    ESTADO_INICIAL
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_12rem_auto]">
        <Campo rotulo="Nome">
          <input type="text" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required className={classeCampo} />
        </Campo>
        <Campo rotulo="PIN (4 a 6 números)">
          <input
            type="password"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            required
            pattern="\d{4,6}"
            title="4 a 6 números"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={`${classeCampo} tracking-[0.3em]`}
          />
        </Campo>
        <Botao type="submit" variante="primario" icone={UserPlus} disabled={isPending} className="h-[42px]">
          {isPending ? "Criando..." : "Adicionar"}
        </Botao>
      </form>
      {estado.erro && <Aviso tom="perigo">{estado.erro}</Aviso>}
      {estado.ok && (
        <Aviso tom="sucesso">
          &quot;{estado.nomeAdicionado}&quot; foi adicionado e já pode entrar com o PIN cadastrado.
        </Aviso>
      )}

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Acesso</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-suave">
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            )}
            {funcionarios.map((f) => (
              <tr key={f.id}>
                <td className="destaque">{f.nome}</td>
                <td>{f.isAdmin ? <Etiqueta tom="ouro">Administrador</Etiqueta> : <Etiqueta>Funcionário</Etiqueta>}</td>
                <td>
                  <ToggleAtivoButton id={f.id} ativo={f.ativo} action={alternarAtivoFuncionario} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-suave">
        Desativar um funcionário impede a entrada dele, mas mantém o histórico de vendas registradas em nome dele.
      </p>
    </div>
  );
}

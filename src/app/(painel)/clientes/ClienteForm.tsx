"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { salvarCliente } from "./actions";
import { CANAL_ORIGEM_LABELS } from "../vendas/labels";
import { PhoneInput } from "@/components/PhoneInput";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { formatCpf } from "@/lib/format";

export type ClienteEdicao = {
  id: number;
  nome: string;
  telefone: string;
  cpf: string | null;
  email: string | null;
  nascimento: string | null;
  endereco: string | null;
  origem: string | null;
  observacoes: string | null;
};

/** Cadastro de alguém da mesma família: vem só o que costuma ser igual (telefone, endereço, origem). */
export type ClienteFamilia = Pick<ClienteEdicao, "telefone" | "endereco" | "origem">;

export function ClienteForm({ cliente, familia }: { cliente?: ClienteEdicao; familia?: ClienteFamilia }) {
  const router = useRouter();
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [cpf, setCpf] = useState(formatCpf(cliente?.cpf));

  async function enviar(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await salvarCliente(formData);
      setResultado(r);
      if (r.ok && r.id && !cliente) router.push(`/clientes/${r.id}`);
      else if (r.ok) router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form action={enviar} className="flex flex-col gap-5">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Nome completo" className="sm:col-span-2">
          <input type="text" name="nome" required autoFocus={!cliente} defaultValue={cliente?.nome} className={classeCampo} />
        </Campo>
        <Campo rotulo="Telefone / WhatsApp">
          <PhoneInput name="telefone" defaultValue={cliente?.telefone ?? familia?.telefone ?? ""} placeholder="(11) 91234-5678" />
        </Campo>
        <Campo rotulo="CPF (opcional)">
          <input
            type="text"
            name="cpf"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Data de nascimento">
          <input type="date" name="nascimento" defaultValue={cliente?.nascimento ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="E-mail">
          <input type="email" name="email" defaultValue={cliente?.email ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="Endereço" className="sm:col-span-2">
          <input type="text" name="endereco" defaultValue={cliente?.endereco ?? familia?.endereco ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="Como conheceu a loja">
          <select name="origem" defaultValue={cliente?.origem ?? familia?.origem ?? ""} className={classeCampo}>
            <option value="">—</option>
            {Object.entries(CANAL_ORIGEM_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2 lg:col-span-3">
          <textarea name="observacoes" rows={2} defaultValue={cliente?.observacoes ?? ""} className={classeCampo} />
        </Campo>
      </div>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && cliente && <Aviso tom="sucesso">Cadastro salvo.</Aviso>}

      <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-5">
        <Botao type="submit" variante="primario" icone={Save} disabled={enviando}>
          {enviando ? "Salvando..." : cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </Botao>
      </div>
    </form>
  );
}

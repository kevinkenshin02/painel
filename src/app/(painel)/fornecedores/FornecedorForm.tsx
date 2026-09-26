"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { salvarFornecedor } from "./actions";
import { PhoneInput } from "@/components/PhoneInput";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { formatCnpj } from "@/lib/format";

export type FornecedorEdicao = {
  id: number;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  representante: string | null;
  observacoes: string | null;
};

export function FornecedorForm({ fornecedor, podeEditar }: { fornecedor?: FornecedorEdicao; podeEditar: boolean }) {
  const router = useRouter();
  const [chave, setChave] = useState(0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [cnpj, setCnpj] = useState(formatCnpj(fornecedor?.cnpj));

  async function enviar(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await salvarFornecedor(formData);
      setResultado(r);
      if (r.ok && !fornecedor) {
        setChave((k) => k + 1);
        setCnpj("");
      }
      if (r.ok) router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form key={chave} action={enviar} className="flex flex-col gap-5">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}
      <fieldset disabled={!podeEditar} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Nome (como a loja chama)">
          <input name="nome" required defaultValue={fornecedor?.nome} placeholder="Ex.: Orient" className={classeCampo} />
        </Campo>
        <Campo rotulo="Razão social">
          <input name="razaoSocial" defaultValue={fornecedor?.razaoSocial ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="CNPJ">
          <input
            name="cnpj"
            inputMode="numeric"
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Telefone">
          <PhoneInput name="telefone" defaultValue={fornecedor?.telefone ?? ""} placeholder="(11) 0000-0000" />
        </Campo>
        <Campo rotulo="E-mail">
          <input type="email" name="email" defaultValue={fornecedor?.email ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="Representante">
          <input name="representante" defaultValue={fornecedor?.representante ?? ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2 lg:col-span-3">
          <input name="observacoes" defaultValue={fornecedor?.observacoes ?? ""} className={classeCampo} />
        </Campo>
      </fieldset>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && <Aviso tom="sucesso">{fornecedor ? "Fornecedor salvo." : "Fornecedor cadastrado."}</Aviso>}

      {podeEditar && (
        <div>
          <Botao type="submit" variante="primario" icone={Save} disabled={enviando}>
            {enviando ? "Salvando..." : fornecedor ? "Salvar alterações" : "Cadastrar fornecedor"}
          </Botao>
        </div>
      )}
    </form>
  );
}

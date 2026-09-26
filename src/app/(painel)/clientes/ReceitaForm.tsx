"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { salvarReceita } from "./actions";
import { COLUNAS_RECEITA } from "./receita";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";


const TIPOS_LENTE = ["Visão simples", "Multifocal", "Bifocal", "Filtro de luz azul", "Solar / colorida", "Ocupacional"];

const classeNum =
  "w-full min-w-0 rounded-lg border border-borda bg-superficie-2 px-2 py-2 text-center text-sm text-texto numero focus:border-ouro focus:ring-2 focus:ring-ouro/25 focus:outline-none";

export function ReceitaForm({ clienteId }: { clienteId: number }) {
  const router = useRouter();
  const [chave, setChave] = useState(0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await salvarReceita(formData);
      setResultado(r);
      if (r.ok) {
        setChave((k) => k + 1);
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form key={chave} action={enviar} className="flex flex-col gap-5">
      <input type="hidden" name="clienteId" value={clienteId} />
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[4.5rem_repeat(6,minmax(0,1fr))] items-center gap-2">
          <span />
          {COLUNAS_RECEITA.map(([, rotulo]) => (
            <span key={rotulo} className="text-center text-[11px] font-bold tracking-[0.08em] text-suave uppercase">
              {rotulo}
            </span>
          ))}
          {(["od", "oe"] as const).map((olho) => (
            <div key={olho} className="contents">
              <span className="text-sm font-bold text-texto">{olho === "od" ? "OD" : "OE"}</span>
              {COLUNAS_RECEITA.map(([campo, rotulo]) => (
                <input
                  key={campo}
                  name={`${olho}${campo}`}
                  aria-label={`${rotulo} ${olho === "od" ? "olho direito" : "olho esquerdo"}`}
                  placeholder={campo === "Eixo" ? "0°" : "0,00"}
                  autoComplete="off"
                  className={classeNum}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-suave">OD = olho direito · OE = olho esquerdo. Copie como está no papel (ex.: -1,25 / +2,00 / 180).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo rotulo="D.P. (distância pupilar)">
          <input name="dp" placeholder="Ex.: 62 ou 31/31" className={classeCampo} />
        </Campo>
        <Campo rotulo="Data da receita">
          <input type="date" name="dataReceita" className={classeCampo} />
        </Campo>
        <Campo rotulo="Médico (opcional)">
          <input name="medico" className={classeCampo} />
        </Campo>
        <Campo rotulo="Tipo de lente">
          <input name="tipoLente" list="tipos-lente" className={classeCampo} />
          <datalist id="tipos-lente">
            {TIPOS_LENTE.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2 lg:col-span-4">
          <input name="observacoes" className={classeCampo} />
        </Campo>
      </div>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && <Aviso tom="sucesso">Receita guardada no cadastro.</Aviso>}

      <div>
        <Botao type="submit" variante="primario" icone={Plus} disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar receita"}
        </Botao>
      </div>
    </form>
  );
}

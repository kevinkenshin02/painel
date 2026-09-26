"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, Lock, Receipt, Unlock } from "lucide-react";
import { abrirCaixa, fecharCaixa, lancarNoCaixa } from "./actions";
import { formatCurrency } from "@/lib/format";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { cx } from "@/components/ui/cx";

type Resultado = { erro?: string; ok?: boolean };

function useEnvio(acao: (f: FormData) => Promise<Resultado>) {
  const router = useRouter();
  const [chave, setChave] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  async function enviar(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await acao(formData);
      setResultado(r);
      if (r.ok) {
        setChave((k) => k + 1);
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }
  return { chave, resultado, enviando, enviar };
}

export function AbrirCaixaForm({ sugestao }: { sugestao: number | null }) {
  const { chave, resultado, enviando, enviar } = useEnvio(abrirCaixa);
  return (
    <form key={chave} action={enviar} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[14rem_1fr]">
        <Campo rotulo="Troco na gaveta (R$)" dica={sugestao !== null ? `No último fechamento foram contados ${formatCurrency(sugestao)}.` : undefined}>
          <input name="trocoInicial" type="number" min={0} step="0.01" required autoFocus defaultValue={sugestao ?? ""} className={cx(classeCampo, "numero text-base font-semibold")} />
        </Campo>
        <Campo rotulo="Observação (opcional)">
          <input name="observacao" className={classeCampo} />
        </Campo>
      </div>
      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      <div>
        <Botao type="submit" variante="primario" tamanho="lg" icone={Unlock} disabled={enviando}>
          {enviando ? "Abrindo..." : "Abrir o caixa"}
        </Botao>
      </div>
    </form>
  );
}

const TIPOS = [
  { valor: "SANGRIA", rotulo: "Sangria", dica: "Tirar dinheiro da gaveta (ex.: depósito, levar para o cofre)", Icone: ArrowUpFromLine },
  { valor: "REFORCO", rotulo: "Reforço", dica: "Colocar dinheiro na gaveta (ex.: mais troco)", Icone: ArrowDownToLine },
  { valor: "DESPESA", rotulo: "Despesa", dica: "Pagou algo com dinheiro da gaveta (ex.: café, motoboy)", Icone: Receipt },
] as const;

export function LancamentoForm() {
  const { chave, resultado, enviando, enviar } = useEnvio(lancarNoCaixa);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["valor"]>("SANGRIA");
  const atual = TIPOS.find((t) => t.valor === tipo)!;
  return (
    <form key={chave} action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="tipo" value={tipo} />
      <div className="grid grid-cols-3 gap-2">
        {TIPOS.map(({ valor, rotulo, Icone }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTipo(valor)}
            aria-pressed={tipo === valor}
            className={cx(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              tipo === valor ? "border-ouro bg-ouro/12 text-texto" : "border-borda bg-superficie-2 text-texto-2 hover:border-borda-forte"
            )}
          >
            <Icone className="h-5 w-5 text-ouro" aria-hidden />
            {rotulo}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-xs text-suave">{atual.dica}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
        <Campo rotulo="Valor (R$)">
          <input name="valor" type="number" min={0.01} step="0.01" required className={cx(classeCampo, "numero")} />
        </Campo>
        <Campo rotulo={tipo === "DESPESA" ? "O que foi pago" : "Motivo"}>
          <input name="descricao" required className={classeCampo} />
        </Campo>
      </div>
      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && <Aviso tom="sucesso">Lançado no caixa.</Aviso>}
      <div>
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Lançando..." : `Lançar ${atual.rotulo.toLowerCase()}`}
        </Botao>
      </div>
    </form>
  );
}

export function FecharCaixaForm({ dinheiroEsperado }: { dinheiroEsperado: number }) {
  const { resultado, enviando, enviar } = useEnvio(fecharCaixa);
  const [contado, setContado] = useState("");
  const diferenca = contado === "" ? null : Math.round((Number(contado) - dinheiroEsperado) * 100) / 100;
  return (
    <form
      action={enviar}
      onSubmit={(e) => {
        if (!confirm("Fechar o caixa agora? Depois de fechado, novas vendas abrem outro caixa.")) e.preventDefault();
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-borda bg-superficie-2 px-4 py-3">
          <div className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Deve ter na gaveta</div>
          <div className="numero text-xl font-bold text-texto">{formatCurrency(dinheiroEsperado)}</div>
        </div>
        <Campo rotulo="Dinheiro contado (R$)">
          <input
            name="dinheiroContado"
            type="number"
            min={0}
            step="0.01"
            required
            value={contado}
            onChange={(e) => setContado(e.target.value)}
            className={cx(classeCampo, "numero text-base font-semibold")}
          />
        </Campo>
      </div>
      {diferenca !== null && (
        <div
          className={cx(
            "rounded-xl border px-4 py-3 text-sm font-semibold",
            Math.abs(diferenca) < 0.01
              ? "border-sucesso/35 bg-sucesso-fundo text-sucesso"
              : diferenca > 0
                ? "border-aviso/35 bg-aviso-fundo text-aviso"
                : "border-perigo/35 bg-perigo-fundo text-perigo"
          )}
        >
          {Math.abs(diferenca) < 0.01
            ? "Bateu certinho."
            : diferenca > 0
              ? `Sobrando ${formatCurrency(diferenca)} na gaveta.`
              : `Faltando ${formatCurrency(-diferenca)} na gaveta.`}
        </div>
      )}
      <Campo rotulo="Observação" dica="Obrigatória se der diferença.">
        <input name="observacao" className={classeCampo} />
      </Campo>
      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      <div>
        <Botao type="submit" variante="perigo" tamanho="lg" icone={Lock} disabled={enviando}>
          {enviando ? "Fechando..." : "Fechar o caixa"}
        </Botao>
      </div>
    </form>
  );
}

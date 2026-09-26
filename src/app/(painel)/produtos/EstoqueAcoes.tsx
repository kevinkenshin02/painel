"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Scale, Trash2 } from "lucide-react";
import { ajustarEstoque, entradaEstoque, excluirProduto } from "./actions";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { cx } from "@/components/ui/cx";

type Resultado = { erro?: string; ok?: boolean };

function useAcao(acao: (f: FormData) => Promise<Resultado>) {
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

export function EstoqueAcoes({ produtoId, quantidadeAtual, custoAtual }: { produtoId: number; quantidadeAtual: number; custoAtual: number }) {
  const entrada = useAcao(entradaEstoque);
  const ajuste = useAcao(ajustarEstoque);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <form key={`e${entrada.chave}`} action={entrada.enviar} className="flex flex-col gap-4 rounded-xl border border-borda bg-superficie-2/50 p-5">
        <input type="hidden" name="id" value={produtoId} />
        <div className="flex items-center gap-2 text-sm font-bold text-texto">
          <PackagePlus className="h-4 w-4 text-ouro" aria-hidden /> Entrada de peças
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo rotulo="Quantas chegaram">
            <input name="quantidade" type="number" min={1} required className={cx(classeCampo, "numero")} />
          </Campo>
          <Campo rotulo="Custo unitário (R$)" dica={`Deixe vazio para manter ${custoAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`}>
            <input name="custoUnitario" type="number" min={0} step="0.01" className={cx(classeCampo, "numero")} />
          </Campo>
          <Campo rotulo="Motivo / nota" className="sm:col-span-2">
            <input name="motivo" placeholder="Ex.: reposição do fornecedor, NF 12345" className={classeCampo} />
          </Campo>
        </div>
        {entrada.resultado?.erro && <Aviso tom="perigo">{entrada.resultado.erro}</Aviso>}
        {entrada.resultado?.ok && <Aviso tom="sucesso">Entrada lançada.</Aviso>}
        <div>
          <Botao type="submit" variante="primario" disabled={entrada.enviando}>
            {entrada.enviando ? "Lançando..." : "Lançar entrada"}
          </Botao>
        </div>
      </form>

      <form key={`a${ajuste.chave}`} action={ajuste.enviar} className="flex flex-col gap-4 rounded-xl border border-borda bg-superficie-2/50 p-5">
        <input type="hidden" name="id" value={produtoId} />
        <div className="flex items-center gap-2 text-sm font-bold text-texto">
          <Scale className="h-4 w-4 text-ouro" aria-hidden /> Ajuste pela contagem
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo rotulo="Quantidade que tem de verdade" dica={`No sistema: ${quantidadeAtual}.`}>
            <input name="novaQuantidade" type="number" min={0} required className={cx(classeCampo, "numero")} />
          </Campo>
          <Campo rotulo="Motivo">
            <input name="motivo" required placeholder="Conferência, defeito, perda..." className={classeCampo} />
          </Campo>
        </div>
        {ajuste.resultado?.erro && <Aviso tom="perigo">{ajuste.resultado.erro}</Aviso>}
        {ajuste.resultado?.ok && <Aviso tom="sucesso">Estoque ajustado.</Aviso>}
        <div>
          <Botao type="submit" disabled={ajuste.enviando}>
            {ajuste.enviando ? "Ajustando..." : "Ajustar estoque"}
          </Botao>
        </div>
      </form>
    </div>
  );
}

export function ExcluirProduto({ produtoId }: { produtoId: number }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-2">
      <Botao
        variante="perigo"
        tamanho="sm"
        icone={Trash2}
        onClick={async () => {
          if (!confirm("Excluir este produto de vez? (Se já foi vendido, o Painel vai pedir para desativar.)")) return;
          const fd = new FormData();
          fd.set("id", String(produtoId));
          const r = await excluirProduto(fd);
          if (r.erro) setErro(r.erro);
          else router.push("/produtos");
        }}
      >
        Excluir produto
      </Botao>
      {erro && <p className="max-w-xs text-right text-xs text-perigo">{erro}</p>}
    </div>
  );
}

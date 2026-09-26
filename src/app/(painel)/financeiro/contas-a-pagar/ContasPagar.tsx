"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Undo2, X } from "lucide-react";
import { criarContaPagar, desfazerPagamento, pagarConta, removerConta } from "../actions";
import { FORMA_PAGAMENTO_LABELS } from "../../vendas/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export type LinhaConta = {
  id: number;
  descricao: string;
  categoria: string | null;
  fornecedor: string | null;
  valor: number;
  vencimento: Date;
  pagoEm: Date | null;
  valorPago: number | null;
  formaPagamento: string | null;
  pagoPeloCaixa: boolean;
  cancelada: boolean;
  origem: "AVULSA" | "DESPESA_FIXA" | "NOTA";
  parcela: string | null;
};

const ORIGEM = { AVULSA: "Avulsa", DESPESA_FIXA: "Fixa", NOTA: "Nota" } as const;
const classeMini = "rounded-lg border border-borda bg-superficie px-2.5 py-1.5 text-sm text-texto focus:border-ouro focus:outline-none";

function situacao(c: LinhaConta, hoje: Date) {
  if (c.cancelada) return <Etiqueta>Não vale neste mês</Etiqueta>;
  if (c.pagoEm) return <Etiqueta tom="sucesso">Paga em {formatDate(c.pagoEm)}</Etiqueta>;
  const dias = Math.round((c.vencimento.getTime() - hoje.getTime()) / 864e5);
  if (dias < 0) return <Etiqueta tom="perigo">Vencida há {-dias} {dias === -1 ? "dia" : "dias"}</Etiqueta>;
  if (dias === 0) return <Etiqueta tom="aviso">Vence hoje</Etiqueta>;
  if (dias <= 5) return <Etiqueta tom="aviso">Vence em {dias} {dias === 1 ? "dia" : "dias"}</Etiqueta>;
  return <Etiqueta tom="info">Em aberto</Etiqueta>;
}

export function TabelaContas({ contas, hoje, hojeInput }: { contas: LinhaConta[]; hoje: Date; hojeInput: string }) {
  const router = useRouter();
  const [pagando, setPagando] = useState<number | null>(null);
  const [forma, setForma] = useState("PIX");
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: (f: FormData) => Promise<{ erro?: string; ok?: boolean }>, fd: FormData) {
    setErro(null);
    const r = await acao(fd);
    if (r.erro) setErro(r.erro);
    else {
      setPagando(null);
      router.refresh();
    }
  }
  const comId = (id: number) => {
    const fd = new FormData();
    fd.set("id", String(id));
    return fd;
  };

  const validas = contas.filter((c) => !c.cancelada);
  return (
    <div className="flex flex-col gap-3">
      {erro && <Aviso tom="perigo">{erro}</Aviso>}
      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Conta</th>
              <th>Categoria</th>
              <th className="direita">Valor</th>
              <th>Situação</th>
              <th className="direita">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contas.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-suave">
                  Nenhuma conta com esses filtros.
                </td>
              </tr>
            )}
            {contas.map((c) => (
              <Fragment key={c.id}>
                <tr className={c.cancelada ? "opacity-50 [&>td]:line-through" : undefined}>
                  <td className="numero whitespace-nowrap">{formatDate(c.vencimento)}</td>
                  <td>
                    <div className="font-semibold text-texto">
                      {c.descricao}
                      {c.parcela && <span className="font-normal text-suave"> · parcela {c.parcela}</span>}
                    </div>
                    <div className="text-xs text-suave">
                      <Etiqueta className="mr-1.5 !px-1.5 !py-0 text-[10px]">{ORIGEM[c.origem]}</Etiqueta>
                      {c.fornecedor ?? ""}
                    </div>
                  </td>
                  <td>{c.categoria ?? "—"}</td>
                  <td className="direita numero destaque">
                    {formatCurrency(c.valor)}
                    {c.valorPago !== null && Math.abs(c.valorPago - c.valor) > 0.009 && (
                      <div className="text-xs font-normal text-suave">pago {formatCurrency(c.valorPago)}</div>
                    )}
                  </td>
                  <td>
                    {situacao(c, hoje)}
                    {c.pagoEm && c.formaPagamento && (
                      <div className="mt-1 text-xs text-suave">
                        {FORMA_PAGAMENTO_LABELS[c.formaPagamento as keyof typeof FORMA_PAGAMENTO_LABELS]}
                        {c.pagoPeloCaixa ? " · saiu do caixa" : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {!c.pagoEm && !c.cancelada && (
                        <button
                          type="button"
                          onClick={() => setPagando(pagando === c.id ? null : c.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sucesso/35 bg-sucesso-fundo px-2 py-1 text-xs font-semibold text-sucesso transition hover:border-sucesso/70"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Pagar
                        </button>
                      )}
                      {c.pagoEm && (
                        <button
                          type="button"
                          onClick={() => executar(desfazerPagamento, comId(c.id))}
                          title="Desfazer pagamento"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-superficie-3 hover:text-texto"
                        >
                          <Undo2 className="h-3.5 w-3.5" aria-hidden />
                          Desfazer
                        </button>
                      )}
                      {!c.pagoEm && (
                        <button
                          type="button"
                          onClick={() => {
                            const msg =
                              c.origem === "AVULSA"
                                ? "Excluir esta conta?"
                                : c.cancelada
                                  ? "Voltar a contar esta conta neste mês?"
                                  : "Essa conta não vale neste mês? (ela some dos totais, mas continua listada)";
                            if (confirm(msg)) executar(removerConta, comId(c.id));
                          }}
                          title={c.origem === "AVULSA" ? "Excluir" : c.cancelada ? "Voltar a contar" : "Não vale neste mês"}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-suave transition hover:bg-perigo-fundo hover:text-perigo"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {pagando === c.id && (
                  <tr>
                    <td colSpan={6} className="bg-superficie-2/60">
                      <form
                        action={(fd) => executar(pagarConta, fd)}
                        className="flex flex-wrap items-end gap-3 rounded-xl border border-borda-forte bg-ouro/8 p-4"
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
                          Pago em
                          <input type="date" name="pagoEm" defaultValue={hojeInput} className={classeMini} />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
                          Valor pago (R$)
                          <input type="number" name="valorPago" min={0.01} step="0.01" defaultValue={c.valor.toFixed(2)} className={cx(classeMini, "numero w-32")} />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold text-suave">
                          Forma
                          <select name="formaPagamento" value={forma} onChange={(e) => setForma(e.target.value)} className={classeMini}>
                            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </label>
                        {forma === "DINHEIRO" && (
                          <label className="flex items-center gap-2 self-center text-sm text-texto-2">
                            <input type="checkbox" name="pagoPeloCaixa" defaultChecked className="accent-[#e0a63d]" />
                            Saiu da gaveta do caixa
                          </label>
                        )}
                        <Botao type="submit" variante="primario" tamanho="sm">
                          Confirmar pagamento
                        </Botao>
                        <Botao tamanho="sm" variante="fantasma" onClick={() => setPagando(null)}>
                          Cancelar
                        </Botao>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          {validas.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3}>
                  Totais · {validas.length} contas · pago {formatCurrency(validas.filter((c) => c.pagoEm).reduce((s, c) => s + (c.valorPago ?? c.valor), 0))}
                </td>
                <td className="direita numero">{formatCurrency(validas.reduce((s, c) => s + c.valor, 0))}</td>
                <td colSpan={2}>Em aberto: {formatCurrency(validas.filter((c) => !c.pagoEm).reduce((s, c) => s + c.valor, 0))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const CATEGORIAS = ["Aluguel", "Fornecedor (mercadoria)", "Laboratório", "Salários", "Impostos", "Marketing", "Manutenção", "Material de consumo", "Outras"];

export function NovaContaForm({ fornecedores, hojeInput }: { fornecedores: { id: number; nome: string }[]; hojeInput: string }) {
  const router = useRouter();
  const [chave, setChave] = useState(0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(fd: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await criarContaPagar(fd);
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
    <form key={chave} action={enviar} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Campo rotulo="Descrição" className="lg:col-span-2">
          <input name="descricao" required placeholder="Ex.: Laboratório Braslab — setembro" className={classeCampo} />
        </Campo>
        <Campo rotulo="Categoria">
          <input name="categoria" list="categorias-conta" className={classeCampo} />
          <datalist id="categorias-conta">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Fornecedor (opcional)">
          <select name="fornecedorId" defaultValue="" className={classeCampo}>
            <option value="">—</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Valor total (R$)">
          <input name="valor" type="number" min={0.01} step="0.01" required className={cx(classeCampo, "numero")} />
        </Campo>
        <Campo rotulo="1º vencimento">
          <input name="vencimento" type="date" required defaultValue={hojeInput} className={classeCampo} />
        </Campo>
        <Campo rotulo="Parcelas" dica="Divide o valor e vence 1 por mês.">
          <input name="parcelas" type="number" min={1} max={24} defaultValue={1} className={cx(classeCampo, "numero")} />
        </Campo>
        <Campo rotulo="Observações" className="sm:col-span-2 lg:col-span-5">
          <input name="observacoes" className={classeCampo} />
        </Campo>
      </div>
      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && <Aviso tom="sucesso">Conta lançada.</Aviso>}
      <div>
        <Botao type="submit" variante="primario" icone={Plus} disabled={enviando}>
          {enviando ? "Lançando..." : "Lançar conta a pagar"}
        </Botao>
      </div>
    </form>
  );
}

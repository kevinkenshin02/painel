"use client";

import { useRef, useState } from "react";
import { Banknote, ChevronDown, CircleEllipsis, CreditCard, QrCode } from "lucide-react";
import { CANAL_ORIGEM_LABELS, CATEGORIA_VENDA_LABELS } from "./labels";
import { nomeProduto, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import type { CategoriaVenda, FormaPagamento, TipoProduto } from "@/generated/prisma/enums";
import { BuscaCliente, type ClienteResumo } from "@/components/BuscaCliente";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { cx } from "@/components/ui/cx";

export type ProdutoOpcao = {
  id: number;
  codigo: string;
  tipo: TipoProduto;
  marca: string | null;
  descricao: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

const CATEGORIA_DO_TIPO: Record<TipoProduto, CategoriaVenda> = {
  RELOGIO: "RELOGIO",
  ARMACAO: "SO_ARMACAO",
  OCULOS_SOL: "OUTRO",
  LENTE_PRONTA: "SO_LENTE",
  LENTE_CONTATO: "SO_LENTE",
  PULSEIRA: "ACESSORIO",
  BATERIA: "BATERIA",
  ACESSORIO: "ACESSORIO",
  OUTRO: "OUTRO",
};

const FORMAS: { valor: FormaPagamento; rotulo: string; Icone: typeof Banknote }[] = [
  { valor: "DINHEIRO", rotulo: "Dinheiro", Icone: Banknote },
  { valor: "PIX", rotulo: "Pix", Icone: QrCode },
  { valor: "CARTAO_MAQUININHA", rotulo: "Cartão (maquininha)", Icone: CreditCard },
  { valor: "OUTRO", rotulo: "Outro", Icone: CircleEllipsis },
];

const descricaoDe = (p: ProdutoOpcao) => `${nomeProduto(p)} (${p.codigo})`;

export function NovaVendaForm({
  action,
  hoje,
  produtos,
  isAdmin,
  produtoInicial,
  clienteInicial,
}: {
  action: (formData: FormData) => Promise<{ erro?: string; ok?: boolean }>;
  hoje: string;
  produtos: ProdutoOpcao[];
  isAdmin: boolean;
  produtoInicial?: ProdutoOpcao | null;
  clienteInicial?: ClienteResumo | null;
}) {
  const [formKey, setFormKey] = useState(0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [produto, setProduto] = useState<ProdutoOpcao | null>(produtoInicial ?? null);
  const descricaoRef = useRef<HTMLInputElement>(null);
  const custoTotalRef = useRef<HTMLInputElement>(null);
  const valorVendidoRef = useRef<HTMLInputElement>(null);
  const quantidadeRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);

  function preencher(p: ProdutoOpcao | null, qtd = Number(quantidadeRef.current?.value) || 1) {
    if (!p) return;
    if (descricaoRef.current) descricaoRef.current.value = descricaoDe(p);
    if (custoTotalRef.current) custoTotalRef.current.value = String(+(p.custoUnitario * qtd).toFixed(2));
    if (valorVendidoRef.current) valorVendidoRef.current.value = String(+(p.precoVenda * qtd).toFixed(2));
    if (categoriaRef.current) categoriaRef.current.value = CATEGORIA_DO_TIPO[p.tipo];
  }

  async function handleAction(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await action(formData);
      setResultado(r);
      if (r.ok) {
        setProduto(null);
        setFormKey((k) => k + 1);
      }
    } finally {
      setEnviando(false);
    }
  }

  const grupos = Object.entries(
    produtos.reduce<Record<string, ProdutoOpcao[]>>((acc, p) => {
      (acc[p.tipo] ??= []).push(p);
      return acc;
    }, {})
  );
  const inicial = formKey === 0 ? produtoInicial : null;

  return (
    <form key={formKey} action={handleAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Campo rotulo="Produto do estoque (opcional)" dica="Escolher um produto preenche a descrição e os valores e tira do estoque.">
          <select
            name="produtoId"
            defaultValue={inicial?.id ?? ""}
            onChange={(event) => {
              const p = produtos.find((x) => x.id === Number(event.target.value)) ?? null;
              setProduto(p);
              preencher(p);
            }}
            className={classeCampo}
            autoFocus={!inicial}
          >
            <option value="">Nenhum — descrição livre (serviço, conserto...)</option>
            {grupos.map(([tipo, lista]) => (
              <optgroup key={tipo} label={TIPO_PRODUTO_LABELS[tipo as TipoProduto]}>
                {lista.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} — {nomeProduto(p)} (estoque: {p.quantidade})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Cliente (opcional)" dica="Busque no cadastro para a compra entrar no histórico do cliente.">
          <BuscaCliente inicial={clienteInicial} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo rotulo="Descrição" className="sm:col-span-2">
          <input ref={descricaoRef} type="text" name="descricao" required defaultValue={inicial ? descricaoDe(inicial) : ""} className={classeCampo} />
        </Campo>
        <Campo rotulo="Categoria">
          <select
            ref={categoriaRef}
            name="categoria"
            required
            defaultValue={inicial ? CATEGORIA_DO_TIPO[inicial.tipo] : "OCULOS_COMPLETO"}
            className={classeCampo}
          >
            {Object.entries(CATEGORIA_VENDA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Valor vendido (R$)">
          <input
            ref={valorVendidoRef}
            type="number"
            name="valorVendido"
            required
            min={0.01}
            step="0.01"
            defaultValue={inicial ? inicial.precoVenda : ""}
            className={cx(classeCampo, "numero text-base font-semibold")}
          />
        </Campo>
      </div>

      <fieldset>
        <legend className="mb-2 text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Forma de pagamento</legend>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {FORMAS.map(({ valor, rotulo, Icone }) => (
            <label
              key={valor}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-borda bg-superficie-2 px-4 py-3 text-sm font-semibold text-texto-2 transition hover:border-borda-forte has-[:checked]:border-ouro has-[:checked]:bg-ouro/12 has-[:checked]:text-texto"
            >
              <input type="radio" name="formaPagamento" value={valor} defaultChecked={valor === "DINHEIRO"} className="sr-only" />
              <Icone className="h-5 w-5 shrink-0 text-ouro" aria-hidden />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <details className="group rounded-xl border border-borda bg-superficie-2/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-texto-2 select-none">
          Mais detalhes: data, quantidade, canal de origem{isAdmin ? " e custo" : ""}
          <ChevronDown className="h-4 w-4 text-suave transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid grid-cols-1 gap-4 border-t border-borda px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Data da venda">
            <input type="date" name="dataVenda" required defaultValue={hoje} className={classeCampo} />
          </Campo>
          <Campo rotulo="Quantidade">
            <input
              ref={quantidadeRef}
              type="number"
              name="quantidade"
              min={1}
              defaultValue={1}
              onChange={(e) => preencher(produto, Number(e.target.value) || 1)}
              className={classeCampo}
            />
          </Campo>
          <Campo rotulo="Canal de origem">
            <select name="canalOrigem" required defaultValue="PASSOU_EM_FRENTE" className={classeCampo}>
              {Object.entries(CANAL_ORIGEM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>
          {isAdmin && (
            <Campo rotulo="Custo total (R$)" dica="Vazio = custo da ficha do produto.">
              <input
                ref={custoTotalRef}
                type="number"
                name="custoTotal"
                min={0}
                step="0.01"
                defaultValue={inicial ? inicial.custoUnitario : ""}
                className={classeCampo}
              />
            </Campo>
          )}
        </div>
      </details>

      {produto && produto.quantidade <= 0 && (
        <Aviso tom="aviso">Esse produto está zerado no sistema. Confira o estoque antes de vender.</Aviso>
      )}
      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && <Aviso tom="sucesso">Venda registrada. Ela já aparece em &quot;Vendas de hoje&quot; logo abaixo.</Aviso>}

      <div className="flex flex-wrap items-center gap-4 border-t border-borda pt-5">
        <Botao type="submit" variante="primario" tamanho="lg" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar venda"}
        </Botao>
        <p className="max-w-xl text-xs text-suave">
          No cartão, a cobrança vai sozinha para a maquininha (Point Smart 2) assim que a venda é registrada.
        </p>
      </div>
    </form>
  );
}

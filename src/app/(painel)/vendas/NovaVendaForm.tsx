"use client";

import { useRef, useState } from "react";
import { Banknote, ChevronDown, CircleEllipsis, CreditCard, QrCode } from "lucide-react";
import { CANAL_ORIGEM_LABELS, CATEGORIA_VENDA_LABELS } from "./labels";
import { MARCA_RELOGIO_LABELS } from "../estoque/labels";
import type { FormaPagamento, MarcaRelogio } from "@/generated/prisma/enums";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { cx } from "@/components/ui/cx";

type ArmacaoOpcao = {
  id: number;
  codigo: string;
  marcaModelo: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

type RelogioOpcao = {
  id: number;
  codigo: string;
  marca: MarcaRelogio;
  marcaOutro: string | null;
  modeloReferencia: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

type LenteOpcao = {
  id: number;
  codigo: string;
  descricao: string;
  grau: string;
  quantidade: number;
  custoUnitario: number;
  precoVenda: number;
};

const FORMAS: { valor: FormaPagamento; rotulo: string; Icone: typeof Banknote }[] = [
  { valor: "DINHEIRO", rotulo: "Dinheiro", Icone: Banknote },
  { valor: "PIX", rotulo: "Pix", Icone: QrCode },
  { valor: "CARTAO_MAQUININHA", rotulo: "Cartão (maquininha)", Icone: CreditCard },
  { valor: "OUTRO", rotulo: "Outro", Icone: CircleEllipsis },
];

export function NovaVendaForm({
  action,
  hoje,
  armacoes,
  relogios,
  lentes,
  isAdmin,
}: {
  action: (formData: FormData) => Promise<{ erro?: string; ok?: boolean }>;
  hoje: string;
  armacoes: ArmacaoOpcao[];
  relogios: RelogioOpcao[];
  lentes: LenteOpcao[];
  isAdmin: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const descricaoRef = useRef<HTMLInputElement>(null);
  const custoTotalRef = useRef<HTMLInputElement>(null);
  const valorVendidoRef = useRef<HTMLInputElement>(null);
  const quantidadeRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);

  function handleItemChange(value: string) {
    if (!value) return;
    const [tipo, idStr] = value.split(":");
    const id = Number(idStr);
    const qtd = Number(quantidadeRef.current?.value) || 1;

    if (tipo === "A") {
      const item = armacoes.find((a) => a.id === id);
      if (!item) return;
      if (descricaoRef.current) descricaoRef.current.value = `${item.marcaModelo} (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "SO_ARMACAO";
    } else if (tipo === "R") {
      const item = relogios.find((r) => r.id === id);
      if (!item) return;
      const nomeMarca = item.marca === "OUTRO" && item.marcaOutro ? item.marcaOutro : MARCA_RELOGIO_LABELS[item.marca];
      if (descricaoRef.current) descricaoRef.current.value = `${nomeMarca} ${item.modeloReferencia} (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "RELOGIO";
    } else if (tipo === "L") {
      const item = lentes.find((l) => l.id === id);
      if (!item) return;
      if (descricaoRef.current) descricaoRef.current.value = `${item.descricao} (${item.grau}) (${item.codigo})`;
      if (custoTotalRef.current) custoTotalRef.current.value = String(item.custoUnitario * qtd);
      if (valorVendidoRef.current) valorVendidoRef.current.value = String(item.precoVenda * qtd);
      if (categoriaRef.current) categoriaRef.current.value = "SO_LENTE";
    }
  }

  async function handleAction(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await action(formData);
      setResultado(r);
      if (r.ok) setFormKey((k) => k + 1);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form key={formKey} action={handleAction} className="flex flex-col gap-6">
      <Campo rotulo="Produto do estoque (opcional)" dica="Escolher um item preenche a descrição e os valores sozinho.">
        <select
          name="itemEstoque"
          defaultValue=""
          onChange={(event) => handleItemChange(event.target.value)}
          className={classeCampo}
          autoFocus
        >
          <option value="">Nenhum — descrição livre</option>
          {relogios.length > 0 && (
            <optgroup label="Relógios">
              {relogios.map((r) => (
                <option key={`R:${r.id}`} value={`R:${r.id}`}>
                  {r.codigo} — {r.marca === "OUTRO" && r.marcaOutro ? r.marcaOutro : MARCA_RELOGIO_LABELS[r.marca]}{" "}
                  {r.modeloReferencia} (estoque: {r.quantidade})
                </option>
              ))}
            </optgroup>
          )}
          {armacoes.length > 0 && (
            <optgroup label="Armações">
              {armacoes.map((a) => (
                <option key={`A:${a.id}`} value={`A:${a.id}`}>
                  {a.codigo} — {a.marcaModelo} (estoque: {a.quantidade})
                </option>
              ))}
            </optgroup>
          )}
          {lentes.length > 0 && (
            <optgroup label="Lentes prontas">
              {lentes.map((l) => (
                <option key={`L:${l.id}`} value={`L:${l.id}`}>
                  {l.codigo} — {l.descricao} ({l.grau}) (estoque: {l.quantidade})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </Campo>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo rotulo="Descrição" className="sm:col-span-2">
          <input ref={descricaoRef} type="text" name="descricao" required className={classeCampo} />
        </Campo>
        <Campo rotulo="Categoria">
          <select ref={categoriaRef} name="categoria" required defaultValue="OCULOS_COMPLETO" className={classeCampo}>
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
            min={0}
            step="0.01"
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
          Mais detalhes: cliente, data, quantidade, canal de origem{isAdmin ? " e custo" : ""}
          <ChevronDown className="h-4 w-4 text-suave transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid grid-cols-1 gap-4 border-t border-borda px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo rotulo="Data da venda">
            <input type="date" name="dataVenda" required defaultValue={hoje} className={classeCampo} />
          </Campo>
          <Campo rotulo="Cliente (opcional)">
            <input type="text" name="clienteNome" className={classeCampo} />
          </Campo>
          <Campo rotulo="Quantidade">
            <input ref={quantidadeRef} type="number" name="quantidade" min={1} defaultValue={1} className={classeCampo} />
          </Campo>
          <Campo rotulo="Canal de origem">
            <select name="canalOrigem" required defaultValue="GOOGLE_MAPS" className={classeCampo}>
              {Object.entries(CANAL_ORIGEM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>
          {isAdmin && (
            <Campo rotulo="Custo total (R$)">
              <input ref={custoTotalRef} type="number" name="custoTotal" min={0} step="0.01" defaultValue={0} className={classeCampo} />
            </Campo>
          )}
        </div>
      </details>

      {!isAdmin && <input ref={custoTotalRef} type="hidden" name="custoTotal" defaultValue={0} />}

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

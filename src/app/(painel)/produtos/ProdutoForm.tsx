"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { salvarProduto } from "./actions";
import { MECANISMO_LABELS, PUBLICO_LABELS, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { TipoProduto } from "@/generated/prisma/enums";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { cx } from "@/components/ui/cx";

export type ProdutoEdicao = {
  id: number;
  tipo: TipoProduto;
  codigo: string;
  codigoBarras: string | null;
  referencia: string | null;
  marca: string | null;
  descricao: string;
  cor: string | null;
  publico: string | null;
  mecanismo: string | null;
  grau: string | null;
  ncm: string | null;
  unidade: string;
  localizacao: string | null;
  fornecedorId: number | null;
  estoqueMinimo: number;
  custoUnitario: number;
  precoVenda: number;
  observacoes: string | null;
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-3 flex w-full items-center gap-3 text-xs font-bold tracking-[0.14em] text-ouro uppercase">
        {titulo}
        <span className="h-px flex-1 bg-borda" />
      </legend>
      {children}
    </fieldset>
  );
}

export function ProdutoForm({
  produto,
  fornecedores,
  marcas,
  podeEditar,
}: {
  produto?: ProdutoEdicao;
  fornecedores: { id: number; nome: string }[];
  marcas: string[];
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoProduto>(produto?.tipo ?? "RELOGIO");
  const [custo, setCusto] = useState(produto?.custoUnitario ?? 0);
  const [preco, setPreco] = useState(produto?.precoVenda ?? 0);
  const [resultado, setResultado] = useState<{ erro?: string; ok?: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const margem = preco > 0 ? (preco - custo) / preco : 0;
  const markup = custo > 0 ? preco / custo : 0;

  async function enviar(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await salvarProduto(formData);
      setResultado(r);
      if (r.ok && r.id && !produto) router.push(`/produtos/${r.id}`);
      else if (r.ok) router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form action={enviar} className="flex flex-col gap-8">
      {produto && <input type="hidden" name="id" value={produto.id} />}
      <fieldset disabled={!podeEditar} className="flex min-w-0 flex-col gap-8">
        <Secao titulo="Dados cadastrais">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo rotulo="Tipo">
              <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoProduto)} className={classeCampo}>
                {Object.entries(TIPO_PRODUTO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Código interno" dica="O que vai na etiqueta.">
              <input name="codigo" required defaultValue={produto?.codigo} autoFocus={!produto} className={cx(classeCampo, "uppercase")} />
            </Campo>
            <Campo rotulo="Código de barras (EAN)">
              <input name="codigoBarras" inputMode="numeric" defaultValue={produto?.codigoBarras ?? ""} className={classeCampo} />
            </Campo>
            <Campo rotulo="Referência do fabricante" dica="Como aparece na nota do fornecedor.">
              <input name="referencia" defaultValue={produto?.referencia ?? ""} className={classeCampo} />
            </Campo>
            <Campo rotulo="Marca">
              <input name="marca" list="marcas-produto" defaultValue={produto?.marca ?? ""} className={classeCampo} />
              <datalist id="marcas-produto">
                {marcas.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Campo>
            <Campo rotulo="Descrição / modelo" className="sm:col-span-2">
              <input name="descricao" required defaultValue={produto?.descricao} placeholder="Ex.: Automático aço, mostrador azul" className={classeCampo} />
            </Campo>
            <Campo rotulo="Cor">
              <input name="cor" defaultValue={produto?.cor ?? ""} className={classeCampo} />
            </Campo>
            {tipo === "RELOGIO" && (
              <>
                <Campo rotulo="Público">
                  <select name="publico" defaultValue={produto?.publico ?? "UNISSEX"} className={classeCampo}>
                    {Object.entries(PUBLICO_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo rotulo="Mecanismo">
                  <select name="mecanismo" defaultValue={produto?.mecanismo ?? "ANALOGICO"} className={classeCampo}>
                    {Object.entries(MECANISMO_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Campo>
              </>
            )}
            {(tipo === "LENTE_PRONTA" || tipo === "LENTE_CONTATO") && (
              <Campo rotulo="Grau">
                <input name="grau" defaultValue={produto?.grau ?? ""} placeholder="+2,00 / sem grau" className={classeCampo} />
              </Campo>
            )}
            <Campo rotulo="Local / prateleira">
              <input name="localizacao" defaultValue={produto?.localizacao ?? ""} placeholder="Vitrine 1, gaveta B..." className={classeCampo} />
            </Campo>
            <Campo rotulo="Unidade">
              <input name="unidade" defaultValue={produto?.unidade ?? "UN"} className={cx(classeCampo, "uppercase")} />
            </Campo>
            <Campo rotulo="NCM (fiscal)">
              <input name="ncm" inputMode="numeric" defaultValue={produto?.ncm ?? ""} className={classeCampo} />
            </Campo>
          </div>
        </Secao>

        <Secao titulo="Fornecedor">
          <Campo rotulo="Quem vende para a loja" className="max-w-md">
            <select name="fornecedorId" defaultValue={produto?.fornecedorId ?? ""} className={classeCampo}>
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </Campo>
        </Secao>

        <Secao titulo="Preços e estoque">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Campo rotulo="Custo unitário (R$)">
              <input
                name="custoUnitario"
                type="number"
                min={0}
                step="0.01"
                defaultValue={produto?.custoUnitario ?? ""}
                onChange={(e) => setCusto(Number(e.target.value) || 0)}
                className={cx(classeCampo, "numero")}
              />
            </Campo>
            <Campo rotulo="Preço de venda (R$)">
              <input
                name="precoVenda"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={produto?.precoVenda ?? ""}
                onChange={(e) => setPreco(Number(e.target.value) || 0)}
                className={cx(classeCampo, "numero text-base font-semibold")}
              />
            </Campo>
            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-borda-forte bg-ouro/10 px-4 py-2">
                <div className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Margem / markup</div>
                <div className={cx("numero text-sm font-bold", margem < 0 ? "text-perigo" : "text-texto")}>
                  {formatPercent(margem)} · {markup ? `${markup.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×` : "—"}
                </div>
                <div className="numero text-[11px] text-suave">Lucro por peça: {formatCurrency(preco - custo)}</div>
              </div>
            </div>
            <Campo rotulo="Estoque mínimo" dica="Avisa quando ficar abaixo. 0 = só quando zerar.">
              <input name="estoqueMinimo" type="number" min={0} defaultValue={produto?.estoqueMinimo ?? 0} className={cx(classeCampo, "numero")} />
            </Campo>
            {!produto && (
              <Campo rotulo="Quantidade inicial">
                <input name="quantidade" type="number" min={0} defaultValue={1} className={cx(classeCampo, "numero")} />
              </Campo>
            )}
          </div>
          <Campo rotulo="Observações">
            <textarea name="observacoes" rows={2} defaultValue={produto?.observacoes ?? ""} className={classeCampo} />
          </Campo>
        </Secao>
      </fieldset>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && produto && <Aviso tom="sucesso">Produto salvo.</Aviso>}
      {!podeEditar && <Aviso tom="info">Só o administrador altera a ficha do produto.</Aviso>}

      {podeEditar && (
        <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-5">
          <Botao type="submit" variante="primario" icone={Save} disabled={enviando}>
            {enviando ? "Salvando..." : produto ? "Salvar alterações" : "Cadastrar produto"}
          </Botao>
        </div>
      )}
    </form>
  );
}

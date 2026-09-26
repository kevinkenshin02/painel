"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, PackageCheck, RefreshCw, TriangleAlert, Truck } from "lucide-react";
import { lancarNota, type DecisaoItem } from "./actions";
import { acharProduto, lerNFe, type NotaNFe } from "@/lib/nfe";
import { nomeProduto, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import { formatCnpj, formatCurrency } from "@/lib/format";
import type { TipoProduto } from "@/generated/prisma/enums";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export type ProdutoParaNota = {
  id: number;
  codigo: string;
  codigoBarras: string | null;
  referencia: string | null;
  tipo: TipoProduto;
  marca: string | null;
  descricao: string;
  precoVenda: number;
  custoUnitario: number;
  quantidade: number;
  aConferir: boolean;
};

type Linha =
  | { acao: "vincular"; produtoId: number; atualizarCusto: boolean; precoVenda: string }
  | { acao: "cadastrar"; codigo: string; tipo: TipoProduto; marca: string; descricao: string; precoVenda: string }
  | { acao: "ignorar" };

const PEQUENAS = new Set(["e", "de", "da", "do", "com", "em"]);
const titulo = (s: string) =>
  s
    .toLowerCase()
    .split(/(\s+|\/)/)
    .map((p, i) => (i > 0 && PEQUENAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");

/** Preço sugerido: custo × markup, arredondado para terminar em ,90 (ex.: 249,90). */
const sugerir = (custo: number, markup: number) => (custo > 0 ? Math.max(0, Math.ceil((custo * markup) / 10) * 10 - 0.1) : 0);

function marcaDoFornecedor(nome: string) {
  const n = nome.toUpperCase();
  for (const [chave, marca] of [
    ["ORIENT", "Orient"],
    ["MAGNUM", "Magnum"],
    ["CHAMPION", "Champion"],
    ["TECHNOS", "Technos"],
    ["LINCE", "Lince"],
    ["SKMEI", "Skmei"],
  ] as const)
    if (n.includes(chave)) return marca;
  return "";
}

const classeMini = "w-full rounded-lg border border-borda bg-superficie-2 px-2.5 py-1.5 text-[13px] text-texto focus:border-ouro focus:outline-none";

export function EntradaNota({ produtos, chavesLancadas }: { produtos: ProdutoParaNota[]; chavesLancadas: string[] }) {
  const [xml, setXml] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [nota, setNota] = useState<NotaNFe | null>(null);
  const [linhas, setLinhas] = useState<Record<number, Linha>>({});
  const [markup, setMarkup] = useState(2.5);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);

  const porId = new Map(produtos.map((p) => [p.id, p]));
  const ordenados = [...produtos].sort((a, b) => nomeProduto(a).localeCompare(nomeProduto(b)));

  async function abrirArquivo(arquivo: File | undefined) {
    setErro(null);
    setFeito(null);
    if (!arquivo) return;
    try {
      const texto = await arquivo.text();
      const n = lerNFe(texto);
      const marca = marcaDoFornecedor(`${n.emitente.nome} ${n.emitente.fantasia ?? ""}`);
      const iniciais: Record<number, Linha> = {};
      for (const it of n.itens) {
        const achado = acharProduto(it, produtos);
        iniciais[it.item] = achado
          ? { acao: "vincular", produtoId: achado.id, atualizarCusto: true, precoVenda: achado.precoVenda ? String(achado.precoVenda) : String(sugerir(it.custoUnitario, markup)) }
          : {
              acao: "cadastrar",
              codigo: it.codigo.toUpperCase(),
              tipo: "RELOGIO",
              marca,
              descricao: titulo(it.descricao),
              precoVenda: String(sugerir(it.custoUnitario, markup)),
            };
      }
      setXml(texto);
      setNomeArquivo(arquivo.name);
      setNota(n);
      setLinhas(iniciais);
    } catch (e) {
      setNota(null);
      setXml(null);
      setErro(e instanceof Error ? e.message : "Não consegui ler esse arquivo.");
    }
  }

  function mudar(item: number, parcial: Partial<Linha>) {
    setLinhas((l) => ({ ...l, [item]: { ...l[item], ...parcial } as Linha }));
  }

  function trocarAcao(item: number, acao: Linha["acao"]) {
    const it = nota!.itens.find((i) => i.item === item)!;
    const achado = acharProduto(it, produtos);
    if (acao === "ignorar") mudar(item, { acao });
    else if (acao === "vincular")
      setLinhas((l) => ({
        ...l,
        [item]: { acao, produtoId: achado?.id ?? 0, atualizarCusto: true, precoVenda: achado ? String(achado.precoVenda) : "" },
      }));
    else
      setLinhas((l) => ({
        ...l,
        [item]: {
          acao,
          codigo: it.codigo.toUpperCase(),
          tipo: "RELOGIO",
          marca: marcaDoFornecedor(nota!.emitente.nome),
          descricao: titulo(it.descricao),
          precoVenda: String(sugerir(it.custoUnitario, markup)),
        },
      }));
  }

  function recalcularPrecos() {
    setLinhas((l) => {
      const novo = { ...l };
      for (const it of nota!.itens) {
        const linha = novo[it.item];
        if (linha.acao === "cadastrar") novo[it.item] = { ...linha, precoVenda: String(sugerir(it.custoUnitario, markup)) };
      }
      return novo;
    });
  }

  async function lancar() {
    if (!nota || !xml) return;
    setErro(null);
    const decisoes: DecisaoItem[] = [];
    for (const it of nota.itens) {
      const l = linhas[it.item];
      if (l.acao === "ignorar") decisoes.push({ item: it.item, acao: "ignorar" });
      else if (l.acao === "vincular") {
        if (!l.produtoId) return setErro(`Escolha em qual produto somar o item ${it.item} (${it.descricao}).`);
        decisoes.push({ item: it.item, acao: "vincular", produtoId: l.produtoId, atualizarCusto: l.atualizarCusto, precoVenda: l.precoVenda === "" ? null : Number(l.precoVenda) });
      } else {
        decisoes.push({ item: it.item, acao: "cadastrar", codigo: l.codigo, tipo: l.tipo, marca: l.marca, descricao: l.descricao, precoVenda: Number(l.precoVenda) || 0 });
      }
    }
    setEnviando(true);
    try {
      const r = await lancarNota(xml, decisoes);
      if (r.erro) setErro(r.erro);
      else {
        setFeito(r.resumo ?? "Nota lançada.");
        setNota(null);
        setXml(null);
        setLinhas({});
      }
    } finally {
      setEnviando(false);
    }
  }

  if (!nota) {
    return (
      <div className="flex flex-col gap-4">
        {feito && (
          <Aviso tom="sucesso">
            {feito}{" "}
            <Link href="/estoque" className="underline">
              Ver a posição do estoque
            </Link>
          </Aviso>
        )}
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            abrirArquivo(e.dataTransfer.files?.[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-borda-forte bg-superficie-2/50 px-6 py-14 text-center transition hover:bg-superficie-2"
        >
          <FileUp className="h-9 w-9 text-ouro" aria-hidden />
          <div className="text-base font-semibold text-texto">Escolha o arquivo XML da nota (ou arraste para cá)</div>
          <div className="max-w-lg text-sm text-suave">
            É o arquivo <strong>.xml</strong> que o fornecedor manda por e-mail junto com a nota — o PDF (DANFE) não serve. Nada é
            lançado antes de você conferir.
          </div>
          <input type="file" accept=".xml,text/xml,application/xml" className="sr-only" onChange={(e) => abrirArquivo(e.target.files?.[0])} />
        </label>
        {erro && <Aviso tom="perigo">{erro}</Aviso>}
      </div>
    );
  }

  const jaLancada = nota.chave ? chavesLancadas.includes(nota.chave) : false;
  const pecas = nota.itens.reduce((s, it) => s + (linhas[it.item]?.acao === "ignorar" ? 0 : Math.round(it.quantidade)), 0);
  const custoEntrada = nota.itens.reduce(
    (s, it) => s + (linhas[it.item]?.acao === "ignorar" ? 0 : Math.round(it.quantidade) * it.custoUnitario),
    0
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-borda bg-superficie-2/60 p-5">
        <div className="flex items-start gap-3">
          <Truck className="mt-1 h-5 w-5 text-ouro" aria-hidden />
          <div>
            <div className="font-titulo text-lg font-bold text-texto">{nota.emitente.fantasia || nota.emitente.nome}</div>
            <div className="text-xs text-suave">
              {nota.emitente.nome}
              {nota.emitente.cnpj ? ` · CNPJ ${formatCnpj(nota.emitente.cnpj)}` : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip>
                NF {nota.numero}
                {nota.serie ? ` · série ${nota.serie}` : ""}
              </Chip>
              {nota.dataEmissao && <Chip>Emitida em {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}</Chip>}
              <Chip>
                Total da nota: <span className="numero text-texto">{formatCurrency(nota.totalNota)}</span>
              </Chip>
              <Chip>{nota.itens.length} itens</Chip>
              <Chip className="max-w-xs truncate">{nomeArquivo}</Chip>
            </div>
          </div>
        </div>
        <Botao
          tamanho="sm"
          variante="fantasma"
          onClick={() => {
            setNota(null);
            setXml(null);
          }}
        >
          Escolher outro arquivo
        </Botao>
      </div>

      {jaLancada && <Aviso tom="perigo">Essa nota já foi lançada antes. Lançar de novo duplicaria o estoque — o Painel vai recusar.</Aviso>}

      {nota.parcelas.length > 0 && (
        <div className="rounded-xl border border-borda p-4">
          <div className="mb-2 text-[11px] font-bold tracking-[0.08em] text-suave uppercase">
            Parcelas (duplicatas) — ficam guardadas para as Contas a pagar
          </div>
          <div className="flex flex-wrap gap-2">
            {nota.parcelas.map((p) => (
              <Chip key={p.numero + p.vencimento}>
                {p.numero} · vence {p.vencimento ? new Date(`${p.vencimento}T12:00:00`).toLocaleDateString("pt-BR") : "—"} ·{" "}
                <span className="numero text-texto">{formatCurrency(p.valor)}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Campo rotulo="Markup para preço sugerido" dica="Preço dos produtos novos = custo × markup, terminando em ,90." className="w-56">
          <input type="number" min={1} step="0.1" value={markup} onChange={(e) => setMarkup(Number(e.target.value) || 1)} className={classeCampo} />
        </Campo>
        <Botao icone={RefreshCw} onClick={recalcularPrecos}>
          Recalcular preços sugeridos
        </Botao>
      </div>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Item da nota</th>
              <th className="direita">Qtd.</th>
              <th className="direita">Custo/peça</th>
              <th>O que fazer</th>
              <th>Produto no Painel</th>
              <th className="direita">Preço de venda</th>
            </tr>
          </thead>
          <tbody>
            {nota.itens.map((it) => {
              const l = linhas[it.item];
              const vinculado = l.acao === "vincular" ? porId.get(l.produtoId) : undefined;
              return (
                <tr key={it.item} className={l.acao === "ignorar" ? "opacity-55" : undefined}>
                  <td className="max-w-xs">
                    <div className="font-semibold text-texto">{it.descricao}</div>
                    <div className="numero text-xs text-suave">
                      Cód. {it.codigo}
                      {it.ean ? ` · EAN ${it.ean}` : ""}
                    </div>
                  </td>
                  <td className="direita numero">{Math.round(it.quantidade)}</td>
                  <td className="direita numero">
                    {formatCurrency(it.custoUnitario)}
                    {Math.abs(it.custoUnitario - it.valorUnitario) > 0.009 && (
                      <div className="text-[11px] text-suave" title="Inclui IPI, frete e outros; menos desconto">
                        nota: {formatCurrency(it.valorUnitario)}
                      </div>
                    )}
                  </td>
                  <td>
                    <select value={l.acao} onChange={(e) => trocarAcao(it.item, e.target.value as Linha["acao"])} className={cx(classeMini, "min-w-[150px]")}>
                      <option value="vincular">Somar no estoque</option>
                      <option value="cadastrar">Cadastrar novo</option>
                      <option value="ignorar">Ignorar</option>
                    </select>
                    {l.acao === "vincular" && vinculado && acharProduto(it, produtos)?.id === vinculado.id && (
                      <div className="mt-1 text-[11px] text-sucesso">Achado pelo {it.ean && vinculado.codigoBarras ? "código de barras" : "código"}</div>
                    )}
                  </td>
                  <td className="min-w-[280px]">
                    {l.acao === "vincular" && (
                      <div className="flex flex-col gap-1.5">
                        <select value={l.produtoId || ""} onChange={(e) => mudar(it.item, { produtoId: Number(e.target.value) })} className={classeMini}>
                          <option value="">Escolha o produto...</option>
                          {ordenados.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codigo} — {nomeProduto(p)} {p.aConferir ? "(a conferir)" : `(tem ${p.quantidade})`}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs text-texto-2">
                          <input
                            type="checkbox"
                            checked={l.atualizarCusto}
                            onChange={(e) => mudar(it.item, { atualizarCusto: e.target.checked })}
                            className="accent-[#e0a63d]"
                          />
                          Atualizar o custo para {formatCurrency(it.custoUnitario)}
                          {vinculado && vinculado.custoUnitario > 0 && <span className="text-suave">(era {formatCurrency(vinculado.custoUnitario)})</span>}
                        </label>
                      </div>
                    )}
                    {l.acao === "cadastrar" && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <input value={l.codigo} onChange={(e) => mudar(it.item, { codigo: e.target.value })} aria-label="Código interno" placeholder="Código" className={cx(classeMini, "uppercase")} />
                        <select value={l.tipo} onChange={(e) => mudar(it.item, { tipo: e.target.value as TipoProduto })} aria-label="Tipo" className={classeMini}>
                          {Object.entries(TIPO_PRODUTO_LABELS).map(([v, r]) => (
                            <option key={v} value={v}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <input value={l.marca} onChange={(e) => mudar(it.item, { marca: e.target.value })} aria-label="Marca" placeholder="Marca" className={classeMini} />
                        <input value={l.descricao} onChange={(e) => mudar(it.item, { descricao: e.target.value })} aria-label="Descrição" placeholder="Descrição" className={classeMini} />
                      </div>
                    )}
                    {l.acao === "ignorar" && <Etiqueta>Não entra no estoque</Etiqueta>}
                  </td>
                  <td className="direita">
                    {l.acao !== "ignorar" && (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.precoVenda}
                        onChange={(e) => mudar(it.item, { precoVenda: e.target.value })}
                        aria-label="Preço de venda"
                        className={cx(classeMini, "numero w-28 text-right")}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>Vai entrar no estoque</td>
              <td className="direita numero">{pecas}</td>
              <td className="direita numero">{formatCurrency(custoEntrada)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      {erro && <Aviso tom="perigo">{erro}</Aviso>}
      {nota.itens.some((it) => linhas[it.item]?.acao === "vincular" && porId.get((linhas[it.item] as { produtoId: number }).produtoId)?.aConferir) && (
        <Aviso tom="info">
          <span className="inline-flex items-center gap-1.5">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            Itens da lista antiga (&quot;a conferir&quot;) que entrarem por esta nota passam a ativos.
          </span>
        </Aviso>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-borda pt-5">
        <Botao variante="primario" tamanho="lg" icone={PackageCheck} onClick={lancar} disabled={enviando || jaLancada}>
          {enviando ? "Lançando..." : `Lançar ${pecas} peças no estoque`}
        </Botao>
        <p className="text-xs text-suave">Cada peça fica registrada nas movimentações com o número da nota.</p>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { nomeProduto, precisaAtencao, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import type { TipoProduto } from "@/generated/prisma/enums";
import { classeCampo } from "@/components/ui/Campo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export type LinhaProduto = {
  id: number;
  codigo: string;
  codigoBarras: string | null;
  referencia: string | null;
  tipo: TipoProduto;
  marca: string | null;
  descricao: string;
  localizacao: string | null;
  fornecedorId: number | null;
  fornecedor: string | null;
  quantidade: number;
  estoqueMinimo: number;
  custoUnitario: number;
  precoVenda: number;
  ativo: boolean;
  aConferir: boolean;
};

export type FiltrosProdutos = { busca?: string; tipo?: string; marca?: string; fornecedor?: string; situacao?: string };

function semAcento(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const classeFiltro = cx(classeCampo, "py-2");

export function ProdutosTabela({
  produtos,
  fornecedores,
  isAdmin,
  inicial,
}: {
  produtos: LinhaProduto[];
  fornecedores: { id: number; nome: string }[];
  isAdmin: boolean;
  inicial: FiltrosProdutos;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState(inicial.busca ?? "");
  const [tipo, setTipo] = useState(inicial.tipo ?? "");
  const [marca, setMarca] = useState(inicial.marca ?? "");
  const [fornecedor, setFornecedor] = useState(inicial.fornecedor ?? "");
  const [situacao, setSituacao] = useState(inicial.situacao ?? "ativos");

  const marcas = useMemo(
    () => [...new Set(produtos.map((p) => p.marca).filter((m): m is string => Boolean(m)))].sort((a, b) => a.localeCompare(b)),
    [produtos]
  );

  const termo = semAcento(busca.trim());
  // os zerados vão para o fim da lista (o resto segue a ordem tipo → marca → modelo)
  const filtrados = [...produtos].sort((a, b) => Number(a.quantidade <= 0) - Number(b.quantidade <= 0)).filter((p) => {
    if (situacao === "ativos" && !p.ativo) return false;
    if (situacao === "inativos" && (p.ativo || p.aConferir)) return false;
    if (situacao === "conferir" && !p.aConferir) return false;
    if (situacao === "atencao" && !precisaAtencao(p)) return false;
    if (tipo && p.tipo !== tipo) return false;
    if (marca && p.marca !== marca) return false;
    if (fornecedor === "0" && p.fornecedorId !== null) return false;
    if (fornecedor && fornecedor !== "0" && String(p.fornecedorId) !== fornecedor) return false;
    if (!termo) return true;
    return semAcento([p.codigo, p.codigoBarras, p.referencia, p.marca, p.descricao, p.localizacao].filter(Boolean).join(" ")).includes(termo);
  });

  const pecas = filtrados.reduce((s, p) => s + p.quantidade, 0);
  const totalCusto = filtrados.reduce((s, p) => s + p.quantidade * p.custoUnitario, 0);
  const totalVenda = filtrados.reduce((s, p) => s + p.quantidade * p.precoVenda, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Código, código de barras, marca ou modelo..."
            autoFocus
            className={cx(classeFiltro, "pl-10")}
          />
        </label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo" className={classeFiltro}>
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_PRODUTO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={marca} onChange={(e) => setMarca(e.target.value)} aria-label="Marca" className={classeFiltro}>
          <option value="">Todas as marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} aria-label="Fornecedor" className={classeFiltro}>
          <option value="">Todos os fornecedores</option>
          <option value="0">Sem fornecedor</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <select value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Situação" className={classeFiltro}>
          <option value="ativos">Ativos</option>
          <option value="atencao">Zerados / abaixo do mínimo</option>
          <option value="conferir">Lista antiga (a conferir)</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Fornecedor</th>
              <th className="direita">Qtd.</th>
              {isAdmin && <th className="direita">Custo</th>}
              <th className="direita">Preço</th>
              {isAdmin && <th className="direita">Margem</th>}
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-suave">
                  {produtos.length === 0 ? "Nenhum produto cadastrado." : "Nenhum produto com esses filtros."}
                </td>
              </tr>
            )}
            {filtrados.map((p) => {
              const atencao = precisaAtencao(p);
              const margem = p.precoVenda > 0 ? (p.precoVenda - p.custoUnitario) / p.precoVenda : 0;
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/produtos/${p.id}`)}
                  className={cx("cursor-pointer", !p.ativo && "opacity-60")}
                  title="Abrir a ficha do produto"
                >
                  <td className="destaque numero whitespace-nowrap">{p.codigo}</td>
                  <td>
                    <div className="text-texto">{nomeProduto(p)}</div>
                    <div className="text-xs text-suave">
                      {TIPO_PRODUTO_LABELS[p.tipo]}
                      {p.localizacao ? ` · ${p.localizacao}` : ""}
                    </div>
                  </td>
                  <td>{p.fornecedor ?? <span className="text-suave">—</span>}</td>
                  <td className="direita numero">
                    <span className={atencao ? "font-bold text-perigo" : "font-semibold text-texto"}>{p.quantidade}</span>
                    {p.estoqueMinimo > 0 && <span className="text-xs text-suave"> / mín. {p.estoqueMinimo}</span>}
                  </td>
                  {isAdmin && <td className="direita numero">{formatCurrency(p.custoUnitario)}</td>}
                  <td className="direita numero destaque">{formatCurrency(p.precoVenda)}</td>
                  {isAdmin && (
                    <td className={cx("direita numero", margem < 0 && "text-perigo")}>{p.custoUnitario > 0 ? formatPercent(margem) : "—"}</td>
                  )}
                  <td>
                    {p.aConferir ? (
                      <Etiqueta tom="info">A conferir</Etiqueta>
                    ) : !p.ativo ? (
                      <Etiqueta>Inativo</Etiqueta>
                    ) : p.quantidade <= 0 ? (
                      <Etiqueta tom="perigo">Zerado</Etiqueta>
                    ) : atencao ? (
                      <Etiqueta tom="aviso">Abaixo do mínimo</Etiqueta>
                    ) : (
                      <Etiqueta tom="sucesso">Em estoque</Etiqueta>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3}>
                  Totais · {filtrados.length} {filtrados.length === 1 ? "produto" : "produtos"}
                </td>
                <td className="direita numero">{pecas}</td>
                {isAdmin && <td className="direita numero">{formatCurrency(totalCusto)}</td>}
                <td className="direita numero">{formatCurrency(totalVenda)}</td>
                {isAdmin && <td />}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-suave">Nos totais, custo e preço são multiplicados pela quantidade em estoque.</p>
    </div>
  );
}

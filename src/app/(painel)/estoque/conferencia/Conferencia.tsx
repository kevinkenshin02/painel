"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Eraser, ScanBarcode, Search } from "lucide-react";
import { aplicarConferencia } from "./actions";
import { normalizarCodigo } from "@/lib/nfe";
import { nomeProduto } from "@/lib/produtos";
import { formatCurrency } from "@/lib/format";
import { Botao } from "@/components/ui/Botao";
import { classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export type ProdutoConferencia = {
  id: number;
  codigo: string;
  codigoBarras: string | null;
  referencia: string | null;
  marca: string | null;
  descricao: string;
  localizacao: string | null;
  quantidade: number;
  precoVenda: number;
  ativo: boolean;
  aConferir: boolean;
};

type Salvo = { contado: Record<number, number>; preco: Record<number, string> };
const CHAVE = "painel-conferencia-v1";

function lerSalvo(): Salvo {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Salvo | null;
    if (s && typeof s === "object") return { contado: s.contado ?? {}, preco: s.preco ?? {} };
  } catch {
    // sem localStorage — começa do zero
  }
  return { contado: {}, preco: {} };
}

function semAcento(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Conferencia({ produtos, isAdmin }: { produtos: ProdutoConferencia[]; isAdmin: boolean }) {
  const router = useRouter();
  const [inicial] = useState(lerSalvo);
  const [contado, setContado] = useState<Record<number, number>>(inicial.contado);
  const [preco, setPreco] = useState<Record<number, string>>(inicial.preco);
  const [mostrar, setMostrar] = useState<"antiga" | "ativos" | "todos">(produtos.some((p) => p.aConferir) ? "antiga" : "ativos");
  const [marca, setMarca] = useState("");
  const [busca, setBusca] = useState("");
  const [bip, setBip] = useState("");
  const [msgBip, setMsgBip] = useState<{ tom: "sucesso" | "aviso"; texto: string; codigo?: string } | null>(null);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{ erro?: string; resumo?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoBip = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ contado, preco }));
    } catch {
      // sem localStorage — a contagem só não fica guardada
    }
  }, [contado, preco]);

  const marcas = useMemo(() => [...new Set(produtos.map((p) => p.marca ?? "Sem marca"))].sort((a, b) => a.localeCompare(b)), [produtos]);
  const indice = useMemo(() => {
    const m = new Map<string, ProdutoConferencia>();
    for (const p of produtos) for (const c of [p.codigo, p.codigoBarras, p.referencia]) if (c) m.set(normalizarCodigo(c), p);
    return m;
  }, [produtos]);

  const termo = semAcento(busca.trim());
  const visiveis = produtos.filter((p) => {
    if (mostrar === "antiga" && !p.aConferir) return false;
    if (mostrar === "ativos" && !p.ativo) return false;
    if (marca && (p.marca ?? "Sem marca") !== marca) return false;
    if (termo && !semAcento(`${p.codigo} ${p.codigoBarras ?? ""} ${p.marca ?? ""} ${p.descricao} ${p.localizacao ?? ""}`).includes(termo)) return false;
    return true;
  });

  function bipar(codigo: string) {
    const c = normalizarCodigo(codigo);
    if (!c) return;
    const p = indice.get(c);
    if (!p) {
      setMsgBip({ tom: "aviso", texto: `O código ${codigo} não está no Painel.`, codigo });
      return;
    }
    const novo = (contado[p.id] ?? 0) + 1;
    setContado((x) => ({ ...x, [p.id]: novo }));
    setMsgBip({ tom: "sucesso", texto: `${nomeProduto(p)} — contado: ${novo}` });
    setDestaque(p.id);
    if (mostrar === "antiga" && !p.aConferir) setMostrar("todos");
    setTimeout(() => document.getElementById(`conf-${p.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
  }

  const contados = produtos.filter((p) => contado[p.id] !== undefined);
  const comDiferenca = contados.filter((p) => contado[p.id] !== p.quantidade);
  const antigosAchados = contados.filter((p) => p.aConferir && contado[p.id] > 0);
  const semPreco = antigosAchados.filter((p) => !(Number(preco[p.id]) > 0) && !(p.precoVenda > 0));

  async function aplicar() {
    if (!contados.length) return;
    const texto = [
      `Aplicar a conferência de ${contados.length} produtos?`,
      `${comDiferenca.length} com diferença no estoque.`,
      antigosAchados.length ? `${antigosAchados.length} da lista antiga encontrados (viram ativos).` : "",
      semPreco.length ? `Atenção: ${semPreco.length} encontrados estão sem preço de venda.` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!confirm(texto)) return;
    setEnviando(true);
    setResultado(null);
    try {
      const r = await aplicarConferencia(
        contados.map((p) => ({ produtoId: p.id, contado: contado[p.id], precoVenda: preco[p.id] !== undefined && preco[p.id] !== "" ? Number(preco[p.id]) : null }))
      );
      setResultado(r);
      if (r.ok) {
        setContado({});
        setPreco({});
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          bipar(bip);
          setBip("");
          campoBip.current?.focus();
        }}
        className="flex flex-col gap-2 rounded-2xl border border-borda-forte bg-ouro/8 p-4"
      >
        <label className="flex items-center gap-2 text-sm font-bold text-texto" htmlFor="bip">
          <ScanBarcode className="h-5 w-5 text-ouro" aria-hidden />
          Bipe o código de barras (ou digite o código e aperte Enter) — cada bip soma 1
        </label>
        <div className="flex gap-2">
          <input
            id="bip"
            ref={campoBip}
            value={bip}
            onChange={(e) => setBip(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder="7891511..."
            className={cx(classeCampo, "numero text-base")}
          />
          <Botao type="submit" variante="primario">
            Contar
          </Botao>
        </div>
        {msgBip && (
          <p className={cx("text-sm font-semibold", msgBip.tom === "sucesso" ? "text-sucesso" : "text-aviso")}>
            {msgBip.texto}{" "}
            {msgBip.codigo && isAdmin && (
              <Link href={`/produtos/novo?codigo=${encodeURIComponent(msgBip.codigo)}`} target="_blank" className="underline">
                Cadastrar esse produto
              </Link>
            )}
          </p>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Chip>
          Contados: {contados.length} de {produtos.length}
        </Chip>
        <Chip>{contados.reduce((s, p) => s + (contado[p.id] ?? 0), 0)} peças contadas</Chip>
        <Chip className={comDiferenca.length ? "border-aviso/40 text-aviso" : undefined}>{comDiferenca.length} com diferença</Chip>
        {produtos.some((p) => p.aConferir) && <Chip>{antigosAchados.length} da lista antiga encontrados</Chip>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por código, marca, modelo ou local..." className={cx(classeCampo, "py-2 pl-10")} />
        </label>
        <select value={mostrar} onChange={(e) => setMostrar(e.target.value as typeof mostrar)} aria-label="Mostrar" className={cx(classeCampo, "py-2")}>
          <option value="antiga">Lista antiga (a conferir)</option>
          <option value="ativos">Produtos ativos</option>
          <option value="todos">Todos</option>
        </select>
        <select value={marca} onChange={(e) => setMarca(e.target.value)} aria-label="Marca" className={cx(classeCampo, "py-2")}>
          <option value="">Todas as marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[640px] overflow-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Local</th>
              <th className="direita">No sistema</th>
              <th className="direita">Contado</th>
              <th className="direita">Diferença</th>
              <th className="direita">Preço de venda</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-suave">
                  Nenhum produto com esses filtros.
                </td>
              </tr>
            )}
            {visiveis.map((p) => {
              const c = contado[p.id];
              const dif = c === undefined ? null : c - p.quantidade;
              return (
                <tr key={p.id} id={`conf-${p.id}`} className={cx(destaque === p.id && "[&>td]:bg-ouro/12")}>
                  <td className="numero whitespace-nowrap">{p.codigoBarras && p.codigoBarras !== p.codigo ? `${p.codigo} · ${p.codigoBarras}` : p.codigo}</td>
                  <td>
                    <span className="text-texto">{nomeProduto(p)}</span>
                    {p.aConferir && <Etiqueta tom="info" className="ml-2">lista antiga</Etiqueta>}
                    {!p.ativo && !p.aConferir && <Etiqueta className="ml-2">inativo</Etiqueta>}
                  </td>
                  <td>{p.localizacao ?? <span className="text-suave">—</span>}</td>
                  <td className="direita numero">{p.quantidade}</td>
                  <td className="direita">
                    <input
                      type="number"
                      min={0}
                      value={c ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        setContado((x) => {
                          const n = { ...x };
                          if (e.target.value === "") delete n[p.id];
                          else n[p.id] = Math.max(0, Math.trunc(Number(e.target.value)));
                          return n;
                        })
                      }
                      aria-label={`Contado de ${p.codigo}`}
                      className="numero w-20 rounded-lg border border-borda bg-superficie-2 px-2 py-1 text-right text-sm text-texto focus:border-ouro focus:outline-none"
                    />
                  </td>
                  <td className={cx("direita numero font-semibold", dif === null ? "text-suave" : dif > 0 ? "text-sucesso" : dif < 0 ? "text-perigo" : "text-texto-2")}>
                    {dif === null ? "—" : dif > 0 ? `+${dif}` : dif}
                  </td>
                  <td className="direita">
                    {p.aConferir || p.precoVenda <= 0 ? (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={preco[p.id] ?? (p.precoVenda > 0 ? String(p.precoVenda) : "")}
                        placeholder="R$"
                        onChange={(e) => setPreco((x) => ({ ...x, [p.id]: e.target.value }))}
                        aria-label={`Preço de ${p.codigo}`}
                        className="numero w-24 rounded-lg border border-borda bg-superficie-2 px-2 py-1 text-right text-sm text-texto focus:border-ouro focus:outline-none"
                      />
                    ) : (
                      <span className="numero text-texto-2">{formatCurrency(p.precoVenda)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.resumo && <Aviso tom="sucesso">{resultado.resumo}</Aviso>}
      {semPreco.length > 0 && (
        <Aviso tom="aviso">
          {semPreco.length} relógio(s) da lista antiga encontrado(s) ainda sem preço de venda — preencha antes de aplicar (ou depois, na ficha).
        </Aviso>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-borda pt-5">
        {isAdmin ? (
          <Botao variante="primario" tamanho="lg" icone={ClipboardCheck} onClick={aplicar} disabled={enviando || contados.length === 0}>
            {enviando ? "Aplicando..." : `Aplicar conferência (${contados.length})`}
          </Botao>
        ) : (
          <Aviso tom="info">Você pode contar; quem aplica no estoque é o administrador (a contagem fica guardada neste computador).</Aviso>
        )}
        <Botao
          variante="fantasma"
          icone={Eraser}
          onClick={() => {
            if (confirm("Apagar toda a contagem feita até agora?")) {
              setContado({});
              setPreco({});
            }
          }}
        >
          Limpar contagem
        </Botao>
        <p className="text-xs text-suave">A contagem fica guardada neste computador até você aplicar — dá para parar e continuar depois.</p>
      </div>
    </div>
  );
}

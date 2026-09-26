"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserCheck, UserPlus, X } from "lucide-react";
import { formatTelefone } from "@/lib/format";
import { classeCampo } from "./ui/Campo";
import { cx } from "./ui/cx";

export type ClienteResumo = { id: number; nome: string; telefone: string; cpf?: string | null };

/**
 * Campo "Cliente" da OS e da venda: busca no cadastro por nome, telefone ou CPF.
 * Escolhendo alguém, manda `clienteId` junto com o formulário e avisa o pai (para preencher nome/telefone).
 * Sem escolher, o formulário segue com o nome digitado (a OS cria o cadastro sozinha).
 */
export function BuscaCliente({
  inicial,
  nomeCampoNome = "clienteNome",
  obrigatorio = false,
  aoEscolher,
}: {
  inicial?: ClienteResumo | null;
  nomeCampoNome?: string;
  obrigatorio?: boolean;
  aoEscolher?: (c: ClienteResumo | null) => void;
}) {
  const [texto, setTexto] = useState(inicial?.nome ?? "");
  const [escolhido, setEscolhido] = useState<ClienteResumo | null>(inicial ?? null);
  const [sugestoes, setSugestoes] = useState<ClienteResumo[]>([]);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (escolhido || texto.trim().length < 2) return;
    const controle = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/clientes?q=${encodeURIComponent(texto.trim())}`, { signal: controle.signal });
        const dados = (await r.json()) as { clientes?: ClienteResumo[] };
        setSugestoes(dados.clientes ?? []);
        setAberto(true);
      } catch {
        // digitou de novo antes da resposta — ignora
      }
    }, 220);
    return () => {
      clearTimeout(t);
      controle.abort();
    };
  }, [texto, escolhido]);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolher(c: ClienteResumo | null) {
    setEscolhido(c);
    setTexto(c?.nome ?? "");
    setAberto(false);
    setSugestoes([]);
    aoEscolher?.(c);
  }

  return (
    <div ref={caixa} className="relative">
      <input type="hidden" name="clienteId" value={escolhido?.id ?? ""} />
      <div className="relative">
        {escolhido ? (
          <UserCheck className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sucesso" aria-hidden />
        ) : (
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
        )}
        <input
          type="text"
          name={nomeCampoNome}
          value={texto}
          required={obrigatorio}
          autoComplete="off"
          placeholder="Nome, telefone ou CPF do cliente"
          onChange={(e) => {
            setTexto(e.target.value);
            if (escolhido) {
              setEscolhido(null);
              aoEscolher?.(null);
            }
            if (e.target.value.trim().length < 2) {
              setSugestoes([]);
              setAberto(false);
            }
          }}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          className={cx(classeCampo, "pr-9 pl-10", escolhido && "border-sucesso/50")}
        />
        {texto && (
          <button
            type="button"
            onClick={() => escolher(null)}
            aria-label="Limpar cliente"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-suave hover:text-texto"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {escolhido ? (
        <p className="mt-1.5 text-xs text-sucesso">Cliente do cadastro — a OS/venda fica no histórico dele.</p>
      ) : (
        texto.trim().length >= 2 && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-suave">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Não escolheu da lista: vale o nome digitado.
          </p>
        )
      )}
      {aberto && sugestoes.length > 0 && !escolhido && (
        <ul className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-borda-forte bg-superficie p-1.5 shadow-cartao">
          {sugestoes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => escolher(c)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-superficie-2"
              >
                <span className="font-semibold text-texto">{c.nome}</span>
                <span className="numero text-xs text-suave">{c.telefone ? formatTelefone(c.telefone) : "sem telefone"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

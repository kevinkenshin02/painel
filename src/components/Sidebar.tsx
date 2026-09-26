"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, LogOut, Search, X } from "lucide-react";
import { sair } from "@/app/login/actions";
import { MENU, grupoAtivo, itemAtivo, type GrupoMenu } from "./menu";
import { cx } from "./ui/cx";

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Sidebar({ nomeFuncionario, isAdmin }: { nomeFuncionario: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const grupos = useMemo(() => {
    const termo = semAcento(busca.trim());
    const resultado: GrupoMenu[] = [];
    for (const original of MENU) {
      if (original.admin && !isAdmin) continue;
      const g: GrupoMenu = { ...original, itens: original.itens?.filter((i) => !i.admin || isAdmin) };
      if (!termo || semAcento(g.rotulo).includes(termo)) {
        resultado.push(g);
        continue;
      }
      const itens = g.itens?.filter((i) => semAcento(i.rotulo).includes(termo));
      if (itens && itens.length > 0) resultado.push({ ...g, itens });
    }
    return resultado;
  }, [busca, isAdmin]);

  const buscando = busca.trim().length > 0;

  function estaAberto(g: GrupoMenu) {
    if (buscando) return true;
    return abertos[g.id] ?? grupoAtivo(g, pathname);
  }

  return (
    <aside className="nao-imprimir flex h-screen w-[272px] shrink-0 flex-col gap-4 border-r border-lat-borda bg-lat-fundo px-4 py-5 text-lat-texto">
      <Link
        href="/"
        className="filete block rounded-2xl border border-lat-borda bg-lat-cartao px-5 pt-5 pb-4 transition hover:border-[rgba(224,166,61,0.4)]"
      >
        <Image
          src="/marca/logo-tanaka.png"
          alt="Tanaka Ótica e Relojoaria"
          width={760}
          height={155}
          priority
          unoptimized
          className="h-auto w-full"
        />
        <div className="mt-3 text-center text-[10px] font-semibold tracking-[0.24em] text-lat-suave uppercase">
          Painel de gestão
        </div>
      </Link>

      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-lat-suave" aria-hidden />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no menu..."
          aria-label="Buscar no menu"
          className="h-10 w-full rounded-xl border border-lat-borda bg-lat-cartao pr-9 pl-10 text-[13px] text-lat-texto placeholder:text-lat-suave/80 focus:border-[#e0a63d] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {buscando && (
          <button
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-lat-suave hover:text-lat-texto"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      <nav className="-mx-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1 pb-2" aria-label="Menu principal">
        {grupos.length === 0 && <p className="px-3 py-4 text-xs text-lat-suave">Nada encontrado.</p>}
        {grupos.map((g) => {
          const Icone = g.icone;
          const ativo = grupoAtivo(g, pathname);

          if (!g.itens) {
            return (
              <Link
                key={g.id}
                href={g.href ?? "/"}
                aria-current={ativo ? "page" : undefined}
                className={cx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition",
                  ativo
                    ? "bg-[rgba(249,178,51,0.1)] text-[#f9b233] before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-[#f9b233]"
                    : "text-lat-texto/85 hover:bg-white/5 hover:text-lat-texto"
                )}
              >
                <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {g.rotulo}
              </Link>
            );
          }

          const aberto = estaAberto(g);
          return (
            <div key={g.id}>
              <button
                type="button"
                onClick={() => setAbertos((a) => ({ ...a, [g.id]: !aberto }))}
                aria-expanded={aberto}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold transition",
                  ativo ? "text-[#f9b233]" : "text-lat-texto/85 hover:bg-white/5 hover:text-lat-texto"
                )}
              >
                <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span className="flex-1">{g.rotulo}</span>
                <ChevronRight
                  className={cx("h-4 w-4 shrink-0 text-lat-suave transition-transform", aberto && "rotate-90")}
                  aria-hidden
                />
              </button>
              {aberto && (
                <ul className="mt-0.5 mb-1.5 ml-[21px] flex flex-col gap-0.5 border-l border-lat-borda pl-3">
                  {g.itens.map((item) =>
                    item.href ? (
                      <li key={item.rotulo}>
                        <Link
                          href={item.href}
                          aria-current={itemAtivo(item.href, pathname) ? "page" : undefined}
                          className={cx(
                            "block rounded-lg px-3 py-2 text-[13px] transition",
                            itemAtivo(item.href, pathname)
                              ? "bg-[rgba(249,178,51,0.1)] font-semibold text-[#f9b233]"
                              : "text-lat-suave hover:bg-white/5 hover:text-lat-texto"
                          )}
                        >
                          {item.rotulo}
                        </Link>
                      </li>
                    ) : (
                      <li
                        key={item.rotulo}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-lat-suave/55"
                        title="Vem nas próximas etapas do Painel 2.0"
                      >
                        {item.rotulo}
                        <span className="shrink-0 rounded-full border border-lat-borda px-1.5 py-px text-[9px] font-bold tracking-wider whitespace-nowrap uppercase">
                          em breve
                        </span>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 rounded-2xl border border-lat-borda bg-lat-cartao p-3">
        <div className="degrade-sol flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-sobre-sol">
          {iniciais(nomeFuncionario)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold" title={nomeFuncionario}>
            {nomeFuncionario}
          </div>
          <div className="text-[11px] text-lat-suave">{isAdmin ? "Administrador" : "Funcionário"}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            sair().then(() => {
              window.location.href = "/login";
            });
          }}
          title="Sair"
          aria-label="Sair"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lat-suave transition hover:bg-white/5 hover:text-[#f07466]"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  );
}

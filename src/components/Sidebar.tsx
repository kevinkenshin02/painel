"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Visão geral", adminOnly: false },
  { href: "/vendas", label: "Vendas", adminOnly: false },
  { href: "/estoque", label: "Estoque", adminOnly: false },
  { href: "/ordens-servico", label: "Ordens de Serviço", adminOnly: false },
  { href: "/despesas", label: "Despesas", adminOnly: true },
] as const;

export function Sidebar({
  nomeFuncionario,
  isAdmin,
}: {
  nomeFuncionario: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const configuracoesAtivo = pathname === "/configuracoes";
  const itensVisiveis = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-7 bg-[#221d19] px-4 py-6 text-[#f3ede4]">
      <div className="flex items-center gap-3 px-2">
        <div className="relative h-9 w-9 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f6b23b] to-[#e0472e]" />
          <div className="absolute top-1.5 left-1 h-6 w-1 bg-[#221d19]" />
          <div className="absolute top-1.5 right-1 h-6 w-1 bg-[#221d19]" />
          <div className="absolute top-1 -left-0.5 h-[3px] w-10 bg-[#221d19]" />
          <div className="absolute top-3 left-0 h-[3px] w-9 bg-[#221d19]" />
        </div>
        <div>
          <div
            className="text-[17px] leading-none font-extrabold tracking-wide"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            TANAKA
          </div>
          <div className="mt-0.5 text-[9px] tracking-[0.15em] text-[#c9bfae] uppercase">
            Ótica &amp; Relojoaria
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {itensVisiveis.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[#e0472e]/20 font-bold text-[#f6b23b]"
                  : "text-[#c9bfae] hover:bg-white/5 hover:text-[#f3ede4]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  isActive
                    ? "bg-gradient-to-br from-[#f6b23b] to-[#e0472e]"
                    : "bg-[#4a4038]"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 px-1 pt-3">
        <span className="truncate text-xs font-medium text-[#c9bfae]" title={nomeFuncionario}>
          {nomeFuncionario}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/configuracoes"
            title="Configurações"
            aria-label="Configurações"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              configuracoesAtivo
                ? "bg-[#e0472e]/20 text-[#f6b23b]"
                : "text-[#c9bfae] hover:bg-white/5 hover:text-[#f3ede4]"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => {
              sair().then(() => {
                window.location.href = "/login";
              });
            }}
            title="Sair"
            className="text-xs font-semibold text-[#c9bfae] hover:text-[#f3ede4] hover:underline"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

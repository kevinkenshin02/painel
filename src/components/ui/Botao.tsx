import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

export type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo" | "sucesso";
export type TamanhoBotao = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBotao, string> = {
  primario:
    "degrade-sol text-sobre-sol font-bold shadow-[0_8px_20px_-10px_rgba(224,57,47,0.7)] hover:brightness-[1.06]",
  secundario: "border border-borda-forte bg-superficie-2 text-texto hover:bg-superficie-3",
  fantasma: "text-texto-2 hover:bg-superficie-2 hover:text-texto",
  perigo: "border border-perigo/30 bg-perigo-fundo text-perigo hover:border-perigo/60",
  sucesso: "border border-sucesso/35 bg-sucesso-fundo text-sucesso hover:border-sucesso/70",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-[13px] rounded-xl",
  lg: "h-12 px-6 text-sm rounded-xl",
};

export function botaoClasses(variante: VarianteBotao = "secundario", tamanho: TamanhoBotao = "md") {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition active:scale-[0.97] disabled:active:scale-100",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ouro",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTES[variante],
    TAMANHOS[tamanho]
  );
}

type Comum = {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: LucideIcon;
  children?: ReactNode;
};

export function Botao({
  variante,
  tamanho,
  icone: Icone,
  className,
  children,
  type = "button",
  ...resto
}: Comum & ComponentProps<"button">) {
  return (
    <button type={type} className={cx(botaoClasses(variante, tamanho), className)} {...resto}>
      {Icone && <Icone className="h-4 w-4" aria-hidden />}
      {children}
    </button>
  );
}

export function BotaoLink({
  variante,
  tamanho,
  icone: Icone,
  className,
  children,
  ...resto
}: Comum & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(botaoClasses(variante, tamanho), className)} {...resto}>
      {Icone && <Icone className="h-4 w-4" aria-hidden />}
      {children}
    </Link>
  );
}

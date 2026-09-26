import type { ReactNode } from "react";
import { cx } from "./cx";

/** Classes de input/select/textarea do painel. */
export const classeCampo =
  "w-full rounded-xl border border-borda bg-superficie-2 px-3.5 py-2.5 text-sm text-texto placeholder:text-suave/70 transition focus:border-ouro focus:ring-2 focus:ring-ouro/25 focus:outline-none disabled:opacity-60";

/** Rótulo + campo. */
export function Campo({
  rotulo,
  dica,
  className,
  children,
}: {
  rotulo: ReactNode;
  dica?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">{rotulo}</span>
      {children}
      {dica && <span className="text-xs text-suave">{dica}</span>}
    </label>
  );
}

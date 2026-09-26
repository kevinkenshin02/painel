import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cx } from "./cx";

const TONS = {
  sucesso: { classe: "border-sucesso/30 bg-sucesso-fundo text-sucesso", Icone: CircleCheck },
  perigo: { classe: "border-perigo/30 bg-perigo-fundo text-perigo", Icone: CircleAlert },
  aviso: { classe: "border-aviso/30 bg-aviso-fundo text-aviso", Icone: TriangleAlert },
  info: { classe: "border-info/30 bg-info-fundo text-info", Icone: Info },
} as const;

/** Caixa de mensagem (erro, sucesso, atenção, informação). */
export function Aviso({
  tom = "info",
  children,
  className,
}: {
  tom?: keyof typeof TONS;
  children: ReactNode;
  className?: string;
}) {
  const { classe, Icone } = TONS[tom];
  return (
    <div role={tom === "perigo" ? "alert" : "status"} className={cx("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium", classe, className)}>
      <Icone className="mt-px h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

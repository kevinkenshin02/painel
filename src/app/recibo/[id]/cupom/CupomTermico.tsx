"use client";

import { Children, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Scissors } from "lucide-react";
import { cx } from "@/components/ui/cx";

export type LarguraPapel = 80 | 58;
const CHAVE = "papelCupom";

export function CupomTermico({
  osId,
  largura,
  papelNaUrl,
  children,
}: {
  osId: number;
  largura: LarguraPapel;
  papelNaUrl: boolean;
  children: ReactNode;
}) {
  const router = useRouter();

  // volta a largura usada da última vez (só quando o link não escolheu uma)
  useEffect(() => {
    if (papelNaUrl) return;
    try {
      if (localStorage.getItem(CHAVE) === "58") router.replace(`/recibo/${osId}/cupom?papel=58`);
    } catch {}
  }, [papelNaUrl, osId, router]);

  function escolher(l: LarguraPapel) {
    try {
      localStorage.setItem(CHAVE, String(l));
    } catch {}
    router.replace(`/recibo/${osId}/cupom?papel=${l}`);
  }

  // área útil da bobina: 80 mm imprime ~72 mm, 58 mm imprime ~48 mm
  const util = largura === 80 ? 72 : 48;
  const vias = Children.toArray(children);

  return (
    <div className="min-h-full w-full bg-[#e9e6e1] py-8 print:bg-white print:py-0">
      <style>{`
        @page { margin: 0; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <div className="mx-auto mb-6 flex w-fit flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#1b1916] p-2 text-[13px] text-[#f3ede4] shadow-lg print:hidden">
        <Link href={`/recibo/${osId}`} className="flex h-9 items-center gap-1.5 rounded-xl px-3 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Folha comum
        </Link>
        <div className="flex rounded-xl bg-white/5 p-0.5" role="group" aria-label="Largura da bobina">
          {([80, 58] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => escolher(l)}
              aria-pressed={largura === l}
              className={cx(
                "h-8 rounded-lg px-3 font-semibold transition-colors",
                largura === l ? "bg-[#f9b233] text-[#1a1108]" : "text-[#f3ede4]/80 hover:text-[#f3ede4]"
              )}
            >
              {l} mm
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#f9b233] to-[#e0392f] px-4 font-bold text-[#1a1108] transition-transform active:scale-[0.97]"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Imprimir 2 vias
        </button>
      </div>

      <div
        className="mx-auto bg-white text-black shadow-[0_4px_24px_rgba(0,0,0,0.15)] print:shadow-none"
        style={{ width: `${util}mm`, padding: "4mm 0", fontSize: largura === 80 ? "12px" : "10.5px", lineHeight: 1.35 }}
      >
        {vias.map((via, i) => (
          <div key={i} style={i < vias.length - 1 ? { breakAfter: "page" } : undefined}>
            <div className="px-[1mm]">{via}</div>
            {i < vias.length - 1 && (
              <div className="my-4 flex items-center gap-1.5 text-[0.85em]" aria-hidden>
                <Scissors className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 border-t border-dashed border-black" />
                <span>corte aqui</span>
                <span className="flex-1 border-t border-dashed border-black" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

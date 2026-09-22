"use client";

export function PrintButton({ label = "Imprimir comprovante" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
    >
      {label}
    </button>
  );
}

"use client";

import { Printer } from "lucide-react";
import { Botao } from "@/components/ui/Botao";

export function PrintButton() {
  return (
    <Botao variante="primario" icone={Printer} onClick={() => window.print()} className="print:hidden">
      Imprimir comprovante
    </Botao>
  );
}

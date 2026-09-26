"use client";

import { Printer } from "lucide-react";
import { Botao } from "./ui/Botao";

/** Imprime a tela (o menu e os botões somem na impressão; dá para "Salvar como PDF"). */
export function BotaoImprimir({ rotulo = "Imprimir" }: { rotulo?: string }) {
  return (
    <Botao icone={Printer} onClick={() => window.print()} className="nao-imprimir">
      {rotulo}
    </Botao>
  );
}

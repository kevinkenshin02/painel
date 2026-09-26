"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Botao } from "./ui/Botao";

declare global {
  interface Window {
    painel?: { salvarPdf: (nomeArquivo: string) => Promise<{ ok: boolean; caminho?: string }> };
  }
}

/**
 * No programa do Painel (Electron) salva o PDF direto e abre; no navegador abre a janela de impressão
 * (escolha "Salvar como PDF"). A versão impressa some com o menu e os botões e usa papel branco.
 */
export function BotaoPdf({ nomeArquivo }: { nomeArquivo: string }) {
  const [salvando, setSalvando] = useState(false);
  return (
    <Botao
      variante="sucesso"
      icone={FileDown}
      disabled={salvando}
      className="nao-imprimir"
      onClick={async () => {
        if (window.painel?.salvarPdf) {
          setSalvando(true);
          try {
            await window.painel.salvarPdf(nomeArquivo);
          } finally {
            setSalvando(false);
          }
        } else {
          window.print();
        }
      }}
    >
      {salvando ? "Gerando PDF..." : "Exportar PDF"}
    </Botao>
  );
}

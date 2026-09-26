"use client";

import dynamic from "next/dynamic";
import type { ProdutoConferencia } from "./Conferencia";

// A contagem vem do localStorage do computador: a tela só monta no navegador.
const Conferencia = dynamic(() => import("./Conferencia"), {
  ssr: false,
  loading: () => <p className="py-10 text-center text-sm text-suave">Carregando a contagem...</p>,
});

export function ConferenciaCliente(props: { produtos: ProdutoConferencia[]; isAdmin: boolean }) {
  return <Conferencia {...props} />;
}

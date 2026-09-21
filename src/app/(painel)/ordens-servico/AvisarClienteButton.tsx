"use client";

import { useRef } from "react";
import { atualizarStatusOrdemServico } from "./actions";
import { StatusOS } from "@/generated/prisma/enums";
import { montarLinkWhatsApp } from "@/lib/whatsapp";

export function AvisarClienteButton({
  id,
  clienteNome,
  clienteWhatsapp,
  tipoServicoLabel,
}: {
  id: number;
  clienteNome: string;
  clienteWhatsapp: string;
  tipoServicoLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    const mensagem = `Olá ${clienteNome}! Seu ${tipoServicoLabel.toLowerCase()} já está pronto para retirada na Óticas Tanaka e Relojoaria. Te esperamos!`;
    window.open(montarLinkWhatsApp(clienteWhatsapp, mensagem), "_blank", "noopener");
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={atualizarStatusOrdemServico}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={StatusOS.CLIENTE_AVISADO} />
      <button
        type="button"
        onClick={handleClick}
        className="rounded-md border border-[#25d366]/50 bg-[#e9f9ef] px-2 py-1 text-xs font-semibold text-[#1a9c4f] hover:bg-[#d7f4e1]"
      >
        Avisar
      </button>
    </form>
  );
}

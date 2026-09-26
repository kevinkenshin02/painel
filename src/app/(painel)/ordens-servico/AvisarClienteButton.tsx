"use client";

import { useRef } from "react";
import { MessageCircle } from "lucide-react";
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
    const mensagem = `Olá ${clienteNome}! Seu ${tipoServicoLabel.toLowerCase()} já está pronto para retirada na Tanaka Ótica e Relojoaria (Rua São Bento, 545 — Lojas 21 e 22). Te esperamos!`;
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
        title="Abre o WhatsApp com a mensagem pronta e marca como Cliente avisado"
        className="inline-flex items-center gap-1 rounded-lg border border-sucesso/35 bg-sucesso-fundo px-2 py-1 text-xs font-semibold text-sucesso transition hover:border-sucesso/70"
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Avisar
      </button>
    </form>
  );
}

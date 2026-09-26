"use client";

import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { excluirOrdemServico } from "./actions";

export function DeleteButton({ id }: { id: number }) {
  return <ConfirmDeleteForm id={id} action={excluirOrdemServico} confirmMessage="Excluir esta ordem de serviço?" compacto />;
}

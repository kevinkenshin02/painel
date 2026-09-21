import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getFuncionarioLogado } from "@/lib/currentUser";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const funcionario = await getFuncionarioLogado();
  if (!funcionario) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      <Sidebar nomeFuncionario={funcionario.nome} isAdmin={funcionario.isAdmin} />
      <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
    </div>
  );
}

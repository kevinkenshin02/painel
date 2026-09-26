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
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar nomeFuncionario={funcionario.nome} isAdmin={funcionario.isAdmin} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-8 py-7">{children}</div>
      </main>
    </div>
  );
}

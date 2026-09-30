import type { ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getFuncionarioLogado } from "@/lib/currentUser";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const funcionario = await getFuncionarioLogado();
  if (!funcionario) {
    redirect("/login");
  }

  return (
    <div className="layout-painel flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <div aria-hidden className="fundo-painel nao-imprimir" />
      <Sidebar nomeFuncionario={funcionario.nome} isAdmin={funcionario.isAdmin} />
      <main className="layout-conteudo min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {/* só no papel/PDF: marca da loja no topo */}
          <div className="hidden items-center justify-between border-b border-borda pb-3 print:flex">
            <Image src="/marca/logo-tanaka-papel.png" alt="Tanaka Ótica e Relojoaria" width={760} height={155} unoptimized className="h-auto w-52" />
            <span className="text-xs text-suave">Rua São Bento, 545 — Lojas 21 e 22 · Centro, São Paulo · (11) 96077-6721</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

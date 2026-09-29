import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PerfilPicker } from "./PerfilPicker";
import { PrimeiroFuncionarioForm } from "./PrimeiroFuncionarioForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [funcionarios, config] = await Promise.all([
    prisma.funcionario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
  ]);
  const semFuncionarios = funcionarios.length === 0;

  return (
    // self-start: o <body> é flex com altura fixa e esticaria esta caixa só até a altura da tela,
    // cortando em cima e embaixo o que não coubesse (no celular, o logo sumia e não dava para rolar)
    <div className="relative flex min-h-dvh w-full self-start items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      {/* fundo preso à tela (fixed): antes acompanhava a caixa e dava um "zoom" quando o cartão crescia para o PIN */}
      <div aria-hidden className="fixed inset-0">
        <Image src="/marca/fundo-sakura.jpg" alt="" fill priority unoptimized className="object-cover object-[35%_60%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.5)_0%,rgba(10,9,8,0.78)_100%)]" />
      </div>

      {/* um cartão só: marca em cima, entrada embaixo. Sempre escuro, porque o logo é branco. */}
      <section
        data-theme="dark"
        className="filete relative z-10 flex w-full max-w-md flex-col rounded-3xl border border-borda-forte bg-[rgba(14,12,10,0.88)] px-5 py-9 text-texto shadow-cartao backdrop-blur-md sm:px-9 sm:py-10"
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/marca/logo-tanaka.png"
            alt="Tanaka Ótica e Relojoaria"
            width={760}
            height={155}
            priority
            unoptimized
            className="h-auto w-full max-w-[300px]"
          />
          <div className="mt-3 text-[10px] font-semibold tracking-[0.28em] text-suave uppercase">Painel de gestão</div>
          <div className="mt-6 h-px w-40 bg-[linear-gradient(90deg,transparent,var(--ouro),transparent)]" />
        </div>

        <h1 className={semFuncionarios ? "mt-6 text-center font-titulo text-2xl leading-tight font-bold" : "sr-only"}>
          {semFuncionarios ? "Vamos criar seu acesso" : "Painel Tanaka"}
        </h1>
        <p className="mt-5 text-center text-sm text-suave">
          {semFuncionarios
            ? "Você será o primeiro funcionário cadastrado, com acesso de administrador."
            : "Escolha o seu nome e digite o seu PIN."}
        </p>

        <div className="mt-5">{semFuncionarios ? <PrimeiroFuncionarioForm /> : <PerfilPicker funcionarios={funcionarios} />}</div>

        <div className="mt-8 border-t border-borda pt-5 text-center text-xs leading-relaxed text-suave">
          <div>{config?.endereco?.trim() || "Rua São Bento, 545 · Lojas 21 e 22 · Centro, São Paulo"}</div>
          <div className="mt-0.5 font-semibold text-ouro">tanakaotica.com.br</div>
        </div>
      </section>
    </div>
  );
}

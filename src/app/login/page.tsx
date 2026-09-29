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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
      <Image
        src="/marca/fundo-sakura.jpg"
        alt=""
        fill
        priority
        unoptimized
        className="object-cover object-[35%_60%]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.5)_0%,rgba(10,9,8,0.78)_100%)]" />

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="filete flex flex-col items-center justify-center gap-7 rounded-3xl border border-lat-borda bg-[rgba(12,11,10,0.84)] px-8 py-12 text-center text-lat-texto backdrop-blur-md">
          <Image
            src="/marca/logo-tanaka.png"
            alt="Tanaka Ótica e Relojoaria"
            width={760}
            height={155}
            priority
            unoptimized
            className="h-auto w-full max-w-[340px]"
          />
          <div className="h-px w-40 bg-[linear-gradient(90deg,transparent,#e0a63d,transparent)]" />
          <div className="flex flex-col gap-1.5 text-sm text-lat-suave">
            <span>{config?.endereco?.trim() || "Rua São Bento, 545 · Lojas 21 e 22 · Centro, São Paulo"}</span>
            <span className="font-semibold text-[#e0a63d]">tanakaotica.com.br</span>
          </div>
        </section>

        <section className="flex flex-col rounded-3xl border border-borda bg-superficie/95 px-8 py-9 shadow-cartao backdrop-blur-md">
          <div className="text-[11px] font-bold tracking-[0.18em] text-ouro uppercase">Sistema da loja</div>
          <h1 className="mt-1.5 font-titulo text-[30px] leading-tight font-bold text-texto">
            {semFuncionarios ? "Vamos criar seu acesso" : "Painel Tanaka"}
          </h1>
          <p className="mt-1.5 text-sm text-suave">
            {semFuncionarios
              ? "Você será o primeiro funcionário cadastrado, com acesso de administrador."
              : "Escolha o seu nome e digite o seu PIN."}
          </p>

          <div className="mt-7 flex flex-1 flex-col justify-center">
            {semFuncionarios ? <PrimeiroFuncionarioForm /> : <PerfilPicker funcionarios={funcionarios} />}
          </div>
        </section>
      </div>
    </div>
  );
}

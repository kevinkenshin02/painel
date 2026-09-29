import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PerfilPicker } from "./PerfilPicker";
import { PrimeiroFuncionarioForm } from "./PrimeiroFuncionarioForm";
import { VidroLiquido } from "@/components/VidroLiquido";

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
    // A tela de entrada rola dentro de si (fixed + overflow), com a barra escondida: a página nunca
    // ganha barra de rolagem, e em tela baixa ainda dá para rolar com o dedo ou a roda do mouse.
    <div className="fixed inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* fundo preso à tela: não muda de tamanho quando o cartão cresce para o PIN */}
      <div aria-hidden className="fixed inset-0">
        <Image src="/marca/fundo-sakura.jpg" alt="" fill priority unoptimized className="object-cover object-[35%_60%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.45)_0%,rgba(10,9,8,0.72)_100%)]" />
      </div>

      <div className="relative flex min-h-full items-center justify-center px-4 py-8">
        {/* um cartão só, em vidro líquido, que aparece com um pop suave. Sempre escuro: o logo é branco. */}
        <VidroLiquido
          data-theme="dark"
          raio={28}
          className="flex w-full max-w-[380px] flex-col px-6 py-7 text-texto transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] starting:scale-[0.94] starting:opacity-0 motion-reduce:transition-none sm:px-8 sm:py-8"
        >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/marca/logo-tanaka.png"
            alt="Tanaka Ótica e Relojoaria"
            width={760}
            height={155}
            priority
            unoptimized
            className="h-auto w-full max-w-[240px]"
          />
          <div className="mt-2.5 text-[10px] font-semibold tracking-[0.28em] text-suave uppercase">Painel de gestão</div>
          <div className="mt-5 h-px w-32 bg-[linear-gradient(90deg,transparent,var(--ouro),transparent)]" />
        </div>

        <h1 className={semFuncionarios ? "mt-5 text-center font-titulo text-xl leading-tight font-bold" : "sr-only"}>
          {semFuncionarios ? "Vamos criar seu acesso" : "Painel Tanaka"}
        </h1>
        <p className="mt-4 text-center text-[13px] text-suave">
          {semFuncionarios
            ? "Você será o primeiro funcionário cadastrado, com acesso de administrador."
            : "Escolha o seu nome e digite o seu PIN."}
        </p>

        <div className="mt-4">{semFuncionarios ? <PrimeiroFuncionarioForm /> : <PerfilPicker funcionarios={funcionarios} />}</div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-suave">
          <div>{config?.endereco?.trim() || "Rua São Bento, 545 · Lojas 21 e 22 · Centro, São Paulo"}</div>
          <div className="mt-0.5 font-semibold text-ouro">tanakaotica.com.br</div>
        </div>
        </VidroLiquido>
      </div>
    </div>
  );
}

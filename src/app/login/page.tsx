import { prisma } from "@/lib/prisma";
import { PerfilPicker } from "./PerfilPicker";
import { PrimeiroFuncionarioForm } from "./PrimeiroFuncionarioForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  const semFuncionarios = funcionarios.length === 0;

  return (
    <div
      className={`mx-auto flex min-h-full w-full flex-col items-center justify-center gap-6 px-6 py-16 ${
        semFuncionarios ? "max-w-sm" : "max-w-md"
      }`}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-9 w-9">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f6b23b] to-[#e0472e]" />
            <div className="absolute top-1.5 left-1 h-6 w-1 bg-[#221d19]" />
            <div className="absolute top-1.5 right-1 h-6 w-1 bg-[#221d19]" />
            <div className="absolute top-1 -left-0.5 h-[3px] w-10 bg-[#221d19]" />
            <div className="absolute top-3 left-0 h-[3px] w-9 bg-[#221d19]" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#221d19]">
          {semFuncionarios ? "Bem-vindo! Vamos criar seu acesso" : "Quem é você?"}
        </h1>
        <p className="mt-1 text-sm text-[#8a8078]">
          {semFuncionarios
            ? "Você será o primeiro funcionário cadastrado no painel."
            : "Escolha seu nome e digite seu PIN."}
        </p>
      </div>

      {semFuncionarios ? (
        <PrimeiroFuncionarioForm />
      ) : (
        <PerfilPicker funcionarios={funcionarios} />
      )}
    </div>
  );
}

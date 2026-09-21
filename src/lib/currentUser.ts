import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, lerFuncionarioIdDoCookie } from "@/lib/session";

export async function getFuncionarioLogado() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE)?.value;
  const funcionarioId = await lerFuncionarioIdDoCookie(cookieValue);
  if (!funcionarioId) return null;

  const funcionario = await prisma.funcionario.findUnique({ where: { id: funcionarioId } });
  if (!funcionario || !funcionario.ativo) return null;

  return funcionario;
}

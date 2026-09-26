import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { soDigitos } from "@/lib/format";

/** Busca de clientes para o campo "Cliente" da OS e da venda: nome, telefone ou CPF. */
export async function GET(request: Request) {
  if (!(await getFuncionarioLogado())) {
    return NextResponse.json({ erro: "Entre no Painel primeiro." }, { status: 401 });
  }
  const termo = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (termo.length < 2) return NextResponse.json({ clientes: [] });

  const digitos = soDigitos(termo);
  const clientes = await prisma.cliente.findMany({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: termo } },
        ...(digitos.length >= 3 ? [{ telefone: { contains: digitos } }, { cpf: { contains: digitos } }] : []),
      ],
    },
    orderBy: { atualizadoEm: "desc" },
    take: 8,
    select: { id: true, nome: true, telefone: true, cpf: true },
  });
  return NextResponse.json({ clientes });
}

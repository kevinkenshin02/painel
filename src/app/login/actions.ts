"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPin, verificarPin } from "@/lib/pin";
import { criarCookieSessao, SESSION_COOKIE } from "@/lib/session";

export async function entrarComPin(funcionarioId: number, pin: string): Promise<{ erro?: string; ok?: boolean }> {
  if (!/^\d{4,6}$/.test(pin)) {
    return { erro: "PIN inválido." };
  }

  const funcionario = await prisma.funcionario.findUnique({ where: { id: funcionarioId } });
  if (!funcionario || !funcionario.ativo) {
    return { erro: "Funcionário não encontrado." };
  }

  const confere = await verificarPin(pin, funcionario.pinSalt, funcionario.pinHash);
  if (!confere) {
    return { erro: "PIN incorreto." };
  }

  const cookieStore = await cookies();
  const valor = await criarCookieSessao(funcionario.id);
  cookieStore.set(SESSION_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return { ok: true };
}

export async function criarPrimeiroFuncionario(nome: string, pin: string): Promise<{ erro?: string; ok?: boolean }> {
  const totalExistente = await prisma.funcionario.count();
  if (totalExistente > 0) {
    return { erro: "Já existe funcionário cadastrado." };
  }

  if (!nome.trim()) {
    return { erro: "Informe o nome." };
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return { erro: "O PIN deve ter de 4 a 6 números." };
  }

  const { hash, salt } = await hashPin(pin);
  const funcionario = await prisma.funcionario.create({
    data: { nome: nome.trim(), pinHash: hash, pinSalt: salt, isAdmin: true },
  });

  const cookieStore = await cookies();
  const valor = await criarCookieSessao(funcionario.id);
  cookieStore.set(SESSION_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { ok: true };
}

export async function criarFuncionarioComPinAdmin(
  _prevState: { erro?: string; ok?: boolean; nomeAdicionado?: string },
  formData: FormData
): Promise<{ erro?: string; ok?: boolean; nomeAdicionado?: string }> {
  const pinAdmin = (formData.get("pinAdmin") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  const pin = (formData.get("pin") as string)?.trim();

  if (!/^\d{4,6}$/.test(pinAdmin)) {
    return { erro: "Digite o PIN do administrador." };
  }
  if (!nome) {
    return { erro: "Informe o nome do novo funcionário." };
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return { erro: "O PIN do novo funcionário deve ter de 4 a 6 números." };
  }

  const admins = await prisma.funcionario.findMany({ where: { ativo: true, isAdmin: true } });
  let autorizado = false;
  for (const admin of admins) {
    if (await verificarPin(pinAdmin, admin.pinSalt, admin.pinHash)) {
      autorizado = true;
      break;
    }
  }
  if (!autorizado) {
    return { erro: "PIN de administrador incorreto." };
  }

  const funcionariosAtivos = await prisma.funcionario.findMany({ where: { ativo: true } });
  for (const f of funcionariosAtivos) {
    if (await verificarPin(pin, f.pinSalt, f.pinHash)) {
      return { erro: "Esse PIN já está em uso por outro funcionário ativo. Escolha outro PIN." };
    }
  }

  const { hash, salt } = await hashPin(pin);
  await prisma.funcionario.create({ data: { nome, pinHash: hash, pinSalt: salt } });

  revalidatePath("/login");
  return { ok: true, nomeAdicionado: nome };
}

export async function sair() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

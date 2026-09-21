"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { spawn } from "node:child_process";
import path from "node:path";
import { hashPin, verificarPin } from "@/lib/pin";
import { getFuncionarioLogado } from "@/lib/currentUser";

export async function criarFuncionario(
  _prevState: { erro?: string; ok?: boolean; nomeAdicionado?: string },
  formData: FormData
): Promise<{ erro?: string; ok?: boolean; nomeAdicionado?: string }> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    return { erro: "Só o administrador pode cadastrar funcionários." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  const pin = (formData.get("pin") as string)?.trim();

  if (!nome) {
    return { erro: "Informe o nome." };
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return { erro: "O PIN deve ter de 4 a 6 números." };
  }

  const funcionariosAtivos = await prisma.funcionario.findMany({ where: { ativo: true } });
  for (const f of funcionariosAtivos) {
    if (await verificarPin(pin, f.pinSalt, f.pinHash)) {
      return { erro: "Esse PIN já está em uso por outro funcionário ativo. Escolha outro PIN." };
    }
  }

  const { hash, salt } = await hashPin(pin);
  await prisma.funcionario.create({ data: { nome, pinHash: hash, pinSalt: salt } });

  revalidatePath("/configuracoes");
  return { ok: true, nomeAdicionado: nome };
}

export async function alternarAtivoFuncionario(formData: FormData) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    throw new Error("Só o administrador pode ativar/desativar funcionários.");
  }

  const id = Number(formData.get("id"));
  const ativo = formData.get("ativo") === "true";
  if (!id) throw new Error("Funcionário inválido.");

  await prisma.funcionario.update({ where: { id }, data: { ativo: !ativo } });
  revalidatePath("/configuracoes");
}

export async function salvarConfiguracaoLoja(formData: FormData) {
  const nomeLoja = (formData.get("nomeLoja") as string)?.trim();
  const endereco = (formData.get("endereco") as string)?.trim() ?? "";
  const whatsapp = (formData.get("whatsapp") as string)?.trim() ?? "";

  if (!nomeLoja) {
    throw new Error("Preencha o nome da loja.");
  }

  await prisma.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, nomeLoja, endereco, whatsapp },
    update: { nomeLoja, endereco, whatsapp },
  });

  revalidatePath("/configuracoes");
}

export async function salvarMetas(formData: FormData) {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) {
    throw new Error("Só o administrador pode definir as metas.");
  }

  const metaDiaria = Number(formData.get("metaDiaria"));
  const metaMensal = Number(formData.get("metaMensal"));

  if (!Number.isFinite(metaDiaria) || metaDiaria < 0 || !Number.isFinite(metaMensal) || metaMensal < 0) {
    throw new Error("Informe valores válidos para as metas.");
  }

  await prisma.configuracao.upsert({
    where: { id: 1 },
    create: { id: 1, metaDiaria, metaMensal },
    update: { metaDiaria, metaMensal },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
}

export async function rodarBackupManual(): Promise<{ ok: boolean; mensagem: string }> {
  const projectRoot = process.cwd();
  const backupScript = path.join(projectRoot, "scripts", "backup.mjs");

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [backupScript], {
      cwd: projectRoot,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    });

    let output = "";
    child.stdout?.on("data", (d) => (output += d.toString()));
    child.stderr?.on("data", (d) => (output += d.toString()));

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ ok: true, mensagem: "Backup criado com sucesso." });
      } else {
        resolve({ ok: false, mensagem: `Falha ao criar backup: ${output.slice(-300) || "erro desconhecido"}` });
      }
    });

    child.on("error", (err) => {
      resolve({ ok: false, mensagem: `Erro ao iniciar backup: ${err.message}` });
    });
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TipoMovimento, TipoProduto } from "@/generated/prisma/enums";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { movimentarEstoque } from "@/lib/produtos";
import { lerNFe, normalizarCodigo } from "@/lib/nfe";
import { soDigitos } from "@/lib/format";
import { gerarContasDasNotas } from "@/lib/financeiro";

export type DecisaoItem =
  | { item: number; acao: "vincular"; produtoId: number; atualizarCusto: boolean; precoVenda: number | null }
  | { item: number; acao: "cadastrar"; codigo: string; tipo: TipoProduto; marca: string; descricao: string; precoVenda: number }
  | { item: number; acao: "ignorar" };

type Resultado = { erro?: string; ok?: boolean; notaId?: number; resumo?: string };

const semAcento = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export async function lancarNota(xml: string, decisoes: DecisaoItem[]): Promise<Resultado> {
  const logado = await getFuncionarioLogado();
  if (!logado?.isAdmin) return { erro: "Só o administrador lança nota de entrada." };

  let nota;
  try {
    nota = lerNFe(xml);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não consegui ler o XML." };
  }

  if (nota.chave) {
    const ja = await prisma.notaEntrada.findUnique({ where: { chave: nota.chave } });
    if (ja) return { erro: `Essa nota (NF ${nota.numero}) já foi lançada em ${ja.criadoEm.toLocaleDateString("pt-BR")}.` };
  }

  // confere as decisões
  const porItem = new Map(decisoes.map((d) => [d.item, d]));
  for (const it of nota.itens) {
    if (!porItem.has(it.item)) return { erro: `Falta escolher o que fazer com o item ${it.item} (${it.descricao}).` };
  }
  const codigosNovos = decisoes.filter((d) => d.acao === "cadastrar").map((d) => (d as { codigo: string }).codigo.trim().toUpperCase());
  if (codigosNovos.some((c) => !c)) return { erro: "Todo produto novo precisa de um código." };
  if (new Set(codigosNovos).size !== codigosNovos.length) return { erro: "Dois produtos novos estão com o mesmo código." };
  const jaExistem = await prisma.produto.findMany({ where: { codigo: { in: codigosNovos } }, select: { codigo: true } });
  if (jaExistem.length) return { erro: `Já existe produto com o código ${jaExistem.map((p) => p.codigo).join(", ")} — escolha "Somar em produto existente".` };
  for (const d of decisoes) {
    if (d.acao === "cadastrar" && (!d.descricao.trim() || !Object.values(TipoProduto).includes(d.tipo))) {
      return { erro: `Complete tipo e descrição do produto novo ${d.codigo}.` };
    }
  }

  const resumo = { entradas: 0, novos: 0, ignorados: 0, pecas: 0 };
  const emitente = nota.emitente;
  const cnpj = soDigitos(emitente.cnpj) || null;

  const criada = await prisma.$transaction(async (tx) => {
    // fornecedor: pelo CNPJ; senão pelo nome (os que vieram do Painel antigo ainda não têm CNPJ)
    let fornecedor = cnpj ? await tx.fornecedor.findUnique({ where: { cnpj } }) : null;
    if (!fornecedor) {
      const nomeNota = semAcento(emitente.nome);
      const fantasia = semAcento(emitente.fantasia ?? "");
      const semCnpj = await tx.fornecedor.findMany({ where: { cnpj: null } });
      fornecedor =
        semCnpj.find((f) => {
          const n = semAcento(f.nome);
          return n && (nomeNota.startsWith(n) || n.startsWith(nomeNota) || (fantasia && n === fantasia));
        }) ?? null;
      if (fornecedor) {
        fornecedor = await tx.fornecedor.update({ where: { id: fornecedor.id }, data: { cnpj, razaoSocial: fornecedor.razaoSocial ?? emitente.nome } });
      } else {
        fornecedor = await tx.fornecedor.create({
          data: {
            nome: emitente.fantasia || emitente.nome,
            razaoSocial: emitente.nome,
            cnpj,
            telefone: soDigitos(emitente.telefone) || null,
          },
        });
      }
    }

    const dataEmissao = nota.dataEmissao ? new Date(nota.dataEmissao) : null;
    const n = await tx.notaEntrada.create({
      data: {
        chave: nota.chave,
        numero: nota.numero,
        serie: nota.serie,
        dataEmissao: dataEmissao && !Number.isNaN(dataEmissao.getTime()) ? dataEmissao : null,
        fornecedorId: fornecedor.id,
        valorProdutos: nota.totalProdutos,
        valorTotal: nota.totalNota,
        parcelas: nota.parcelas.length ? JSON.stringify(nota.parcelas) : null,
        funcionarioId: logado.id,
      },
    });
    const motivo = `NF ${nota.numero}${nota.serie ? `/${nota.serie}` : ""} — ${fornecedor.nome}`;

    for (const it of nota.itens) {
      const d = porItem.get(it.item)!;
      const qtd = Math.max(0, Math.round(it.quantidade));
      const baseItem = {
        notaId: n.id,
        codigoFornecedor: it.codigo,
        descricao: it.descricao,
        ean: it.ean,
        ncm: it.ncm,
        quantidade: it.quantidade,
        custoUnitario: it.custoUnitario,
        valorTotal: it.valorProdutos,
      };

      if (d.acao === "ignorar") {
        await tx.notaEntradaItem.create({ data: { ...baseItem, lancado: false } });
        resumo.ignorados++;
        continue;
      }

      let produtoId: number;
      if (d.acao === "vincular") {
        const p = await tx.produto.findUnique({ where: { id: d.produtoId } });
        if (!p) throw new Error(`Produto do item ${it.item} não encontrado.`);
        const novoCusto = d.atualizarCusto ? it.custoUnitario : p.custoUnitario;
        const novoPreco = d.precoVenda !== null && d.precoVenda >= 0 ? d.precoVenda : p.precoVenda;
        await tx.produto.update({
          where: { id: p.id },
          data: {
            custoUnitario: novoCusto,
            precoVenda: novoPreco,
            fornecedorId: p.fornecedorId ?? fornecedor.id,
            referencia: p.referencia ?? (normalizarCodigo(p.codigo) === normalizarCodigo(it.codigo) ? null : it.codigo),
            codigoBarras: p.codigoBarras ?? it.ean,
            ncm: p.ncm ?? it.ncm,
            ativo: true,
            aConferir: false,
          },
        });
        if (novoCusto !== p.custoUnitario || novoPreco !== p.precoVenda) {
          await tx.historicoPreco.create({
            data: { produtoId: p.id, custoUnitario: novoCusto, precoVenda: novoPreco, origem: motivo, funcionarioId: logado.id },
          });
        }
        produtoId = p.id;
        resumo.entradas++;
      } else {
        const p = await tx.produto.create({
          data: {
            codigo: d.codigo.trim().toUpperCase(),
            tipo: d.tipo,
            marca: d.marca.trim() || null,
            descricao: d.descricao.trim(),
            referencia: normalizarCodigo(d.codigo) === normalizarCodigo(it.codigo) ? null : it.codigo,
            codigoBarras: it.ean,
            ncm: it.ncm,
            unidade: it.unidade || "UN",
            fornecedorId: fornecedor.id,
            custoUnitario: it.custoUnitario,
            precoVenda: d.precoVenda,
            publico: d.tipo === "RELOGIO" ? "UNISSEX" : null,
            quantidade: 0,
          },
        });
        await tx.historicoPreco.create({
          data: { produtoId: p.id, custoUnitario: it.custoUnitario, precoVenda: d.precoVenda, origem: motivo, funcionarioId: logado.id },
        });
        produtoId = p.id;
        resumo.novos++;
      }

      await movimentarEstoque(tx, {
        produtoId,
        delta: qtd,
        tipo: TipoMovimento.ENTRADA,
        motivo,
        funcionarioId: logado.id,
        custoUnitario: it.custoUnitario,
      });
      await tx.notaEntradaItem.create({ data: { ...baseItem, produtoId } });
      resumo.pecas += qtd;
    }
    return n;
  });

  // as parcelas da nota já aparecem em Contas a pagar
  await gerarContasDasNotas(prisma);

  revalidatePath("/estoque", "layout");
  revalidatePath("/produtos", "layout");
  revalidatePath("/fornecedores", "layout");
  revalidatePath("/financeiro", "layout");
  revalidatePath("/");
  return {
    ok: true,
    notaId: criada.id,
    resumo: `${resumo.pecas} peças lançadas: ${resumo.entradas} somadas em produtos que já existiam, ${resumo.novos} produtos novos${resumo.ignorados ? `, ${resumo.ignorados} itens ignorados` : ""}.`,
  };
}

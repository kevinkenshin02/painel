import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Package, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCnpj, formatCurrency } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { nomeProduto, precisaAtencao, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import { alternarAtivoFornecedor } from "../actions";
import { FornecedorForm } from "../FornecedorForm";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

export default async function FornecedorPage(props: PageProps<"/fornecedores/[id]">) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!id) notFound();
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const f = await prisma.fornecedor.findUnique({
    where: { id },
    include: { produtos: { orderBy: [{ ativo: "desc" }, { marca: "asc" }, { descricao: "asc" }] } },
  });
  if (!f) notFound();

  const ativos = f.produtos.filter((p) => p.ativo);
  const pecas = ativos.reduce((s, p) => s + p.quantidade, 0);
  const valorVenda = ativos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0);

  return (
    <>
      <Cabecalho
        secao="Cadastros · Fornecedor"
        titulo={f.nome}
        descricao={f.razaoSocial ?? undefined}
        acoes={
          <BotaoLink href="/fornecedores" icone={Truck}>
            Fornecedores
          </BotaoLink>
        }
      >
        {f.cnpj && <Chip>CNPJ {formatCnpj(f.cnpj)}</Chip>}
        <Chip>{ativos.length} produtos ativos</Chip>
        <Chip>{pecas} peças</Chip>
        <Chip>
          Em estoque: <span className="numero text-texto">{formatCurrency(valorVenda)}</span>
        </Chip>
        {!f.ativo && <Etiqueta>Inativo</Etiqueta>}
      </Cabecalho>

      <Cartao filete className="p-6">
        <TituloCartao selo="Cadastro" icone={Building2} titulo="Dados do fornecedor" className="mb-6">
          {isAdmin && (
            <>
              <span className="text-xs text-suave">Situação</span>
              <ToggleAtivoButton id={f.id} ativo={f.ativo} action={alternarAtivoFornecedor} />
            </>
          )}
        </TituloCartao>
        <FornecedorForm
          podeEditar={isAdmin}
          fornecedor={{
            id: f.id,
            nome: f.nome,
            razaoSocial: f.razaoSocial,
            cnpj: f.cnpj,
            telefone: f.telefone,
            email: f.email,
            representante: f.representante,
            observacoes: f.observacoes,
          }}
        />
      </Cartao>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Produtos" icone={Package} titulo="Produtos deste fornecedor" />
        </div>
        <div className="overflow-x-auto border-t border-borda">
          <table className="tabela">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th className="direita">Qtd.</th>
                <th className="direita">Preço</th>
              </tr>
            </thead>
            <tbody>
              {f.produtos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-suave">
                    Nenhum produto ligado a este fornecedor.
                  </td>
                </tr>
              )}
              {f.produtos.map((p) => (
                <tr key={p.id} className={p.ativo ? undefined : "opacity-60"}>
                  <td className="numero whitespace-nowrap">
                    <Link href={`/produtos/${p.id}`} className="font-semibold text-texto hover:text-ouro hover:underline">
                      {p.codigo}
                    </Link>
                  </td>
                  <td>{nomeProduto(p)}</td>
                  <td>{TIPO_PRODUTO_LABELS[p.tipo]}</td>
                  <td className={cx("direita numero", precisaAtencao(p) && "font-bold text-perigo")}>{p.quantidade}</td>
                  <td className="direita numero">{formatCurrency(p.precoVenda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>
    </>
  );
}

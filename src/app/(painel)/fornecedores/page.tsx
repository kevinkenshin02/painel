import Link from "next/link";
import { Building2, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCnpj, formatCurrency, formatTelefone } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { FornecedorForm } from "./FornecedorForm";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;
  const [fornecedores, semFornecedor] = await Promise.all([
    prisma.fornecedor.findMany({
      orderBy: { nome: "asc" },
      include: { produtos: { select: { quantidade: true, custoUnitario: true, precoVenda: true, ativo: true } } },
    }),
    prisma.produto.count({ where: { fornecedorId: null, ativo: true } }),
  ]);

  const linhas = fornecedores.map((f) => {
    const ativos = f.produtos.filter((p) => p.ativo);
    return {
      ...f,
      qtdProdutos: ativos.length,
      pecas: ativos.reduce((s, p) => s + p.quantidade, 0),
      valorCusto: ativos.reduce((s, p) => s + p.quantidade * p.custoUnitario, 0),
      valorVenda: ativos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0),
    };
  });

  return (
    <>
      <Cabecalho
        secao="Cadastros"
        titulo="Fornecedores"
        descricao="Quem vende para a loja: CNPJ, contato e representante. A entrada por nota fiscal (XML) cadastra o fornecedor sozinha."
      >
        <Chip>{fornecedores.filter((f) => f.ativo).length} ativos</Chip>
        {semFornecedor > 0 && (
          <Link href="/produtos?fornecedor=0">
            <Chip className="border-aviso/40 text-aviso hover:border-aviso">{semFornecedor} produtos sem fornecedor</Chip>
          </Link>
        )}
      </Cabecalho>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Cadastro" icone={Truck} titulo="Lista de fornecedores" descricao="Clique para abrir a ficha com os produtos." />
        </div>
        <div className="overflow-x-auto border-t border-borda">
          <table className="tabela">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>CNPJ</th>
                <th>Contato</th>
                <th className="direita">Produtos</th>
                <th className="direita">Peças</th>
                {isAdmin && <th className="direita">Estoque a custo</th>}
                <th className="direita">Estoque a preço de venda</th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-suave">
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              )}
              {linhas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <Link href={`/fornecedores/${f.id}`} className="font-semibold text-texto hover:text-ouro hover:underline">
                      {f.nome}
                    </Link>
                    {f.razaoSocial && <div className="text-xs text-suave">{f.razaoSocial}</div>}
                    {!f.ativo && <Etiqueta className="mt-1">Inativo</Etiqueta>}
                  </td>
                  <td className="numero whitespace-nowrap">{f.cnpj ? formatCnpj(f.cnpj) : "—"}</td>
                  <td>
                    {f.representante && <div className="text-texto">{f.representante}</div>}
                    <div className="numero text-xs text-suave">
                      {[f.telefone && formatTelefone(f.telefone), f.email].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="direita numero">{f.qtdProdutos}</td>
                  <td className="direita numero">{f.pecas}</td>
                  {isAdmin && <td className="direita numero">{formatCurrency(f.valorCusto)}</td>}
                  <td className="direita numero destaque">{formatCurrency(f.valorVenda)}</td>
                </tr>
              ))}
            </tbody>
            {linhas.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3}>Totais · {linhas.length} fornecedores</td>
                  <td className="direita numero">{linhas.reduce((s, f) => s + f.qtdProdutos, 0)}</td>
                  <td className="direita numero">{linhas.reduce((s, f) => s + f.pecas, 0)}</td>
                  {isAdmin && <td className="direita numero">{formatCurrency(linhas.reduce((s, f) => s + f.valorCusto, 0))}</td>}
                  <td className="direita numero">{formatCurrency(linhas.reduce((s, f) => s + f.valorVenda, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Cartao>

      {isAdmin && (
        <Cartao filete className="p-6">
          <TituloCartao selo="Novo" icone={Building2} titulo="Cadastrar fornecedor" className="mb-6" />
          <FornecedorForm podeEditar />
        </Cartao>
      )}
    </>
  );
}

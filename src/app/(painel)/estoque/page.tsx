import Link from "next/link";
import { Boxes, History, Package, PackageSearch, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { nomeProduto, precisaAtencao, TIPO_MOVIMENTO_LABELS, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import type { TipoProduto } from "@/generated/prisma/enums";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const dataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(d);

export default async function EstoquePage() {
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [produtos, movimentos] = await Promise.all([
    prisma.produto.findMany({ where: { ativo: true }, orderBy: [{ tipo: "asc" }, { marca: "asc" }] }),
    prisma.movimentoEstoque.findMany({
      orderBy: { criadoEm: "desc" },
      take: 15,
      include: { produto: { select: { id: true, codigo: true, marca: true, descricao: true } }, funcionario: { select: { nome: true } } },
    }),
  ]);

  const grupos = new Map<string, { tipo: TipoProduto; marca: string; produtos: number; pecas: number; custo: number; venda: number }>();
  for (const p of produtos) {
    const chave = `${p.tipo}|${p.marca ?? ""}`;
    const g = grupos.get(chave) ?? { tipo: p.tipo, marca: p.marca ?? "Sem marca", produtos: 0, pecas: 0, custo: 0, venda: 0 };
    g.produtos += 1;
    g.pecas += p.quantidade;
    g.custo += p.quantidade * p.custoUnitario;
    g.venda += p.quantidade * p.precoVenda;
    grupos.set(chave, g);
  }
  const linhas = [...grupos.values()].sort((a, b) => b.venda - a.venda);
  const atencao = produtos.filter(precisaAtencao).sort((a, b) => a.quantidade - b.quantidade);
  const totPecas = linhas.reduce((s, g) => s + g.pecas, 0);
  const totCusto = linhas.reduce((s, g) => s + g.custo, 0);
  const totVenda = linhas.reduce((s, g) => s + g.venda, 0);

  return (
    <>
      <Cabecalho
        secao="Estoque"
        titulo="Posição do estoque"
        descricao="Quanto tem na loja, por tipo e marca. Vender pelo Painel já tira do estoque; cada entrada e ajuste fica registrado."
        acoes={
          <BotaoLink href="/produtos" icone={Package}>
            Lista de produtos
          </BotaoLink>
        }
      >
        <Chip>
          {totPecas} peças em {produtos.length} produtos ativos
        </Chip>
        <Chip>
          A preço de venda: <span className="numero text-texto">{formatCurrency(totVenda)}</span>
        </Chip>
        {isAdmin && (
          <Chip>
            A custo: <span className="numero text-texto">{formatCurrency(totCusto)}</span>
          </Chip>
        )}
        <Chip className={atencao.length > 0 ? "border-perigo/40 text-perigo" : undefined}>
          {atencao.length} zerados ou abaixo do mínimo
        </Chip>
      </Cabecalho>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Cartao filete className="overflow-hidden xl:col-span-3">
          <div className="p-6 pb-5">
            <TituloCartao selo="Resumo" icone={Boxes} titulo="Por tipo e marca" descricao="Ordenado pelo valor em estoque." />
          </div>
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Marca</th>
                  <th className="direita">Produtos</th>
                  <th className="direita">Peças</th>
                  {isAdmin && <th className="direita">A custo</th>}
                  <th className="direita">A preço de venda</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((g) => (
                  <tr key={`${g.tipo}|${g.marca}`}>
                    <td>{TIPO_PRODUTO_LABELS[g.tipo]}</td>
                    <td className="destaque">
                      <Link
                        href={`/produtos?tipo=${g.tipo}${g.marca !== "Sem marca" ? `&marca=${encodeURIComponent(g.marca)}` : ""}`}
                        className="hover:text-ouro hover:underline"
                      >
                        {g.marca}
                      </Link>
                    </td>
                    <td className="direita numero">{g.produtos}</td>
                    <td className="direita numero">{g.pecas}</td>
                    {isAdmin && <td className="direita numero">{formatCurrency(g.custo)}</td>}
                    <td className="direita numero destaque">{formatCurrency(g.venda)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Totais</td>
                  <td className="direita numero">{produtos.length}</td>
                  <td className="direita numero">{totPecas}</td>
                  {isAdmin && <td className="direita numero">{formatCurrency(totCusto)}</td>}
                  <td className="direita numero">{formatCurrency(totVenda)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Cartao>

        <Cartao filete className="overflow-hidden xl:col-span-2">
          <div className="p-6 pb-5">
            <TituloCartao selo="Atenção" icone={TriangleAlert} titulo="Zerados ou abaixo do mínimo">
              {atencao.length > 0 && (
                <BotaoLink href="/produtos?situacao=atencao" tamanho="sm">
                  Ver todos
                </BotaoLink>
              )}
            </TituloCartao>
          </div>
          {atencao.length === 0 ? (
            <div className="px-6 pb-6">
              <Vazio>Nenhum produto zerado.</Vazio>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto border-t border-borda">
              <table className="tabela">
                <tbody>
                  {atencao.slice(0, 40).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/produtos/${p.id}?aba=estoque`} className="text-texto hover:text-ouro hover:underline">
                          {nomeProduto(p)}
                        </Link>
                        <div className="numero text-xs text-suave">{p.codigo}</div>
                      </td>
                      <td className="direita">
                        {p.quantidade <= 0 ? (
                          <Etiqueta tom="perigo">Zerado</Etiqueta>
                        ) : (
                          <Etiqueta tom="aviso">
                            {p.quantidade} / mín. {p.estoqueMinimo}
                          </Etiqueta>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>
      </div>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao
            selo="Movimentações"
            icone={History}
            titulo="Últimas entradas e saídas"
            descricao="Vendas, entradas, ajustes e cadastros de todos os produtos."
          />
        </div>
        {movimentos.length === 0 ? (
          <div className="px-6 pb-6">
            <Vazio>Nenhuma movimentação ainda.</Vazio>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th>Quem</th>
                  <th className="direita">Qtd.</th>
                  <th className="direita">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimentos.map((m) => (
                  <tr key={m.id}>
                    <td className="numero whitespace-nowrap">{dataHora(m.criadoEm)}</td>
                    <td>
                      <Link href={`/produtos/${m.produto.id}?aba=estoque`} className="text-texto hover:text-ouro hover:underline">
                        {nomeProduto(m.produto)}
                      </Link>
                    </td>
                    <td>{TIPO_MOVIMENTO_LABELS[m.tipo]}</td>
                    <td className="max-w-xs truncate">{m.motivo ?? "—"}</td>
                    <td>{m.funcionario?.nome ?? "—"}</td>
                    <td
                      className={cx(
                        "direita numero font-semibold",
                        m.quantidade > 0 ? "text-sucesso" : m.quantidade < 0 ? "text-perigo" : ""
                      )}
                    >
                      {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                    </td>
                    <td className="direita numero destaque">{m.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      {produtos.length === 0 && (
        <Cartao className="p-6">
          <Vazio>
            <PackageSearch className="mx-auto mb-2 h-6 w-6" aria-hidden />
            Nenhum produto ativo. Cadastre em Cadastros → Produtos.
          </Vazio>
        </Cartao>
      )}
    </>
  );
}

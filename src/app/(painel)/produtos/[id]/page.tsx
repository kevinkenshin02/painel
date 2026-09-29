import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeDollarSign, Boxes, Copy, FileText, History, Package, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusPagamento } from "@/generated/prisma/enums";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { MARCAS_SUGERIDAS, nomeProduto, precisaAtencao, TIPO_MOVIMENTO_LABELS, TIPO_PRODUTO_LABELS } from "@/lib/produtos";
import { alternarAtivoProduto } from "../actions";
import { ProdutoForm } from "../ProdutoForm";
import { EstoqueAcoes, ExcluirProduto } from "../EstoqueAcoes";
import { STATUS_PAGAMENTO_LABELS, STATUS_PAGAMENTO_TOM } from "../../vendas/labels";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Abas } from "@/components/ui/Abas";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const dataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(d);

export default async function ProdutoPage(props: PageProps<"/produtos/[id]">) {
  const { id: idParam } = await props.params;
  const { aba = "dados" } = (await props.searchParams) as { aba?: string };
  const id = Number(idParam);
  if (!id) notFound();
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [p, fornecedores, marcasUsadas] = await Promise.all([
    prisma.produto.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        movimentos: { orderBy: { criadoEm: "desc" }, take: 100, include: { funcionario: { select: { nome: true } } } },
        precos: { orderBy: { criadoEm: "desc" }, include: { funcionario: { select: { nome: true } } } },
        vendas: { orderBy: { dataVenda: "desc" }, take: 100, include: { funcionario: { select: { nome: true } } } },
      },
    }),
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.produto.findMany({ where: { marca: { not: null } }, distinct: ["marca"], select: { marca: true } }),
  ]);
  if (!p) notFound();

  const marcas = [...new Set([...MARCAS_SUGERIDAS, ...marcasUsadas.map((m) => m.marca as string)])].sort((a, b) => a.localeCompare(b));
  const margem = p.precoVenda > 0 ? (p.precoVenda - p.custoUnitario) / p.precoVenda : 0;
  const vendidas = p.vendas.filter((v) => v.statusPagamento === StatusPagamento.PAGO);
  const base = `/produtos/${p.id}`;

  return (
    <>
      <Cabecalho
        secao={`Cadastros · Produto · ${TIPO_PRODUTO_LABELS[p.tipo]}`}
        titulo={nomeProduto(p)}
        descricao={`Código ${p.codigo}${p.referencia ? ` · Ref. ${p.referencia}` : ""}${p.codigoBarras ? ` · EAN ${p.codigoBarras}` : ""}`}
        acoes={
          <>
            <BotaoLink href="/produtos" icone={Package}>
              Produtos
            </BotaoLink>
            {isAdmin && (
              <BotaoLink href={`/produtos/novo?copiar=${p.id}`} icone={Copy} title="Cadastrar outra peça a partir desta ficha">
                Duplicar
              </BotaoLink>
            )}
            {p.ativo && p.quantidade > 0 && (
              <BotaoLink href={`/vendas/nova?produto=${p.id}`} variante="primario" icone={ShoppingCart}>
                Vender
              </BotaoLink>
            )}
          </>
        }
      >
        <Chip className={precisaAtencao(p) ? "border-perigo/40 text-perigo" : undefined}>
          {p.quantidade} {p.unidade === "UN" ? (p.quantidade === 1 ? "peça" : "peças") : p.unidade} em estoque
        </Chip>
        <Chip>
          Preço: <span className="numero text-texto">{formatCurrency(p.precoVenda)}</span>
        </Chip>
        {isAdmin && <Chip>Margem {formatPercent(margem)}</Chip>}
        {p.fornecedor && (
          <Link href={`/fornecedores/${p.fornecedor.id}`}>
            <Chip className="hover:border-borda-forte">{p.fornecedor.nome}</Chip>
          </Link>
        )}
        {p.localizacao && <Chip>{p.localizacao}</Chip>}
        {!p.ativo && <Etiqueta>Inativo</Etiqueta>}
      </Cabecalho>

      <Abas
        abas={[
          { href: `${base}?aba=dados`, rotulo: "Dados cadastrais", icone: FileText, ativo: aba === "dados" },
          ...(isAdmin
            ? [{ href: `${base}?aba=precos`, rotulo: "Histórico de preços", icone: BadgeDollarSign, ativo: aba === "precos", contagem: p.precos.length }]
            : []),
          { href: `${base}?aba=estoque`, rotulo: "Estoque", icone: Boxes, ativo: aba === "estoque", contagem: p.movimentos.length },
          { href: `${base}?aba=vendas`, rotulo: "Vendas", icone: ShoppingCart, ativo: aba === "vendas", contagem: p.vendas.length },
        ]}
      />

      {aba === "dados" && (
        <Cartao filete className="p-6">
          <TituloCartao selo="Ficha" icone={FileText} titulo="Dados do produto" className="mb-6">
            {isAdmin && (
              <>
                <span className="text-xs text-suave">Situação</span>
                <ToggleAtivoButton id={p.id} ativo={p.ativo} action={alternarAtivoProduto} />
              </>
            )}
          </TituloCartao>
          <ProdutoForm
            podeEditar={isAdmin}
            fornecedores={fornecedores}
            marcas={marcas}
            produto={{
              id: p.id,
              tipo: p.tipo,
              codigo: p.codigo,
              codigoBarras: p.codigoBarras,
              referencia: p.referencia,
              marca: p.marca,
              descricao: p.descricao,
              cor: p.cor,
              publico: p.publico,
              mecanismo: p.mecanismo,
              grau: p.grau,
              ncm: p.ncm,
              unidade: p.unidade,
              localizacao: p.localizacao,
              fornecedorId: p.fornecedorId,
              estoqueMinimo: p.estoqueMinimo,
              custoUnitario: isAdmin ? p.custoUnitario : 0,
              precoVenda: p.precoVenda,
              observacoes: p.observacoes,
            }}
          />
          {isAdmin && (
            <div className="mt-6 flex justify-end border-t border-borda pt-5">
              <ExcluirProduto produtoId={p.id} />
            </div>
          )}
        </Cartao>
      )}

      {aba === "precos" && isAdmin && (
        <Cartao filete className="overflow-hidden">
          <div className="p-6 pb-5">
            <TituloCartao
              selo="Preços"
              icone={History}
              titulo="Histórico de preços"
              descricao="Cada mudança de custo ou preço fica guardada, com quem mudou."
            />
          </div>
          <div className="overflow-x-auto border-t border-borda">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Origem</th>
                  <th>Quem</th>
                  <th className="direita">Custo</th>
                  <th className="direita">Preço</th>
                  <th className="direita">Margem</th>
                </tr>
              </thead>
              <tbody>
                {p.precos.map((h) => (
                  <tr key={h.id}>
                    <td className="numero whitespace-nowrap">{dataHora(h.criadoEm)}</td>
                    <td>{h.origem ?? "—"}</td>
                    <td>{h.funcionario?.nome ?? "—"}</td>
                    <td className="direita numero">{formatCurrency(h.custoUnitario)}</td>
                    <td className="direita numero destaque">{formatCurrency(h.precoVenda)}</td>
                    <td className="direita numero">
                      {h.precoVenda > 0 ? formatPercent((h.precoVenda - h.custoUnitario) / h.precoVenda) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>
      )}

      {aba === "estoque" && (
        <>
          {isAdmin && (
            <Cartao filete className="p-6">
              <TituloCartao
                selo="Movimentar"
                icone={Boxes}
                titulo="Entrada e ajuste"
                descricao="Tudo fica registrado abaixo. Para uma nota inteira, a entrada por XML vem na próxima etapa."
                className="mb-5"
              />
              <EstoqueAcoes produtoId={p.id} quantidadeAtual={p.quantidade} custoAtual={p.custoUnitario} />
            </Cartao>
          )}
          <Cartao filete className="overflow-hidden">
            <div className="p-6 pb-5">
              <TituloCartao selo="Movimentações" icone={History} titulo="Entradas e saídas" descricao="As 100 mais recentes." />
            </div>
            <div className="overflow-x-auto border-t border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Quem</th>
                    <th className="direita">Qtd.</th>
                    <th className="direita">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {p.movimentos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-suave">
                        Nenhuma movimentação.
                      </td>
                    </tr>
                  )}
                  {p.movimentos.map((m) => (
                    <tr key={m.id}>
                      <td className="numero whitespace-nowrap">{dataHora(m.criadoEm)}</td>
                      <td>{TIPO_MOVIMENTO_LABELS[m.tipo]}</td>
                      <td className="max-w-md">{m.motivo ?? "—"}</td>
                      <td>{m.funcionario?.nome ?? "—"}</td>
                      <td className={cx("direita numero font-semibold", m.quantidade > 0 ? "text-sucesso" : m.quantidade < 0 ? "text-perigo" : "")}>
                        {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                      </td>
                      <td className="direita numero destaque">{m.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Cartao>
        </>
      )}

      {aba === "vendas" && (
        <Cartao filete className="overflow-hidden">
          <div className="p-6 pb-5">
            <TituloCartao selo="Vendas" icone={ShoppingCart} titulo="Vendas deste produto" />
          </div>
          {p.vendas.length === 0 ? (
            <div className="px-6 pb-6">
              <Vazio>Ainda não foi vendido pelo Painel.</Vazio>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Vendido por</th>
                    <th>Situação</th>
                    <th className="direita">Qtd.</th>
                    <th className="direita">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {p.vendas.map((v) => (
                    <tr key={v.id}>
                      <td className="numero">{formatDate(v.dataVenda)}</td>
                      <td>
                        {v.clienteId ? (
                          <Link href={`/clientes/${v.clienteId}`} className="text-texto hover:text-ouro hover:underline">
                            {v.clienteNome ?? "Cliente"}
                          </Link>
                        ) : (
                          (v.clienteNome ?? "—")
                        )}
                      </td>
                      <td>{v.funcionario?.nome ?? "—"}</td>
                      <td>
                        <Etiqueta tom={STATUS_PAGAMENTO_TOM[v.statusPagamento]}>{STATUS_PAGAMENTO_LABELS[v.statusPagamento]}</Etiqueta>
                      </td>
                      <td className="direita numero">{v.quantidade}</td>
                      <td className="direita numero destaque">{formatCurrency(v.valorVendido)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}>Pagas · {vendidas.length}</td>
                    <td className="direita numero">{vendidas.reduce((s, v) => s + v.quantidade, 0)}</td>
                    <td className="direita numero">{formatCurrency(vendidas.reduce((s, v) => s + v.valorVendido, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Cartao>
      )}
    </>
  );
}

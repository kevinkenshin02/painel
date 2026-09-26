import Link from "next/link";
import { ClipboardCheck, Package, Scale } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TipoMovimento } from "@/generated/prisma/enums";
import { formatCurrency } from "@/lib/format";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { nomeProduto, TIPO_MOVIMENTO_LABELS } from "@/lib/produtos";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export const dynamic = "force-dynamic";

const dataHora = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(d);

export default async function AjustesPage() {
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;
  const movimentos = await prisma.movimentoEstoque.findMany({
    where: { tipo: { in: [TipoMovimento.AJUSTE, TipoMovimento.CONFERENCIA] } },
    orderBy: { criadoEm: "desc" },
    take: 300,
    include: {
      produto: { select: { id: true, codigo: true, marca: true, descricao: true, custoUnitario: true } },
      funcionario: { select: { nome: true } },
    },
  });

  const entrou = movimentos.filter((m) => m.quantidade > 0).reduce((s, m) => s + m.quantidade, 0);
  const saiu = movimentos.filter((m) => m.quantidade < 0).reduce((s, m) => s + m.quantidade, 0);
  const valor = movimentos.reduce((s, m) => s + m.quantidade * m.produto.custoUnitario, 0);

  return (
    <>
      <Cabecalho
        secao="Estoque"
        titulo="Ajustes e conferências"
        descricao="Toda correção de estoque feita à mão ou pela conferência da vitrine, com quem fez e o motivo."
        acoes={
          <>
            <BotaoLink href="/estoque" icone={Package}>
              Posição do estoque
            </BotaoLink>
            <BotaoLink href="/estoque/conferencia" variante="primario" icone={ClipboardCheck}>
              Conferir a vitrine
            </BotaoLink>
          </>
        }
      >
        <Chip>{movimentos.length} ajustes</Chip>
        <Chip className="text-sucesso">+{entrou} peças</Chip>
        <Chip className="text-perigo">{saiu} peças</Chip>
        {isAdmin && (
          <Chip>
            Diferença a custo: <span className={cx("numero", valor < 0 ? "text-perigo" : "text-texto")}>{formatCurrency(valor)}</span>
          </Chip>
        )}
      </Cabecalho>

      <Cartao filete className="overflow-hidden">
        <div className="p-6 pb-5">
          <TituloCartao selo="Histórico" icone={Scale} titulo="Ajustes de estoque" descricao="Os 300 mais recentes." />
        </div>
        {movimentos.length === 0 ? (
          <div className="px-6 pb-6">
            <Vazio>Nenhum ajuste ainda.</Vazio>
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
                  {isAdmin && <th className="direita">A custo</th>}
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
                      <div className="numero text-xs text-suave">{m.produto.codigo}</div>
                    </td>
                    <td>{TIPO_MOVIMENTO_LABELS[m.tipo]}</td>
                    <td className="max-w-xs">{m.motivo ?? "—"}</td>
                    <td>{m.funcionario?.nome ?? "—"}</td>
                    <td className={cx("direita numero font-semibold", m.quantidade > 0 ? "text-sucesso" : "text-perigo")}>
                      {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                    </td>
                    <td className="direita numero destaque">{m.saldo}</td>
                    {isAdmin && <td className="direita numero">{formatCurrency(m.quantidade * m.produto.custoUnitario)}</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5}>Totais</td>
                  <td className="direita numero">{entrou + saiu > 0 ? `+${entrou + saiu}` : entrou + saiu}</td>
                  <td />
                  {isAdmin && <td className="direita numero">{formatCurrency(valor)}</td>}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Cartao>
    </>
  );
}

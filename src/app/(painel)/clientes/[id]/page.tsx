import { notFound } from "next/navigation";
import { ClipboardList, Eye, History, MessageCircle, Plus, ShoppingCart, UserPlus, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusOS, StatusPagamento } from "@/generated/prisma/enums";
import { formatCpf, formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import { montarLinkWhatsApp } from "@/lib/whatsapp";
import { alternarAtivoCliente, excluirReceita } from "../actions";
import { ClienteForm } from "../ClienteForm";
import { ReceitaForm } from "../ReceitaForm";
import { COLUNAS_RECEITA } from "../receita";
import { CANAL_ORIGEM_LABELS, CATEGORIA_VENDA_LABELS, STATUS_PAGAMENTO_LABELS, STATUS_PAGAMENTO_TOM } from "../../vendas/labels";
import { STATUS_OS_LABELS, STATUS_OS_TOM, TIPO_SERVICO_LABELS } from "../../ordens-servico/labels";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { ToggleAtivoButton } from "@/components/ToggleAtivoButton";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Abas } from "@/components/ui/Abas";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao, TituloCartao, Vazio } from "@/components/ui/Cartao";
import { Chip, Etiqueta } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

type ReceitaLinha = Record<string, string | null | Date | number>;

function ReceitaCartao({ r }: { r: ReceitaLinha & { id: number; criadoEm: Date; dataReceita: Date | null } }) {
  const valor = (k: string) => (r[k] as string | null) || "—";
  return (
    <div className="rounded-xl border border-borda bg-superficie-2/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-texto">
          Receita {r.dataReceita ? `de ${formatDate(r.dataReceita)}` : `guardada em ${formatDate(r.criadoEm)}`}
          {r.tipoLente ? <span className="font-normal text-suave"> · {String(r.tipoLente)}</span> : null}
          {r.medico ? <span className="font-normal text-suave"> · Dr(a). {String(r.medico)}</span> : null}
        </div>
        <ConfirmDeleteForm id={r.id} action={excluirReceita} confirmMessage="Excluir esta receita?" compacto />
      </div>
      <div className="overflow-x-auto">
        <table className="tabela">
          <thead>
            <tr>
              <th />
              {COLUNAS_RECEITA.map(([, rotulo]) => (
                <th key={rotulo} className="text-center!">
                  {rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["od", "oe"] as const).map((olho) => (
              <tr key={olho}>
                <td className="destaque">{olho === "od" ? "OD" : "OE"}</td>
                {COLUNAS_RECEITA.map(([campo]) => (
                  <td key={campo} className="numero text-center">
                    {valor(`${olho}${campo}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-texto-2">
        {r.dp ? <Chip>D.P.: {String(r.dp)}</Chip> : null}
        {r.observacoes ? <Chip>{String(r.observacoes)}</Chip> : null}
      </div>
    </div>
  );
}

export default async function ClientePage(props: PageProps<"/clientes/[id]">) {
  const { id: idParam } = await props.params;
  const { aba = "dados" } = (await props.searchParams) as { aba?: string };
  const id = Number(idParam);
  if (!id) notFound();

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      receitas: { orderBy: { criadoEm: "desc" } },
      ordens: { orderBy: { dataEntrada: "desc" } },
      vendas: { orderBy: { dataVenda: "desc" }, include: { funcionario: { select: { nome: true } } } },
    },
  });
  if (!cliente) notFound();

  const pagas = cliente.vendas.filter((v) => v.statusPagamento === StatusPagamento.PAGO);
  const entregues = cliente.ordens.filter((o) => o.status === StatusOS.ENTREGUE);
  const totalGasto = pagas.reduce((s, v) => s + v.valorVendido, 0) + entregues.reduce((s, o) => s + o.valorTotal, 0);
  const base = `/clientes/${cliente.id}`;

  return (
    <>
      <Cabecalho
        secao={`Cadastros · Cliente nº ${cliente.id}`}
        titulo={cliente.nome}
        descricao={`Cliente desde ${formatDate(cliente.criadoEm)} · ${cliente.ordens.length} OS · ${pagas.length} compras · ${formatCurrency(totalGasto)} no total`}
        acoes={
          <>
            {cliente.telefone && (
              <a
                href={montarLinkWhatsApp(cliente.telefone, `Olá ${cliente.nome.split(" ")[0]}! Aqui é da Tanaka Ótica e Relojoaria.`)}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-sucesso/35 bg-sucesso-fundo px-4 text-[13px] font-semibold text-sucesso transition hover:border-sucesso/70"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            )}
            <BotaoLink href={`/clientes/novo?copiar=${cliente.id}`} icone={UserPlus} title="Cadastrar alguém da família com o mesmo telefone e endereço">
              Mesma família
            </BotaoLink>
            <BotaoLink href={`/vendas/nova?cliente=${cliente.id}`} icone={ShoppingCart}>
              Nova venda
            </BotaoLink>
            <BotaoLink href={`/ordens-servico/nova?cliente=${cliente.id}`} variante="primario" icone={Plus}>
              Nova OS
            </BotaoLink>
          </>
        }
      >
        <Chip>{cliente.telefone ? formatTelefone(cliente.telefone) : "Sem telefone"}</Chip>
        {cliente.cpf && <Chip>CPF {formatCpf(cliente.cpf)}</Chip>}
        {cliente.nascimento && <Chip>Nascimento {formatDate(cliente.nascimento)}</Chip>}
        {cliente.origem && <Chip>Conheceu por: {CANAL_ORIGEM_LABELS[cliente.origem]}</Chip>}
        {!cliente.ativo && <Etiqueta>Inativo</Etiqueta>}
      </Cabecalho>

      <Abas
        abas={[
          { href: `${base}?aba=dados`, rotulo: "Dados", icone: UserRound, ativo: aba === "dados" },
          { href: `${base}?aba=receitas`, rotulo: "Receitas", icone: Eye, ativo: aba === "receitas", contagem: cliente.receitas.length },
          {
            href: `${base}?aba=historico`,
            rotulo: "Histórico",
            icone: History,
            ativo: aba === "historico",
            contagem: cliente.ordens.length + cliente.vendas.length,
          },
        ]}
      />

      {aba === "dados" && (
        <Cartao filete className="p-6">
          <TituloCartao selo="Cadastro" icone={UserRound} titulo="Dados do cliente" className="mb-6">
            <span className="text-xs text-suave">Situação</span>
            <ToggleAtivoButton id={cliente.id} ativo={cliente.ativo} action={alternarAtivoCliente} />
          </TituloCartao>
          <ClienteForm
            cliente={{
              id: cliente.id,
              nome: cliente.nome,
              telefone: cliente.telefone,
              cpf: cliente.cpf,
              email: cliente.email,
              nascimento: cliente.nascimento ? cliente.nascimento.toISOString().slice(0, 10) : null,
              endereco: cliente.endereco,
              origem: cliente.origem,
              observacoes: cliente.observacoes,
            }}
          />
        </Cartao>
      )}

      {aba === "receitas" && (
        <>
          <Cartao filete className="p-6">
            <TituloCartao
              selo="Nova receita"
              icone={Eye}
              titulo="Guardar receita de óculos"
              descricao="Os mesmos campos do Orçamento de óculos do site — dá para copiar o que o cliente mandou no WhatsApp."
              className="mb-6"
            />
            <ReceitaForm clienteId={cliente.id} />
          </Cartao>
          <Cartao filete className="p-6">
            <TituloCartao selo="Guardadas" icone={History} titulo="Receitas do cliente" descricao="A mais recente primeiro." className="mb-5" />
            <div className="flex flex-col gap-4">
              {cliente.receitas.length === 0 && <Vazio>Nenhuma receita guardada ainda.</Vazio>}
              {cliente.receitas.map((r) => (
                <ReceitaCartao key={r.id} r={r as unknown as ReceitaLinha & { id: number; criadoEm: Date; dataReceita: Date | null }} />
              ))}
            </div>
          </Cartao>
        </>
      )}

      {aba === "historico" && (
        <>
          <Cartao filete className="overflow-hidden">
            <div className="p-6 pb-5">
              <TituloCartao selo="Serviços" icone={ClipboardList} titulo="Ordens de serviço" />
            </div>
            <div className="overflow-x-auto border-t border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Entrada</th>
                    <th>Serviço</th>
                    <th>Situação</th>
                    <th className="direita">Total</th>
                    <th className="direita">Falta pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.ordens.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-suave">
                        Nenhuma OS.
                      </td>
                    </tr>
                  )}
                  {cliente.ordens.map((o) => (
                    <tr key={o.id}>
                      <td className="destaque numero">
                        <a href={`/recibo/${o.id}`} target="_blank" rel="noopener" className="hover:text-ouro hover:underline">
                          #{o.id}
                        </a>
                      </td>
                      <td className="numero">{formatDate(o.dataEntrada)}</td>
                      <td>
                        <div className="text-texto">{TIPO_SERVICO_LABELS[o.tipoServico]}</div>
                        <div className="max-w-md truncate text-xs text-suave">{o.descricao}</div>
                      </td>
                      <td>
                        <Etiqueta tom={STATUS_OS_TOM[o.status]}>{STATUS_OS_LABELS[o.status]}</Etiqueta>
                      </td>
                      <td className="direita numero">{formatCurrency(o.valorTotal)}</td>
                      <td className="direita numero">{formatCurrency(o.valorTotal - o.sinalPago)}</td>
                    </tr>
                  ))}
                </tbody>
                {cliente.ordens.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Totais · {cliente.ordens.length} OS</td>
                      <td className="direita numero">{formatCurrency(cliente.ordens.reduce((s, o) => s + o.valorTotal, 0))}</td>
                      <td className="direita numero">
                        {formatCurrency(cliente.ordens.reduce((s, o) => s + o.valorTotal - o.sinalPago, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Cartao>

          <Cartao filete className="overflow-hidden">
            <div className="p-6 pb-5">
              <TituloCartao selo="Compras" icone={ShoppingCart} titulo="Compras" />
            </div>
            <div className="overflow-x-auto border-t border-borda">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Vendido por</th>
                    <th>Situação</th>
                    <th className="direita">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.vendas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-suave">
                        Nenhuma compra registrada.
                      </td>
                    </tr>
                  )}
                  {cliente.vendas.map((v) => (
                    <tr key={v.id}>
                      <td className="numero">{formatDate(v.dataVenda)}</td>
                      <td>
                        <div className="text-texto">{v.descricao}</div>
                        <div className="text-xs text-suave">{CATEGORIA_VENDA_LABELS[v.categoria]}</div>
                      </td>
                      <td>{v.funcionario?.nome ?? "—"}</td>
                      <td>
                        <Etiqueta tom={STATUS_PAGAMENTO_TOM[v.statusPagamento]}>{STATUS_PAGAMENTO_LABELS[v.statusPagamento]}</Etiqueta>
                      </td>
                      <td className="direita numero destaque">{formatCurrency(v.valorVendido)}</td>
                    </tr>
                  ))}
                </tbody>
                {pagas.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={4}>Total pago · {pagas.length} compras</td>
                      <td className="direita numero">{formatCurrency(pagas.reduce((s, v) => s + v.valorVendido, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Cartao>
        </>
      )}
    </>
  );
}

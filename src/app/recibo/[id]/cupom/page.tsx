import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import { TIPO_SERVICO_LABELS } from "../../../(painel)/ordens-servico/labels";
import { CupomTermico, type LarguraPapel } from "./CupomTermico";

export const dynamic = "force-dynamic";

function Linha({ rotulo, valor, forte }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span>{rotulo}</span>
      <span className={forte ? "text-right font-bold" : "text-right"}>{valor}</span>
    </div>
  );
}

function Via({
  titulo,
  loja,
  os,
  restante,
  paraLoja,
}: {
  titulo: string;
  loja: { nome: string; endereco: string; whatsapp: string };
  os: {
    id: number;
    clienteNome: string;
    clienteWhatsapp: string;
    tipoServico: keyof typeof TIPO_SERVICO_LABELS;
    dataEntrada: Date;
    prazoPrometido: Date;
    descricao: string;
    observacoes: string | null;
    valorTotal: number;
    sinalPago: number;
  };
  restante: number;
  paraLoja?: boolean;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <header className="text-center leading-tight">
        <div className="text-[1.15em] font-extrabold tracking-wide uppercase">{loja.nome}</div>
        <div className="mt-0.5">{loja.endereco}</div>
        <div>WhatsApp {loja.whatsapp}</div>
      </header>

      <div className="border-t border-dashed border-black" />

      <div className="text-center leading-tight">
        <div className="font-bold tracking-[0.2em] uppercase">Ordem de serviço</div>
        <div className="text-[2.4em] leading-none font-extrabold">#{os.id}</div>
        <div className="mt-1 inline-block border border-black px-2 py-0.5 font-bold uppercase">{titulo}</div>
      </div>

      <div className="border-t border-dashed border-black" />

      <div className="flex flex-col gap-0.5">
        <div className="font-bold">{os.clienteNome}</div>
        <div>{formatTelefone(os.clienteWhatsapp)}</div>
      </div>

      <div className="flex flex-col gap-0.5">
        <Linha rotulo="Serviço" valor={TIPO_SERVICO_LABELS[os.tipoServico]} />
        <Linha rotulo="Entrada" valor={formatDate(os.dataEntrada)} />
        <Linha rotulo="Prazo" valor={formatDate(os.prazoPrometido)} forte />
      </div>

      <div>
        <div className="font-bold uppercase">Descrição</div>
        <div className="whitespace-pre-line">{os.descricao}</div>
        {os.observacoes && <div className="mt-1 whitespace-pre-line">Obs.: {os.observacoes}</div>}
      </div>

      <div className="border-t border-dashed border-black" />

      <div className="flex flex-col gap-0.5">
        <Linha rotulo="Valor total" valor={formatCurrency(os.valorTotal)} />
        <Linha rotulo="Sinal pago" valor={formatCurrency(os.sinalPago)} />
        <Linha rotulo="Falta pagar" valor={restante > 0 ? formatCurrency(restante) : "Quitado"} forte />
      </div>

      <div className="border-t border-dashed border-black" />

      {paraLoja ? (
        <div className="flex flex-col gap-4 pt-1">
          <div>Retirado em ____/____/______</div>
          <div>
            <div className="border-b border-black pt-5" />
            <div className="mt-0.5 text-center">Assinatura do cliente</div>
          </div>
        </div>
      ) : (
        <div className="text-center leading-snug">
          Guarde este comprovante. Acompanhe o serviço em <strong>tanakaotica.com.br/consulta-os</strong> com o nº <strong>#{os.id}</strong> e o
          telefone cadastrado.
        </div>
      )}
    </section>
  );
}

export default async function CupomOSPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ papel?: string }>;
}) {
  const { id: idParam } = await params;
  const { papel } = await searchParams;
  const id = Number(idParam);
  if (!id) notFound();

  const [os, config] = await Promise.all([
    prisma.ordemServico.findUnique({ where: { id } }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
  ]);
  if (!os) notFound();

  const loja = {
    nome: "Tanaka Ótica & Relojoaria",
    endereco: config?.endereco || "Rua São Bento, 545 — Lojas 21 e 22 · Centro, São Paulo - SP",
    whatsapp: config?.whatsapp || "(11) 96077-6721",
  };
  const restante = os.valorTotal - os.sinalPago;
  const largura: LarguraPapel = papel === "58" ? 58 : 80;

  return (
    <CupomTermico osId={os.id} largura={largura} papelNaUrl={papel === "58" || papel === "80"}>
      <Via titulo="Via do cliente" loja={loja} os={os} restante={restante} />
      <Via titulo="Via da loja" loja={loja} os={os} restante={restante} paraLoja />
    </CupomTermico>
  );
}

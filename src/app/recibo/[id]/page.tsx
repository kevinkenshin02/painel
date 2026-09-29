import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import { STATUS_OS_LABELS, TIPO_SERVICO_LABELS } from "../../(painel)/ordens-servico/labels";
import { PrintButton } from "./PrintButton";
import { ReceiptText } from "lucide-react";
import { BotaoLink } from "@/components/ui/Botao";

export const dynamic = "force-dynamic";

function Info({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.12em] text-suave uppercase">{rotulo}</div>
      <div className="mt-0.5 font-semibold text-texto">{children}</div>
    </div>
  );
}

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) notFound();

  const [os, config] = await Promise.all([
    prisma.ordemServico.findUnique({ where: { id } }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
  ]);

  if (!os) notFound();

  const endereco = config?.endereco || "Rua São Bento, 545 — Lojas 21 e 22 · Centro, São Paulo - SP";
  const whatsapp = config?.whatsapp || "(11) 96077-6721";
  const restante = os.valorTotal - os.sinalPago;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-5 px-6 py-10 print:max-w-none print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-titulo text-xl font-bold text-texto">Comprovante da OS #{os.id}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoLink href={`/recibo/${os.id}/cupom`} icone={ReceiptText}>
            Impressora de cupom
          </BotaoLink>
          <PrintButton />
        </div>
      </div>

      {/* papel: sempre claro, na tela e na impressão */}
      <div data-theme="light" className="flex flex-col gap-5 rounded-2xl bg-superficie p-8 text-texto shadow-cartao print:rounded-none print:p-0 print:shadow-none">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/marca/logo-tanaka-papel.png"
            alt="Tanaka Ótica e Relojoaria"
            width={760}
            height={155}
            unoptimized
            className="h-auto w-64"
          />
          <div className="text-xs text-suave">{endereco}</div>
          <div className="text-xs text-suave">WhatsApp {whatsapp} · tanakaotica.com.br</div>
        </div>

        <div className="border-t border-dashed border-borda-forte" />

        <div className="text-center">
          <div className="text-[11px] font-bold tracking-[0.18em] text-ouro uppercase">Ordem de serviço</div>
          <div className="numero font-titulo text-4xl font-bold">#{os.id}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Info rotulo="Cliente">{os.clienteNome}</Info>
          <Info rotulo="Telefone">{formatTelefone(os.clienteWhatsapp)}</Info>
          <Info rotulo="Serviço">{TIPO_SERVICO_LABELS[os.tipoServico]}</Info>
          <Info rotulo="Situação">{STATUS_OS_LABELS[os.status]}</Info>
          <Info rotulo="Entrada">{formatDate(os.dataEntrada)}</Info>
          <Info rotulo="Prazo prometido">{formatDate(os.prazoPrometido)}</Info>
        </div>

        <div className="border-t border-dashed border-borda-forte" />

        <div className="text-sm">
          <div className="text-[10px] font-bold tracking-[0.12em] text-suave uppercase">Descrição</div>
          <div className="mt-0.5 whitespace-pre-line">{os.descricao}</div>
          {os.observacoes && <div className="mt-2 text-xs whitespace-pre-line text-suave">Obs.: {os.observacoes}</div>}
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-borda bg-superficie-2 p-4 text-sm">
          <Info rotulo="Valor total">
            <span className="numero">{formatCurrency(os.valorTotal)}</span>
          </Info>
          <Info rotulo="Sinal pago">
            <span className="numero">{formatCurrency(os.sinalPago)}</span>
          </Info>
          <Info rotulo="Falta pagar">
            <span className={restante > 0 ? "numero text-perigo" : "numero text-sucesso"}>
              {restante > 0 ? formatCurrency(restante) : "Quitado"}
            </span>
          </Info>
        </div>

        <div className="rounded-xl border border-borda p-4 text-center text-xs leading-relaxed text-texto-2">
          Guarde este comprovante. Acompanhe o seu serviço em <strong>tanakaotica.com.br/consulta-os</strong> com o número{" "}
          <strong>#{os.id}</strong> e o telefone cadastrado.
        </div>
      </div>
    </div>
  );
}

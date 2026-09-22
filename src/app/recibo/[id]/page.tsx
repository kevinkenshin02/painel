import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatTelefone } from "@/lib/format";
import {
  STATUS_OS_LABELS,
  TIPO_SERVICO_LABELS,
} from "../../(painel)/ordens-servico/labels";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) notFound();

  const [os, config] = await Promise.all([
    prisma.ordemServico.findUnique({ where: { id } }),
    prisma.configuracao.findUnique({ where: { id: 1 } }),
  ]);

  if (!os) notFound();

  const nomeLoja = config?.nomeLoja || "Óticas Tanaka e Relojoaria";
  const endereco = config?.endereco || "";
  const whatsapp = config?.whatsapp || "";
  const restante = os.valorTotal - os.sinalPago;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-6 px-6 py-10 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-[#221d19]">Comprovante da OS #{os.id}</h1>
        <PrintButton />
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-[#eee3d3] bg-white p-8 print:rounded-none print:border-0 print:p-0">
        <div className="text-center">
          <div className="text-lg font-extrabold tracking-wide text-[#221d19]">{nomeLoja}</div>
          {endereco && <div className="text-xs text-[#8a8078]">{endereco}</div>}
          {whatsapp && <div className="text-xs text-[#8a8078]">{whatsapp}</div>}
        </div>

        <div className="border-t border-dashed border-[#eee3d3]" />

        <div className="text-center">
          <div className="text-xs font-semibold tracking-wide text-[#8a8078] uppercase">
            Ordem de serviço
          </div>
          <div className="text-3xl font-extrabold text-[#221d19]">#{os.id}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Cliente</div>
            <div className="font-medium text-[#221d19]">{os.clienteNome}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Telefone</div>
            <div className="font-medium text-[#221d19]">{formatTelefone(os.clienteWhatsapp)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Serviço</div>
            <div className="font-medium text-[#221d19]">{TIPO_SERVICO_LABELS[os.tipoServico]}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Status</div>
            <div className="font-medium text-[#221d19]">{STATUS_OS_LABELS[os.status]}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Entrada</div>
            <div className="font-medium text-[#221d19]">{formatDate(os.dataEntrada)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Prazo prometido</div>
            <div className="font-medium text-[#221d19]">{formatDate(os.prazoPrometido)}</div>
          </div>
        </div>

        <div className="border-t border-dashed border-[#eee3d3]" />

        <div className="text-sm text-[#221d19]">
          <div className="text-xs font-semibold text-[#8a8078]">Descrição</div>
          <div>{os.descricao}</div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Valor total</div>
            <div className="font-bold text-[#221d19]">{formatCurrency(os.valorTotal)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Sinal pago</div>
            <div className="font-bold text-[#221d19]">{formatCurrency(os.sinalPago)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a8078]">Restante</div>
            <div className="font-bold text-[#c0472b]">{formatCurrency(restante)}</div>
          </div>
        </div>

        <div className="border-t border-dashed border-[#eee3d3]" />

        <div className="rounded-lg bg-[#f7f1e6] p-4 text-center text-xs text-[#4a4038] print:bg-transparent print:border print:border-[#eee3d3]">
          Guarde este comprovante. Para consultar o status do seu serviço, acesse a página de
          consulta e informe o número <strong>#{os.id}</strong> e o telefone cadastrado.
        </div>
      </div>
    </div>
  );
}

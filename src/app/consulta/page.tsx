import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { PhoneInput } from "@/components/PhoneInput";
import {
  STATUS_OS_BADGE_CLASSES,
  STATUS_OS_LABELS,
  TIPO_SERVICO_LABELS,
} from "../(painel)/ordens-servico/labels";

export const dynamic = "force-dynamic";

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, "");
}

async function buscarOrdemServico(osId: string, telefone: string) {
  const id = Number(osId);
  if (!id || !telefone) return null;

  const os = await prisma.ordemServico.findUnique({ where: { id } });
  if (!os) return null;

  const telefoneDigitado = normalizarTelefone(telefone);
  const telefoneCadastrado = normalizarTelefone(os.clienteWhatsapp);
  if (!telefoneDigitado || telefoneDigitado !== telefoneCadastrado) return null;

  return os;
}

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ os?: string; telefone?: string }>;
}) {
  const params = await searchParams;
  const buscou = Boolean(params.os && params.telefone);
  const resultado = buscou
    ? await buscarOrdemServico(params.os!, params.telefone!)
    : null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <div className="mx-auto mb-3 h-9 w-9">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f6b23b] to-[#e0472e]" />
            <div className="absolute top-1.5 left-1 h-6 w-1 bg-[#221d19]" />
            <div className="absolute top-1.5 right-1 h-6 w-1 bg-[#221d19]" />
            <div className="absolute top-1 -left-0.5 h-[3px] w-10 bg-[#221d19]" />
            <div className="absolute top-3 left-0 h-[3px] w-9 bg-[#221d19]" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-[#221d19]">Acompanhar minha ordem de serviço</h1>
        <p className="mt-1 text-sm text-[#8a8078]">
          Digite o número da OS (informado na retirada) e o telefone cadastrado.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-col gap-4 rounded-xl border border-[#eee3d3] bg-white p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">Número da OS</span>
          <input
            type="text"
            name="os"
            required
            defaultValue={params.os}
            inputMode="numeric"
            className="rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-semibold text-[#8a8078]">Telefone/WhatsApp cadastrado</span>
          <PhoneInput
            name="telefone"
            required
            defaultValue={params.telefone}
            placeholder="(11) 91234-5678"
            className="rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
        >
          Consultar
        </button>
      </form>

      {buscou && !resultado && (
        <div className="rounded-xl border border-[#eee3d3] bg-white p-6 text-center text-sm text-[#8a8078]">
          Não encontramos nenhuma ordem de serviço com esses dados. Confira o número da
          OS e o telefone e tente novamente.
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-4 rounded-xl border border-[#eee3d3] bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold tracking-wide text-[#8a8078] uppercase">
                OS #{resultado.id}
              </div>
              <div className="text-lg font-bold text-[#221d19]">
                {TIPO_SERVICO_LABELS[resultado.tipoServico]}
              </div>
            </div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_OS_BADGE_CLASSES[resultado.status]}`}
            >
              {STATUS_OS_LABELS[resultado.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#f3ede4] pt-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-[#8a8078]">Entrada</div>
              <div className="text-[#221d19]">{formatDate(resultado.dataEntrada)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#8a8078]">Prazo prometido</div>
              <div className="text-[#221d19]">{formatDate(resultado.prazoPrometido)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#8a8078]">Valor total</div>
              <div className="text-[#221d19]">{formatCurrency(resultado.valorTotal)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#8a8078]">Restante a pagar</div>
              <div className="text-[#221d19]">
                {formatCurrency(resultado.valorTotal - resultado.sinalPago)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

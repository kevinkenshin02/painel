import { prisma } from "@/lib/prisma";
import { StatusOS } from "@/generated/prisma/enums";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import { criarOrdemServico } from "./actions";
import { TIPO_SERVICO_LABELS } from "./labels";
import { PhoneInput } from "@/components/PhoneInput";
import { AutoResetForm } from "@/components/AutoResetForm";
import { OrdensAtivasTable } from "./OrdensAtivasTable";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

export default async function OrdensServicoPage() {
  const [ativas, entregues] = await Promise.all([
    prisma.ordemServico.findMany({
      where: { status: { not: StatusOS.ENTREGUE } },
      orderBy: { prazoPrometido: "asc" },
    }),
    prisma.ordemServico.findMany({
      where: { status: StatusOS.ENTREGUE },
      orderBy: { dataEntrega: "desc" },
      take: 15,
    }),
  ]);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#221d19]">
            Ordens de Serviço
          </h1>
          <p className="mt-1 text-sm text-[#8a8078]">
            Acompanhamento de óculos e relógios em serviço.
          </p>
        </div>
      </div>

      <details className="rounded-xl border border-[#eee3d3] bg-white open:pb-6">
        <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-[#221d19] select-none">
          + Nova Ordem de Serviço
        </summary>

        <AutoResetForm
          action={criarOrdemServico}
          className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Data de entrada</span>
            <input
              type="date"
              name="dataEntrada"
              required
              defaultValue={toDateInputValue(hoje)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Prazo prometido</span>
            <input type="date" name="prazoPrometido" required className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Tipo de serviço</span>
            <select
              name="tipoServico"
              required
              defaultValue="VISAO_SIMPLES"
              className={inputClass}
            >
              {Object.entries(TIPO_SERVICO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Nome do cliente</span>
            <input type="text" name="clienteNome" required className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Telefone do cliente</span>
            <PhoneInput name="clienteWhatsapp" required placeholder="(11) 91234-5678" className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Valor total (R$)</span>
            <input
              type="number"
              name="valorTotal"
              required
              min={0}
              step="0.01"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">Sinal pago (R$)</span>
            <input
              type="number"
              name="sinalPago"
              min={0}
              step="0.01"
              defaultValue={0}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-3">
            <span className="text-xs font-semibold text-[#8a8078]">Descrição do serviço</span>
            <textarea name="descricao" required rows={2} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-3">
            <span className="text-xs font-semibold text-[#8a8078]">Observações (opcional)</span>
            <textarea name="observacoes" rows={2} className={inputClass} />
          </label>

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
            >
              Cadastrar OS
            </button>
          </div>
        </AutoResetForm>
      </details>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-[#221d19]">
          Em andamento ({ativas.length})
        </h2>

        <OrdensAtivasTable ativas={ativas} hoje={hoje} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-[#221d19]">Entregues recentemente</h2>

        <div className="overflow-x-auto rounded-xl border border-[#eee3d3] bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f7f1e6]">
              <tr className="text-left text-xs font-bold tracking-wide text-[#8a8078] uppercase">
                <th className="px-5 py-3.5">Nº OS</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Serviço</th>
                <th className="px-5 py-3.5">Entregue em</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {entregues.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#8a8078]">
                    Nenhuma entrega registrada ainda.
                  </td>
                </tr>
              )}
              {entregues.map((os) => (
                <tr key={os.id} className="border-t border-[#f3ede4]">
                  <td className="px-5 py-4 font-semibold text-[#221d19]">#{os.id}</td>
                  <td className="px-5 py-4 font-semibold text-[#221d19]">{os.clienteNome}</td>
                  <td className="px-5 py-4 text-[#4a4038]">
                    {TIPO_SERVICO_LABELS[os.tipoServico]}
                  </td>
                  <td className="px-5 py-4 text-[#4a4038]">
                    {os.dataEntrega ? formatDate(os.dataEntrega) : "-"}
                  </td>
                  <td className="px-5 py-4 text-[#4a4038]">{formatCurrency(os.valorTotal)}</td>
                  <td className="px-5 py-4 text-right">
                    <a
                      href={`/recibo/${os.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs font-semibold text-[#8a8078] hover:text-[#221d19] hover:underline"
                    >
                      Comprovante
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

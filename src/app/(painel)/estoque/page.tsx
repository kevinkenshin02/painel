import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/format";
import {
  criarArmacao,
  criarRelogio,
  criarLente,
  alternarAtivoArmacao,
  alternarAtivoRelogio,
  alternarAtivoLente,
  excluirArmacao,
  excluirRelogio,
  excluirLente,
} from "./actions";
import { MARCA_RELOGIO_LABELS, PUBLICO_RELOGIO_LABELS, MECANISMO_RELOGIO_LABELS } from "./labels";
import { EstoqueTabs } from "./EstoqueTabs";
import { ArmacoesTable } from "./ArmacoesTable";
import { RelogiosTable } from "./RelogiosTable";
import { LentesTable } from "./LentesTable";
import { AutoResetForm } from "@/components/AutoResetForm";
import { getFuncionarioLogado } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

export default async function EstoquePage() {
  const hoje = new Date();
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;

  const [armacoes, relogios, lentes] = await Promise.all([
    prisma.armacaoEstoque.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.relogioEstoque.findMany({ orderBy: { criadoEm: "desc" } }),
    prisma.lenteEstoque.findMany({ orderBy: { criadoEm: "desc" } }),
  ]);

  const armacoesSection = (
    <div className="flex flex-col gap-5">
      {isAdmin && (
        <details className="rounded-xl border border-[#eee3d3] bg-white open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-[#221d19] select-none">
            + Nova Armação
          </summary>
          <AutoResetForm
            action={criarArmacao}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Marca/Modelo</span>
              <input type="text" name="marcaModelo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Cor/Referência</span>
              <input type="text" name="corReferencia" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
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
              <span className="text-xs font-semibold text-[#8a8078]">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
              >
                Cadastrar armação
              </button>
            </div>
          </AutoResetForm>
        </details>
      )}

      <ArmacoesTable
        armacoes={armacoes}
        alternarAtivo={alternarAtivoArmacao}
        excluir={excluirArmacao}
        isAdmin={isAdmin}
      />
    </div>
  );

  const relogiosSection = (
    <div className="flex flex-col gap-5">
      {isAdmin && (
        <details className="rounded-xl border border-[#eee3d3] bg-white open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-[#221d19] select-none">
            + Novo Relógio
          </summary>
          <AutoResetForm
            action={criarRelogio}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Marca</span>
              <select name="marca" required defaultValue="ORIENT" className={inputClass}>
                {Object.entries(MARCA_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Marca (se &quot;Outro&quot;)</span>
              <input type="text" name="marcaOutro" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Modelo/Referência</span>
              <input type="text" name="modeloReferencia" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Público</span>
              <select name="tipoPublico" required defaultValue="UNISSEX" className={inputClass}>
                {Object.entries(PUBLICO_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Mecanismo</span>
              <select name="tipoMecanismo" required defaultValue="ANALOGICO" className={inputClass}>
                {Object.entries(MECANISMO_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
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
              <span className="text-xs font-semibold text-[#8a8078]">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
              >
                Cadastrar relógio
              </button>
            </div>
          </AutoResetForm>
        </details>
      )}

      <RelogiosTable
        relogios={relogios}
        alternarAtivo={alternarAtivoRelogio}
        excluir={excluirRelogio}
        isAdmin={isAdmin}
      />
    </div>
  );

  const lentesSection = (
    <div className="flex flex-col gap-5">
      {isAdmin && (
        <details className="rounded-xl border border-[#eee3d3] bg-white open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-[#221d19] select-none">
            + Nova Lente Pronta
          </summary>
          <AutoResetForm
            action={criarLente}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Descrição</span>
              <input
                type="text"
                name="descricao"
                required
                placeholder="Lente comum AR, Multifocal Kodak..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Grau</span>
              <input
                type="text"
                name="grau"
                required
                placeholder="+2.00, sem grau..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
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
              <span className="text-xs font-semibold text-[#8a8078]">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
              >
                Cadastrar lente
              </button>
            </div>
          </AutoResetForm>
        </details>
      )}

      <LentesTable
        lentes={lentes}
        alternarAtivo={alternarAtivoLente}
        excluir={excluirLente}
        isAdmin={isAdmin}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-[26px] font-bold text-[#221d19]">Estoque</h1>
        <p className="mt-1 text-sm text-[#8a8078]">
          Armações, relógios e lentes prontas disponíveis para venda.
        </p>
      </div>

      <EstoqueTabs armacoes={armacoesSection} relogios={relogiosSection} lentes={lentesSection} />
    </div>
  );
}

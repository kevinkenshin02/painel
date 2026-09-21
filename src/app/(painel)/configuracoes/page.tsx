import { prisma } from "@/lib/prisma";
import { salvarConfiguracaoLoja, salvarMetas } from "./actions";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BackupButton } from "./BackupButton";
import { FuncionariosSection } from "./FuncionariosSection";
import { getFuncionarioLogado } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-[#e4dbcb] bg-white px-3 py-2.5 text-sm text-[#221d19]";

export default async function ConfiguracoesPage() {
  const [config, funcionarios, logado] = await Promise.all([
    prisma.configuracao.findUnique({ where: { id: 1 } }),
    prisma.funcionario.findMany({ orderBy: { criadoEm: "asc" } }),
    getFuncionarioLogado(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-[26px] font-bold text-[#221d19]">Configurações</h1>
        <p className="mt-1 text-sm text-[#8a8078]">
          Aparência, dados da loja e backup do sistema.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-[#eee3d3] bg-white p-6">
        <h2 className="text-[15px] font-bold text-[#221d19]">Aparência</h2>
        <p className="text-xs text-[#8a8078]">Escolha o tema visual do painel.</p>
        <ThemeSwitcher />
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-[#eee3d3] bg-white p-6">
        <div>
          <h2 className="text-[15px] font-bold text-[#221d19]">Dados da loja</h2>
          <p className="text-xs text-[#8a8078]">
            Usados em mensagens e futuras integrações (recibos, site, etc.).
          </p>
        </div>

        <form action={salvarConfiguracaoLoja} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-[#8a8078]">Nome da loja</span>
            <input
              type="text"
              name="nomeLoja"
              required
              defaultValue={config?.nomeLoja ?? "Óticas Tanaka e Relojoaria"}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-[#8a8078]">Endereço</span>
            <input
              type="text"
              name="endereco"
              defaultValue={config?.endereco ?? ""}
              placeholder="Rua São Bento, 545 — Centro, São Paulo - SP"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold text-[#8a8078]">WhatsApp da loja</span>
            <input
              type="text"
              name="whatsapp"
              defaultValue={config?.whatsapp ?? ""}
              placeholder="(11) 96077-6721"
              className={inputClass}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
            >
              Salvar dados da loja
            </button>
          </div>
        </form>
      </section>

      {logado?.isAdmin && (
        <section className="flex flex-col gap-4 rounded-xl border border-[#eee3d3] bg-white p-6">
          <div>
            <h2 className="text-[15px] font-bold text-[#221d19]">Metas de vendas</h2>
            <p className="text-xs text-[#8a8078]">
              Definem o progresso mostrado na Visão geral, comparando com as vendas pagas do
              dia e do mês. Só o administrador altera esses valores.
            </p>
          </div>

          <form action={salvarMetas} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Meta diária (R$)</span>
              <input
                type="number"
                name="metaDiaria"
                min={0}
                step="0.01"
                defaultValue={config?.metaDiaria ?? 0}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold text-[#8a8078]">Meta mensal (R$)</span>
              <input
                type="number"
                name="metaMensal"
                min={0}
                step="0.01"
                defaultValue={config?.metaMensal ?? 0}
                className={inputClass}
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-5 py-2.5 text-sm font-bold text-white"
              >
                Salvar metas
              </button>
            </div>
          </form>
        </section>
      )}

      {logado?.isAdmin && (
        <section className="flex flex-col gap-4 rounded-xl border border-[#eee3d3] bg-white p-6">
          <div>
            <h2 className="text-[15px] font-bold text-[#221d19]">Funcionários</h2>
            <p className="text-xs text-[#8a8078]">
              Cada funcionário entra no painel com um PIN próprio — assim dá pra saber quem
              registrou cada venda. Só o administrador vê essa seção.
            </p>
          </div>
          <FuncionariosSection funcionarios={funcionarios} />
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-[#eee3d3] bg-white p-6">
        <div>
          <h2 className="text-[15px] font-bold text-[#221d19]">Backup</h2>
          <p className="text-xs text-[#8a8078]">
            Um backup automático já roda toda vez que o app é fechado. Use o botão abaixo
            para forçar um backup na hora.
          </p>
        </div>
        <BackupButton />
      </section>
    </div>
  );
}

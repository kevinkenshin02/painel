import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { hojeInput } from "@/lib/datas";
import { semEstoque } from "@/lib/estoque";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Chip } from "@/components/ui/Etiqueta";
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
  "w-full rounded-xl border border-borda bg-superficie-2 px-3.5 py-2.5 text-sm text-texto focus:border-ouro focus:ring-2 focus:ring-ouro/25 focus:outline-none";

export default async function EstoquePage(props: PageProps<"/estoque">) {
  const { aba } = await props.searchParams;
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
        <details className="filete rounded-2xl border border-borda bg-superficie shadow-cartao open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-ouro select-none">
            + Nova Armação
          </summary>
          <AutoResetForm
            action={criarArmacao}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Marca/Modelo</span>
              <input type="text" name="marcaModelo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Cor/Referência</span>
              <input type="text" name="corReferencia" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Data de entrada</span>
              <input
                type="date"
                name="dataEntrada"
                required
                defaultValue={hojeInput()}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="degrade-sol rounded-xl px-5 py-2.5 text-sm font-bold text-sobre-sol"
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
        <details className="filete rounded-2xl border border-borda bg-superficie shadow-cartao open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-ouro select-none">
            + Novo Relógio
          </summary>
          <AutoResetForm
            action={criarRelogio}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Marca</span>
              <select name="marca" required defaultValue="ORIENT" className={inputClass}>
                {Object.entries(MARCA_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Marca (se &quot;Outro&quot;)</span>
              <input type="text" name="marcaOutro" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Modelo/Referência</span>
              <input type="text" name="modeloReferencia" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Público</span>
              <select name="tipoPublico" required defaultValue="UNISSEX" className={inputClass}>
                {Object.entries(PUBLICO_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Mecanismo</span>
              <select name="tipoMecanismo" required defaultValue="ANALOGICO" className={inputClass}>
                {Object.entries(MECANISMO_RELOGIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Data de entrada</span>
              <input
                type="date"
                name="dataEntrada"
                required
                defaultValue={hojeInput()}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="degrade-sol rounded-xl px-5 py-2.5 text-sm font-bold text-sobre-sol"
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
        <details className="filete rounded-2xl border border-borda bg-superficie shadow-cartao open:pb-6">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-ouro select-none">
            + Nova Lente Pronta
          </summary>
          <AutoResetForm
            action={criarLente}
            className="grid grid-cols-1 gap-4 px-6 pt-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Código</span>
              <input type="text" name="codigo" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Descrição</span>
              <input
                type="text"
                name="descricao"
                required
                placeholder="Lente comum AR, Multifocal Kodak..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Grau</span>
              <input
                type="text"
                name="grau"
                required
                placeholder="+2.00, sem grau..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Fornecedor</span>
              <input type="text" name="fornecedor" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Data de entrada</span>
              <input
                type="date"
                name="dataEntrada"
                required
                defaultValue={hojeInput()}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Quantidade</span>
              <input type="number" name="quantidade" required min={0} defaultValue={1} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Custo unitário (R$)</span>
              <input type="number" name="custoUnitario" required min={0} step="0.01" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Preço de venda (R$)</span>
              <input type="number" name="precoVenda" required min={0} step="0.01" className={inputClass} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="degrade-sol rounded-xl px-5 py-2.5 text-sm font-bold text-sobre-sol"
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

  const ativos = [...armacoes, ...relogios, ...lentes].filter((i) => i.ativo);
  const pecas = ativos.reduce((s, i) => s + i.quantidade, 0);
  const valorVenda = ativos.reduce((s, i) => s + i.quantidade * i.precoVenda, 0);
  const valorCusto = ativos.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0);
  const zerados = ativos.filter(semEstoque).length;

  return (
    <>
      <Cabecalho
        secao="Estoque"
        titulo="Posição do estoque"
        descricao="Relógios, armações e lentes prontas disponíveis para venda. Vender pelo Painel já tira do estoque."
      >
        <Chip>{pecas} peças em {ativos.length} itens ativos</Chip>
        <Chip>
          Valor de venda: <span className="numero text-texto">{formatCurrency(valorVenda)}</span>
        </Chip>
        {isAdmin && (
          <Chip>
            Valor de custo: <span className="numero text-texto">{formatCurrency(valorCusto)}</span>
          </Chip>
        )}
        <Chip className={zerados > 0 ? "border-perigo/40 text-perigo" : undefined}>
          {zerados} {zerados === 1 ? "item ativo zerado" : "itens ativos zerados"}
        </Chip>
      </Cabecalho>

      <EstoqueTabs
        inicial={aba === "armacoes" || aba === "lentes" ? aba : "relogios"}
        contagem={{ armacoes: armacoes.length, relogios: relogios.length, lentes: lentes.length }}
        armacoes={armacoesSection}
        relogios={relogiosSection}
        lentes={lentesSection}
      />
    </>
  );
}

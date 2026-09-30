import { DatabaseBackup, Palette, Store, Target, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { salvarConfiguracaoLoja, salvarMetas } from "./actions";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { EfeitosSwitcher } from "./EfeitosSwitcher";
import { BackupButton } from "./BackupButton";
import { FuncionariosSection } from "./FuncionariosSection";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { VERSAO_PAINEL } from "@/lib/versao";
import { Cabecalho } from "@/components/ui/Cabecalho";
import { Cartao, TituloCartao } from "@/components/ui/Cartao";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Etiqueta";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [config, funcionarios, logado] = await Promise.all([
    prisma.configuracao.findUnique({ where: { id: 1 } }),
    // só o necessário: nunca mandar pinHash/pinSalt para o navegador
    prisma.funcionario.findMany({
      orderBy: { criadoEm: "asc" },
      select: { id: true, nome: true, ativo: true, isAdmin: true },
    }),
    getFuncionarioLogado(),
  ]);
  const isAdmin = logado?.isAdmin ?? false;

  return (
    <>
      <Cabecalho secao="Sistema" titulo="Configurações" descricao="Aparência, dados da loja, metas, funcionários e backup.">
        <Chip>Painel Tanaka {VERSAO_PAINEL}</Chip>
        <Chip>Dados guardados neste computador</Chip>
      </Cabecalho>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Cartao filete className="p-6">
          <TituloCartao selo="Aparência" icone={Palette} titulo="Tema do painel" descricao="Vale só para este computador." className="mb-5" />
          <ThemeSwitcher />
          <div className="mt-6 border-t border-borda pt-5">
            <h3 className="text-sm font-semibold text-texto">Efeitos visuais</h3>
            <p className="mt-0.5 mb-3 text-xs text-suave">
              No automático, computador ou celular mais fraco usa o leve sozinho. Vale só para este aparelho.
            </p>
            <EfeitosSwitcher />
          </div>
        </Cartao>

        <Cartao filete className="p-6">
          <TituloCartao
            selo="Backup"
            icone={DatabaseBackup}
            titulo="Cópia de segurança"
            descricao="Um backup automático roda toda vez que o Painel é fechado (pasta Backups-Painel-Tanaka no OneDrive). Use o botão para fazer um agora."
            className="mb-5"
          />
          <BackupButton />
        </Cartao>

        <Cartao filete className="p-6">
          <TituloCartao selo="Loja" icone={Store} titulo="Dados da loja" descricao="Aparecem no comprovante da OS e na tela de entrada." className="mb-5" />
          <form action={salvarConfiguracaoLoja} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome da loja" className="sm:col-span-2">
              <input
                type="text"
                name="nomeLoja"
                required
                defaultValue={config?.nomeLoja ?? "Tanaka Ótica e Relojoaria"}
                className={classeCampo}
              />
            </Campo>
            <Campo rotulo="Endereço" className="sm:col-span-2">
              <input
                type="text"
                name="endereco"
                defaultValue={config?.endereco ?? ""}
                placeholder="Rua São Bento, 545 — Lojas 21 e 22 · Centro, São Paulo - SP"
                className={classeCampo}
              />
            </Campo>
            <Campo rotulo="WhatsApp da loja">
              <input type="text" name="whatsapp" defaultValue={config?.whatsapp ?? ""} placeholder="(11) 96077-6721" className={classeCampo} />
            </Campo>
            <div className="flex items-end">
              <Botao type="submit" variante="primario">
                Salvar dados da loja
              </Botao>
            </div>
          </form>
        </Cartao>

        {isAdmin && (
          <Cartao filete className="p-6">
            <TituloCartao
              selo="Metas"
              icone={Target}
              titulo="Metas de vendas"
              descricao="O progresso aparece na Visão Geral, comparando com as vendas pagas do dia e do mês."
              className="mb-5"
            />
            <form action={salvarMetas} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo rotulo="Meta diária (R$)">
                <input type="number" name="metaDiaria" min={0} step="0.01" defaultValue={config?.metaDiaria ?? 0} className={classeCampo} />
              </Campo>
              <Campo rotulo="Meta mensal (R$)">
                <input type="number" name="metaMensal" min={0} step="0.01" defaultValue={config?.metaMensal ?? 0} className={classeCampo} />
              </Campo>
              <div className="sm:col-span-2">
                <Botao type="submit" variante="primario">
                  Salvar metas
                </Botao>
              </div>
            </form>
          </Cartao>
        )}

        {isAdmin && (
          <Cartao filete className="scroll-mt-6 p-6 xl:col-span-2" id="funcionarios">
            <TituloCartao
              selo="Equipe"
              icone={Users}
              titulo="Funcionários"
              descricao="Cada funcionário entra com um PIN próprio — assim dá para saber quem registrou cada venda."
              className="mb-5"
            />
            <FuncionariosSection funcionarios={funcionarios} />
          </Cartao>
        )}
      </div>
    </>
  );
}

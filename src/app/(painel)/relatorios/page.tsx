import Link from "next/link";
import { ChevronRight, ClipboardList, Landmark, Package, ShoppingCart, Wallet } from "lucide-react";
import { getFuncionarioLogado } from "@/lib/currentUser";
import { AtalhosRelatorios } from "./comum";
import { Cabecalho } from "@/components/ui/Cabecalho";

export const dynamic = "force-dynamic";

const RELATORIOS = [
  { href: "/relatorios/vendas", titulo: "Vendas", texto: "Produtos vendidos, por categoria, forma de pagamento, funcionário ou dia — com lucro para o administrador.", Icone: ShoppingCart, tom: "kpi-sol" },
  { href: "/relatorios/os", titulo: "Ordens de serviço", texto: "Entradas por tipo de serviço e situação, valores, o que falta receber e o tempo médio de entrega.", Icone: ClipboardList, tom: "kpi-noite" },
  { href: "/relatorios/estoque", titulo: "Estoque", texto: "Posição por marca, valor a custo e a preço de venda, produtos parados e movimentações do período.", Icone: Package, tom: "kpi-ouro" },
  { href: "/relatorios/caixa", titulo: "Caixa", texto: "Caixas do período com o recebido por forma de pagamento e as diferenças de gaveta.", Icone: Wallet, tom: "kpi-jade" },
  { href: "/relatorios/financeiro", titulo: "Financeiro", texto: "Resultado mês a mês, contas pagas por categoria e contas em aberto.", Icone: Landmark, tom: "kpi-vinho", admin: true },
];

export default async function RelatoriosPage() {
  const logado = await getFuncionarioLogado();
  const isAdmin = logado?.isAdmin ?? false;
  return (
    <>
      <AtalhosRelatorios ativo="inicio" isAdmin={isAdmin} />
      <Cabecalho secao="Relatórios" titulo="Relatórios" descricao="Escolha o relatório, ajuste o período e exporte em PDF." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RELATORIOS.filter((r) => !r.admin || isAdmin).map(({ href, titulo, texto, Icone, tom }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-6 shadow-cartao transition hover:-translate-y-0.5 hover:border-borda-forte"
          >
            <div className={`${tom} flex h-12 w-12 items-center justify-center rounded-2xl`}>
              <Icone className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-1 font-titulo text-xl font-bold text-texto">
                {titulo}
                <ChevronRight className="h-4 w-4 text-suave transition group-hover:translate-x-0.5" aria-hidden />
              </div>
              <p className="mt-1 text-sm text-suave">{texto}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

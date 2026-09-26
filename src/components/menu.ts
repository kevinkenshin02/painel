import {
  ChartColumn,
  ClipboardList,
  House,
  Landmark,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ItemMenu = {
  rotulo: string;
  /** Sem href = ainda não existe (aparece como "em breve"). */
  href?: string;
  admin?: boolean;
};

export type GrupoMenu = {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  /** Grupo sem itens vira um link direto. */
  href?: string;
  itens?: ItemMenu[];
  admin?: boolean;
};

export const MENU: GrupoMenu[] = [
  { id: "inicio", rotulo: "Visão Geral", icone: House, href: "/" },
  {
    id: "cadastros",
    rotulo: "Cadastros",
    icone: Users,
    itens: [
      { rotulo: "Clientes", href: "/clientes" },
      { rotulo: "Fornecedores", href: "/fornecedores" },
      { rotulo: "Produtos", href: "/produtos" },
      { rotulo: "Funcionários", href: "/configuracoes#funcionarios", admin: true },
    ],
  },
  {
    id: "estoque",
    rotulo: "Estoque",
    icone: Package,
    itens: [
      { rotulo: "Posição do estoque", href: "/estoque" },
      { rotulo: "Entrada por nota (XML)", href: "/estoque/entrada-nota", admin: true },
      { rotulo: "Conferência da vitrine", href: "/estoque/conferencia" },
      { rotulo: "Ajustes e conferências", href: "/estoque/ajustes" },
    ],
  },
  {
    id: "vendas",
    rotulo: "Vendas",
    icone: ShoppingCart,
    itens: [
      { rotulo: "Nova venda", href: "/vendas/nova" },
      { rotulo: "Vendas realizadas", href: "/vendas" },
      { rotulo: "Orçamentos de óculos" },
    ],
  },
  {
    id: "os",
    rotulo: "Ordens de Serviço",
    icone: ClipboardList,
    itens: [
      { rotulo: "Nova OS", href: "/ordens-servico/nova" },
      { rotulo: "Em andamento", href: "/ordens-servico" },
      { rotulo: "Entregues", href: "/ordens-servico/entregues" },
    ],
  },
  {
    id: "caixa",
    rotulo: "Caixa",
    icone: Wallet,
    itens: [
      { rotulo: "Caixa atual", href: "/caixa" },
      { rotulo: "Caixa detalhado", href: "/caixa/detalhado" },
      { rotulo: "Histórico de caixas", href: "/caixa/historico" },
    ],
  },
  {
    id: "financeiro",
    rotulo: "Financeiro",
    icone: Landmark,
    admin: true,
    itens: [
      { rotulo: "Contas a pagar" },
      { rotulo: "Contas a receber" },
      { rotulo: "Despesas fixas", href: "/despesas" },
      { rotulo: "Resumo do mês" },
    ],
  },
  {
    id: "relatorios",
    rotulo: "Relatórios",
    icone: ChartColumn,
    itens: [
      { rotulo: "Vendas" },
      { rotulo: "Ordens de serviço" },
      { rotulo: "Estoque" },
      { rotulo: "Caixa" },
      { rotulo: "Financeiro", admin: true },
    ],
  },
  { id: "config", rotulo: "Configurações", icone: Settings, href: "/configuracoes" },
];

/** Um item está ativo só na própria página (links com # nunca ficam marcados). */
export function itemAtivo(href: string | undefined, pathname: string) {
  if (!href || href.includes("#")) return false;
  return pathname === href;
}

/** O grupo fica aberto quando a página atual é dele. */
export function grupoAtivo(grupo: GrupoMenu, pathname: string) {
  if (grupo.href) return grupo.href === "/" ? pathname === "/" : pathname.startsWith(grupo.href);
  return (grupo.itens ?? []).some(
    (i) => i.href && !i.href.includes("#") && (pathname === i.href || pathname.startsWith(`${i.href}/`))
  );
}

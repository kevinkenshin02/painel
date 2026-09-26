"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cake, Search } from "lucide-react";
import { formatCpf, formatCurrency, formatDate, formatTelefone, soDigitos } from "@/lib/format";
import { classeCampo } from "@/components/ui/Campo";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { cx } from "@/components/ui/cx";

export type LinhaCliente = {
  id: number;
  nome: string;
  telefone: string;
  cpf: string | null;
  ativo: boolean;
  aniversarioNoMes: boolean;
  qtdOs: number;
  osAbertas: number;
  qtdCompras: number;
  totalGasto: number;
  ultimaVisita: Date | null;
};

function semAcento(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function ClientesTabela({ clientes }: { clientes: LinhaCliente[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [soAtivos, setSoAtivos] = useState(true);

  const termo = semAcento(busca.trim());
  const digitos = soDigitos(busca);
  const filtrados = clientes.filter((c) => {
    if (soAtivos && !c.ativo) return false;
    if (!termo) return true;
    return (
      semAcento(c.nome).includes(termo) ||
      (digitos.length >= 3 && (c.telefone.includes(digitos) || (c.cpf ?? "").includes(digitos))) ||
      String(c.id) === termo
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-suave" aria-hidden />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
            autoFocus
            className={cx(classeCampo, "pl-10")}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-texto-2">
          <input type="checkbox" checked={soAtivos} onChange={(e) => setSoAtivos(e.target.checked)} className="accent-[#e0a63d]" />
          Só ativos
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-borda">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th className="direita">OS</th>
              <th className="direita">Compras</th>
              <th className="direita">Total gasto</th>
              <th>Última visita</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-suave">
                  {clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clientes/${c.id}`)}
                className="cursor-pointer"
                title="Abrir a ficha do cliente"
              >
                <td className="numero text-suave">{c.id}</td>
                <td>
                  <span className="font-semibold text-texto">{c.nome}</span>
                  {c.aniversarioNoMes && (
                    <Cake className="ml-1.5 inline h-3.5 w-3.5 -translate-y-px text-ouro" aria-label="Faz aniversário este mês" />
                  )}
                  {!c.ativo && <Etiqueta className="ml-2">Inativo</Etiqueta>}
                  {c.osAbertas > 0 && (
                    <Etiqueta tom="aviso" className="ml-2">
                      {c.osAbertas} OS aberta{c.osAbertas > 1 ? "s" : ""}
                    </Etiqueta>
                  )}
                </td>
                <td className="numero whitespace-nowrap">{c.telefone ? formatTelefone(c.telefone) : "—"}</td>
                <td className="numero whitespace-nowrap">{c.cpf ? formatCpf(c.cpf) : "—"}</td>
                <td className="direita numero">{c.qtdOs}</td>
                <td className="direita numero">{c.qtdCompras}</td>
                <td className="direita numero destaque">{formatCurrency(c.totalGasto)}</td>
                <td className="numero">{c.ultimaVisita ? formatDate(c.ultimaVisita) : "—"}</td>
              </tr>
            ))}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={4}>
                  Totais · {filtrados.length} {filtrados.length === 1 ? "cliente" : "clientes"}
                </td>
                <td className="direita numero">{filtrados.reduce((s, c) => s + c.qtdOs, 0)}</td>
                <td className="direita numero">{filtrados.reduce((s, c) => s + c.qtdCompras, 0)}</td>
                <td className="direita numero">{formatCurrency(filtrados.reduce((s, c) => s + c.totalGasto, 0))}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

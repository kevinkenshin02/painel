"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { TIPO_SERVICO_LABELS } from "./labels";
import { PhoneInput } from "@/components/PhoneInput";
import { BuscaCliente, type ClienteResumo } from "@/components/BuscaCliente";
import { Botao } from "@/components/ui/Botao";
import { Campo, classeCampo } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { formatCurrency } from "@/lib/format";
import { cx } from "@/components/ui/cx";

type Resultado = { erro?: string; ok?: boolean; id?: number };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 flex w-full items-center gap-3 text-xs font-bold tracking-[0.14em] text-ouro uppercase">
        {titulo}
        <span className="h-px flex-1 bg-borda" />
      </legend>
      {children}
    </fieldset>
  );
}

export function NovaOSForm({
  action,
  hoje,
  clienteInicial,
}: {
  action: (formData: FormData) => Promise<Resultado>;
  hoje: string;
  clienteInicial?: ClienteResumo | null;
}) {
  const [formKey, setFormKey] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [valorTotal, setValorTotal] = useState(0);
  const [sinal, setSinal] = useState(0);
  const [cliente, setCliente] = useState<ClienteResumo | null>(clienteInicial ?? null);

  async function handleAction(formData: FormData) {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await action(formData);
      setResultado(r);
      if (r.ok) {
        setFormKey((k) => k + 1);
        setValorTotal(0);
        setSinal(0);
        setCliente(null);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form key={formKey} action={handleAction} className="flex flex-col gap-8">
      <Secao titulo="Cliente">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="Cliente" dica={cliente ? undefined : "Busque no cadastro; se for cliente novo, é só digitar o nome — o cadastro é criado sozinho."}>
            <BuscaCliente
              inicial={formKey === 0 ? clienteInicial : null}
              obrigatorio
              aoEscolher={setCliente}
            />
          </Campo>
          <Campo rotulo="Telefone / WhatsApp" dica="Usado no botão Avisar e na consulta online da OS.">
            <PhoneInput
              key={cliente?.id ?? "novo"}
              name="clienteWhatsapp"
              required
              defaultValue={cliente?.telefone ?? ""}
              placeholder="(11) 91234-5678"
            />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Serviço">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo rotulo="Tipo de serviço">
            <select name="tipoServico" required defaultValue="VISAO_SIMPLES" className={classeCampo}>
              {Object.entries(TIPO_SERVICO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Data de entrada">
            <input type="date" name="dataEntrada" required defaultValue={hoje} className={classeCampo} />
          </Campo>
          <Campo rotulo="Prazo prometido">
            <input type="date" name="prazoPrometido" required className={classeCampo} />
          </Campo>
        </div>
        <Campo rotulo="Descrição do serviço">
          <textarea
            name="descricao"
            required
            rows={3}
            placeholder="Ex.: lente multifocal com antirreflexo na armação da cliente; troca de bateria e vedação..."
            className={classeCampo}
          />
        </Campo>
        <Campo rotulo="Observações (opcional)">
          <textarea name="observacoes" rows={2} className={classeCampo} />
        </Campo>
      </Secao>

      <Secao titulo="Valores">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo rotulo="Valor total (R$)">
            <input
              type="number"
              name="valorTotal"
              required
              min={0}
              step="0.01"
              onChange={(e) => setValorTotal(Number(e.target.value) || 0)}
              className={cx(classeCampo, "numero text-base font-semibold")}
            />
          </Campo>
          <Campo rotulo="Sinal pago agora (R$)">
            <input
              type="number"
              name="sinalPago"
              min={0}
              step="0.01"
              defaultValue={0}
              onChange={(e) => setSinal(Number(e.target.value) || 0)}
              className={cx(classeCampo, "numero")}
            />
          </Campo>
          <div className="flex flex-col justify-end">
            <div className="rounded-xl border border-borda-forte bg-ouro/10 px-4 py-2.5">
              <div className="text-[11px] font-bold tracking-[0.08em] text-suave uppercase">Falta pagar na retirada</div>
              <div className={cx("numero text-lg font-bold", valorTotal - sinal < 0 ? "text-perigo" : "text-texto")}>
                {formatCurrency(Math.max(0, valorTotal - sinal))}
              </div>
            </div>
          </div>
        </div>
      </Secao>

      {resultado?.erro && <Aviso tom="perigo">{resultado.erro}</Aviso>}
      {resultado?.ok && resultado.id && (
        <Aviso tom="sucesso">
          <span>
            OS <strong>#{resultado.id}</strong> criada.{" "}
            <a href={`/recibo/${resultado.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline">
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Imprimir o comprovante
            </a>{" "}
            ·{" "}
            <Link href="/ordens-servico" className="underline">
              Ver em andamento
            </Link>
          </span>
        </Aviso>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-borda pt-5">
        <Botao type="submit" variante="primario" tamanho="lg" disabled={enviando}>
          {enviando ? "Salvando..." : "Criar ordem de serviço"}
        </Botao>
        <p className="text-xs text-suave">O cliente pode acompanhar a OS pela consulta online com o número e o telefone.</p>
      </div>
    </form>
  );
}

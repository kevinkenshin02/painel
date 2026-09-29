"use client";

import { useEffect, useState, useTransition } from "react";
import { Delete } from "lucide-react";
import { entrarComPin } from "./actions";
import { Botao } from "@/components/ui/Botao";
import { cx } from "@/components/ui/cx";

const PIN_MIN = 4;
const PIN_MAX = 6;

const classeTecla =
  "liquido-botao flex h-12 w-16 items-center justify-center rounded-[18px] text-lg font-bold text-texto disabled:opacity-50";

export function PinPad({ funcionarioId }: { funcionarioId: number }) {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function tentar(valor: string, definitivo: boolean) {
    startTransition(async () => {
      const resultado = await entrarComPin(funcionarioId, valor);
      if (resultado?.erro) {
        if (definitivo) {
          setErro(resultado.erro);
          setPin("");
        }
        // Se não é a tentativa final, o PIN pode só ter mais dígitos do que
        // já foi digitado (PINs de 4 a 6 números) — deixa a pessoa continuar
        // digitando ou apagar, sem interromper com um erro prematuro.
      } else {
        window.location.href = "/";
      }
    });
  }

  function adicionarDigito(d: string) {
    if (pin.length >= PIN_MAX) return;
    const novoPin = pin + d;
    setErro(null);
    setPin(novoPin);
    if (novoPin.length >= PIN_MIN) {
      tentar(novoPin, novoPin.length === PIN_MAX);
    }
  }

  function apagar() {
    setErro(null);
    setPin((p) => p.slice(0, -1));
  }

  const podeConfirmar = pin.length >= PIN_MIN;

  useEffect(() => {
    function aoTeclar(event: KeyboardEvent) {
      if (isPending) return;
      if (/^[0-9]$/.test(event.key)) {
        adicionarDigito(event.key);
      } else if (event.key === "Backspace") {
        apagar();
      } else if (event.key === "Delete" || event.key === "Escape") {
        setErro(null);
        setPin("");
      } else if (event.key === "Enter") {
        if (pin.length >= PIN_MIN) tentar(pin, true);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3" aria-label={`${pin.length} números digitados`}>
          {Array.from({ length: PIN_MAX }).map((_, i) => (
            <div
              key={i}
              className={cx(
                "h-4 w-4 rounded-full border-2 transition",
                i < pin.length ? "degrade-sol border-transparent" : "border-borda-forte"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-suave">
          {erro ? (
            <span className="font-semibold text-perigo">{erro}</span>
          ) : isPending ? (
            "Entrando..."
          ) : (
            "PIN de 4 a 6 números — dá para digitar no teclado"
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button key={n} type="button" onClick={() => adicionarDigito(n)} disabled={isPending} className={classeTecla}>
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setErro(null);
            setPin("");
          }}
          disabled={isPending}
          className={cx(classeTecla, "text-xs font-semibold text-suave")}
        >
          Limpar
        </button>
        <button type="button" onClick={() => adicionarDigito("0")} disabled={isPending} className={classeTecla}>
          0
        </button>
        <button type="button" onClick={apagar} disabled={isPending} aria-label="Apagar" className={cx(classeTecla, "text-suave")}>
          <Delete className="h-5 w-5" />
        </button>
      </div>

      <Botao
        variante="primario"
        tamanho="lg"
        onClick={() => tentar(pin, true)}
        disabled={!podeConfirmar || isPending}
        className="w-full max-w-[16rem]"
      >
        Entrar
      </Botao>
    </div>
  );
}

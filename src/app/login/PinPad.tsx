"use client";

import { useEffect, useState, useTransition } from "react";
import { entrarComPin } from "./actions";

const PIN_MIN = 4;
const PIN_MAX = 6;

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
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3.5">
        {Array.from({ length: PIN_MAX }).map((_, i) => (
          <div
            key={i}
            className={`h-6 w-6 rounded-full border-2 border-[#e4dbcb] ${
              i < pin.length ? "bg-gradient-to-br from-[#f6b23b] to-[#e0472e] border-transparent" : ""
            }`}
          />
        ))}
      </div>
      <p className="-mt-4 text-xs text-[#8a8078]">PIN de 4 a 6 números</p>

      {erro && <p className="text-sm font-medium text-[#c0472b]">{erro}</p>}
      {isPending && <p className="text-sm text-[#8a8078]">Entrando...</p>}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => adicionarDigito(n)}
            disabled={isPending}
            className="h-16 w-16 rounded-xl border border-[#e4dbcb] bg-white text-xl font-bold text-[#221d19] hover:bg-[#f7f1e6] disabled:opacity-50"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={apagar}
          disabled={isPending}
          className="h-16 w-16 rounded-xl border border-[#e4dbcb] bg-white text-sm font-semibold text-[#8a8078] hover:bg-[#f7f1e6] disabled:opacity-50"
        >
          Apagar
        </button>
        <button
          type="button"
          onClick={() => adicionarDigito("0")}
          disabled={isPending}
          className="h-16 w-16 rounded-xl border border-[#e4dbcb] bg-white text-xl font-bold text-[#221d19] hover:bg-[#f7f1e6] disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => {
            setErro(null);
            setPin("");
          }}
          disabled={isPending}
          className="h-16 w-16 rounded-xl border border-[#e4dbcb] bg-white text-sm font-semibold text-[#8a8078] hover:bg-[#f7f1e6] disabled:opacity-50"
        >
          Limpar
        </button>
      </div>

      <button
        type="button"
        onClick={() => tentar(pin, true)}
        disabled={!podeConfirmar || isPending}
        className="rounded-lg bg-gradient-to-br from-[#f6b23b] to-[#e0472e] px-8 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Confirmar
      </button>
    </div>
  );
}

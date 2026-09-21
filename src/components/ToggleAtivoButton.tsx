"use client";

export function ToggleAtivoButton({
  id,
  ativo,
  action,
}: {
  id: number;
  ativo: boolean;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ativo" value={String(ativo)} />
      <button
        type="submit"
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          ativo ? "bg-[#e3f1e8] text-[#3a8f5b]" : "bg-[#f3ede4] text-[#8a8078]"
        }`}
      >
        {ativo ? "Ativo" : "Inativo"}
      </button>
    </form>
  );
}

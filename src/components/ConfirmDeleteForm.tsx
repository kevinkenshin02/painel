"use client";

export function ConfirmDeleteForm({
  id,
  action,
  confirmMessage = "Excluir este item?",
}: {
  id: number;
  action: (formData: FormData) => void;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs font-semibold text-[#8a8078] hover:text-[#c0472b] hover:underline"
      >
        Excluir
      </button>
    </form>
  );
}

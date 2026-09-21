"use client";

import { useState, type ReactNode } from "react";

export function AutoResetForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const [formKey, setFormKey] = useState(0);

  async function handleAction(formData: FormData) {
    await action(formData);
    setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={handleAction} className={className}>
      {children}
    </form>
  );
}

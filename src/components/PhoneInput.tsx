"use client";

import { useState } from "react";
import { formatTelefone } from "@/lib/format";

export function PhoneInput({
  name,
  defaultValue = "",
  required,
  placeholder,
  className,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  className: string;
}) {
  const [value, setValue] = useState(formatTelefone(defaultValue));

  return (
    <input
      type="text"
      name={name}
      required={required}
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(formatTelefone(event.target.value))}
      className={className}
    />
  );
}

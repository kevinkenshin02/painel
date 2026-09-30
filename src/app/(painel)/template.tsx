import type { ReactNode } from "react";

// O template (diferente do layout) é montado de novo a cada troca de tela: é o que faz o conteúdo entrar suave.
export default function PainelTemplate({ children }: { children: ReactNode }) {
  return <div className="entrada-tela flex flex-col gap-6">{children}</div>;
}

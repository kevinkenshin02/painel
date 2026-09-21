import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // koffi carrega binário nativo (.node) para falar com a DLL do SAT — não pode ser empacotado.
  serverExternalPackages: ["koffi"],
};

export default nextConfig;

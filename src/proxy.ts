import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, lerFuncionarioIdDoCookie } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const funcionarioId = await lerFuncionarioIdDoCookie(cookieValue);

  if (!funcionarioId) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // além das páginas públicas, deixa passar direto qualquer arquivo estático
  // (imagens da pasta public/, como as da tela de entrada) sem exigir login
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|consulta|recibo|api|marca|.*\\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|woff2?|ttf)$).*)",
  ],
};

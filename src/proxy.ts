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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|consulta|recibo|api).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authenticated = Boolean(request.cookies.get("omsons_access_token")?.value);
  if (request.nextUrl.pathname === "/" && authenticated) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (request.nextUrl.pathname !== "/" && !authenticated) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)"] };

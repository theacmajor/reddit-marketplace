import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

const PROTECTED_PATHS = ["/admin"];
const PROTECTED_API_PREFIXES = ["/api/admin", "/api/sync"];

function isProtected(pathname: string): boolean {
  if (pathname === "/admin/login") return false;
  for (const path of PROTECTED_PATHS) {
    if (pathname === path || pathname.startsWith(path + "/")) return true;
  }
  for (const prefix of PROTECTED_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/sync/:path*"],
};

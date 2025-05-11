import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

export async function middleware(req: NextRequest) {
  // Decode the session cookie once. No DB hit.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });

  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 1) Un‑authenticated user on a protected route → login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 2) Authenticated user visiting login/register → send home
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3) Otherwise continue
  return NextResponse.next();
}

/** Skip static files and Next internals */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

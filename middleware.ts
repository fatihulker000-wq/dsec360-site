import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const AUTH_EXCEPTIONS = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/admin/login",
  "/api/admin/logout",
]);

export function middleware(request: NextRequest) {
  const role = String(
    request.cookies.get("dsec_user_role")?.value ||
      request.cookies.get("dsec_admin_role")?.value ||
      ""
  )
    .trim()
    .toLowerCase();

  const isDemo =
    role === "demo_user" ||
    request.cookies.get("dsec_is_demo")?.value === "true";

  if (!isDemo || SAFE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  if (AUTH_EXCEPTIONS.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "Demo hesabı salt okunurdur. Kayıt ekleme, düzenleme ve silme işlemleri kapalıdır.",
    },
    { status: 403 }
  );
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
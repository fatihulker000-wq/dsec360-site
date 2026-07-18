import { NextRequest, NextResponse } from "next/server";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const DEMO_ALLOWED_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/me",
  "/api/admin/drugs/search",
  "/api/admin/icd10/search",
];

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  const role = String(
    req.cookies.get("dsec_user_role")?.value ||
      req.cookies.get("dsec_admin_role")?.value ||
      ""
  )
    .trim()
    .toLowerCase();

  const isDemo =
    role === "demo_user" ||
    req.cookies.get("dsec_is_demo")?.value === "true";

  if (!isDemo || !WRITE_METHODS.has(method)) {
    return NextResponse.next();
  }

  const isAllowedPath = DEMO_ALLOWED_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`)
  );

  if (isAllowedPath) {
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
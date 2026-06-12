import { NextRequest, NextResponse } from "next/server";

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

const DEMO_ALLOWED_PATHS = [
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/me",
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  const role =
    req.cookies.get("dsec_admin_role")?.value ||
    req.cookies.get("dsec_user_role")?.value ||
    "";

  const isDemoCookie = req.cookies.get("dsec_is_demo")?.value === "true";
  const isDemo = role === "demo_user" || isDemoCookie;

  const isApi = pathname.startsWith("/api/");
  const isWrite = WRITE_METHODS.includes(method);
  const isAllowedPath = DEMO_ALLOWED_PATHS.some((p) => pathname.startsWith(p));

  if (isDemo && isApi && isWrite && !isAllowedPath) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Demo sürümünde kayıt oluşturma, güncelleme, silme ve indirme işlemleri kapalıdır.",
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
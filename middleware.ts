import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  const isPanelPage = pathname.startsWith("/panel");
  const isPortalTrainingPage = pathname.startsWith("/portal/training");
  const isLoginPage = pathname === "/login";

  const adminAuthCookie = request.cookies.get("dsec_admin_auth")?.value;

  const userAuthCookie = request.cookies.get("dsec_user_auth")?.value;
  const userRoleCookie = request.cookies.get("dsec_user_role")?.value;

  // ADMIN ALANI
  if (isAdminPage) {
    if (isAdminLoginPage) {
      if (adminAuthCookie === "ok") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      return NextResponse.next();
    }

    if (adminAuthCookie === "ok") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // KULLANICI LOGIN SAYFASI
  // Kurumsal akış:
  // /login her zaman formu açsın
  // aktif admin/user oturumu olsa bile otomatik redirect yapmasın
  if (isLoginPage) {
    return NextResponse.next();
  }

  // PANEL ALANI
  if (isPanelPage) {
    if (userAuthCookie !== "ok") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      userRoleCookie === "company_admin" ||
      userRoleCookie === "operator" ||
      userRoleCookie === "super_admin"
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // EĞİTİM PORTALI
  if (isPortalTrainingPage) {
    if (userAuthCookie !== "ok") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (
      userRoleCookie === "training_user" ||
      userRoleCookie === "company_admin" ||
      userRoleCookie === "operator" ||
      userRoleCookie === "super_admin"
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel/:path*", "/portal/training/:path*", "/login"],
};
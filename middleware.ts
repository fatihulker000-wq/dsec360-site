import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  const isPanelPage = pathname.startsWith("/panel");
  const isPortalTrainingPage = pathname.startsWith("/portal/training");
  const isLoginPage = pathname === "/login";

  const adminAuthCookie = request.cookies.get("dsec_admin_auth")?.value;
  const adminRoleCookie = request.cookies.get("dsec_admin_role")?.value;

  const userAuthCookie = request.cookies.get("dsec_user_auth")?.value;
  const userRoleCookie = request.cookies.get("dsec_user_role")?.value;

  const isAllowedAdminRole =
    adminRoleCookie === "super_admin" || adminRoleCookie === "company_admin";

  const isAllowedPanelRole =
    userRoleCookie === "company_admin" ||
    userRoleCookie === "operator" ||
    userRoleCookie === "super_admin";

  const isAllowedPortalRole =
    userRoleCookie === "training_user" ||
    userRoleCookie === "company_admin" ||
    userRoleCookie === "operator" ||
    userRoleCookie === "super_admin";

  // ADMIN
  if (isAdminPage) {
    if (isAdminLoginPage) {
      if (adminAuthCookie === "ok" && isAllowedAdminRole) {
        return redirectTo(request, "/admin/dashboard");
      }

      return NextResponse.next();
    }

    if (adminAuthCookie === "ok" && isAllowedAdminRole) {
      return NextResponse.next();
    }

    return redirectTo(request, "/admin/login");
  }

  // USER LOGIN
  if (isLoginPage) {
    return NextResponse.next();
  }

  // PANEL
  if (isPanelPage) {
    if (userAuthCookie !== "ok") {
      return redirectTo(request, "/login");
    }

    if (isAllowedPanelRole) {
      return NextResponse.next();
    }

    return redirectTo(request, "/login");
  }

  // TRAINING PORTAL
  if (isPortalTrainingPage) {
    if (userAuthCookie !== "ok") {
      return redirectTo(request, "/login");
    }

    if (isAllowedPortalRole) {
      return NextResponse.next();
    }

    return redirectTo(request, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/panel/:path*", "/portal/training/:path*", "/login"],
};
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  const secure = process.env.NODE_ENV === "production";
  const cookieDomain =
    process.env.NODE_ENV === "production" ? ".dsec360.com" : undefined;

  const expiredDate = new Date(0);

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const clearCookie = (name: string) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      expires: expiredDate,
    });

    if (cookieDomain) {
      response.cookies.set(name, "", {
        httpOnly: true,
        sameSite: "lax",
        secure,
        domain: cookieDomain,
        path: "/",
        expires: expiredDate,
      });
    }
  };

  clearCookie("dsec_admin_auth");
  clearCookie("dsec_admin_role");
  clearCookie("dsec_user_auth");
  clearCookie("dsec_user_role");
  clearCookie("dsec_user_id");
  clearCookie("dsec_user_email");
  clearCookie("dsec_company_id");

  return response;
}
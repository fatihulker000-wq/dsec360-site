import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const secure = process.env.NODE_ENV === "production";

  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires: new Date(0),
  };

  response.cookies.set("dsec_admin_auth", "", cookieBase);
  response.cookies.set("dsec_admin_role", "", cookieBase);
  response.cookies.set("dsec_user_auth", "", cookieBase);
  response.cookies.set("dsec_user_role", "", cookieBase);
  response.cookies.set("dsec_user_id", "", cookieBase);
  response.cookies.set("dsec_user_email", "", cookieBase);
  response.cookies.set("dsec_company_id", "", cookieBase);

  return response;
}
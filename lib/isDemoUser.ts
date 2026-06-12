import { cookies } from "next/headers";

export async function isDemoUser(): Promise<boolean> {
  const cookieStore = await cookies();

  const role = String(
    cookieStore.get("dsec_admin_role")?.value || ""
  ).trim();

  const demoCookie = String(
    cookieStore.get("dsec_is_demo")?.value || ""
  ).trim();

  return role === "demo_user" || demoCookie === "true";
}
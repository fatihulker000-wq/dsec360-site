import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase sunucu ortam değişkenleri eksik.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function text(value: unknown) {
  return String(value ?? "").trim();
}

export type Access = {
  allowed: boolean;
  role: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

export async function getAccess(): Promise<Access> {
  const store = await cookies();
  const auth = text(store.get("dsec_admin_auth")?.value || store.get("dsec_user_auth")?.value);
  const role = text(store.get("dsec_admin_role")?.value || store.get("dsec_user_role")?.value).toLowerCase();
  const companyId = text(store.get("dsec_company_id")?.value);
  const companyScoped = role === "company_admin" || role === "demo_user";
  return {
    allowed: auth === "ok" && ["admin", "super_admin", "company_admin", "demo_user"].includes(role) && (!companyScoped || Boolean(companyId)),
    role,
    companyId,
    companyScoped,
    readOnly: role === "demo_user",
  };
}

export function deny(status = 401, error = "Yetkisiz erişim.") {
  return NextResponse.json({ success: false, error }, { status });
}

export function resolveFirmId(requested: unknown, access: Access) {
  const value = text(requested);
  if (!value) return null;
  if (access.companyScoped && value !== access.companyId) return null;
  return value;
}

export function surveyStatus(value: unknown) {
  const normalized = text(value).toUpperCase();
  return ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"].includes(normalized) ? normalized : "DRAFT";
}

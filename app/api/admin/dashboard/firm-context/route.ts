import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (v: unknown) => String(v ?? "").trim();
const uuid = (v: unknown) => UUID_RE.test(text(v)) ? text(v) : "";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getSession() {
  const c = await cookies();
  const auth = text(c.get("dsec_admin_auth")?.value || c.get("dsec_user_auth")?.value);
  const role = text(c.get("dsec_admin_role")?.value || c.get("dsec_user_role")?.value).toLowerCase();
  const userId = uuid(c.get("dsec_user_id")?.value);
  const firmId = uuid(c.get("dsec_company_id")?.value);

  if (
    auth !== "ok" ||
    !userId ||
    !["super_admin", "company_admin", "demo_user"].includes(role)
  ) return null;

  return { role, userId, firmId };
}

async function accessibleFirms(role: string, userId: string) {
  const s = db();

  if (role === "super_admin") {
    const { data, error } = await s
      .from("companies")
      .select("id,name,local_firm_id,is_active,tehlike_sinifi")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return (data || [])
      .map((x: any) => ({
        id: text(x.id),
        name: text(x.name) || "Firma",
        localFirmId: x.local_firm_id ?? null,
        hazardClass: text(x.tehlike_sinifi),
        isPrimary: false,
      }))
      .filter((x: any) => uuid(x.id));
  }

  /*
   * Yetkili firmalar ve kullanıcının ana şirketi bağımsız kaynaklardır.
   * Paralel sorgulanır. company_id yalnız erişim listesini tamamlamak içindir;
   * hiçbir zaman istenen firma için sessiz tenant fallback'i yapılmaz.
   */
  const [accessResult, userResult] = await Promise.all([
    s.from("user_firm_access")
      .select("firm_id,is_primary")
      .eq("user_id", userId),
    s.from("users")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (accessResult.error) throw accessResult.error;
  if (userResult.error) throw userResult.error;

  const access = accessResult.data || [];
  const ids = Array.from(new Set([
    ...access.map((x: any) => uuid(x.firm_id)).filter(Boolean),
    uuid(userResult.data?.company_id),
  ].filter(Boolean)));

  if (ids.length === 0) return [];

  const { data: companies, error } = await s
    .from("companies")
    .select("id,name,local_firm_id,is_active,tehlike_sinifi")
    .in("id", ids)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  const primary = new Set(
    access
      .filter((x: any) => x.is_primary === true)
      .map((x: any) => text(x.firm_id))
  );

  return (companies || [])
    .map((x: any) => ({
      id: text(x.id),
      name: text(x.name) || "Firma",
      localFirmId: x.local_firm_id ?? null,
      hazardClass: text(x.tehlike_sinifi),
      isPrimary: primary.has(text(x.id)),
    }))
    .filter((x: any) => uuid(x.id));
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return json({ success: false, error: "Yetkisiz erişim." }, 401);

    const firms = await accessibleFirms(session.role, session.userId);
    if (firms.length === 0) {
      return json({ success: false, error: "Erişilebilir aktif firma bulunamadı." }, 403);
    }

    const allowed = new Set(firms.map((x: any) => x.id));

    /*
     * Cookie'deki remote UUID erişilebilir durumdaysa aynen korunur.
     * Geçersiz/eski cookie varsa yalnız başlangıç seçimi yapılır:
     * primary -> ilk erişilebilir firma.
     * Bu seçim DB sorgularında tenant fallback'i değildir.
     */
    const activeFirmId =
      session.firmId && allowed.has(session.firmId)
        ? session.firmId
        : (firms.find((x: any) => x.isPrimary)?.id || firms[0].id);

    return json({
      success: true,
      activeFirmId,
      firms,
      role: session.role,
    });
  } catch (e) {
    console.error("dashboard firm-context GET", e);
    return json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Firma bağlamı alınamadı.",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return json({ success: false, error: "Yetkisiz erişim." }, 401);

    const body = await request.json().catch(() => ({}));
    const requested = uuid(body?.firmId);

    if (!requested) {
      return json({ success: false, error: "Geçerli firma UUID gerekli." }, 400);
    }

    const firms = await accessibleFirms(session.role, session.userId);
    const target = firms.find((x: any) => x.id === requested);

    if (!target) {
      return json({ success: false, error: "Bu firmaya erişim yetkiniz yok." }, 403);
    }

    const response = json({
      success: true,
      activeFirmId: requested,
      firm: target,
    });

    /*
     * Executive API tenant'ı dsec_company_id cookie'sinden okur.
     * Bu nedenle firma değişiminde cookie response üzerinde kesin olarak güncellenir.
     */
    response.cookies.set("dsec_company_id", requested, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".dsec360.com" : undefined,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (e) {
    console.error("dashboard firm-context POST", e);
    return json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Firma değiştirilemedi.",
      },
      500
    );
  }
}

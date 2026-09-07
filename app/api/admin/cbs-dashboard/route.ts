import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DashboardRole =
  | "super_admin"
  | "company_admin"
  | "demo_user";

type DashboardSession = {
  role: DashboardRole;
  firmId: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function uuid(value: unknown) {
  const valueText = clean(value);
  return UUID_RE.test(valueText) ? valueText : "";
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getDashboardSession(): Promise<DashboardSession | null> {
  const cookieStore = await cookies();

  const auth = clean(
    cookieStore.get("dsec_admin_auth")?.value ||
      cookieStore.get("dsec_user_auth")?.value
  );

  const role = clean(
    cookieStore.get("dsec_admin_role")?.value ||
      cookieStore.get("dsec_user_role")?.value
  ) as DashboardRole;

  const firmId = uuid(
    cookieStore.get("dsec_company_id")?.value
  );

  if (auth !== "ok") return null;

  if (
    !["super_admin", "company_admin", "demo_user"].includes(role)
  ) {
    return null;
  }

  // Dashboard daima aktif firma bağlamında çalışır.
  // Super admin dahil hiçbir rol için "tüm firmalar" fallback'i yoktur.
  if (!firmId) return null;

  return { role, firmId };
}

export async function GET() {
  try {
    const session = await getDashboardSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktif firma oturumu bulunamadı veya yetkisiz erişim.",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("cbs_forms")
      .select(
        "id,status,priority,sla_due_at,closed_at,firm_id,created_at"
      )
      .eq("firm_id", session.firmId);

    if (error) {
      console.error("CBS dashboard GET hatası:", error);
      return NextResponse.json(
        { success: false, error: "ÇBS verisi alınamadı." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const records = data || [];
    const closedStatuses = new Set([
      "closed",
      "resolved",
      "rejected",
      "duplicate",
      "cancelled",
    ]);

    const now = Date.now();

    const total = records.length;
    const countNew = records.filter(
      (x) => clean(x.status).toLowerCase() === "new"
    ).length;
    const countProcessing = records.filter(
      (x) => clean(x.status).toLowerCase() === "processing"
    ).length;
    const countRead = records.filter(
      (x) => clean(x.status).toLowerCase() === "read"
    ).length;
    const countClosed = records.filter((x) =>
      closedStatuses.has(clean(x.status).toLowerCase())
    ).length;

    const open = records.filter(
      (x) => !closedStatuses.has(clean(x.status).toLowerCase())
    ).length;

    const slaExceeded = records.filter((x) => {
      if (
        !x.sla_due_at ||
        closedStatuses.has(clean(x.status).toLowerCase())
      ) {
        return false;
      }

      const due = new Date(x.sla_due_at).getTime();
      return Number.isFinite(due) && due < now;
    }).length;

    const critical = records.filter(
      (x) => clean(x.priority).toLowerCase() === "critical"
    ).length;

    const high = records.filter(
      (x) => clean(x.priority).toLowerCase() === "high"
    ).length;

    const closedRate =
      total > 0
        ? Math.round((countClosed / total) * 100)
        : null;

    return NextResponse.json(
      {
        success: true,
        firmId: session.firmId,
        summary: {
          total,
          open,
          new: countNew,
          processing: countProcessing,
          read: countRead,
          closed: countClosed,
          slaExceeded,
          critical,
          high,
          closedRate,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("CBS dashboard genel hata:", error);

    return NextResponse.json(
      { success: false, error: "Sunucu hatası." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}

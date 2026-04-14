import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

type AdminSession = {
  userId: string;
  role: "super_admin" | "company_admin";
  companyId: string;
};

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

  const isAllowedRole =
    adminRole === "super_admin" || adminRole === "company_admin";

  if (adminAuth !== "ok" || !isAllowedRole || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const role =
    String(data.role || "").trim() === "super_admin"
      ? "super_admin"
      : "company_admin";

  return {
    userId: String(data.id || "").trim(),
    role,
    companyId: String(data.company_id || "").trim(),
  };
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
}

async function getAuthorizedRecord(
  id: number,
  session: AdminSession
): Promise<{
  id: number;
  firm_id: string | number | null;
} | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("cbs_forms")
    .select("id, firm_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  if (session.role === "super_admin") {
    return data;
  }

  const recordFirmId = String(data.firm_id || "").trim();
  if (!recordFirmId || recordFirmId !== session.companyId) {
    return null;
  }

  return data;
}

/* =========================
   GET
========================= */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const supabase = getSupabase();

    let query = supabase
      .from("cbs_forms")
      .select(`
        id,
        full_name,
        email,
        message,
        created_at,
        status,
        category,
        firm_id,
        assigned_to,
        resolution_note,
        priority,
        sla_due_at,
        closed_at
      `)
      .order("created_at", { ascending: false });

    if (session.role === "company_admin") {
      query = query.eq("firm_id", session.companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("CBS GET hatası:", error);
      return NextResponse.json(
        { error: "Kayıtlar alınamadı." },
        { status: 500 }
      );
    }

    const formatted = (data || []).map((item) => ({
      id: item.id,
      full_name: item.full_name,
      email: item.email,
      message: item.message,
      created_at: item.created_at,
      status: item.status,
      category: item.category,
      firmId: item.firm_id,
      assignedTo: item.assigned_to,
      resolutionNote: item.resolution_note,
      priority: item.priority,
      sla_due_at: item.sla_due_at,
      closed_at: item.closed_at,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error("CBS GET genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   PATCH (STATUS)
========================= */
export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);
    const status = String(body?.status || "").trim();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID ve durum zorunludur." },
        { status: 400 }
      );
    }

    const allowedStatuses = ["new", "read", "processing", "closed"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Geçersiz durum değeri." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    } else {
      updatePayload.closed_at = null;
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("CBS PATCH hatası:", error);
      return NextResponse.json(
        { error: "Durum güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS PATCH genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   PUT (DETAY GÜNCELLE)
========================= */
export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);
    const { category, assignedTo, resolutionNote, priority } = body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: "ID zorunludur." },
        { status: 400 }
      );
    }

    const allowedPriorities = ["low", "normal", "high", "critical"];
    if (priority && !allowedPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Geçersiz öncelik değeri." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      category: category ?? null,
      assigned_to: assignedTo ?? null,
      resolution_note: resolutionNote ?? null,
      updated_at: new Date().toISOString(),
    };

    if (priority) {
      updatePayload.priority = priority;
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("CBS PUT hatası:", error);
      return NextResponse.json(
        { error: "Güncelleme yapılamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS PUT genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */
export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID zorunludur." },
        { status: 400 }
      );
    }

    const record = await getAuthorizedRecord(id, session);
    if (!record) {
      return NextResponse.json(
        { error: "Bu kayıt için yetkiniz yok." },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("cbs_forms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("CBS DELETE hatası:", error);
      return NextResponse.json(
        { error: "Kayıt silinemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CBS DELETE genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
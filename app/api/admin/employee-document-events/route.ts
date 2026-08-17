import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function isAdminAllowed(role?: string) {
  return role === "super_admin" || role === "company_admin";
}

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value;
  const adminRole =
    cookieStore.get("dsec_admin_role")?.value;

  if (
    adminAuth !== "ok" ||
    !isAdminAllowed(adminRole)
  ) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);

  const firmId = clean(
    url.searchParams.get("firmId")
  );

  const assignmentId = clean(
    url.searchParams.get("assignmentId")
  );

  const eventType = clean(
    url.searchParams.get("eventType")
  );

  const limitRaw = Number(
    url.searchParams.get("limit") || 500
  );

  const limit = Math.max(
    1,
    Math.min(2000, limitRaw)
  );

  const supabase = getSupabase();

  let query = supabase
    .from("employee_document_events")
    .select(
      "id,assignment_id,session_id,document_id,firm_id,employee_id,event_type,page_no,active_seconds_delta,total_open_seconds_delta,metadata,occurred_at"
    )
    .order("occurred_at", {
      ascending: false,
    })
    .limit(limit);

  if (firmId && firmId !== "all") {
    query = query.eq(
      "firm_id",
      firmId
    );
  }

  if (assignmentId) {
    query = query.eq(
      "assignment_id",
      assignmentId
    );
  }

  if (eventType && eventType !== "all") {
    query = query.eq(
      "event_type",
      eventType
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        error:
          "İşlem logları alınamadı.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data || [],
  });
}
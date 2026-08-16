import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function makeCode() {
  const year = new Date().getFullYear();
  const token = randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `DSEC-DOC-${year}-${token}`;
}

async function getIdentity() {
  const cookieStore = await cookies();
  const auth = clean(cookieStore.get("dsec_user_auth")?.value);
  const role = clean(cookieStore.get("dsec_user_role")?.value);
  const userId = clean(cookieStore.get("dsec_user_id")?.value);

  if (auth !== "ok" || role !== "training_user" || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id,employee_id")
    .eq("id", userId)
    .maybeSingle();

  const employeeId = clean(user?.employee_id);

  if (!employeeId) return null;

  return {
    userId,
    employeeId,
  };
}

export async function POST(request: Request) {
  const identity = await getIdentity();

  if (!identity) {
    return NextResponse.json(
      { error: "Oturum bulunamadı." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const assignmentId = clean(body.assignmentId);

  if (!assignmentId) {
    return NextResponse.json(
      { error: "assignmentId zorunludur." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data: assignment, error } = await supabase
    .from("employee_document_assignments")
    .select(
      "id,document_id,firm_id,employee_id,status,reading_completed_at,acknowledgement_at,acknowledgement_code,document_version_no,document_sha256_hash,is_cancelled"
    )
    .eq("id", assignmentId)
    .eq("employee_id", identity.employeeId)
    .eq("is_cancelled", false)
    .maybeSingle();

  if (error || !assignment) {
    return NextResponse.json(
      {
        error: "Belge ataması bulunamadı.",
        detail: error?.message,
      },
      { status: error ? 500 : 404 }
    );
  }

  const { data: document, error: docError } = await supabase
    .from("employee_documents")
    .select(
      "id,requires_acknowledgement,reading_policy,min_active_read_seconds,require_last_page,require_all_pages,page_count"
    )
    .eq("id", assignment.document_id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (docError || !document) {
    return NextResponse.json(
      {
        error: "Belge bulunamadı.",
        detail: docError?.message,
      },
      { status: docError ? 500 : 404 }
    );
  }

  if (assignment.acknowledgement_at) {
    return NextResponse.json({
      success: true,
      alreadyAcknowledged: true,
      acknowledgementCode:
        assignment.acknowledgement_code,
      acknowledgementAt:
        assignment.acknowledgement_at,
    });
  }

  if (!assignment.reading_completed_at) {
    return NextResponse.json(
      {
        error:
          "Belge okuma şartları tamamlanmadan onay verilemez.",
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  await supabase
    .from("employee_document_events")
    .insert({
      assignment_id: assignment.id,
      document_id: assignment.document_id,
      firm_id: assignment.firm_id,
      employee_id: identity.employeeId,
      event_type: "ACKNOWLEDGEMENT_CHECKED",
      metadata: {},
      occurred_at: now,
    });

  if (document.requires_acknowledgement === false) {
    await supabase
      .from("employee_document_assignments")
      .update({
        status: "READ",
      })
      .eq("id", assignment.id);

    return NextResponse.json({
      success: true,
      acknowledgementRequired: false,
    });
  }

  let code = makeCode();

  for (let i = 0; i < 5; i += 1) {
    const { data: existing } = await supabase
      .from("employee_document_assignments")
      .select("id")
      .eq("acknowledgement_code", code)
      .maybeSingle();

    if (!existing) break;
    code = makeCode();
  }

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    null;

  const userAgent =
    request.headers.get("user-agent") || null;

  const { error: updateError } = await supabase
    .from("employee_document_assignments")
    .update({
      status: "ACKNOWLEDGED",
      acknowledgement_at: now,
      acknowledgement_code: code,
      acknowledgement_ip: ip,
      acknowledgement_user_agent: userAgent,
    })
    .eq("id", assignment.id);

  if (updateError) {
    return NextResponse.json(
      {
        error: "Belge onayı kaydedilemedi.",
        detail: updateError.message,
      },
      { status: 500 }
    );
  }

  await supabase
    .from("employee_document_events")
    .insert({
      assignment_id: assignment.id,
      document_id: assignment.document_id,
      firm_id: assignment.firm_id,
      employee_id: identity.employeeId,
      event_type: "DOCUMENT_ACKNOWLEDGED",
      metadata: {
        acknowledgementCode: code,
        documentVersionNo:
          assignment.document_version_no,
        documentSha256Hash:
          assignment.document_sha256_hash,
      },
      occurred_at: now,
    });

  return NextResponse.json({
    success: true,
    acknowledgementRequired: true,
    acknowledgementCode: code,
    acknowledgementAt: now,
  });
}
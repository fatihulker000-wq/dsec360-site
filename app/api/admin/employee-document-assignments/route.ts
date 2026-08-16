import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAdminAllowed(role?: string) {
  return role === "super_admin" || role === "company_admin";
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  if (adminAuth !== "ok" || !isAdminAllowed(adminRole)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true as const,
    role: adminRole || "",
  };
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

type TargetType =
  | "ALL"
  | "DEPARTMENT"
  | "JOB_TITLE"
  | "MULTI_PERSON"
  | "PERSON";

function normalizeTargetType(value: unknown): TargetType {
  const raw = text(value).toUpperCase();

  if (
    raw === "ALL" ||
    raw === "DEPARTMENT" ||
    raw === "JOB_TITLE" ||
    raw === "MULTI_PERSON" ||
    raw === "PERSON"
  ) {
    return raw;
  }

  return "PERSON";
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const firmId = text(url.searchParams.get("firmId"));
  const documentId = text(url.searchParams.get("documentId"));
  const status = text(url.searchParams.get("status"));

  const supabase = getSupabase();

  let query = supabase
    .from("employee_document_assignment_summary")
    .select("*")
    .order("assigned_at", { ascending: false });

  if (firmId && firmId !== "all") {
    query = query.eq("firm_id", firmId);
  }

  if (documentId && documentId !== "all") {
    query = query.eq("document_id", documentId);
  }

  if (status && status !== "all") {
    query = query.eq("effective_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: "Belge gönderimleri alınamadı.",
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

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));

  const documentId = text(body.documentId);
  const firmId = text(body.firmId);
  const targetType = normalizeTargetType(body.targetType);
  const department = text(body.department);
  const jobTitle = text(body.jobTitle);
  const dueAt = text(body.dueAt);
  const requestedEmployeeIds = Array.isArray(body.employeeIds)
    ? body.employeeIds
        .map((value: unknown) => text(value))
        .filter(Boolean)
    : [];

  if (!documentId || !firmId) {
    return NextResponse.json(
      { error: "Belge ve firma seçimi zorunludur." },
      { status: 400 }
    );
  }

  if (targetType === "DEPARTMENT" && !department) {
    return NextResponse.json(
      { error: "Departman seçimi zorunludur." },
      { status: 400 }
    );
  }

  if (targetType === "JOB_TITLE" && !jobTitle) {
    return NextResponse.json(
      { error: "Görev / kadro seçimi zorunludur." },
      { status: 400 }
    );
  }

  if (
    (targetType === "PERSON" || targetType === "MULTI_PERSON") &&
    requestedEmployeeIds.length === 0
  ) {
    return NextResponse.json(
      { error: "En az bir çalışan seçilmelidir." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data: document, error: documentError } = await supabase
    .from("employee_documents")
    .select(
      "id,firm_id,title,status,version_no,sha256_hash,is_deleted"
    )
    .eq("id", documentId)
    .eq("firm_id", firmId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (documentError) {
    return NextResponse.json(
      {
        error: "Belge kontrol edilemedi.",
        detail: documentError.message,
      },
      { status: 500 }
    );
  }

  if (!document) {
    return NextResponse.json(
      { error: "Belge bulunamadı." },
      { status: 404 }
    );
  }

  if (document.status !== "PUBLISHED") {
    return NextResponse.json(
      {
        error:
          "Çalışanlara yalnızca yayınlanmış belgeler gönderilebilir.",
      },
      { status: 409 }
    );
  }

  let employeeQuery = supabase
    .from("employees")
    .select(
      "id,firm_id,full_name,email,department,job_title,registry_no,active"
    )
    .eq("firm_id", firmId)
    .eq("active", true);

  if (targetType === "DEPARTMENT") {
    employeeQuery = employeeQuery.eq("department", department);
  }

  if (targetType === "JOB_TITLE") {
    employeeQuery = employeeQuery.eq("job_title", jobTitle);
  }

  if (
    targetType === "PERSON" ||
    targetType === "MULTI_PERSON"
  ) {
    employeeQuery = employeeQuery.in("id", requestedEmployeeIds);
  }

  const { data: employees, error: employeeError } =
    await employeeQuery.order("full_name", { ascending: true });

  if (employeeError) {
    return NextResponse.json(
      {
        error: "Çalışanlar alınamadı.",
        detail: employeeError.message,
      },
      { status: 500 }
    );
  }

  const selectedEmployees = Array.isArray(employees)
    ? employees
    : [];

  if (selectedEmployees.length === 0) {
    return NextResponse.json(
      { error: "Seçim kriterlerine uyan aktif çalışan bulunamadı." },
      { status: 404 }
    );
  }

  const employeeIds = selectedEmployees.map((employee) =>
    String(employee.id)
  );

  const { data: existingAssignments, error: existingError } =
    await supabase
      .from("employee_document_assignments")
      .select("employee_id")
      .eq("document_id", documentId)
      .in("employee_id", employeeIds);

  if (existingError) {
    return NextResponse.json(
      {
        error: "Mevcut belge atamaları kontrol edilemedi.",
        detail: existingError.message,
      },
      { status: 500 }
    );
  }

  const alreadyAssigned = new Set(
    (existingAssignments || []).map((item) =>
      String(item.employee_id)
    )
  );

  const newEmployees = selectedEmployees.filter(
    (employee) => !alreadyAssigned.has(String(employee.id))
  );

  if (newEmployees.length === 0) {
    return NextResponse.json(
      {
        success: true,
        inserted: 0,
        skipped: selectedEmployees.length,
        noEmail: selectedEmployees.filter(
          (employee) => !text(employee.email)
        ).length,
        message:
          "Seçilen çalışanların tamamına bu belge daha önce atanmış.",
      }
    );
  }

  const batchId = randomUUID();
  const assignedAt = new Date().toISOString();

  const assignments = newEmployees.map((employee) => ({
    document_id: documentId,
    firm_id: firmId,
    assignment_batch_id: batchId,

    employee_id: String(employee.id),
    employee_full_name: text(employee.full_name) || "Çalışan",
    employee_email: text(employee.email) || null,
    department: text(employee.department) || null,
    job_title: text(employee.job_title) || null,
    registry_no: text(employee.registry_no) || null,

    target_type: targetType,

    assigned_by: auth.role,
    assigned_at: assignedAt,
    due_at: dueAt || null,

    status: "ASSIGNED",
    email_status: text(employee.email) ? "PENDING" : "NOT_REQUIRED",

    document_version_no: Math.max(
      1,
      Number(document.version_no || 1)
    ),
    document_sha256_hash:
      text(document.sha256_hash) || null,
  }));

  const { data: insertedRows, error: insertError } =
    await supabase
      .from("employee_document_assignments")
      .insert(assignments)
      .select(
        "id,document_id,firm_id,employee_id,employee_email,assignment_batch_id"
      );

  if (insertError) {
    return NextResponse.json(
      {
        error: "Belge çalışanlara atanamadı.",
        detail: insertError.message,
      },
      { status: 500 }
    );
  }

  const rows = insertedRows || [];

  if (rows.length > 0) {
    const events = rows.map((row) => ({
      assignment_id: row.id,
      document_id: row.document_id,
      firm_id: row.firm_id,
      employee_id: row.employee_id,
      event_type: "ASSIGNED",
      metadata: {
        assignmentBatchId: row.assignment_batch_id,
        targetType,
        department: department || null,
        jobTitle: jobTitle || null,
        documentTitle: document.title,
      },
      occurred_at: assignedAt,
    }));

    const { error: eventError } = await supabase
      .from("employee_document_events")
      .insert(events);

    if (eventError) {
      console.error(
        "Employee document ASSIGNED log error:",
        eventError.message
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      batchId,
      inserted: rows.length,
      skipped:
        selectedEmployees.length - newEmployees.length,
      noEmail: newEmployees.filter(
        (employee) => !text(employee.email)
      ).length,
      totalMatched: selectedEmployees.length,
      message:
        "Belge ataması oluşturuldu. E-posta gönderimi sonraki pakette devreye alınacaktır.",
    },
    { status: 201 }
  );
}
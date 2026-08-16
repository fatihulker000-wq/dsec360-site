import crypto, { randomBytes, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex");
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

function isValidEmail(value: unknown) {
  const email = text(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: unknown) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = `${upper}${lower}${digits}`;

  const pick = (source: string) =>
    source[Math.floor(Math.random() * source.length)];

  return [
    pick(upper),
    pick(lower),
    pick(digits),
    ...Array.from({ length: 7 }, () => pick(all)),
  ]
    .sort(() => Math.random() - 0.5)
    .join("");
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

type EmployeeRow = {
  id: string;
  firm_id: string | null;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  registry_no: string | null;
  active: boolean | null;
};

type PortalUserResult = {
  userId: string | null;
  tempPassword: string | null;
  isNewUser: boolean;
  error?: string;
};

async function ensurePortalUser(
  employee: EmployeeRow,
  firmId: string
): Promise<PortalUserResult> {
  const supabase = getSupabase();

  const employeeId = text(employee.id);
  const email = text(employee.email).toLowerCase();

  if (!employeeId) {
    return {
      userId: null,
      tempPassword: null,
      isNewUser: false,
      error: "Çalışan kimliği bulunamadı.",
    };
  }

  // 1) Önce çalışan bağlantısı üzerinden mevcut kullanıcı.
  const byEmployee = await supabase
    .from("users")
    .select("id,employee_id,email,role,is_active")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (byEmployee.data?.id) {
    return {
      userId: String(byEmployee.data.id),
      tempPassword: null,
      isNewUser: false,
    };
  }

  // 2) Eğitim portalında aynı e-posta ile kullanıcı varsa onu çalışana bağla.
  if (isValidEmail(email)) {
    const byEmail = await supabase
      .from("users")
      .select("id,employee_id,email,role,is_active")
      .ilike("email", email)
      .maybeSingle();

    if (byEmail.data?.id) {
      const userId = String(byEmail.data.id);

      const { error: linkError } = await supabase
        .from("users")
        .update({
          employee_id: employeeId,
          company_id: firmId,
          role: "training_user",
          is_active: true,
        })
        .eq("id", userId);

      if (linkError) {
        return {
          userId: null,
          tempPassword: null,
          isNewUser: false,
          error: linkError.message,
        };
      }

      return {
        userId,
        tempPassword: null,
        isNewUser: false,
      };
    }
  }

  // 3) İlk defa portala girecek çalışan: kullanıcı + geçici şifre oluştur.
  if (!isValidEmail(email)) {
    return {
      userId: null,
      tempPassword: null,
      isNewUser: false,
      error: "Geçerli e-posta adresi bulunamadı.",
    };
  }

  const tempPassword = generatePassword();

  const { data: created, error: createError } = await supabase
    .from("users")
    .insert({
      employee_id: employeeId,
      full_name: text(employee.full_name) || "Çalışan",
      email,
      password_hash: sha256(tempPassword),
      role: "training_user",
      company_id: firmId,
      is_active: true,
    })
    .select("id")
    .single();

  if (createError || !created?.id) {
    return {
      userId: null,
      tempPassword: null,
      isNewUser: false,
      error:
        createError?.message ||
        "Portal kullanıcısı oluşturulamadı.",
    };
  }

  return {
    userId: String(created.id),
    tempPassword,
    isNewUser: true,
  };
}

async function sendDocumentInviteEmail(params: {
  to: string;
  fullName: string;
  documentTitle: string;
  dueAt?: string | null;
  tempPassword?: string | null;
  isNewUser: boolean;
  accessToken: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dsec360.com";

  if (!apiKey || !emailFrom) {
    return {
      ok: false,
      reason:
        "RESEND_API_KEY veya EMAIL_FROM ortam değişkeni eksik.",
      messageId: null as string | null,
    };
  }

  const portalUrl =
    `${appUrl.replace(/\/$/, "")}/api/employee-documents/access?token=${encodeURIComponent(
      params.accessToken
    )}`;

  const dueText = params.dueAt
    ? new Date(params.dueAt).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Son tarih tanımlanmadı";

  const passwordArea = `
    <div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;color:#1e40af;font-size:13px;line-height:1.6;">
      Bu bağlantı size özel güvenli erişim bağlantısıdır. Butona bastığınızda kullanıcı adı veya şifre girmeden doğrudan size atanmış belge açılır.
    </div>
  `;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:30px;color:#111827;">
      <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(0,0,0,.08);">
        <div style="background:linear-gradient(135deg,#312e81,#6d28d9);padding:26px;text-align:center;">
          <div style="font-size:25px;font-weight:900;color:#fff;">D-SEC</div>
          <div style="font-size:13px;color:#ddd6fe;margin-top:6px;">Çalışan Belge Yönetimi</div>
        </div>

        <div style="padding:30px 28px;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f5f3ff;border:1px solid #ddd6fe;color:#6d28d9;font-size:12px;font-weight:800;">
            Yeni Belge Ataması
          </div>

          <p style="font-size:15px;line-height:1.8;margin:18px 0 8px;">
            Merhaba <strong>${escapeHtml(params.fullName)}</strong>,
          </p>

          <p style="font-size:14px;line-height:1.8;color:#374151;">
            D-SEC Çalışan Portalı üzerinden tarafınıza okunması ve elektronik olarak onaylanması gereken bir belge atanmıştır.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:18px 0;">
            <div style="font-size:12px;color:#6b7280;">Belge</div>
            <div style="font-size:19px;font-weight:900;color:#111827;margin-top:5px;">
              ${escapeHtml(params.documentTitle)}
            </div>

            <div style="font-size:12px;color:#6b7280;margin-top:15px;">Son Okuma / Onay Tarihi</div>
            <div style="font-size:14px;font-weight:800;color:#374151;margin-top:5px;">
              ${escapeHtml(dueText)}
            </div>
          </div>

          ${passwordArea}

          <div style="margin-top:22px;">
            <a href="${escapeHtml(portalUrl)}"
              style="display:inline-block;background:#6d28d9;color:#fff;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:900;font-size:14px;">
              Belgeyi Görüntüle
            </a>
          </div>

          <p style="font-size:12px;line-height:1.7;color:#6b7280;margin-top:18px;">
            Portalda “Belgelerim” alanından size atanmış tüm belgeleri görebilirsiniz.
          </p>
        </div>

        <div style="background:#f9fafb;padding:17px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          © ${new Date().getFullYear()} D-SEC • www.dsec360.com
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [params.to],
          subject: `D-SEC Belge Ataması: ${params.documentTitle}`,
          html,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        reason:
          data?.message ||
          data?.error ||
          `Mail gönderilemedi. HTTP ${response.status}`,
        messageId: null,
      };
    }

    return {
      ok: true,
      reason: null,
      messageId: text(data?.id) || null,
    };
  } catch (cause) {
    return {
      ok: false,
      reason:
        cause instanceof Error
          ? cause.message
          : "Mail servisine bağlanılamadı.",
      messageId: null,
    };
  }
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
    ? body.employeeIds.map((value: unknown) => text(value)).filter(Boolean)
    : [];

  if (!documentId || !firmId) {
    return NextResponse.json(
      { error: "Belge ve firma seçimi zorunludur." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data: document, error: documentError } =
    await supabase
      .from("employee_documents")
      .select(
        "id,firm_id,title,status,version_no,sha256_hash,is_deleted"
      )
      .eq("id", documentId)
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json(
      {
        error: documentError
          ? "Belge kontrol edilemedi."
          : "Belge bulunamadı.",
        detail: documentError?.message,
      },
      { status: documentError ? 500 : 404 }
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
      "id,firm_id,full_name,email,job_title,registry_no,active"
    )
    .eq("firm_id", firmId)
    .eq("active", true);

  if (targetType === "DEPARTMENT") {
    return NextResponse.json(
      {
        error:
          "Mevcut employees tablosunda departman alanı bulunmuyor. Şimdilik görev/kadro, tek çalışan, çoklu çalışan veya tüm çalışanlar seçimini kullanın.",
        code: "DEPARTMENT_FIELD_NOT_AVAILABLE",
      },
      { status: 409 }
    );
  }

  if (targetType === "JOB_TITLE") {
    if (!jobTitle) {
      return NextResponse.json(
        { error: "Görev / kadro seçimi zorunludur." },
        { status: 400 }
      );
    }
    employeeQuery = employeeQuery.eq("job_title", jobTitle);
  }

  if (
    targetType === "PERSON" ||
    targetType === "MULTI_PERSON"
  ) {
    if (requestedEmployeeIds.length === 0) {
      return NextResponse.json(
        { error: "En az bir çalışan seçilmelidir." },
        { status: 400 }
      );
    }
    employeeQuery = employeeQuery.in("id", requestedEmployeeIds);
  }

  const { data: employees, error: employeeError } =
    await employeeQuery.order("full_name", {
      ascending: true,
    });

  if (employeeError) {
    return NextResponse.json(
      {
        error: "Çalışanlar alınamadı.",
        detail: employeeError.message,
      },
      { status: 500 }
    );
  }

  const selectedEmployees = (employees || []) as EmployeeRow[];

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
        error: "Mevcut atamalar kontrol edilemedi.",
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
    (employee) =>
      !alreadyAssigned.has(String(employee.id))
  );

  if (newEmployees.length === 0) {
    return NextResponse.json({
      success: true,
      inserted: 0,
      skipped: selectedEmployees.length,
      emailed: 0,
      mailFailed: 0,
      noEmail: selectedEmployees.filter(
        (employee) => !isValidEmail(employee.email)
      ).length,
      message:
        "Seçilen çalışanların tamamına bu belge daha önce atanmış.",
    });
  }

  const batchId = randomUUID();
  const assignedAt = new Date().toISOString();

  const prepared: Array<{
    employee: EmployeeRow;
    user: PortalUserResult;
  }> = [];

  for (const employee of newEmployees) {
    prepared.push({
      employee,
      user: await ensurePortalUser(employee, firmId),
    });
  }

  const assignments = prepared.map(({ employee, user }) => ({
    document_id: documentId,
    firm_id: firmId,
    assignment_batch_id: batchId,

    employee_id: String(employee.id),
    portal_user_id: user.userId,

    employee_full_name:
      text(employee.full_name) || "Çalışan",
    employee_email:
      text(employee.email).toLowerCase() || null,
    department: null,
    job_title: text(employee.job_title) || null,
    registry_no: text(employee.registry_no) || null,

    target_type: targetType,

    assigned_by: auth.role,
    assigned_at: assignedAt,
    due_at: dueAt || null,

    status: "ASSIGNED",

    email_status:
      isValidEmail(employee.email) && user.userId
        ? "QUEUED"
        : "NOT_REQUIRED",

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
        "id,document_id,firm_id,employee_id,portal_user_id,employee_email,employee_full_name,assignment_batch_id,due_at"
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

  // ASSIGNED audit log
  if (rows.length > 0) {
    await supabase
      .from("employee_document_events")
      .insert(
        rows.map((row) => ({
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
        }))
      );
  }

  let emailed = 0;
  let mailFailed = 0;
  let noEmail = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const source = prepared[index];

    if (
      !source ||
      !row ||
      !isValidEmail(source.employee.email) ||
      !source.user.userId
    ) {
      noEmail += 1;

      await supabase
        .from("employee_document_assignments")
        .update({
          email_status: "NOT_REQUIRED",
          email_last_attempt_at:
            new Date().toISOString(),
          email_error:
            source?.user.error ||
            "Geçerli e-posta veya portal kullanıcısı yok.",
        })
        .eq("id", row.id);

      continue;
    }

    const attemptAt = new Date().toISOString();

    const accessToken = randomBytes(32).toString("hex");
    const accessTokenHash = sha256(accessToken);

    const dueMs = row.due_at
      ? new Date(row.due_at).getTime()
      : 0;

    const fallbackExpiry =
      Date.now() + 7 * 24 * 60 * 60 * 1000;

    const accessExpiresAt =
      new Date(
        Math.max(
          dueMs > Date.now()
            ? dueMs
            : 0,
          fallbackExpiry
        )
      ).toISOString();

    await supabase
      .from("employee_document_assignments")
      .update({
        portal_access_token_hash:
          accessTokenHash,
        portal_access_token_expires_at:
          accessExpiresAt,
      })
      .eq("id", row.id);

    await supabase
      .from("employee_document_events")
      .insert({
        assignment_id: row.id,
        document_id: row.document_id,
        firm_id: row.firm_id,
        employee_id: row.employee_id,
        event_type: "EMAIL_QUEUED",
        metadata: {},
        occurred_at: attemptAt,
      });

    const mail = await sendDocumentInviteEmail({
      to: text(source.employee.email).toLowerCase(),
      fullName:
        text(source.employee.full_name) || "Çalışan",
      documentTitle: text(document.title) || "D-SEC Belgesi",
      dueAt: row.due_at,
      tempPassword: source.user.tempPassword,
      isNewUser: source.user.isNewUser,
      accessToken,
    });

    if (mail.ok) {
      emailed += 1;

      await supabase
        .from("employee_document_assignments")
        .update({
          email_status: "SENT",
          email_sent_at: attemptAt,
          email_last_attempt_at: attemptAt,
          email_message_id: mail.messageId,
          email_error: null,
          status: "SENT",
        })
        .eq("id", row.id);

      await supabase
        .from("employee_document_events")
        .insert({
          assignment_id: row.id,
          document_id: row.document_id,
          firm_id: row.firm_id,
          employee_id: row.employee_id,
          event_type: "EMAIL_SENT",
          metadata: {
            messageId: mail.messageId,
          },
          occurred_at: attemptAt,
        });
    } else {
      mailFailed += 1;

      await supabase
        .from("employee_document_assignments")
        .update({
          email_status: "FAILED",
          email_last_attempt_at: attemptAt,
          email_error: mail.reason,
        })
        .eq("id", row.id);

      await supabase
        .from("employee_document_events")
        .insert({
          assignment_id: row.id,
          document_id: row.document_id,
          firm_id: row.firm_id,
          employee_id: row.employee_id,
          event_type: "EMAIL_FAILED",
          metadata: {
            reason: mail.reason,
          },
          occurred_at: attemptAt,
        });
    }
  }

  return NextResponse.json(
    {
      success: true,
      batchId,
      inserted: rows.length,
      skipped:
        selectedEmployees.length - newEmployees.length,
      emailed,
      mailFailed,
      noEmail,
      totalMatched: selectedEmployees.length,
      message:
        "Belge atamaları oluşturuldu ve e-posta gönderimleri işlendi.",
    },
    { status: 201 }
  );
}
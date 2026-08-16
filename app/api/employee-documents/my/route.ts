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

type PortalIdentity = {
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  companyId: string;
};

type AssignmentRow = {
  id: string;
  document_id: string;
  firm_id: string;
  employee_id: string | null;
  portal_user_id: string | null;
  employee_full_name: string | null;
  employee_email: string | null;
  job_title: string | null;
  assigned_at: string;
  due_at: string | null;
  status: string;
  email_status: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  opened_count: number | null;
  total_open_seconds: number | null;
  active_read_seconds: number | null;
  last_page_viewed: number | null;
  pages_viewed: number[] | null;
  reading_completed_at: string | null;
  acknowledgement_at: string | null;
  acknowledgement_code: string | null;
  document_version_no: number | null;
  document_sha256_hash: string | null;
};

type DocumentRow = {
  id: string;
  title: string | null;
  document_type: string | null;
  description: string | null;
  file_name: string | null;
  mime_type: string | null;
  version_no: number | null;
  version_label: string | null;
  status: string | null;
  requires_acknowledgement: boolean | null;
  reading_policy: string | null;
  min_active_read_seconds: number | null;
  require_last_page: boolean | null;
  require_all_pages: boolean | null;
  page_count: number | null;
};

async function getPortalIdentity(): Promise<
  | { ok: true; identity: PortalIdentity }
  | {
      ok: false;
      status: number;
      error: string;
      detail?: string;
    }
> {
  const cookieStore = await cookies();

  const auth = clean(
    cookieStore.get("dsec_user_auth")?.value
  );
  const role = clean(
    cookieStore.get("dsec_user_role")?.value
  );
  const userId = clean(
    cookieStore.get("dsec_user_id")?.value
  );
  const cookieEmail = clean(
    cookieStore.get("dsec_user_email")?.value
  ).toLowerCase();

  if (
    auth !== "ok" ||
    role !== "training_user" ||
    !userId
  ) {
    return {
      ok: false,
      status: 401,
      error: "Oturum bulunamadı.",
    };
  }

  const supabase = getSupabase();

  const { data: user, error: userError } =
    await supabase
      .from("users")
      .select(
        "id,employee_id,full_name,email,company_id,role,is_active"
      )
      .eq("id", userId)
      .maybeSingle();

  if (userError) {
    return {
      ok: false,
      status: 500,
      error: "Portal kullanıcı bilgisi alınamadı.",
      detail: userError.message,
    };
  }

  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Portal kullanıcısı bulunamadı.",
    };
  }

  let employeeId = clean(user.employee_id);
  const email =
    clean(user.email).toLowerCase() || cookieEmail;
  const companyId = clean(user.company_id);

  if (!employeeId && email) {
    let employeeQuery = supabase
      .from("employees")
      .select("id,firm_id,full_name,email")
      .ilike("email", email)
      .neq("active", false);

    if (companyId) {
      employeeQuery = employeeQuery.eq(
        "firm_id",
        companyId
      );
    }

    const {
      data: employeeRows,
      error: employeeError,
    } = await employeeQuery.limit(10);

    if (!employeeError) {
      const employee = employeeRows?.[0];

      if (employee?.id) {
        employeeId = String(employee.id);

        await supabase
          .from("users")
          .update({
            employee_id: employeeId,
          })
          .eq("id", userId);
      }
    }
  }

  return {
    ok: true,
    identity: {
      userId,
      employeeId,
      fullName:
        clean(user.full_name) || "Çalışan",
      email,
      companyId,
    },
  };
}

export async function GET() {
  try {
    const identityResult =
      await getPortalIdentity();

    if (!identityResult.ok) {
      return NextResponse.json(
        {
          error: identityResult.error,
          detail: identityResult.detail,
          code:
            identityResult.status === 401
              ? "AUTH_REQUIRED"
              : "IDENTITY_ERROR",
        },
        {
          status: identityResult.status,
        }
      );
    }

    const identity = identityResult.identity;
    const supabase = getSupabase();

    const filters: string[] = [];

    filters.push(
      `portal_user_id.eq.${identity.userId}`
    );

    if (identity.employeeId) {
      filters.push(
        `employee_id.eq.${identity.employeeId}`
      );
    }

    if (identity.email) {
      filters.push(
        `employee_email.ilike.${identity.email}`
      );
    }

    const { data: assignmentData, error } =
      await supabase
        .from("employee_document_assignments")
        .select(
          "id,document_id,firm_id,employee_id,portal_user_id,employee_full_name,employee_email,job_title,assigned_at,due_at,status,email_status,first_opened_at,last_opened_at,opened_count,total_open_seconds,active_read_seconds,last_page_viewed,pages_viewed,reading_completed_at,acknowledgement_at,acknowledgement_code,document_version_no,document_sha256_hash"
        )
        .or(filters.join(","))
        .eq("is_cancelled", false)
        .order("assigned_at", {
          ascending: false,
        });

    if (error) {
      return NextResponse.json(
        {
          error: "Belgeleriniz alınamadı.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    const assignments =
      (assignmentData || []) as AssignmentRow[];

    const documentIds = Array.from(
      new Set(
        assignments
          .map((row) => clean(row.document_id))
          .filter(Boolean)
      )
    );

    let documents: DocumentRow[] = [];

    if (documentIds.length > 0) {
      const {
        data: documentData,
        error: documentError,
      } = await supabase
        .from("employee_documents")
        .select(
          "id,title,document_type,description,file_name,mime_type,version_no,version_label,status,requires_acknowledgement,reading_policy,min_active_read_seconds,require_last_page,require_all_pages,page_count"
        )
        .in("id", documentIds)
        .eq("is_deleted", false);

      if (documentError) {
        return NextResponse.json(
          {
            error:
              "Belge detayları alınamadı.",
            detail:
              documentError.message,
          },
          { status: 500 }
        );
      }

      documents =
        (documentData || []) as DocumentRow[];
    }

    const documentMap = new Map<
      string,
      DocumentRow
    >(
      documents.map((document) => [
        clean(document.id),
        document,
      ])
    );

    const now = Date.now();

    const data = assignments
      .map((assignment) => {
        const document = documentMap.get(
          clean(assignment.document_id)
        );

        if (!document) {
          return null;
        }

        const dueMs = assignment.due_at
          ? new Date(
              assignment.due_at
            ).getTime()
          : 0;

        const effectiveStatus =
          assignment.acknowledgement_at
            ? "ACKNOWLEDGED"
            : dueMs > 0 && dueMs < now
            ? "OVERDUE"
            : assignment.reading_completed_at
            ? "READ"
            : assignment.first_opened_at
            ? "OPENED"
            : clean(assignment.status) ||
              "ASSIGNED";

        return {
          assignmentId: assignment.id,
          documentId:
            assignment.document_id,

          assignedAt:
            assignment.assigned_at,
          dueAt: assignment.due_at,
          status: effectiveStatus,

          firstOpenedAt:
            assignment.first_opened_at,
          lastOpenedAt:
            assignment.last_opened_at,
          openedCount: Number(
            assignment.opened_count || 0
          ),

          totalOpenSeconds: Number(
            assignment.total_open_seconds ||
              0
          ),
          activeReadSeconds: Number(
            assignment.active_read_seconds ||
              0
          ),

          lastPageViewed:
            assignment.last_page_viewed ==
            null
              ? null
              : Number(
                  assignment.last_page_viewed
                ),

          pagesViewed: Array.isArray(
            assignment.pages_viewed
          )
            ? assignment.pages_viewed.map(
                Number
              )
            : [],

          readingCompletedAt:
            assignment.reading_completed_at,
          acknowledgementAt:
            assignment.acknowledgement_at,
          acknowledgementCode:
            assignment.acknowledgement_code,

          title:
            clean(document.title) ||
            "Belge",
          documentType:
            clean(
              document.document_type
            ) || "DIGER",
          description: clean(
            document.description
          ),
          fileName: clean(
            document.file_name
          ),
          mimeType: clean(
            document.mime_type
          ),

          versionNo: Number(
            document.version_no || 1
          ),
          versionLabel: clean(
            document.version_label
          ),

          requiresAcknowledgement:
            document.requires_acknowledgement !==
            false,

          readingPolicy:
            clean(
              document.reading_policy
            ) || "CONTROLLED",

          minActiveReadSeconds:
            Number(
              document.min_active_read_seconds ||
                0
            ),

          requireLastPage:
            document.require_last_page !==
            false,

          requireAllPages:
            document.require_all_pages ===
            true,

          pageCount:
            document.page_count == null
              ? null
              : Number(
                  document.page_count
                ),
        };
      })
      .filter(
        (
          item
        ): item is NonNullable<
          typeof item
        > => item !== null
      );

    return NextResponse.json({
      success: true,
      profile: {
        userId: identity.userId,
        employeeId:
          identity.employeeId,
        fullName:
          identity.fullName,
        email: identity.email,
      },
      data,
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error: "Belgeleriniz alınamadı.",
        detail:
          cause instanceof Error
            ? cause.message
            : "Bilinmeyen sunucu hatası.",
      },
      { status: 500 }
    );
  }
}
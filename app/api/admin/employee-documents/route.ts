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
  return (
    role === "super_admin" ||
    role === "company_admin"
  );
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

function optionalText(value: unknown) {
  const result = text(value);
  return result || null;
}

function numberOrNull(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);

  const firmId = text(url.searchParams.get("firmId"));
  const status = text(url.searchParams.get("status"));
  const documentType = text(url.searchParams.get("documentType"));
  const search = text(url.searchParams.get("search"));

  const supabase = getSupabase();

  let query = supabase
    .from("employee_documents")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (firmId && firmId !== "all") {
    query = query.eq("firm_id", firmId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (documentType && documentType !== "all") {
    query = query.eq("document_type", documentType);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,document_type.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: "Çalışan belge havuzu alınamadı.",
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

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => ({}));

  const firmId = text(body.firmId);
  const title = text(body.title);
  const documentType = text(body.documentType) || "DIGER";
  const fileUrl = text(body.fileUrl);

  if (!firmId) {
    return NextResponse.json(
      { error: "Firma seçimi zorunludur." },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json(
      { error: "Belge adı zorunludur." },
      { status: 400 }
    );
  }

  if (!fileUrl) {
    return NextResponse.json(
      { error: "Belge dosyası / dosya URL bilgisi zorunludur." },
      { status: 400 }
    );
  }

  const readingPolicy =
    ["STANDARD", "CONTROLLED", "STRICT"].includes(
      text(body.readingPolicy)
    )
      ? text(body.readingPolicy)
      : "CONTROLLED";

  const status =
    ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(
      text(body.status)
    )
      ? text(body.status)
      : "DRAFT";

  const minActiveReadSeconds = Math.max(
    0,
    Number(body.minActiveReadSeconds || 0)
  );

  const pageCount = numberOrNull(body.pageCount);
  const defaultDueDays = numberOrNull(body.defaultDueDays);

  const payload = {
    firm_id: firmId,

    title,
    document_type: documentType,
    description: optionalText(body.description),

    file_url: fileUrl,
    file_name: optionalText(body.fileName),
    mime_type: optionalText(body.mimeType),
    file_size_bytes: numberOrNull(body.fileSizeBytes),

    sha256_hash: optionalText(body.sha256Hash),

    version_no: Math.max(
      1,
      Number(body.versionNo || 1)
    ),
    version_label: optionalText(body.versionLabel),
    previous_document_id:
      optionalText(body.previousDocumentId),

    status,

    requires_acknowledgement:
      body.requiresAcknowledgement !== false,

    reading_policy: readingPolicy,

    min_active_read_seconds:
      minActiveReadSeconds,

    require_last_page:
      body.requireLastPage !== false,

    require_all_pages:
      body.requireAllPages === true,

    page_count:
      pageCount === null
        ? null
        : Math.max(0, Math.floor(pageCount)),

    default_due_days:
      defaultDueDays === null
        ? null
        : Math.max(0, Math.floor(defaultDueDays)),

    created_by: auth.role,

    published_at:
      status === "PUBLISHED"
        ? new Date().toISOString()
        : null,
  };

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("employee_documents")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Çalışan belgesi oluşturulamadı.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: 201 }
  );
}
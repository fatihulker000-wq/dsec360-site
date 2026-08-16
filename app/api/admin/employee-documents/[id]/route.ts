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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Belge ID gerekli." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Belge alınamadı.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Belge bulunamadı." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (!id) {
    return NextResponse.json(
      { error: "Belge ID gerekli." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { data: existing, error: existingError } =
    await supabase
      .from("employee_documents")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      {
        error: "Belge kontrol edilemedi.",
        detail: existingError.message,
      },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Belge bulunamadı." },
      { status: 404 }
    );
  }

  const updatePayload: Record<string, unknown> = {};

  if ("title" in body) {
    const title = text(body.title);

    if (!title) {
      return NextResponse.json(
        { error: "Belge adı boş bırakılamaz." },
        { status: 400 }
      );
    }

    updatePayload.title = title;
  }

  if ("documentType" in body) {
    updatePayload.document_type =
      text(body.documentType) || "DIGER";
  }

  if ("description" in body) {
    updatePayload.description =
      optionalText(body.description);
  }

  if ("fileUrl" in body) {
    const fileUrl = text(body.fileUrl);

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Dosya URL boş bırakılamaz." },
        { status: 400 }
      );
    }

    updatePayload.file_url = fileUrl;
  }

  if ("fileName" in body) {
    updatePayload.file_name =
      optionalText(body.fileName);
  }

  if ("mimeType" in body) {
    updatePayload.mime_type =
      optionalText(body.mimeType);
  }

  if ("fileSizeBytes" in body) {
    updatePayload.file_size_bytes =
      numberOrNull(body.fileSizeBytes);
  }

  if ("sha256Hash" in body) {
    updatePayload.sha256_hash =
      optionalText(body.sha256Hash);
  }

  if ("versionLabel" in body) {
    updatePayload.version_label =
      optionalText(body.versionLabel);
  }

  if ("status" in body) {
    const status = text(body.status);

    if (
      !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Geçersiz belge durumu." },
        { status: 400 }
      );
    }

    updatePayload.status = status;

    if (
      status === "PUBLISHED" &&
      !existing.published_at
    ) {
      updatePayload.published_at =
        new Date().toISOString();
    }
  }

  if ("requiresAcknowledgement" in body) {
    updatePayload.requires_acknowledgement =
      body.requiresAcknowledgement !== false;
  }

  if ("readingPolicy" in body) {
    const policy = text(body.readingPolicy);

    if (
      !["STANDARD", "CONTROLLED", "STRICT"].includes(policy)
    ) {
      return NextResponse.json(
        { error: "Geçersiz okuma politikası." },
        { status: 400 }
      );
    }

    updatePayload.reading_policy = policy;
  }

  if ("minActiveReadSeconds" in body) {
    updatePayload.min_active_read_seconds =
      Math.max(
        0,
        Number(body.minActiveReadSeconds || 0)
      );
  }

  if ("requireLastPage" in body) {
    updatePayload.require_last_page =
      body.requireLastPage !== false;
  }

  if ("requireAllPages" in body) {
    updatePayload.require_all_pages =
      body.requireAllPages === true;
  }

  if ("pageCount" in body) {
    const pageCount = numberOrNull(body.pageCount);

    updatePayload.page_count =
      pageCount === null
        ? null
        : Math.max(0, Math.floor(pageCount));
  }

  if ("defaultDueDays" in body) {
    const defaultDueDays =
      numberOrNull(body.defaultDueDays);

    updatePayload.default_due_days =
      defaultDueDays === null
        ? null
        : Math.max(0, Math.floor(defaultDueDays));
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan bulunamadı." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("employee_documents")
    .update(updatePayload)
    .eq("id", id)
    .eq("is_deleted", false)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: "Belge güncellenemedi.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Belge ID gerekli." },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  const { count, error: assignmentError } =
    await supabase
      .from("employee_document_assignments")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("document_id", id)
      .eq("is_cancelled", false);

  if (assignmentError) {
    return NextResponse.json(
      {
        error: "Belge atamaları kontrol edilemedi.",
        detail: assignmentError.message,
      },
      { status: 500 }
    );
  }

  if ((count || 0) > 0) {
    return NextResponse.json(
      {
        error:
          "Bu belge çalışanlara atanmış. Denetim izi korunması için silinemez; arşivleyebilirsiniz.",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("employee_documents")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_deleted", false)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "Belge silinemedi.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Belge bulunamadı." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}
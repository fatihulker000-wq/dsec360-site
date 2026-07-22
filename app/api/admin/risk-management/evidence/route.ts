import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "risk-evidence";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

type EvidenceCategory =
  | "BEFORE"
  | "PROCESS"
  | "AFTER"
  | "DOCUMENT";

type EvidenceRow = {
  id: string;
  risk_id: string;
  firm_id: string;
  category: EvidenceCategory;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  is_deleted: boolean;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ENV bulunamadı.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getAdminContext() {
  const cookieStore = await cookies();

  const auth =
    cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value;

  const role =
    cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value;

  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  const userName =
    cookieStore.get("dsec_admin_name")?.value ||
    cookieStore.get("dsec_user_name")?.value ||
    role ||
    "D-SEC Kullanıcısı";

  return {
    allowed:
      auth === "ok" &&
      (role === "super_admin" ||
        role === "company_admin" ||
        role === "demo_user"),

    role,
    companyId,
    companyScoped:
      role === "company_admin" ||
      role === "demo_user",

    readOnly: role === "demo_user",
    userName,
  };
}

function safeFileName(value: string) {
  const extension = value.includes(".")
    ? `.${value.split(".").pop()}`
    : "";

  const base = value
    .replace(extension, "")
    .normalize("NFKD")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  return `${base || "file"}${extension.toLowerCase()}`;
}

function validCategory(
  value: string
): value is EvidenceCategory {
  return [
    "BEFORE",
    "PROCESS",
    "AFTER",
    "DOCUMENT",
  ].includes(value);
}

function toClientRow(
  row: EvidenceRow,
  signedUrl: string
) {
  return {
    id: row.id,
    riskId: row.risk_id,
    firmId: row.firm_id,
    category: row.category,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    description: row.description || "",
    uploadedBy: row.uploaded_by || "",
    createdAt: row.created_at,
    signedUrl,
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);

    const riskId = String(
      url.searchParams.get("riskId") || ""
    ).trim();

    if (!riskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let query = supabase
      .from("risk_evidence")
      .select("*")
      .eq("risk_id", riskId)
      .eq("is_deleted", false)
      .order("created_at", {
        ascending: false,
      });

    if (ctx.companyScoped) {
      query = query.eq(
        "firm_id",
        ctx.companyId
      );
    }

    const { data, error } =
      await query.returns<EvidenceRow[]>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const items = await Promise.all(
      (data || []).map(async (row) => {
        const { data: signedData } =
          await supabase.storage
            .from(BUCKET)
            .createSignedUrl(
              row.storage_path,
              60 * 60
            );

        return toClientRow(
          row,
          signedData?.signedUrl || ""
        );
      })
    );

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error(
      "risk evidence GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Risk kanıtları okunamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı dosya yükleyemez.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const riskId = String(
      formData.get("riskId") || ""
    ).trim();

    const requestedFirmId = String(
      formData.get("firmId") || ""
    ).trim();

    const category = String(
      formData.get("category") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    const fileValue = formData.get("file");

    if (!riskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!validCategory(category)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kanıt kategorisi geçersizdir.",
        },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Dosya seçilmelidir.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Dosya boştur.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tek dosya boyutu 25 MB sınırını aşamaz.",
        },
        { status: 400 }
      );
    }

    const firmId = ctx.companyScoped
      ? ctx.companyId
      : requestedFirmId;

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma bilgisi zorunludur.",
        },
        { status: 400 }
      );
    }

    const safeName = safeFileName(
      fileValue.name
    );

    const storageFolder =
      category.toLowerCase();

    const storagePath =
      `${firmId}/${riskId}/${storageFolder}/` +
      `${crypto.randomUUID()}-${safeName}`;

    const supabase = getSupabase();

    const fileBuffer =
      await fileValue.arrayBuffer();

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType:
            fileValue.type ||
            "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dosya Storage alanına yüklenemedi.",
          detail: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: inserted, error } =
      await supabase
        .from("risk_evidence")
        .insert({
          risk_id: riskId,
          firm_id: firmId,
          category,
          file_name: fileValue.name,
          mime_type:
            fileValue.type ||
            "application/octet-stream",
          size_bytes: fileValue.size,
          storage_path: storagePath,
          description:
            description || null,
          uploaded_by: ctx.userName,
          source: "WEB",
          sync_status: "SYNCED",
          is_deleted: false,
          deleted_at: null,
        })
        .select("*")
        .single<EvidenceRow>();

    if (error || !inserted) {
      await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

      return NextResponse.json(
        {
          success: false,
          message:
            "Risk kanıt kaydı oluşturulamadı.",
          detail: error?.message,
        },
        { status: 500 }
      );
    }

    const { data: signedData } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

    return NextResponse.json({
      success: true,
      item: toClientRow(
        inserted,
        signedData?.signedUrl || ""
      ),
      message: "Dosya yüklendi.",
    });
  } catch (error) {
    console.error(
      "risk evidence POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Dosya yüklenirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getAdminContext();

    if (!ctx.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    if (ctx.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Demo kullanıcısı dosya silemez.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);

    const id = String(
      url.searchParams.get("id") || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kanıt kaydı ID bilgisi zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let findQuery = supabase
      .from("risk_evidence")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false);

    if (ctx.companyScoped) {
      findQuery = findQuery.eq(
        "firm_id",
        ctx.companyId
      );
    }

    const { data: row, error: findError } =
      await findQuery.maybeSingle<EvidenceRow>();

    if (findError) {
      return NextResponse.json(
        {
          success: false,
          message: findError.message,
        },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kanıt dosyası bulunamadı.",
        },
        { status: 404 }
      );
    }

    const { error: storageError } =
      await supabase.storage
        .from(BUCKET)
        .remove([row.storage_path]);

    if (storageError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Dosya Storage alanından silinemedi.",
          detail: storageError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteError } =
      await supabase
        .from("risk_evidence")
        .update({
          is_deleted: true,
          deleted_at:
            new Date().toISOString(),
          sync_status: "SYNCED",
        })
        .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kanıt kaydı silinemedi.",
          detail: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      message: "Kanıt dosyası silindi.",
    });
  } catch (error) {
    console.error(
      "risk evidence DELETE error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Dosya silinirken sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
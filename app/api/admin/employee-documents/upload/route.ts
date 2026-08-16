import { createHash, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BUCKET = "employee-documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  return null;
}

function safeFileName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "document";
}

async function ensureBucket() {
  const supabase = getSupabase();

  const { data, error } = await supabase.storage.getBucket(BUCKET);

  if (data && !error) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  });

  if (
    createError &&
    !String(createError.message || "")
      .toLocaleLowerCase("tr-TR")
      .includes("already")
  ) {
    throw createError;
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();

  const firmId = String(formData.get("firmId") || "").trim();
  const file = formData.get("file");

  if (!firmId) {
    return NextResponse.json(
      { error: "Firma seçimi zorunludur." },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Belge dosyası seçilmelidir." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "Desteklenmeyen dosya türü. PDF, DOC veya DOCX yükleyebilirsiniz.",
      },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `Dosya boyutu 0'dan büyük ve en fazla ${
          MAX_FILE_SIZE / 1024 / 1024
        } MB olmalıdır.`,
      },
      { status: 400 }
    );
  }

  try {
    await ensureBucket();

    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256Hash = createHash("sha256")
      .update(bytes)
      .digest("hex");

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");

    const objectPath = [
      safeFileName(firmId),
      String(year),
      month,
      `${randomUUID()}-${safeFileName(file.name)}`,
    ].join("/");

    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      return NextResponse.json(
        {
          error: "Belge dosyası yüklenemedi.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: `storage://${BUCKET}/${objectPath}`,
        storageBucket: BUCKET,
        storagePath: objectPath,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        sha256Hash,
      },
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error: "Belge yükleme servisi çalıştırılamadı.",
        detail:
          cause instanceof Error
            ? cause.message
            : "Bilinmeyen hata.",
      },
      { status: 500 }
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "training-archive";
const ALLOWED_TYPES = new Set([
  "TRAINING_DOCUMENT",
  "ATTENDANCE_SIGNED",
  "CERTIFICATE_SIGNED",
]);

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safeSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "file";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));

    if (!firmId) {
      return NextResponse.json(
        { success: false, error: "firmId zorunlu." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_archive_files")
      .select("*")
      .eq("firm_id", firmId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      files: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Eğitim arşiv belgeleri alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fileValue = formData.get("file");
    const firmId = clean(formData.get("firmId"));
    const documentType = clean(
      formData.get("documentType")
    );
    const sessionKey = clean(
      formData.get("sessionKey")
    );
    const employeeRemoteId = clean(
      formData.get("employeeRemoteId")
    );
    const trainingTitle = clean(
      formData.get("trainingTitle")
    );

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Dosya zorunlu." },
        { status: 400 }
      );
    }

    if (!firmId || !ALLOWED_TYPES.has(documentType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Firma veya belge türü geçersiz.",
        },
        { status: 400 }
      );
    }

    if (
      documentType === "ATTENDANCE_SIGNED" &&
      !sessionKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "İmzalı katılım formu için sessionKey zorunlu.",
        },
        { status: 400 }
      );
    }

    if (
      documentType === "CERTIFICATE_SIGNED" &&
      (!sessionKey || !employeeRemoteId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "İmzalı sertifika için oturum ve çalışan bilgisi zorunlu.",
        },
        { status: 400 }
      );
    }

    const maxSize = 15 * 1024 * 1024;

    if (fileValue.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Dosya boyutu en fazla 15 MB olabilir.",
        },
        { status: 400 }
      );
    }

    const extension =
      fileValue.name.includes(".")
        ? fileValue.name.split(".").pop()
        : "bin";

    const slot =
      documentType === "CERTIFICATE_SIGNED"
        ? `${sessionKey}-${employeeRemoteId}`
        : sessionKey || trainingTitle || "document";

    const storagePath = [
      safeSegment(firmId),
      documentType.toLowerCase(),
      `${safeSegment(slot)}.${safeSegment(
        extension || "bin"
      )}`,
    ].join("/");

    const supabase = getSupabase();
    const buffer = Buffer.from(
      await fileValue.arrayBuffer()
    );

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType:
            fileValue.type ||
            "application/octet-stream",
          upsert: true,
        });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const payload = {
      firm_id: firmId,
      document_type: documentType,
      session_key: sessionKey || null,
      employee_remote_id:
        employeeRemoteId || null,
      training_title: trainingTitle,
      file_name: fileValue.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type:
        fileValue.type || null,
      file_size: fileValue.size,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("training_archive_files")
      .upsert(payload, {
        onConflict:
          "firm_id,document_type,session_key,employee_remote_id",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      file: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Belge yüklenemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const DOCUMENTATION_BUCKET =
  process.env.DOCUMENTATION_STORAGE_BUCKET ||
  "documentation";

const MAX_FILE_SIZE_BYTES =
  25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "image/jpeg",
  "image/png",
  "image/webp",

  /*
   * Bazı tarayıcılar Office dosyalarını bu genel MIME tipiyle
   * gönderebildiği için uzantı kontrolüyle birlikte kabul edilir.
   */
  "application/octet-stream",
]);

function getSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function normalizeString(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function sanitizePathPart(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}

function sanitizeFileName(
  fileName: string
): string {
  const normalized =
    fileName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w.\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  return (
    normalized.slice(0, 180) ||
    "dokuman"
  );
}

function getFileExtension(
  fileName: string
): string {
  const parts =
    fileName
      .toLocaleLowerCase("tr-TR")
      .split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.trim() || "";
}

function mapFileType(
  extension: string
):
  | "PDF"
  | "DOC"
  | "DOCX"
  | "XLS"
  | "XLSX"
  | "PPT"
  | "PPTX"
  | "IMAGE"
  | "OTHER" {
  switch (extension) {
    case "pdf":
      return "PDF";

    case "doc":
      return "DOC";

    case "docx":
      return "DOCX";

    case "xls":
      return "XLS";

    case "xlsx":
      return "XLSX";

    case "ppt":
      return "PPT";

    case "pptx":
      return "PPTX";

    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return "IMAGE";

    default:
      return "OTHER";
  }
}

function errorResponse(
  error: unknown,
  fallback: string,
  status = 500
) {
  console.error(fallback, error);

  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : fallback,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(
  request: NextRequest
) {
  let uploadedPath: string | null =
    null;

  try {
    const formData =
      await request.formData();

    const firmId =
      normalizeString(
        formData.get("firmId")
      );

    const fileValue =
      formData.get("file");

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosya yüklemek için firma seçimi zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !fileValue ||
      !(fileValue instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yüklenecek dosya bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    const file = fileValue;

    if (
      !file.name ||
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seçilen dosya boş veya geçersiz.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosya boyutu en fazla 25 MB olabilir.",
        },
        {
          status: 413,
        }
      );
    }

    const extension =
      getFileExtension(file.name);

    if (
      !extension ||
      !ALLOWED_EXTENSIONS.has(
        extension
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Desteklenmeyen dosya türü. PDF, Word, Excel, PowerPoint veya görsel dosyası yükleyin.",
        },
        {
          status: 415,
        }
      );
    }

    const mimeType =
      normalizeString(file.type) ||
      "application/octet-stream";

    if (
      !ALLOWED_MIME_TYPES.has(
        mimeType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosyanın içerik türü desteklenmiyor.",
        },
        {
          status: 415,
        }
      );
    }

    const safeFirmId =
      sanitizePathPart(firmId);

    if (!safeFirmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma kimliği geçersiz.",
        },
        {
          status: 400,
        }
      );
    }

    const safeFileName =
      sanitizeFileName(
        file.name
      );

    const now = Date.now();

    const uniqueId =
      crypto.randomUUID();

    uploadedPath = [
      safeFirmId,
      String(
        new Date().getFullYear()
      ),
      `${now}_${uniqueId}_${safeFileName}`,
    ].join("/");

    const fileBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const supabase =
      getSupabaseAdmin();

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        DOCUMENTATION_BUCKET
      )
      .upload(
        uploadedPath,
        fileBuffer,
        {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      if (
        uploadError.message
          .toLocaleLowerCase("tr-TR")
          .includes(
            "bucket not found"
          )
      ) {
        throw new Error(
          `"${DOCUMENTATION_BUCKET}" isimli Supabase Storage bucket bulunamadı.`
        );
      }

      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(
        DOCUMENTATION_BUCKET
      )
      .getPublicUrl(
        uploadedPath
      );

    const fileUrl =
      normalizeString(
        publicUrlData.publicUrl
      );

    if (!fileUrl) {
      await supabase.storage
        .from(
          DOCUMENTATION_BUCKET
        )
        .remove([
          uploadedPath,
        ]);

      uploadedPath = null;

      throw new Error(
        "Yüklenen dosyanın erişim bağlantısı oluşturulamadı."
      );
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          fileName:
            file.name,

          fileUrl,

          fileType:
            mapFileType(
              extension
            ),

          fileSizeBytes:
            file.size,

          mimeType,

          storageBucket:
            DOCUMENTATION_BUCKET,

          storagePath:
            uploadedPath,
        },

        message:
          "Doküman dosyası başarıyla yüklendi.",
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    /*
     * Dosya Storage'a yüklenmiş fakat işlem sonrasında hata oluşmuşsa
     * sahipsiz dosya kalmasını önler.
     */
    if (uploadedPath) {
      try {
        const supabase =
          getSupabaseAdmin();

        await supabase.storage
          .from(
            DOCUMENTATION_BUCKET
          )
          .remove([
            uploadedPath,
          ]);
      } catch (
        cleanupError
      ) {
        console.error(
          "Yüklenen dosya temizlenemedi:",
          cleanupError
        );
      }
    }

    return errorResponse(
      error,
      "Doküman dosyası yüklenemedi."
    );
  }
}
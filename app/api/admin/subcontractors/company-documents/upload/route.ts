import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const BUCKET =
  "subcontractor-documents";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE =
  10 * 1024 * 1024; // 10 MB

function safeName(name: string) {
  return name
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    );
}

export async function POST(
  request: NextRequest
) {
  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const firmId =
      String(
        formData.get("firmId") ?? ""
      ).trim();

    const companyId =
      String(
        formData.get("companyId") ??
          ""
      ).trim();

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firm ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Taşeron firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosya seçilmedi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosya boş.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dosya en fazla 10 MB olabilir.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sadece PDF, JPG, PNG veya WEBP dosyaları yüklenebilir.",
        },
        {
          status: 400,
        }
      );
    }

    const fileName =
      safeName(file.name);

    const uniqueName =
      `${Date.now()}-${crypto.randomUUID()}-${fileName}`;

    const storagePath =
      `${firmId}/${companyId}/${uniqueName}`;

    const arrayBuffer =
      await file.arrayBuffer();

    const { error } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          storagePath,
          arrayBuffer,
          {
            contentType:
              file.type ||
              "application/octet-stream",

            cacheControl: "3600",

            upsert: false,
          }
        );

    if (error) {
      console.error(
        "COMPANY DOCUMENT UPLOAD:",
        error
      );

      throw error;
    }

    const { data } =
      supabase.storage
        .from(BUCKET)
        .getPublicUrl(
          storagePath
        );

    return NextResponse.json({
      success: true,

      fileUrl:
        data.publicUrl,

      path:
        storagePath,

      fileName:
        file.name,

      contentType:
        file.type,

      size:
        file.size,
    });
  } catch (error) {
    console.error(
      "COMPANY DOCUMENT UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Dosya yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}
export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

const BUCKET =
  "egitim-videolari";

const MAX_ASSET_SIZE =
  4 * 1024 * 1024;

const ALLOWED_FILES =
  /^(index\.m3u8|segment-\d{5}\.ts)$/;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase sunucu ortam değişkenleri eksik."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function isUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const cookieStore =
      await cookies();

    const auth =
      cookieStore.get(
        "dsec_admin_auth"
      )?.value;

    const role =
      cookieStore.get(
        "dsec_admin_role"
      )?.value;

    if (
      auth !== "ok" ||
      ![
        "super_admin",
        "company_admin",
      ].includes(role || "")
    ) {
      return NextResponse.json(
        {
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    const trainingId =
      String(
        request.nextUrl.searchParams.get(
          "trainingId"
        ) || ""
      ).trim();

    const uploadId =
      String(
        request.nextUrl.searchParams.get(
          "uploadId"
        ) || ""
      ).trim();

    const fileName =
      String(
        request.nextUrl.searchParams.get(
          "fileName"
        ) || ""
      ).trim();

    if (
      !isUuid(trainingId) ||
      !isUuid(uploadId) ||
      !ALLOWED_FILES.test(fileName)
    ) {
      return NextResponse.json(
        {
          error:
            "Geçersiz yükleme bilgisi.",
        },
        {
          status: 400,
        }
      );
    }

    const contentLength =
      Number(
        request.headers.get(
          "content-length"
        ) || 0
      );

    if (
      contentLength >
      MAX_ASSET_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Video parçası 4 MB sınırını aşıyor.",
        },
        {
          status: 413,
        }
      );
    }

    const bytes =
      await request.arrayBuffer();

    if (
      bytes.byteLength <= 0 ||
      bytes.byteLength >
        MAX_ASSET_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Video parçası boş veya çok büyük.",
        },
        {
          status: 413,
        }
      );
    }

    const contentType =
      fileName.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "video/mp2t";

    const supabase =
      getSupabaseAdmin();

    const {
      data: training,
      error: trainingError,
    } = await supabase
      .from("trainings")
      .select("id")
      .eq("id", trainingId)
      .maybeSingle();

    if (
      trainingError ||
      !training
    ) {
      return NextResponse.json(
        {
          error:
            "Eğitim bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const objectPath =
      `trainings/${trainingId}/${uploadId}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(BUCKET)
      .upload(
        objectPath,
        bytes,
        {
          contentType,
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      return NextResponse.json(
        {
          error:
            uploadError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      path: objectPath,
    });
  } catch (cause) {
    console.error(
      "HLS asset upload error:",
      cause
    );

    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Video parçası yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}
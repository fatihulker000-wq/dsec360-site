import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mobileSyncKey = process.env.DSEC_EMERGENCY_SYNC_KEY;

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
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

function unauthorized(message: string) {
  return NextResponse.json(
    {
      success: false,
      cursor: String(Date.now()),
      server_time: Date.now(),
      insert_records: [],
      update_records: [],
      delete_records: [],
      conflicts: [],
      synced_remote_ids: [],
      warnings: [],
      message,
    },
    { status: 401 }
  );
}

function errorResponse(
  message: string,
  status: number
) {
  const now = Date.now();

  return NextResponse.json(
    {
      success: false,
      cursor: String(now),
      server_time: now,
      insert_records: [],
      update_records: [],
      delete_records: [],
      conflicts: [],
      synced_remote_ids: [],
      warnings: [],
      message,
    },
    { status }
  );
}

function validateRequest(body: any): string | null {
  const companyId = Number(
    body?.company_id ??
      body?.companyId ??
      body?.firm_id ??
      body?.firmId ??
      0
  );

  const webCompanyId = String(
    body?.web_company_id ??
      body?.webCompanyId ??
      body?.web_firm_id ??
      body?.webFirmId ??
      ""
  ).trim();

  if (companyId <= 0 && !webCompanyId) {
    return "Firma bilgisi bulunamadı.";
  }

  if (
    body?.records !== undefined &&
    !Array.isArray(body.records)
  ) {
    return "records alanı dizi olmalıdır.";
  }

  if (
    body?.deleted_records !== undefined &&
    !Array.isArray(body.deleted_records)
  ) {
    return "deleted_records alanı dizi olmalıdır.";
  }

  if (
    body?.deletedRecords !== undefined &&
    !Array.isArray(body.deletedRecords)
  ) {
    return "deletedRecords alanı dizi olmalıdır.";
  }

  return null;
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
     * DSEC_EMERGENCY_SYNC_KEY tanımlıysa mobil isteklerde
     * x-dsec-sync-key başlığı zorunlu olur.
     */
    if (mobileSyncKey) {
      const receivedKey =
        request.headers
          .get("x-dsec-sync-key")
          ?.trim() || "";

      if (receivedKey !== mobileSyncKey) {
        return unauthorized(
          "Acil durum senkronizasyon anahtarı geçersiz."
        );
      }
    }

    const body = await request
      .json()
      .catch(() => null);

    if (!body || typeof body !== "object") {
      return errorResponse(
        "Geçerli JSON gövdesi gönderilmelidir.",
        400
      );
    }

    const validationError =
      validateRequest(body);

    if (validationError) {
      return errorResponse(
        validationError,
        400
      );
    }

    const supabase = getSupabase();

    const { data, error } =
      await supabase.rpc(
        "emergency_sync_batch",
        {
          p_request: body,
        }
      );

    if (error) {
      console.error(
        "emergency_sync_batch RPC hatası:",
        error
      );

      const message =
        error.message ||
        "Acil durum senkronizasyon fonksiyonu çalıştırılamadı.";

      const status =
        message
          .toLowerCase()
          .includes("could not find the function")
          ? 500
          : 400;

      return errorResponse(
        message,
        status
      );
    }

    if (!data) {
      return errorResponse(
        "Acil durum senkronizasyon sunucusu boş cevap döndürdü.",
        500
      );
    }

    /*
     * PostgreSQL fonksiyonu JSON/JSONB nesnesi döndürür.
     * Supabase JS bunu doğrudan nesne olarak verir.
     */
    return NextResponse.json(
      data,
      {
        status:
          data.success === false
            ? 400
            : 200,
      }
    );
  } catch (error) {
    console.error(
      "Mobil acil durum sync route hatası:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Acil durum senkronizasyonu sırasında hata oluştu.",
      500
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "D-SEC Emergency Mobile Sync",
    function: "emergency_sync_batch",
    status: "READY",
    server_time: Date.now(),
  });
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type SyncRequestBody = {
  companyId?: string;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

type RiskSyncRpcResponse = {
  success?: boolean;
  cursor?: string;
  server_time?: number;
  insert_records?: unknown[];
  update_records?: unknown[];
  delete_records?: string[];
  conflicts?: unknown[];
  synced_remote_ids?: string[];
  warnings?: string[];
  message?: string;
};

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

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const adminAuth =
      cookieStore.get("dsec_admin_auth")?.value ||
      cookieStore.get("dsec_user_auth")?.value;

    const adminRole =
      cookieStore.get("dsec_admin_role")?.value ||
      cookieStore.get("dsec_user_role")?.value;

    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" ||
      adminRole === "company_admin" ||
      adminRole === "demo_user";

    const isCompanyScoped =
      adminRole === "company_admin" || adminRole === "demo_user";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        {
          success: false,
          message: "Yetkisiz erişim.",
        },
        { status: 401 }
      );
    }

    const body: SyncRequestBody = await request
      .json()
      .catch(() => ({}));

    const requestedCompanyId = String(body.companyId || "").trim();

    if (isCompanyScoped && !companyIdFromCookie) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma bilgisi bulunamadı.",
        },
        { status: 403 }
      );
    }

    const supabase = getSupabase();

    let companyIds: string[] = [];

    if (isCompanyScoped) {
      companyIds = [companyIdFromCookie];
    } else if (requestedCompanyId) {
      companyIds = [requestedCompanyId];
    } else {
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true })
        .returns<CompanyRow[]>();

      if (companiesError) {
        return NextResponse.json(
          {
            success: false,
            message: "Firma listesi alınamadı.",
            detail: companiesError.message,
          },
          { status: 500 }
        );
      }

      companyIds = (companies || [])
        .map((company) => String(company.id || "").trim())
        .filter(Boolean);
    }

    if (companyIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          inserted: 0,
          updated: 0,
          deleted: 0,
          conflicts: 0,
          syncedAt: new Date().toISOString(),
          message: "Senkronize edilecek firma bulunamadı.",
        },
        { status: 200 }
      );
    }

    let inserted = 0;
    let updated = 0;
    let deleted = 0;
    let conflicts = 0;

    const failures: string[] = [];

    for (const companyId of companyIds) {
      const payload = {
        device_id: "dsec-web-admin",
        user_id: 0,
        company_id: companyId,
        cursor: null,
        records: [],
        deleted_records: [],
        app_version: "web",
        platform: "WEB",
        request_time: Date.now(),
      };

      const { data, error } = await supabase.rpc("risk_sync_batch", {
        p_request: payload,
      });

      if (error) {
        failures.push(`${companyId}: ${error.message}`);
        continue;
      }

      const response = (data || {}) as RiskSyncRpcResponse;

      inserted += Array.isArray(response.insert_records)
        ? response.insert_records.length
        : 0;

      updated += Array.isArray(response.update_records)
        ? response.update_records.length
        : 0;

      deleted += Array.isArray(response.delete_records)
        ? response.delete_records.length
        : 0;

      conflicts += Array.isArray(response.conflicts)
        ? response.conflicts.length
        : 0;
    }

    if (failures.length === companyIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Risk senkronizasyonu tamamlanamadı.",
          detail: failures,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      deleted,
      conflicts,
      syncedAt: new Date().toISOString(),
      companyCount: companyIds.length,
      warnings: failures,
      message:
        failures.length > 0
          ? "Senkronizasyon kısmen tamamlandı."
          : "Risk senkronizasyonu tamamlandı.",
    });
  } catch (error) {
    console.error("risk management sync route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Risk senkronizasyonu sırasında sunucu hatası oluştu.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
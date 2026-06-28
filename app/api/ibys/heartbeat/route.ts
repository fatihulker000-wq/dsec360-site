export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getIbysSettings } from "@/lib/ibys/ibysSettingsService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST() {
  try {
    const settings = await getIbysSettings();

    if (!settings?.api_url) {
      return Response.json(
        { success: false, error: "API URL tanımlı değil." },
        { status: 400 }
      );
    }

    const startedAt = Date.now();

    const response = await fetch(settings.api_url, {
      method: "GET",
      cache: "no-store",
    });

    const durationMs = Date.now() - startedAt;
    const checkedAt = new Date().toISOString();

    const status = response.ok ? "ONLINE" : "WARNING";

    const supabase = getSupabaseAdmin();

    await supabase.from("ibys_service_status").insert({
      service_name: "HEARTBEAT",
      environment: settings.environment || "TEST",
      status,
      http_status: response.status,
      duration_ms: durationMs,
      checked_at: checkedAt,
      message: response.ok
        ? "Servis erişilebilir."
        : `Servis cevap verdi ancak durum kodu: ${response.status}`,
    });

    return Response.json({
      success: true,
      status,
      httpStatus: response.status,
      durationMs,
      checkedAt,
      message: response.ok
        ? "Heartbeat başarılı. Servis erişilebilir."
        : `Heartbeat uyarı verdi. Durum kodu: ${response.status}`,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getIbysSettings } from "@/lib/ibys/ibysSettingsService";

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

    const res = await fetch(settings.api_url, {
      method: "GET",
      cache: "no-store",
    });

    const durationMs = Date.now() - startedAt;

    return Response.json({
      success: true,
      status: res.status,
      ok: res.ok,
      durationMs,
      message: res.ok
        ? "API bağlantısı başarılı."
        : `API cevap verdi ancak durum kodu: ${res.status}`,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error?.message ?? "API bağlantı testi başarısız.",
      },
      { status: 500 }
    );
  }
}
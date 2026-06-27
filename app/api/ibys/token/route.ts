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

    if (!settings?.token_url) {
      return Response.json(
        { success: false, error: "Token URL tanımlı değil." },
        { status: 400 }
      );
    }

    if (!settings?.client_id || !settings?.client_secret_encrypted) {
      return Response.json(
        { success: false, error: "Client ID veya Client Secret eksik." },
        { status: 400 }
      );
    }

    const startedAt = Date.now();

    const body = new URLSearchParams();
    body.set("grant_type", "client_credentials");
    body.set("client_id", settings.client_id);
    body.set("client_secret", settings.client_secret_encrypted);

    const response = await fetch(settings.token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    const durationMs = Date.now() - startedAt;
    const rawText = await response.text();

    let tokenJson: any = {};
    try {
      tokenJson = rawText ? JSON.parse(rawText) : {};
    } catch {
      tokenJson = { raw: rawText };
    }

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: `Token servisi hata döndürdü. Durum: ${response.status}`,
          status: response.status,
          durationMs,
          response: tokenJson,
        },
        { status: 400 }
      );
    }

    const accessToken = tokenJson.access_token ?? "";
    const expiresIn = Number(tokenJson.expires_in ?? 0);
    const expiresAt =
      expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null;

    if (!accessToken) {
      return Response.json(
        {
          success: false,
          error: "Token cevabında access_token bulunamadı.",
          status: response.status,
          durationMs,
          response: tokenJson,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    await supabase
      .from("ibys_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("environment", settings.environment || "TEST")
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("ibys_tokens")
      .insert({
        environment: settings.environment || "TEST",
        access_token: accessToken,
        token_type: tokenJson.token_type ?? "Bearer",
        expires_in: expiresIn || null,
        expires_at: expiresAt,
        scope: tokenJson.scope ?? null,
        raw_response: tokenJson,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      message: "Token başarıyla oluşturuldu.",
      status: response.status,
      durationMs,
      data: {
        id: data.id,
        environment: data.environment,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        expiresAt: data.expires_at,
      },
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
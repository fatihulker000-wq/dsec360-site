import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getIbysSettings } from "@/lib/ibys/ibysSettingsService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function getActiveIbysToken() {
  const supabase = getSupabaseAdmin();
  const settings = await getIbysSettings();

  const environment = settings?.environment || "TEST";

  const { data, error } = await supabase
    .from("ibys_tokens")
    .select("*")
    .eq("environment", environment)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getValidIbysAccessToken() {
  const activeToken = await getActiveIbysToken();

  if (activeToken?.access_token && activeToken?.expires_at) {
    const expiresAt = new Date(activeToken.expires_at).getTime();
    const now = Date.now();
    const safetyWindow = 60 * 1000;

    if (expiresAt > now + safetyWindow) {
      return {
        success: true,
        reused: true,
        accessToken: activeToken.access_token,
        tokenType: activeToken.token_type || "Bearer",
        expiresAt: activeToken.expires_at,
      };
    }
  }

  return await createNewIbysToken();
}

export async function createNewIbysToken() {
  const supabase = getSupabaseAdmin();
  const settings = await getIbysSettings();

  if (!settings?.token_url) {
    throw new Error("Token URL tanımlı değil.");
  }

  if (!settings?.client_id || !settings?.client_secret_encrypted) {
    throw new Error("Client ID veya Client Secret eksik.");
  }

  const environment = settings.environment || "TEST";
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
    throw new Error(
      `Token servisi hata döndürdü. Durum: ${response.status} | ${getErrorMessage(
        tokenJson
      )}`
    );
  }

  const accessToken = tokenJson.access_token ?? "";
  const expiresIn = Number(tokenJson.expires_in ?? 0);
  const expiresAt =
    expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

  if (!accessToken) {
    throw new Error("Token cevabında access_token bulunamadı.");
  }

  await supabase
    .from("ibys_tokens")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("environment", environment)
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("ibys_tokens")
    .insert({
      environment,
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

  return {
    success: true,
    reused: false,
    accessToken,
    tokenType: data.token_type || "Bearer",
    expiresAt: data.expires_at,
    durationMs,
    data,
  };
}
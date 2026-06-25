import { getSupabaseAdmin } from "@/lib/supabase/server";

export type IbysSettingsInput = {
  environment: string;
  apiUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  autoSendEnabled: boolean;
  debugMode: boolean;
  retryCount: number;
  retryDelaySeconds: number;
  queueLimit: number;
};

export async function getIbysSettings() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ibys_settings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function saveIbysSettings(input: IbysSettingsInput) {
  const supabase = getSupabaseAdmin();

  const current = await getIbysSettings();

  const payload = {
    environment: input.environment,
    api_url: input.apiUrl ?? null,
    token_url: input.tokenUrl ?? null,
    client_id: input.clientId ?? null,
    client_secret_encrypted: input.clientSecret ?? null,
    auto_send_enabled: input.autoSendEnabled,
    debug_mode: input.debugMode,
    retry_count: input.retryCount,
    retry_delay_seconds: input.retryDelaySeconds,
    queue_limit: input.queueLimit,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (current?.id) {
    const { data, error } = await supabase
      .from("ibys_settings")
      .update(payload)
      .eq("id", current.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("ibys_settings")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}
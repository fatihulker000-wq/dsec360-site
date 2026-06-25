import { getSupabaseAdmin } from "@/lib/supabase/server";

export type IbysQueueStatus =
  | "PENDING"
  | "READY"
  | "SENT"
  | "FAILED"
  | "RETRY"
  | "MISSING_INFO";

export type CreateIbysQueueInput = {
  firmId?: string | null;
  firmName?: string | null;
  moduleName: string;
  recordType: string;
  recordId?: string | null;
  recordTitle?: string | null;
  payload?: Record<string, unknown>;
  createdBy?: string | null;
};

export async function createIbysQueueItem(input: CreateIbysQueueInput) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ibys_queue")
    .insert({
      firm_id: input.firmId ?? null,
      firm_name: input.firmName ?? null,
      module_name: input.moduleName,
      record_type: input.recordType,
      record_id: input.recordId ?? null,
      record_title: input.recordTitle ?? null,
      payload: input.payload ?? {},
      status: "PENDING",
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`İBYS kuyruk kaydı oluşturulamadı: ${error.message}`);
  }

  return data;
}

export async function listIbysQueueItems(status?: IbysQueueStatus) {
  const supabaseAdmin = getSupabaseAdmin();

  let query = supabaseAdmin
    .from("ibys_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`İBYS kuyruk listesi alınamadı: ${error.message}`);
  }

  return data ?? [];
}

export async function createIbysLog(input: {
  queueId?: string | null;
  firmId?: string | null;
  firmName?: string | null;
  moduleName?: string | null;
  action: string;
  status: string;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  responseCode?: string | null;
  durationMs?: number;
  errorMessage?: string | null;
  createdBy?: string | null;
}) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ibys_logs")
    .insert({
      queue_id: input.queueId ?? null,
      firm_id: input.firmId ?? null,
      firm_name: input.firmName ?? null,
      module_name: input.moduleName ?? null,
      action: input.action,
      status: input.status,
      request_payload: input.requestPayload ?? null,
      response_payload: input.responsePayload ?? null,
      response_code: input.responseCode ?? null,
      duration_ms: input.durationMs ?? 0,
      error_message: input.errorMessage ?? null,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`İBYS log kaydı oluşturulamadı: ${error.message}`);
  }

  return data;
}

export async function listIbysLogs() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("ibys_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`İBYS log listesi alınamadı: ${error.message}`);
  }

  return data ?? [];
}
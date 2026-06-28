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

export async function updateIbysQueueStatus(input: {
  queueId: string;
  status: IbysQueueStatus;
  lastError?: string | null;
  sentAt?: string | null;
  nextRetryAt?: string | null;
  retryCount?: number;
}) {
  const supabaseAdmin = getSupabaseAdmin();

  const payload: Record<string, unknown> = {
    status: input.status,
    last_error: input.lastError ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.sentAt !== undefined) {
    payload.sent_at = input.sentAt;
  }

  if (input.nextRetryAt !== undefined) {
    payload.next_retry_at = input.nextRetryAt;
  }

  if (input.retryCount !== undefined) {
    payload.retry_count = input.retryCount;
  }

  const { data, error } = await supabaseAdmin
    .from("ibys_queue")
    .update(payload)
    .eq("id", input.queueId)
    .select()
    .single();

  if (error) {
    throw new Error(`İBYS kuyruk durumu güncellenemedi: ${error.message}`);
  }

  return data;
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
export async function sendIbysQueueItem(queueId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: queue, error } = await supabaseAdmin
    .from("ibys_queue")
    .select("*")
    .eq("id", queueId)
    .single();

  if (error || !queue) {
    throw new Error(error?.message || "İBYS kuyruk kaydı bulunamadı.");
  }

  const startedAt = Date.now();

  try {
    await updateIbysQueueStatus({
      queueId,
      status: "READY",
      lastError: null,
    });

    const simulatedResponse = {
      success: true,
      message: "Test gönderim motoru çalıştı. Gerçek İBYS endpoint bağlantısı sonraki aşamada yapılacak.",
      queueId,
      moduleName: queue.module_name,
      recordType: queue.record_type,
    };

    const durationMs = Date.now() - startedAt;

    await updateIbysQueueStatus({
      queueId,
      status: "SENT",
      sentAt: new Date().toISOString(),
      lastError: null,
    });

    await createIbysLog({
      queueId,
      firmId: queue.firm_id,
      firmName: queue.firm_name,
      moduleName: queue.module_name,
      action: "SEND_QUEUE_ITEM",
      status: "SUCCESS",
      requestPayload: queue.payload,
      responsePayload: simulatedResponse,
      responseCode: "SIMULATED_SENT",
      durationMs,
      createdBy: null,
    });

    return {
      success: true,
      message: "Kuyruk kaydı başarıyla gönderildi.",
      durationMs,
      data: simulatedResponse,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);

    const nextRetryAt = new Date(Date.now() + 60 * 1000).toISOString();

    await updateIbysQueueStatus({
      queueId,
      status: "RETRY",
      lastError: errorMessage,
      nextRetryAt,
      retryCount: Number(queue.retry_count || 0) + 1,
    });

    await createIbysLog({
      queueId,
      firmId: queue.firm_id,
      firmName: queue.firm_name,
      moduleName: queue.module_name,
      action: "SEND_QUEUE_ITEM",
      status: "FAILED",
      requestPayload: queue.payload,
      responsePayload: null,
      responseCode: "ERROR",
      durationMs,
      errorMessage,
      createdBy: null,
    });

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

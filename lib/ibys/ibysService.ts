import { validateIbysQueuePayload } from "@/lib/ibys/ibysValidationEngine";
import { buildIbysPayload } from "@/lib/ibys/ibysPayloadBuilder";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendToCsgbIbys } from "@/lib/ibys/ibysCsgbClient";

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
      payload: buildIbysPayload({
  recordType: input.recordType,
  firmId: input.firmId,
  firmName: input.firmName,
  recordId: input.recordId,
  recordTitle: input.recordTitle,
  sourceData: input.payload ?? {},
}),
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
const MAX_RETRY_COUNT = 3;
const SEND_TIMEOUT_MS = 15000;

type IbysQueueRow = {
  id: string;
  firm_id?: string | null;
  firm_name?: string | null;
  module_name?: string | null;
  record_type?: string | null;
  record_id?: string | null;
  record_title?: string | null;
  payload?: Record<string, unknown> | null;
  status?: IbysQueueStatus | null;
  retry_count?: number | null;
  next_retry_at?: string | null;
  updated_at?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function calculateNextRetryAt(retryCount: number) {
  const delaySeconds = Math.min(60 * Math.pow(2, retryCount), 15 * 60);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

function isSendableStatus(status?: string | null) {
  return status === "PENDING" || status === "FAILED" || status === "RETRY";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error("İBYS gönderim zaman aşımına uğradı."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

async function sendRealIbys(queue: IbysQueueRow) {
  return await sendToCsgbIbys({
    recordType: queue.record_type,
    payload: (queue.payload as Record<string, unknown>) ?? {},
  });
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

  const item = queue as IbysQueueRow;
  const startedAt = Date.now();
  
  const retryCount = Number(item.retry_count || 0);

  if (item.status === "SENT") {
    await createIbysLog({
      queueId,
      firmId: item.firm_id,
      firmName: item.firm_name,
      moduleName: item.module_name,
      action: "SEND_QUEUE_ITEM_SKIPPED",
      status: "SKIPPED",
      requestPayload: item.payload ?? {},
      responsePayload: {
        reason: "Bu kayıt daha önce başarıyla gönderilmiş.",
      },
      responseCode: "ALREADY_SENT",
      durationMs: Date.now() - startedAt,
      createdBy: null,
    });

    return {
      success: true,
      message: "Bu kayıt daha önce gönderilmiş. Tekrar gönderilmedi.",
      durationMs: Date.now() - startedAt,
      data: item,
    };
  }

const validation = validateIbysQueuePayload(
  (item.payload as Record<string, unknown>) ?? {}
);

if (!validation.valid) {
  const errorMessage = validation.issues
    .map((i) => `${i.field}: ${i.message}`)
    .join(" | ");

  await updateIbysQueueStatus({
    queueId,
    status: "MISSING_INFO",
    lastError: errorMessage,
  });

  await createIbysLog({
    queueId,
    firmId: item.firm_id,
    firmName: item.firm_name,
    moduleName: item.module_name,
    action: "VALIDATION",
    status: "FAILED",
    requestPayload: item.payload ?? {},
    responsePayload: validation,
    responseCode: "VALIDATION_FAILED",
    durationMs: 0,
    errorMessage,
    createdBy: null,
  });

  return {
    success: false,
    error: errorMessage,
    validation,
  };
}

  if (!isSendableStatus(item.status)) {
    return {
      success: false,
      error: `Bu kayıt gönderime uygun durumda değil. Durum: ${item.status || "-"}`,
      durationMs: Date.now() - startedAt,
    };
  }

  if (retryCount >= MAX_RETRY_COUNT) {
    await updateIbysQueueStatus({
      queueId,
      status: "FAILED",
      lastError: "Maksimum retry sayısına ulaşıldı.",
      retryCount,
    });

    return {
      success: false,
      error: "Maksimum retry sayısına ulaşıldı.",
      durationMs: Date.now() - startedAt,
    };
  }

  if (
    item.status === "RETRY" &&
    item.next_retry_at &&
    new Date(item.next_retry_at).getTime() > Date.now()
  ) {
    return {
      success: false,
      error: `Retry zamanı henüz gelmedi. Planlanan zaman: ${new Date(
        item.next_retry_at
      ).toLocaleString("tr-TR")}`,
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    await updateIbysQueueStatus({
      queueId,
      status: "READY",
      lastError: null,
    });

   const responsePayload = await withTimeout(
  sendRealIbys(item),
  SEND_TIMEOUT_MS
);

    const durationMs = Date.now() - startedAt;
    if (!responsePayload.ok || responsePayload.response?.sonuc !== "1") {
  throw new Error(
    responsePayload.response?.aciklama ||
      `İBYS gönderimi başarısız. HTTP: ${responsePayload.httpStatus}`
  );
}

    await updateIbysQueueStatus({
      queueId,
      status: "SENT",
      sentAt: new Date().toISOString(),
      lastError: null,
      nextRetryAt: null,
      retryCount,
    });

    await createIbysLog({
      queueId,
      firmId: item.firm_id,
      firmName: item.firm_name,
      moduleName: item.module_name,
      action: "SEND_QUEUE_ITEM",
      status: "SUCCESS",
      requestPayload: item.payload ?? {},
      responsePayload,
     responseCode: String(responsePayload.response?.sonuc || responsePayload.httpStatus),
      durationMs,
      createdBy: null,
    });

    return {
      success: true,
      message: "Kuyruk kaydı başarıyla gönderildi.",
      durationMs,
      data: responsePayload,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = getErrorMessage(error);
    const nextRetryCount = retryCount + 1;
    const shouldRetry = nextRetryCount < MAX_RETRY_COUNT;

    await updateIbysQueueStatus({
      queueId,
      status: shouldRetry ? "RETRY" : "FAILED",
      lastError: errorMessage,
      nextRetryAt: shouldRetry ? calculateNextRetryAt(nextRetryCount) : null,
      retryCount: nextRetryCount,
    });

    await createIbysLog({
      queueId,
      firmId: item.firm_id,
      firmName: item.firm_name,
      moduleName: item.module_name,
      action: "SEND_QUEUE_ITEM",
      status: "FAILED",
      requestPayload: item.payload ?? {},
      responsePayload: null,
      responseCode: shouldRetry ? "RETRY_SCHEDULED" : "FAILED_MAX_RETRY",
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
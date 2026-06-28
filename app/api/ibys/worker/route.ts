export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { sendIbysQueueItem } from "@/lib/ibys/ibysService";
import { getSupabaseAdmin } from "@/lib/supabase/server";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-cron-secret");

    if (
      process.env.IBYS_WORKER_SECRET &&
      secret !== process.env.IBYS_WORKER_SECRET
    ) {
      return Response.json(
        {
          success: false,
          error: "Yetkisiz worker isteği.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("ibys_queue")
      .select("*")
      .in("status", ["PENDING", "FAILED", "RETRY"])
      .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    const rows = data ?? [];
    const results = [];

    for (const row of rows) {
      const result = await sendIbysQueueItem(row.id);

      results.push({
        queueId: row.id,
        recordTitle: row.record_title,
        status: result.success ? "OK" : "FAILED",
        message: result.message || result.error || null,
      });
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
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
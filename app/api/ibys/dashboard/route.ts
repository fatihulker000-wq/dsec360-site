export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getSupabaseAdmin } from "@/lib/supabase/server";

function average(values: number[]) {
  if (!values.length) return 0;

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const [
      { data: queue, error: queueError },
      { data: logs, error: logsError },
      { data: tokens, error: tokensError },
    ] = await Promise.all([
      supabase.from("ibys_queue").select("*"),
      supabase.from("ibys_logs").select("*"),
      supabase
        .from("ibys_tokens")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (queueError) throw queueError;
    if (logsError) throw logsError;
    if (tokensError) throw tokensError;

    const queueRows = queue ?? [];
    const logRows = logs ?? [];

    const total = queueRows.length;
    const pending = queueRows.filter((r) => r.status === "PENDING").length;
    const ready = queueRows.filter((r) => r.status === "READY").length;
    const sent = queueRows.filter((r) => r.status === "SENT").length;
    const retry = queueRows.filter((r) => r.status === "RETRY").length;
    const failed = queueRows.filter((r) => r.status === "FAILED").length;
    const missing = queueRows.filter((r) => r.status === "MISSING_INFO").length;

    const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);

    const durations = logRows
      .map((x) => Number(x.duration_ms || 0))
      .filter((x) => Number.isFinite(x));

    const averageDuration = average(durations);

    const lastSent =
      queueRows
        .filter((x) => x.sent_at)
        .sort(
          (a, b) =>
            new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
        )[0]?.sent_at ?? null;

    const lastToken = tokens?.[0]?.created_at ?? null;

    const lastHeartbeat =
      logRows
        .filter((x) => x.action === "HEARTBEAT")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0]?.created_at ?? null;

    return Response.json({
      success: true,
      stats: {
        total,
        pending,
        ready,
        sent,
        retry,
        failed,
        missing,
        successRate,
        averageDuration,
        lastSent,
        lastToken,
        lastHeartbeat,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
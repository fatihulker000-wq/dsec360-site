import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const client = getSupabaseAdmin();

    const { data, error } = await client
      .from("ibys_queue")
      .select("id")
      .limit(1);

    if (error) {
      return Response.json({
        success: false,
        error: error.message,
      });
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return Response.json({
      success: false,
      error: e?.message ?? String(e),
      cause: String(e?.cause ?? ""),
    });
  }
}
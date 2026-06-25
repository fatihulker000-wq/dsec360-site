import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await client
      .from("ibys_queue")
      .select("*")
      .limit(1);

    return Response.json({
      success: true,
      error: error?.message ?? null,
    });
  } catch (e: any) {
    return Response.json({
      success: false,
      message: e.message,
      cause: String(e.cause),
      stack: e.stack,
    });
  }
}
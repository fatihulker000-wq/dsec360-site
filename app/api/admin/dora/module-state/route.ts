import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const firmId = text(url.searchParams.get("firmId"));
    const moduleKey = text(url.searchParams.get("moduleKey")).toUpperCase();

    if (!firmId) {
      return NextResponse.json(
        { success: false, error: "firmId zorunludur." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("dora_module_state")
      .select("module_key,payload,updated_at_millis")
      .eq("firm_id", firmId);

    if (moduleKey) {
      query = query.eq("module_key", moduleKey);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (moduleKey) {
      const row = data?.[0];
      return NextResponse.json({
        success: true,
        moduleKey,
        payload: row?.payload ?? {},
        updatedAtMillis: row?.updated_at_millis ?? null,
      });
    }

    const modules: Record<string, unknown> = {};
    for (const row of data ?? []) {
      modules[text(row.module_key).toUpperCase()] = row.payload ?? {};
    }

    return NextResponse.json({ success: true, modules });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "DORA modül durumu alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const firmId = text(body.firmId ?? body.firm_id);
    const moduleKey = text(body.moduleKey ?? body.module_key).toUpperCase();

    if (!firmId || !moduleKey) {
      return NextResponse.json(
        { success: false, error: "firmId ve moduleKey zorunludur." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const { data, error } = await supabase
      .from("dora_module_state")
      .upsert(
        {
          firm_id: firmId,
          module_key: moduleKey,
          payload: body.payload ?? {},
          source: "WEB",
          updated_at_millis: now,
        },
        { onConflict: "firm_id,module_key" }
      )
      .select("module_key,payload,updated_at_millis")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, state: data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "DORA modül durumu kaydedilemedi.",
      },
      { status: 500 }
    );
  }
}
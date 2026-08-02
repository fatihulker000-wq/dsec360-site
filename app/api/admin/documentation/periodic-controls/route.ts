import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const [
      equipmentResponse,
      measurementResponse,
    ] = await Promise.all([
      supabase
        .from("periodic_control_equipments")
        .select("*")
        .eq("firm_id", firmId)
        .eq("deleted", false)
        .order("next_due_millis", {
          ascending: true,
          nullsFirst: true,
        }),

      supabase
        .from("environment_measurements")
        .select("*")
        .eq("firm_id", firmId)
        .eq("deleted", false)
        .order("next_due_millis", {
          ascending: true,
          nullsFirst: true,
        }),
    ]);

    if (equipmentResponse.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "İş ekipmanı kayıtları alınamadı.",
          detail:
            equipmentResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (measurementResponse.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ortam ölçümü kayıtları alınamadı.",
          detail:
            measurementResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const equipments =
      equipmentResponse.data || [];

    const measurements =
      measurementResponse.data || [];

    return NextResponse.json({
      success: true,
      firmId,
      equipmentCount: equipments.length,
      measurementCount: measurements.length,
      equipments,
      measurements,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu hatası.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
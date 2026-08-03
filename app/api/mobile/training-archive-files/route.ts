import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(req: Request) {
  try {
    const apiKey = clean(
      req.headers.get("x-api-key")
    );

    if (apiKey !== API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
        },
        { status: 401 }
      );
    }

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
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_archive_files")
      .select(
        `
        id,
        firm_id,
        document_type,
        session_key,
        employee_remote_id,
        training_title,
        file_name,
        public_url,
        mime_type,
        file_size,
        updated_at
        `
      )
      .eq("firm_id", firmId)
      .in("document_type", [
        "TRAINING_DOCUMENT",
        "ATTENDANCE_SIGNED",
        "CERTIFICATE_SIGNED",
      ])
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Eğitim arşiv belgeleri alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
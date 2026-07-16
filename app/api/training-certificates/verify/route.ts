import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase servis bilgileri eksik."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          valid: false,
          error: "Kod zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("training_certificates_v2")
      .select(`
        certificate_no,
        verification_code,
        status,
        issued_at,
        valid_from,
        valid_until,
        revision_no,
        training_title,
        employee_name,
        company_name,
        duration_minutes,
        final_score,
        document_hash,
        revoked_at,
        revoked_reason
      `)
      .eq("verification_code", code)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        {
          valid: false,
          error: "Sertifika bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const expired =
      Boolean(data.valid_until) &&
      new Date(data.valid_until).getTime() <
        new Date().setHours(0, 0, 0, 0);

    const valid =
      data.status !== "REVOKED" &&
      !expired;

    return NextResponse.json({
      valid,
      expired,

      data: {
        ...data,

        effective_status: expired
          ? "EXPIRED"
          : data.status,
      },
    });

  } catch (error: any) {

    console.error(
      "certificate verify:",
      error
    );

    return NextResponse.json(
      {
        valid: false,

        error:
          "Sunucu hatası oluştu.",

        detail:
          error?.message || null,
      },
      {
        status: 500,
      }
    );
  }
}
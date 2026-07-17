import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest
) {
  try {
    const cookieStore =
      await cookies();

    const adminAuth =
      cookieStore.get(
        "dsec_admin_auth"
      )?.value;

    if (!adminAuth) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz erişim",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const id =
      Number(body?.id);

    if (
      !Number.isFinite(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçerli kayıt ID bilgisi zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from("accident_records")
      .update({
        is_active: 0,
        is_deleted: true,
        deleted_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("is_deleted", false)
      .select(
        "id, app_record_id, web_firm_id, is_active, is_deleted, deleted_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kayıt bulunamadı veya daha önce silinmiş.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Kayıt silindi ve mobil senkronizasyon için işaretlendi.",
      record: data,
    });
  } catch (
    errorValue: unknown
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Silme hatası",
      },
      {
        status: 500,
      }
    );
  }
}
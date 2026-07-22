import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntityType = "PLAN" | "TEAM" | "DRILL";

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

async function getAccessContext() {
  const cookieStore = await cookies();

  const auth =
    cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value;

  const role =
    cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value ||
    "";

  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();

  const allowedRoles = [
    "admin",
    "super_admin",
    "company_admin",
    "demo_user",
  ];

  const companyScoped =
    role === "company_admin" || role === "demo_user";

  return {
    allowed:
      auth === "ok" &&
      allowedRoles.includes(role) &&
      (!companyScoped || Boolean(companyId)),
    companyId,
    companyScoped,
    readOnly: role === "demo_user",
  };
}

function tableFor(entity: EntityType) {
  if (entity === "PLAN") return "emergency_action_plans";
  if (entity === "TEAM") return "emergency_support_teams";
  return "emergency_drills";
}

function camelToSnakeRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );

    result[snakeKey] = value;
  }

  return result;
}

function snakeToCamelRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const camelKey = key.replace(
      /_([a-z])/g,
      (_, letter: string) => letter.toUpperCase()
    );

    result[camelKey] = value;
  }

  return result;
}

export async function GET(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const requestedFirmId = String(
      url.searchParams.get("firmId") || ""
    ).trim();

    const firmId = access.companyScoped
      ? access.companyId
      : requestedFirmId;

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          message: "Firma bilgisi zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const [plansResult, teamsResult, drillsResult] =
      await Promise.all([
        supabase
          .from("emergency_action_plans")
          .select("*")
          .eq("firm_id", firmId)
          .order("updated_at_millis", { ascending: false }),

        supabase
          .from("emergency_support_teams")
          .select("*")
          .eq("firm_id", firmId)
          .order("created_at_millis", { ascending: false }),

        supabase
          .from("emergency_drills")
          .select("*")
          .eq("firm_id", firmId)
          .order("drill_date_millis", { ascending: false }),
      ]);

    const firstError =
      plansResult.error ||
      teamsResult.error ||
      drillsResult.error;

    if (firstError) {
      return NextResponse.json(
        {
          success: false,
          message: firstError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plans: (plansResult.data || []).map((row) =>
        snakeToCamelRecord(row)
      ),
      teams: (teamsResult.data || []).map((row) =>
        snakeToCamelRecord(row)
      ),
      drills: (drillsResult.data || []).map((row) =>
        snakeToCamelRecord(row)
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Acil durum verileri alınamadı.",
      },
      { status: 500 }
    );
  }
}

async function writeRecord(
  request: Request,
  mode: "INSERT" | "UPDATE"
) {
  const access = await getAccessContext();

  if (!access.allowed) {
    return NextResponse.json(
      { success: false, message: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  if (access.readOnly) {
    return NextResponse.json(
      {
        success: false,
        message: "Demo kullanıcısı kayıt değiştiremez.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const entity = String(body?.entity || "") as EntityType;
  const record = body?.record as Record<string, unknown>;

  if (!["PLAN", "TEAM", "DRILL"].includes(entity) || !record) {
    return NextResponse.json(
      {
        success: false,
        message: "Geçersiz kayıt türü veya içerik.",
      },
      { status: 400 }
    );
  }

  const payload = camelToSnakeRecord(record);
  const recordId = String(payload.id || "").trim();

  if (access.companyScoped) {
    payload.firm_id = access.companyId;
  }

  delete payload.id;

  const supabase = getSupabase();
  const table = tableFor(entity);

  const query =
    mode === "INSERT"
      ? supabase.from(table).insert(payload)
      : supabase.from(table).update(payload).eq("id", recordId);

  const { data, error } = await query
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        message: "Kayıt bulunamadı veya kaydedilemedi.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    record: snakeToCamelRecord(data),
  });
}

export async function POST(request: Request) {
  try {
    return await writeRecord(request, "INSERT");
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Kayıt oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    return await writeRecord(request, "UPDATE");
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Kayıt güncellenemedi.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await getAccessContext();

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (access.readOnly) {
      return NextResponse.json(
        {
          success: false,
          message: "Demo kullanıcısı kayıt silemez.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const entity = String(
      url.searchParams.get("entity") || ""
    ) as EntityType;
    const id = String(
      url.searchParams.get("id") || ""
    ).trim();

    if (!["PLAN", "TEAM", "DRILL"].includes(entity) || !id) {
      return NextResponse.json(
        {
          success: false,
          message: "Geçersiz kayıt türü veya ID.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    let query = supabase
      .from(tableFor(entity))
      .delete()
      .eq("id", id);

    if (access.companyScoped) {
      query = query.eq("firm_id", access.companyId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kayıt silindi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Kayıt silinemedi.",
      },
      { status: 500 }
    );
  }
}
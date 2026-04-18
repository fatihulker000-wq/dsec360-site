import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey === MOBILE_API_KEY) {
    return true;
  }

  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin(req);

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const role = String(body?.role || "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: "role gerekli" }, { status: 400 });
    }

    const allowedRoles = ["operator", "company_admin", "super_admin"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);

    if (error) {
      console.error("update-role error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update-role general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
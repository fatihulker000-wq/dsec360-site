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

  if (apiKey === MOBILE_API_KEY) return true;

  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((p) => String(p || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "tr"));
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin(req);

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const permissions = normalizePermissions(body?.permissions);

    if (!userId) {
      return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
    }

    const supabase = getSupabase();

    
    const { error: deleteError } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("permission delete error:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Eski yetkiler silinemedi." },
        { status: 500 }
      );
    }

    if (permissions.length > 0) {
      const insertData = permissions.map((permissionKey) => ({
        user_id: userId,
        permission_key: permissionKey,
      }));

      const { error: insertError } = await supabase
        .from("user_permissions")
        .insert(insertData);

      if (insertError) {
        console.error("permission insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message || "Yeni yetkiler kaydedilemedi." },
          { status: 500 }
        );
      }
    }

     const { error: userPermissionsSyncError } = await supabase
  .from("users")
  .update({
    permissions,
  })
  .eq("id", userId);

if (userPermissionsSyncError) {
  console.error(
    "users permissions sync error:",
    userPermissionsSyncError
  );

  return NextResponse.json(
    {
      error:
        String(userPermissionsSyncError?.message || "") ||
        "Kullanıcı yetki özeti güncellenemedi.",
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      success: true,
      userId,
      permissions,
      permissionCount: permissions.length,
    });
  } catch (err) {
    console.error("update-permissions general error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
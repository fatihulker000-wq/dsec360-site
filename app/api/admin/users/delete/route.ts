import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();
    const userId = String(body?.userId || "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", userId)
      .maybeSingle();

    if (targetUserError) {
      console.error("delete user read error:", targetUserError);
      return NextResponse.json(
        { error: "Kullanıcı okunamadı." },
        { status: 500 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (String(targetUser.role || "").trim() === "super_admin") {
        if (String(targetUser.role || "").trim() === "training_user") {
  // eğitim kullanıcı silinebilir (problem yok)
} else {
  // sistem kullanıcılarını korumak istersen buraya kural eklenebilir
}
      return NextResponse.json(
        { error: "Süper admin kullanıcı silinemez." },
        { status: 400 }
      );
    }

    await supabase.from("user_permissions").delete().eq("user_id", userId);

    const { error: deleteAssignmentsError } = await supabase
  .from("training_assignments")
  .delete()
  .eq("user_id", userId);

if (deleteAssignmentsError) {
  console.error("delete training assignments error:", deleteAssignmentsError);
}

    const { error: deleteRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteRoleError) {
      console.error("delete user roles error:", deleteRoleError);
    }

    const { error: deleteAccessError } = await supabase
      .from("user_firm_access")
      .delete()
      .eq("user_id", userId);

    if (deleteAccessError) {
      console.error("delete user firm access error:", deleteAccessError);
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      console.error("delete user error:", deleteUserError);
      return NextResponse.json(
        { error: deleteUserError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete user general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
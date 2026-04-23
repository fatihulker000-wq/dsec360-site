import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const headerStore = await headers();
    const apiKey = headerStore.get("x-api-key");

    if (apiKey !== MOBILE_API_KEY) {
      const cookieStore = await cookies();
      const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
      const adminRole = String(
        cookieStore.get("dsec_admin_role")?.value || ""
      ).trim();

      const isAllowedRole =
        adminRole === "super_admin" || adminRole === "company_admin";

      if (adminAuth !== "ok" || !isAllowedRole) {
        return NextResponse.json(
          { error: "Yetkisiz erişim." },
          { status: 401 }
        );
      }
    }

    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const appUserType = String(body.app_user_type || "").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "UserId gerekli." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let updateResult = await supabase
      .from("users")
      .update({
        app_user_type: appUserType || null,
      })
      .eq("id", userId)
      .select("id, email, app_user_type");

    let data = updateResult.data;
    let error = updateResult.error;

    if (!error && (!data || data.length === 0)) {
      updateResult = await supabase
        .from("users")
        .update({
          app_user_type: appUserType || null,
        })
        .eq("email", userId)
        .select("id, email, app_user_type");

      data = updateResult.data;
      error = updateResult.error;
    }

    if (error) {
      console.error("update app_user_type error:", error);
      return NextResponse.json(
        { error: "App kullanıcı tipi güncellenemedi." },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error("update app_user_type warning: kullanıcı bulunamadı", {
        userId,
        appUserType,
      });

      return NextResponse.json(
        { error: "Güncellenecek kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("update app_user_type route error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
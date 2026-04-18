import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token = String(body?.token || "").trim();
    const newPassword = String(body?.newPassword || "").trim();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token ve yeni şifre zorunlu." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifre en az 6 karakter olmalı." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, reset_token, reset_token_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (error) {
      console.error("reset-password user read error:", error);
      return NextResponse.json(
        { error: "Reset bilgisi okunamadı." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Geçersiz reset bağlantısı." },
        { status: 400 }
      );
    }

    const expiresAt = user.reset_token_expires_at
      ? new Date(user.reset_token_expires_at).getTime()
      : 0;

    if (!expiresAt || Date.now() > expiresAt) {
      return NextResponse.json(
        { error: "Reset bağlantısının süresi dolmuş." },
        { status: 400 }
      );
    }

    const newHash = sha256(newPassword);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: newHash,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("reset-password update error:", updateError);
      return NextResponse.json(
        { error: "Şifre güncellenemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("reset-password general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
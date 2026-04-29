import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body?.email || "").trim().toLowerCase();
    const newPassword = String(body?.newPassword || "").trim();

    if (!email || newPassword.length < 4) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const hashed = sha256(newPassword);

    const { error } = await supabase
      .from("users")
      .update({
        password_hash: hashed,
        password: null,
      })
      .ilike("email", email);

    if (error) {
      return NextResponse.json(
        { error: "Şifre güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}